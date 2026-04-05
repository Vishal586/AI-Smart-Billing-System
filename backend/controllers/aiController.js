const OpenAI = require('openai');
const Bill = require('../models/Bill');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────────────────────────
// UTILITY: Sleep for ms milliseconds (used in retry backoff)
// ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────
// UTILITY: Validate and sanitize parsed items array
// ─────────────────────────────────────────────────────────────────
const sanitizeItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items
        .filter(
            (item) =>
                item &&
                typeof item.itemName === 'string' &&
                item.itemName.trim().length > 0 &&
                Number(item.price) > 0 &&
                Number(item.quantity) > 0
        )
        .map((item) => ({
            itemName: String(item.itemName).trim(),
            price: Math.round(Number(item.price) * 100) / 100,
            quantity: Math.round(Number(item.quantity)) || 1,
        }));
};

// ─────────────────────────────────────────────────────────────────
// FALLBACK PARSER: Pure regex — works 100% offline, no API needed.
// Handles patterns like:
//   "2 soaps 30"  |  "soap 30 rupees 2"  |  "5 biscuits at 10 each"
//   "rice 50 rupees 3kg"  |  "dal 80 x 2"  |  "shampoo 120"
// ─────────────────────────────────────────────────────────────────
const regexFallbackParser = (text) => {
    const items = [];

    // Normalize: lowercase, strip filler words
    const normalized = text
        .toLowerCase()
        .replace(/\b(add|and|also|with|plus|each|per|piece|pieces|pcs|rupees|rs|₹|kg|gm|gram|grams|packet|packets|bottle|bottles|litre|liter|litres|liters|unit|units|no\.|nos|at|@)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Split on separators: comma, semicolon, "and"
    const segments = normalized.split(/\s*(?:,|;|\band\b)\s*/);

    for (const segment of segments) {
        const s = segment.trim();
        if (!s || s.length < 3) continue;

        let itemName = null;
        let price = null;
        let quantity = 1;

        // Pattern 1: "2 soaps 30"  →  qty name price
        const p1 = s.match(/^(\d+(?:\.\d+)?)\s+([a-z][a-z\s]{0,30}?)\s+(\d+(?:\.\d+)?)$/);
        if (p1) {
            quantity = parseFloat(p1[1]);
            itemName = p1[2].trim();
            price = parseFloat(p1[3]);
        }

        // Pattern 2: "soap 30 2"  →  name price qty
        if (!itemName) {
            const p2 = s.match(/^([a-z][a-z\s]{0,30}?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
            if (p2) {
                itemName = p2[1].trim();
                price = parseFloat(p2[2]);
                quantity = parseFloat(p2[3]);
            }
        }

        // Pattern 3: "soap 30"  →  name price  (qty = 1)
        if (!itemName) {
            const p3 = s.match(/^([a-z][a-z\s]{0,30}?)\s+(\d+(?:\.\d+)?)$/);
            if (p3) {
                itemName = p3[1].trim();
                price = parseFloat(p3[2]);
                quantity = 1;
            }
        }

        // Pattern 4: "30 soap"  →  price name  (qty = 1)
        if (!itemName) {
            const p4 = s.match(/^(\d+(?:\.\d+)?)\s+([a-z][a-z\s]{1,30})$/);
            if (p4) {
                price = parseFloat(p4[1]);
                itemName = p4[2].trim();
                quantity = 1;
            }
        }

        // Pattern 5: "soap x2 30"  or  "soap 2x30"
        if (!itemName) {
            const p5 = s.match(/^([a-z][a-z\s]{0,30}?)\s*[x×]\s*(\d+)\s*(\d+(?:\.\d+)?)$/);
            if (p5) {
                itemName = p5[1].trim();
                quantity = parseFloat(p5[2]);
                price = parseFloat(p5[3]);
            }
        }

        // Validate and push
        if (itemName && price > 0 && quantity > 0) {
            // Strip leading articles / stray numbers from name
            itemName = itemName.replace(/^(a|an|the|\d+)\s+/i, '').trim();
            if (itemName.length > 0) {
                items.push({ itemName, price, quantity });
            }
        }
    }

    return items;
};

// ─────────────────────────────────────────────────────────────────
// UTILITY: Call OpenAI with automatic retry + exponential backoff.
// Retries on 429 (rate limit) and 503 (service unavailable).
// ─────────────────────────────────────────────────────────────────
const callOpenAIWithRetry = async (text, maxRetries = 3) => {
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a billing assistant. Extract items, quantities, and prices from shop billing input.

RULES:
- Respond ONLY with a valid JSON array. No text. No markdown. No explanation.
- Each object must have: "itemName" (string), "price" (number), "quantity" (number)
- Default quantity is 1 if not mentioned. Price is always per unit.

EXAMPLES:
Input: "2 soaps 30 each and 1 shampoo 120"
Output: [{"itemName":"soap","price":30,"quantity":2},{"itemName":"shampoo","price":120,"quantity":1}]

Input: "rice 50 rupees 3 and dal 80 per packet 2"
Output: [{"itemName":"rice","price":50,"quantity":3},{"itemName":"dal","price":80,"quantity":2}]

Input: "5 biscuits at 10 each, cold drink 40"
Output: [{"itemName":"biscuit","price":10,"quantity":5},{"itemName":"cold drink","price":40,"quantity":1}]`,
                    },
                    { role: 'user', content: text },
                ],
                max_tokens: 400,
                temperature: 0.1,
            });

            return completion.choices[0]?.message?.content?.trim();

        } catch (error) {
            lastError = error;
            const status = error?.status || error?.response?.status;

            // 429 rate limit or 503 server error → wait and retry
            if ((status === 429 || status === 503) && attempt < maxRetries) {
                const retryAfter = error?.headers?.['retry-after'];
                const backoffMs = retryAfter
                    ? parseInt(retryAfter) * 1000
                    : Math.min(1000 * Math.pow(2, attempt), 10000); // 2s → 4s → 8s

                console.warn(`⏳ OpenAI ${status}. Attempt ${attempt}/${maxRetries}. Retrying in ${backoffMs}ms…`);
                await sleep(backoffMs);
                continue;
            }

            // All other errors (401 bad key, 400 bad request, network) → stop immediately
            break;
        }
    }

    throw lastError;
};

// ─────────────────────────────────────────────────────────────────
// CONTROLLER: POST /api/ai/parse-bill
//
// Strategy (3-layer resilience):
//   Layer 1 → OpenAI GPT-3.5 with up to 3 retries + backoff
//   Layer 2 → Regex fallback parser (works offline, no API key)
//   Layer 3 → Clear user-facing error with hint if both fail
// ─────────────────────────────────────────────────────────────────
const parseBillText = async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Text input is required',
            });
        }

        if (text.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Input too short. Try: "2 soaps 30 each and 1 shampoo 120"',
            });
        }

        let items = [];
        let parseMethod = 'openai';
        let warning = null;

        // ── Layer 1: OpenAI with retry ───────────────────────────────
        try {
            const rawContent = await callOpenAIWithRetry(text, 3);

            if (rawContent) {
                try {
                    items = JSON.parse(rawContent);
                } catch {
                    // Sometimes GPT wraps JSON in markdown fences — strip them
                    const jsonMatch = rawContent.match(/\[[\s\S]*?\]/);
                    if (jsonMatch) {
                        try { items = JSON.parse(jsonMatch[0]); } catch { items = []; }
                    }
                }
            }

            items = sanitizeItems(items);

            if (items.length === 0) {
                // GPT responded but gave nothing useful → fall through
                throw new Error('OpenAI returned no valid items — using regex fallback');
            }

        } catch (aiError) {
            // ── Layer 2: Regex Fallback ────────────────────────────────
            const errStatus = aiError?.status || aiError?.response?.status;
            console.warn(`⚠️  AI layer failed (${errStatus || aiError.message}). Using regex fallback.`);

            parseMethod = 'regex';
            warning =
                errStatus === 429
                    ? 'AI is rate-limited right now. Items parsed using smart pattern matching instead.'
                    : errStatus === 401
                        ? 'OpenAI API key issue. Items parsed using smart pattern matching instead.'
                        : 'AI service unavailable. Items parsed using smart pattern matching instead.';

            items = sanitizeItems(regexFallbackParser(text));
        }

        // ── Layer 3: Nothing worked ──────────────────────────────────
        if (items.length === 0) {
            return res.status(422).json({
                success: false,
                message: 'Could not extract items from your input.',
                hint: 'Try format: "2 soaps 30 each and 1 shampoo 120"',
            });
        }

        return res.json({
            success: true,
            items,
            parseMethod,
            warning, // null when OpenAI worked fine
        });

    } catch (error) {
        // Absolute last resort — try regex one more time silently
        console.error('parseBillText unexpected error:', error);

        try {
            const fallbackItems = sanitizeItems(regexFallbackParser(req.body?.text || ''));
            if (fallbackItems.length > 0) {
                return res.json({
                    success: true,
                    items: fallbackItems,
                    parseMethod: 'regex',
                    warning: 'AI unavailable. Items parsed using pattern matching.',
                });
            }
        } catch (_) { /* ignore */ }

        return res.status(500).json({
            success: false,
            message: 'Parsing failed. Please add items manually or try again.',
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// CONTROLLER: GET /api/ai/suggestions
// Returns top 10 frequently sold items for quick-add suggestions
// ─────────────────────────────────────────────────────────────────
const getSmartSuggestions = async (req, res, next) => {
    try {
        const bills = await Bill.find({
            shopkeeper: req.user.id,
            status: 'final',
        })
            .sort({ createdAt: -1 })
            .limit(100);

        const itemStats = {};

        bills.forEach((bill) => {
            bill.items.forEach((item) => {
                const key = item.itemName.toLowerCase().trim();
                if (!itemStats[key]) {
                    itemStats[key] = {
                        name: item.itemName,
                        count: 0,
                        latestPrice: item.price,
                        totalRevenue: 0,
                    };
                }
                itemStats[key].count++;
                itemStats[key].latestPrice = item.price; // keep most recent price
                itemStats[key].totalRevenue += item.subtotal || item.price * item.quantity;
            });
        });

        const suggestions = Object.values(itemStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((item) => ({
                itemName: item.name,
                price: item.latestPrice,
                frequency: item.count,
            }));

        res.json({ success: true, suggestions });
    } catch (error) {
        next(error);
    }
};

module.exports = { parseBillText, getSmartSuggestions };