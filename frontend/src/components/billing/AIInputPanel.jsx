import { useState, useRef } from 'react';
import {
    MdAutoAwesome,
    MdMic,
    MdMicOff,
    MdArrowForward,
    MdWarning,
    MdRefresh,
    MdCheckCircle,
    MdInfo,
} from 'react-icons/md';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// CLIENT-SIDE REGEX FALLBACK
// Mirrors the server regex parser — used when the request itself
// fails to reach the server (offline / network error).
// ─────────────────────────────────────────────────────────────
const clientFallbackParser = (text) => {
    const items = [];
    const normalized = text
        .toLowerCase()
        .replace(
            /\b(add|and|also|with|plus|each|per|piece|pieces|pcs|rupees|rs|₹|kg|gm|gram|grams|packet|packets|bottle|bottles|litre|liter|litres|liters|unit|units|no\.|nos|at|@)\b/gi,
            ' '
        )
        .replace(/\s+/g, ' ')
        .trim();

    const segments = normalized.split(/\s*(?:,|;|\band\b)\s*/);

    for (const seg of segments) {
        const s = seg.trim();
        if (!s || s.length < 3) continue;

        let itemName = null, price = null, quantity = 1;

        // qty name price
        const p1 = s.match(/^(\d+(?:\.\d+)?)\s+([a-z][a-z\s]{0,30}?)\s+(\d+(?:\.\d+)?)$/);
        if (p1) { quantity = +p1[1]; itemName = p1[2].trim(); price = +p1[3]; }

        // name price qty
        if (!itemName) {
            const p2 = s.match(/^([a-z][a-z\s]{0,30}?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
            if (p2) { itemName = p2[1].trim(); price = +p2[2]; quantity = +p2[3]; }
        }

        // name price
        if (!itemName) {
            const p3 = s.match(/^([a-z][a-z\s]{0,30}?)\s+(\d+(?:\.\d+)?)$/);
            if (p3) { itemName = p3[1].trim(); price = +p3[2]; quantity = 1; }
        }

        // price name
        if (!itemName) {
            const p4 = s.match(/^(\d+(?:\.\d+)?)\s+([a-z][a-z\s]{1,30})$/);
            if (p4) { price = +p4[1]; itemName = p4[2].trim(); quantity = 1; }
        }

        if (itemName && price > 0 && quantity > 0) {
            itemName = itemName.replace(/^(a|an|the|\d+)\s+/i, '').trim();
            if (itemName.length > 0) {
                items.push({
                    itemName,
                    price: Math.round(price * 100) / 100,
                    quantity: Math.round(quantity) || 1,
                });
            }
        }
    }

    return items;
};

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
const ParseBadge = ({ method }) => {
    if (!method) return null;
    if (method === 'openai') {
        return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full
                       bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                <MdCheckCircle size={12} /> OpenAI
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full
                     bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
            <MdInfo size={12} /> Smart Match
        </span>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const AIInputPanel = ({ onItemsParsed }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    const [lastWarning, setLastWarning] = useState(null);
    const [lastMethod, setLastMethod] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const recognitionRef = useRef(null);

    const examples = [
        '2 soaps 30 each and 1 shampoo 120',
        'rice 50 rupees 3 and dal 80 per packet 2',
        'biscuit 10 rupees 5, cold drink 40 each 3',
        '1 toothpaste 65 and 2 soap 25',
    ];

    // ── Main parse handler ──────────────────────────────────────
    const handleParse = async (inputText) => {
        const query = (inputText || text).trim();
        if (!query) return;

        setLoading(true);
        setLastWarning(null);
        setLastMethod(null);

        try {
            const { data } = await api.post('/ai/parse-bill', { text: query });

            if (data.success && data.items?.length > 0) {
                onItemsParsed(data.items);
                setLastMethod(data.parseMethod || 'openai');

                if (data.warning) {
                    setLastWarning(data.warning);
                    toast(`⚡ ${data.items.length} item(s) added via smart matching`, {
                        icon: '🔄',
                        style: { background: '#fef3c7', color: '#92400e' },
                    });
                } else {
                    toast.success(`✨ ${data.items.length} item(s) added via AI`);
                }

                setText('');
                setRetryCount(0);
            } else {
                toast.error(data.message || 'No items found. Try a different phrasing.');
            }

        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;
            const hint = err.response?.data?.hint;

            if (status === 429) {
                // Server is still rate-limited even after retries → try client regex
                toast.loading('AI busy, trying local parsing…', { id: 'fallback' });
                const fallbackItems = clientFallbackParser(query);

                if (fallbackItems.length > 0) {
                    onItemsParsed(fallbackItems);
                    setLastMethod('regex');
                    setLastWarning('OpenAI rate limit reached. Used offline pattern matching.');
                    toast.success(`⚡ ${fallbackItems.length} item(s) added (offline mode)`, { id: 'fallback' });
                    setText('');
                } else {
                    toast.error('AI is rate-limited and pattern matching also failed. Try: "2 soaps 30 each"', { id: 'fallback' });
                    setRetryCount((c) => c + 1);
                }

            } else if (status === 422) {
                toast.error(`${message}${hint ? `\nHint: ${hint}` : ''}`);

            } else if (!err.response) {
                // Network offline → client regex
                const fallbackItems = clientFallbackParser(query);
                if (fallbackItems.length > 0) {
                    onItemsParsed(fallbackItems);
                    setLastMethod('regex');
                    setLastWarning('Network offline. Items parsed locally.');
                    toast.success(`📡 ${fallbackItems.length} item(s) added (offline)`);
                    setText('');
                } else {
                    toast.error('Network error. Check your connection or add items manually.');
                }

            } else {
                toast.error(message || 'Parsing failed. Please try again or add items manually.');
                setRetryCount((c) => c + 1);
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Voice input ─────────────────────────────────────────────
    const startVoice = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error('Voice input not supported in this browser (use Chrome/Edge)');
            return;
        }
        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SR();
        recognitionRef.current = recognition;
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setListening(true);
        recognition.start();

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setText(transcript);
            setListening(false);
            // Auto-parse after voice
            setTimeout(() => handleParse(transcript), 300);
        };
        recognition.onerror = (e) => {
            setListening(false);
            if (e.error !== 'aborted') toast.error('Voice recognition failed. Try again.');
        };
        recognition.onend = () => setListening(false);
    };

    // ── Render ──────────────────────────────────────────────────
    return (
        <div className="card p-4 mb-6 border-2 border-blue-100 dark:border-blue-900/40
                    bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-800">

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <MdAutoAwesome className="text-blue-500" size={20} />
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                    AI Bill Entry
                </h3>
                <span className="badge bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 text-xs">
                    OpenAI + Smart Fallback
                </span>
                {lastMethod && <ParseBadge method={lastMethod} />}
            </div>

            {/* Input row */}
            <div className="flex gap-2">
                <input
                    className="input flex-1"
                    placeholder='e.g. "2 soaps 30 each and 1 shampoo 120"'
                    value={text}
                    onChange={(e) => { setText(e.target.value); setLastWarning(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleParse()}
                    disabled={loading}
                />

                {/* Voice button */}
                <button
                    type="button"
                    onClick={startVoice}
                    title={listening ? 'Stop listening' : 'Voice input'}
                    className={`p-2.5 rounded-xl border transition-all flex-shrink-0 ${listening
                            ? 'bg-red-500 text-white border-red-500 animate-pulse'
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-blue-400 hover:text-blue-500'
                        }`}
                >
                    {listening ? <MdMicOff size={18} /> : <MdMic size={18} />}
                </button>

                {/* Parse button */}
                <button
                    type="button"
                    onClick={() => handleParse()}
                    disabled={loading || !text.trim()}
                    className="btn-primary flex-shrink-0"
                >
                    {loading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : retryCount > 0 ? (
                        <MdRefresh size={18} />
                    ) : (
                        <MdArrowForward size={18} />
                    )}
                    <span className="hidden sm:inline">
                        {loading ? 'Parsing…' : retryCount > 0 ? 'Retry' : 'Parse'}
                    </span>
                </button>
            </div>

            {/* Warning banner — shows when fallback was used */}
            {lastWarning && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-yellow-50 dark:bg-yellow-900/20
                        border border-yellow-200 dark:border-yellow-700/50 rounded-xl">
                    <MdWarning className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
                        {lastWarning}
                    </p>
                </div>
            )}

            {/* Quick examples */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-xs text-slate-400 flex-shrink-0">Try:</span>
                {examples.map((ex, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => { setText(ex); setLastWarning(null); }}
                        disabled={loading}
                        className="text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200
                       dark:border-slate-600 text-slate-500 dark:text-slate-400 rounded-lg
                       hover:border-blue-400 hover:text-blue-500 transition-all disabled:opacity-50"
                    >
                        {ex}
                    </button>
                ))}
            </div>

            {/* Hint when retries have failed */}
            {retryCount >= 2 && (
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                    💡 Tip: Add items manually in the table below, or try format:{' '}
                    <span className="font-mono text-blue-500">"soap 30 2"</span>
                </p>
            )}
        </div>
    );
};

export default AIInputPanel;