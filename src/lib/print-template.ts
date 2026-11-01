/**
 * Municipal Print & PDF Document Template Engine
 * Generates official A4/Letter formatted printable government documents
 * for the Municipality of Mabini, Batangas Tourism Office.
 */

export interface PrintDocumentOptions {
  title: string;
  documentType: string;
  documentNumber?: string;
  periodOrDate?: string;
  preparedBy?: string;
  signatoryTitle?: string;
  bodyHtml: string;
  paperFormat?: string;
}

export function openPrintDocument(options: PrintDocumentOptions): void {
  const {
    title,
    documentType,
    documentNumber = `MTO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    periodOrDate = new Date().toLocaleDateString('en-PH', { dateStyle: 'long' }),
    preparedBy = 'Tourism Office Staff',
    signatoryTitle = 'Municipal Tourism Officer',
    bodyHtml,
    paperFormat = 'A4',
  } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and print documents.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — Mabini Tourism Office</title>
  <style>
    @page {
      size: ${paperFormat} portrait;
      margin: 15mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.4;
    }
    .no-print {
      margin-bottom: 24px;
      padding: 12px 16px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-print {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    .btn-print:hover {
      background: #0369a1;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header .republic {
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
    }
    .header .province {
      font-size: 10pt;
      font-weight: 500;
      color: #334155;
    }
    .header .municipality {
      font-size: 14pt;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.02em;
    }
    .header .office {
      font-size: 11pt;
      font-weight: 600;
      color: #0284c7;
      margin-top: 2px;
    }
    .doc-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 9.5pt;
    }
    .doc-title-block {
      text-align: center;
      margin-bottom: 24px;
    }
    .doc-title {
      font-size: 15pt;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .doc-subtitle {
      font-size: 10pt;
      color: #64748b;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 9.5pt;
    }
    th {
      background-color: #f8fafc;
      color: #0f172a;
      font-weight: 600;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .font-semibold {
      font-weight: 600;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 8pt;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 14pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .signatures {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-box {
      width: 42%;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px solid #0f172a;
      margin-top: 45px;
      margin-bottom: 6px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 10pt;
      color: #0f172a;
    }
    .sig-title {
      font-size: 9pt;
      color: #475569;
    }
    .official-footer {
      margin-top: 36px;
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong>Document Print Preview</strong> &mdash; Press Print to print or save as PDF.
    </div>
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="republic">Republic of the Philippines</div>
    <div class="province">Province of Batangas</div>
    <div class="municipality">Municipality of Mabini</div>
    <div class="office">MUNICIPAL TOURISM &amp; CULTURAL HERITAGE OFFICE</div>
  </div>

  <div class="doc-meta">
    <div>
      <strong>Doc Ref:</strong> <span class="font-mono">${documentNumber}</span><br>
      <strong>Date Generated:</strong> ${new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
    </div>
    <div class="text-right">
      <strong>Classification:</strong> ${documentType}<br>
      <strong>Coverage / Date:</strong> ${periodOrDate}
    </div>
  </div>

  <div class="doc-title-block">
    <div class="doc-title">${title}</div>
  </div>

  ${bodyHtml}

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">${preparedBy}</div>
      <div class="sig-title">Tourism Office Staff / Encoding Officer</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-name">MARIA ELENA S. BAUTISTA</div>
      <div class="sig-title">${signatoryTitle}</div>
    </div>
  </div>

  <div class="official-footer">
    Official Document &bull; Mabini Municipal Hall, Batangas, Philippines &bull; bantaydagat@mabini.batangas.gov.ph
  </div>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
