/* ================================================
   SITE COMMAND — PDF Export
   Uses jsPDF (loaded via CDN) to generate
   professional daily report PDFs.
   ================================================ */

/**
 * Generate a professional PDF for a daily site report.
 * @param {Object} report - The report object from DB
 */
function exportReportPDF(report) {
  if (typeof window.jspdf === 'undefined') {
    showToast('PDF library loading… try again in a moment', 'info');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

  // ── Colors ────────────────────────────────────
  const ORANGE = [255, 107, 43];
  const NAVY   = [10, 14, 26];
  const NAVY2  = [20, 25, 41];
  const WHITE  = [255, 255, 255];
  const GRAY   = [120, 130, 155];
  const LGRAY  = [230, 233, 240];
  const GREEN  = [34, 197, 94];
  const RED    = [239, 68, 68];

  const W = 215.9; // letter width mm
  const MARGIN = 18;
  const CONTENT_W = W - MARGIN * 2;

  let y = 0;

  // ── Header Banner ─────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 48, 'F');

  // Orange accent bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 5, 48, 'F');

  // Logo area
  doc.setFillColor(...ORANGE);
  doc.roundedRect(MARGIN, 10, 24, 24, 3, 3, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SC', MARGIN + 12, 25, { align: 'center' });

  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('SITE COMMAND', MARGIN + 30, 19);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ORANGE);
  doc.text('DAILY SITE REPORT', MARGIN + 30, 25);

  // Report date top-right
  const fmtDate = report.date
    ? new Date(report.date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown Date';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(fmtDate, W - MARGIN, 19, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Generated ${new Date().toLocaleString('en-CA')}`, W - MARGIN, 25, { align: 'right' });

  y = 56;

  // ── Info Grid ─────────────────────────────────
  const infoBoxH = 28;
  const boxW = (CONTENT_W - 6) / 4;

  const infoItems = [
    { label: 'PROJECT', value: report.project || '—' },
    { label: 'FOREMAN', value: report.foreman || '—' },
    { label: 'CREW / MAN-HRS', value: `${report.crew || 0} workers / ${report.hours || 0}h` },
    { label: 'WEATHER', value: report.weather?.replace(/[^\x00-\x7F]/g, '').trim() || '—' },
  ];

  infoItems.forEach((item, i) => {
    const x = MARGIN + i * (boxW + 2);
    doc.setFillColor(...NAVY2);
    doc.roundedRect(x, y, boxW, infoBoxH, 2, 2, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ORANGE);
    doc.text(item.label, x + 5, y + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 230, 255);
    const lines = doc.splitTextToSize(item.value, boxW - 8);
    doc.text(lines[0], x + 5, y + 15);
    if (lines[1]) doc.text(lines[1], x + 5, y + 21);
  });

  y += infoBoxH + 8;

  // ── Sections helper ───────────────────────────
  function drawSection(title, content, accentColor = ORANGE) {
    if (y > 240) { doc.addPage(); y = MARGIN; }

    // Section header
    doc.setFillColor(...accentColor);
    doc.rect(MARGIN, y, 3, 5, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(title, MARGIN + 6, y + 4);

    // Separator line
    doc.setDrawColor(...LGRAY);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 7, MARGIN + CONTENT_W, y + 7);

    y += 11;

    // Content
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 60, 80);
    const lines = doc.splitTextToSize(content || 'None reported.', CONTENT_W);
    lines.forEach(line => {
      if (y > 258) { doc.addPage(); y = MARGIN; }
      doc.text(line, MARGIN, y);
      y += 5.5;
    });

    y += 5;
  }

  // ── Draw Sections ─────────────────────────────
  drawSection('WORK COMPLETED TODAY', report.work);
  drawSection('ISSUES & DELAYS', report.issues, RED);
  drawSection('VISITORS ON SITE', report.visitors, [59, 130, 246]);

  // ── Deliveries / Notes ────────────────────────
  if (report.deliveries) {
    drawSection('DELIVERIES RECEIVED', report.deliveries);
  }

  // ── Photos Tag ────────────────────────────────
  if (y > 230) { doc.addPage(); y = MARGIN; }

  doc.setFillColor(34, 197, 94, 0.1);
  doc.setFillColor(240, 255, 245);
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 2, 2, 'F');
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text(`PHOTOS ATTACHED: ${report.photos || 0}`, MARGIN + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 100, 70);
  doc.setFontSize(8);
  doc.text('Photos are stored digitally in Site Command Photo Log', MARGIN + 5, y + 13);

  y += 24;

  // ── Signature Block ───────────────────────────
  if (y > 235) { doc.addPage(); y = MARGIN; }

  doc.setFillColor(...LGRAY);
  doc.rect(MARGIN, y, CONTENT_W, 0.4, 'F');
  y += 8;

  const sigColW = CONTENT_W / 3;

  // Foreman sig
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Foreman Signature', MARGIN, y);
  doc.setDrawColor(...LGRAY);
  doc.line(MARGIN, y + 14, MARGIN + sigColW - 8, y + 14);
  doc.text(report.foreman || '', MARGIN, y + 20);

  // PM sig
  const x2 = MARGIN + sigColW + 4;
  doc.text('Project Manager / Reviewed By', x2, y);
  doc.line(x2, y + 14, x2 + sigColW - 8, y + 14);

  // Date signed
  const x3 = MARGIN + sigColW * 2 + 8;
  doc.text('Date Signed', x3, y);
  doc.line(x3, y + 14, x3 + sigColW - 10, y + 14);
  doc.text(fmtDate, x3, y + 20);

  y += 28;

  // ── Footer ───────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    // Footer bar
    doc.setFillColor(...NAVY);
    doc.rect(0, 272, W, 287, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('SITE COMMAND — Confidential Construction Documentation', MARGIN, 279);
    doc.text(`Page ${p} of ${pageCount}`, W - MARGIN, 279, { align: 'right' });

    // Orange bottom strip
    doc.setFillColor(...ORANGE);
    doc.rect(0, 284, W, 3, 'F');
  }

  // ── Save ─────────────────────────────────────
  const safeName = (report.project || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDate = (report.date || 'unknown').replace(/[^0-9-]/g, '');
  doc.save(`SiteCommand_DailyReport_${safeName}_${safeDate}.pdf`);

  showToast('📄 PDF exported to your Downloads folder', 'success');
}

/**
 * Generate a Change Order PDF
 * @param {Object} co - The change order from DB
 */
function exportChangOrderPDF(co) {
  if (typeof window.jspdf === 'undefined') {
    showToast('PDF library loading… try again', 'info');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });

  const W = 215.9;
  const MARGIN = 20;
  const CONTENT_W = W - MARGIN * 2;
  const ORANGE = [255, 107, 43];
  const NAVY = [10, 14, 26];
  const WHITE = [255, 255, 255];
  const GRAY = [120, 130, 155];
  const LGRAY = [230, 233, 240];

  // Header
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 50, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 5, 50, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('CHANGE ORDER', MARGIN, 22);

  doc.setFontSize(12);
  doc.setTextColor(...ORANGE);
  doc.text(co.number || '#CO-000', MARGIN, 32);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Site Command — Contract Modification', MARGIN, 40);

  const total = Number(co.labourCost || 0) + Number(co.materialCost || 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(`$${total.toLocaleString()}`, W - MARGIN, 25, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Total Amount', W - MARGIN, 32, { align: 'right' });

  let y = 60;

  // Info grid
  const fields = [
    ['Project', co.project],
    ['Date Submitted', co.date],
    ['Requested By', co.requestedBy],
    ['Status', (co.status || 'Pending').toUpperCase()],
  ];
  fields.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN + col * (CONTENT_W / 2 + 2);
    const cy = y + row * 20;

    doc.setFillColor(245, 246, 250);
    doc.roundedRect(x, cy, CONTENT_W / 2 - 2, 16, 1, 1, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ORANGE);
    doc.text(label.toUpperCase(), x + 4, cy + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 40, 60);
    doc.text(String(val || '—'), x + 4, cy + 13);
  });

  y += 46;

  // Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 40, 60);
  const titleLines = doc.splitTextToSize(co.title || '', CONTENT_W);
  titleLines.forEach(l => { doc.text(l, MARGIN, y); y += 7; });
  y += 4;

  // Description
  doc.setFillColor(...LGRAY);
  doc.rect(MARGIN, y, CONTENT_W, 0.4, 'F');
  y += 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 70, 90);
  const descLines = doc.splitTextToSize(co.desc || '', CONTENT_W);
  descLines.forEach(l => { doc.text(l, MARGIN, y); y += 5.5; });
  y += 8;

  // Cost table
  doc.setFillColor(248, 249, 252);
  doc.roundedRect(MARGIN, y, CONTENT_W, 40, 2, 2, 'F');
  doc.setDrawColor(...LGRAY);
  doc.roundedRect(MARGIN, y, CONTENT_W, 40, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text('COST BREAKDOWN', MARGIN + 6, y + 8);

  doc.setFontSize(9);
  doc.setTextColor(30, 40, 60);
  doc.text('Labour:', MARGIN + 6, y + 18);
  doc.text(`$${Number(co.labourCost || 0).toLocaleString()}`, MARGIN + CONTENT_W - 6, y + 18, { align: 'right' });
  doc.text('Materials:', MARGIN + 6, y + 27);
  doc.text(`$${Number(co.materialCost || 0).toLocaleString()}`, MARGIN + CONTENT_W - 6, y + 27, { align: 'right' });

  doc.setFillColor(...LGRAY);
  doc.rect(MARGIN + 4, y + 31, CONTENT_W - 8, 0.3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('TOTAL:', MARGIN + 6, y + 38);
  doc.setTextColor(...ORANGE);
  doc.text(`$${total.toLocaleString()}`, MARGIN + CONTENT_W - 6, y + 38, { align: 'right' });
  y += 50;

  // Signature block
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Authorized Signature', MARGIN, y + 5);
  doc.line(MARGIN, y + 18, MARGIN + 80, y + 18);
  doc.text('Date', MARGIN + 100, y + 5);
  doc.line(MARGIN + 100, y + 18, W - MARGIN, y + 18);

  // Footer
  doc.setFillColor(...NAVY);
  doc.rect(0, 272, W, 287, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(0, 284, W, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('SITE COMMAND — Confidential Contract Documentation', MARGIN, 279);
  doc.text('Page 1 of 1', W - MARGIN, 279, { align: 'right' });

  const safeNum = (co.number || 'CO').replace(/[^a-zA-Z0-9-]/g, '_');
  doc.save(`SiteCommand_ChangeOrder_${safeNum}.pdf`);
  showToast('📄 Change Order PDF exported', 'success');
}
