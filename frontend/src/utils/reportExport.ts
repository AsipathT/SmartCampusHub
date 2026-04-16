import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resource } from '../types/resource';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatType = (t: string) =>
  (t || 'OTHER').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const nowStr   = () => new Date().toLocaleString('en-GB', { hour12: false });
const fileDate = () => new Date().toISOString().slice(0, 10);

const statusDisplay = (s: string) => {
  if (s === 'ACTIVE')         return '✔ ACTIVE';
  if (s === 'MAINTENANCE')    return '⚠ MAINTENANCE';
  if (s === 'OUT_OF_SERVICE') return '✖ OUT OF SERVICE';
  return s.replace(/_/g, ' ');
};

// ── CSV Export ───────────────────────────────────────────────────────────────
export const exportCSV = (resources: Resource[], label = 'Resources') => {
  if (!resources.length) return;

  const headers = [
    'ID', 'Name', 'Type', 'Location', 'Capacity',
    'Status', 'Available From', 'Available To', 'Description',
  ];

  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

  const rows = resources.map((r) => [
    r.id,
    r.name,
    formatType(r.type),
    r.location,
    r.capacity ?? '',
    r.status,
    r.availableFrom ?? '',
    r.availableTo ?? '',
    r.description ?? '',
  ].map(escape).join(','));

  const csv = [
    `# SLIIT SmartCampusHub — ${label} Report`,
    `# Generated: ${nowStr()}`,
    `# Total Records: ${resources.length}`,
    '',
    headers.map(escape).join(','),
    ...rows,
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `SLIIT_${label.replace(/\s+/g, '_')}_${fileDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── PDF Export ───────────────────────────────────────────────────────────────
export const exportPDF = (
  resources: Resource[],
  label = 'Resources',
  stats?: { total: number; active: number; maintenance: number; inactive: number }
) => {
  if (!resources.length) return;

  const doc  = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // ── 1. Header banner ──────────────────────────────────────────────────────
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SLIIT SmartCampusHub', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${label.replace(/_/g, ' ')} Report`, 14, 19);

  doc.setFontSize(7.5);
  doc.setTextColor(199, 194, 255);
  doc.text(
    `Generated: ${nowStr()} · Sri Lanka Institute of Information Technology`,
    14, 25.5
  );

  // ── 2. KPI summary boxes (if stats provided) ──────────────────────────────
  let tableStartY = 33;

  if (stats) {
    const kpis: Array<{ label: string; value: number; r: number; g: number; b: number }> = [
      { label: 'Total Resources', value: stats.total,       r: 99,  g: 102, b: 241 },
      { label: 'Active',          value: stats.active,      r: 16,  g: 185, b: 129 },
      { label: 'Maintenance',     value: stats.maintenance, r: 245, g: 158, b: 11  },
      { label: 'Inactive',        value: stats.inactive,    r: 244, g: 63,  b: 94  },
    ];

    const boxW = 58, boxH = 16, gap = 4;
    const totalBoxes = kpis.length * (boxW + gap) - gap;
    const startX = (pageW - totalBoxes) / 2;
    const startY = 33;

    kpis.forEach(({ label: kLabel, value, r, g, b }, i) => {
      const x = startX + i * (boxW + gap);
      doc.setFillColor(r, g, b);
      doc.roundedRect(x, startY, boxW, boxH, 2.5, 2.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(kLabel.toUpperCase(), x + boxW / 2, startY + 5.5, { align: 'center' });

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), x + boxW / 2, startY + 13.5, { align: 'center' });
    });

    tableStartY = startY + boxH + 5;
  }

  // ── 3. Data table ─────────────────────────────────────────────────────────
  const head = [['#', 'Name', 'Type', 'Location', 'Cap.', 'Status', 'Hours', 'Description']];
  const body = resources.map((r) => [
    String(r.id),
    r.name,
    formatType(r.type),
    r.location ?? '—',
    String(r.capacity ?? '—'),
    statusDisplay(r.status),
    r.availableFrom && r.availableTo ? `${r.availableFrom} – ${r.availableTo}` : '—',
    (r.description ?? '—').slice(0, 55) + ((r.description?.length ?? 0) > 55 ? '…' : ''),
  ]);

  // Status column colour via didParseCell (correct v5 API)
  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles:          { fontSize: 7.5, textColor: [51, 65, 85] },
    alternateRowStyles:  { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 30 },
      6: { cellWidth: 24, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw ?? '');
        if (val.includes('ACTIVE')) {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fontStyle = 'bold';
        } else if (val.includes('MAINTENANCE') || val.includes('OUT OF SERVICE')) {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── 4. Page footer ────────────────────────────────────────────────────────
  const total = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SLIIT SmartCampusHub · Confidential · Page ${p} of ${total}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  doc.save(`SLIIT_${label.replace(/[\s/]/g, '_')}_${fileDate()}.pdf`);
};
