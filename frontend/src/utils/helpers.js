// Format currency
export const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount || 0);
};

// Format date
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

// Payment status badge color
export const statusColor = (status) => {
    const map = {
        paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        refunded: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        final: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
};

// Generate PDF Invoice
export const generatePDF = (bill, shopInfo) => {
    import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(() => {
            const doc = new jsPDF();
            const pageW = doc.internal.pageSize.getWidth();

            // Header
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, pageW, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(shopInfo?.shopName || 'Smart Billing', 14, 18);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`INVOICE`, pageW - 14, 12, { align: 'right' });
            doc.text(`#${bill.billNumber}`, pageW - 14, 20, { align: 'right' });
            doc.text(formatDate(bill.createdAt), pageW - 14, 28, { align: 'right' });

            // Customer info
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Bill To:', 14, 55);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const cust = bill.customerSnapshot || {};
            doc.text(cust.name || 'Walk-in Customer', 14, 63);
            if (cust.phone) doc.text(`Phone: ${cust.phone}`, 14, 70);
            if (cust.address) doc.text(`Address: ${cust.address}`, 14, 77);

            // Shop info
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('From:', pageW / 2, 55);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(shopInfo?.name || '', pageW / 2, 63);
            if (shopInfo?.phone) doc.text(shopInfo.phone, pageW / 2, 70);
            if (shopInfo?.gstNumber) doc.text(`GST: ${shopInfo.gstNumber}`, pageW / 2, 77);

            // Items table
            const tableData = bill.items.map((item, i) => [
                i + 1,
                item.itemName,
                item.quantity,
                formatCurrency(item.price),
                formatCurrency(item.subtotal),
            ]);

            doc.autoTable({
                startY: 90,
                head: [['#', 'Item', 'Qty', 'Price', 'Subtotal']],
                body: tableData,
                headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                styles: { fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 10 },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                },
            });

            const finalY = doc.lastAutoTable.finalY + 10;

            // Totals
            const totalsX = pageW - 80;
            let ty = finalY;
            const addRow = (label, value, bold = false) => {
                if (bold) { doc.setFont('helvetica', 'bold'); doc.setFontSize(11); }
                else { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); }
                doc.text(label, totalsX, ty);
                doc.text(value, pageW - 14, ty, { align: 'right' });
                ty += 8;
            };

            addRow('Subtotal:', formatCurrency(bill.subtotal));
            if (bill.discountAmount > 0) addRow(`Discount:`, `-${formatCurrency(bill.discountAmount)}`);
            if (bill.gstEnabled) addRow(`GST (${bill.gstRate}%):`, formatCurrency(bill.gstAmount));
            doc.setDrawColor(200, 200, 200);
            doc.line(totalsX, ty - 2, pageW - 14, ty - 2);
            addRow('TOTAL:', formatCurrency(bill.totalAmount), true);

            // Footer
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text('Thank you for your business!', pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

            doc.save(`${bill.billNumber}.pdf`);
        });
    });
};