export function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function downloadDocument(filename: string, title: string, content: string) {
  const documentHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><style>
body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; background: #f8fafc; }
main { max-width: 760px; margin: 32px auto; padding: 36px; background: white; box-shadow: 0 1px 4px #0f172a1a; }
h1 { color: #047857; margin: 0 0 8px; } h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; } th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
th { color: #475569; background: #f8fafc; } .right { text-align: right; } .muted { color: #64748b; font-size: 13px; } .total { font-weight: 700; font-size: 17px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 16px; background: #f8fafc; } @media print { body { background: white; } main { margin: 0; box-shadow: none; } } @media (max-width: 600px) { main { margin: 0; padding: 20px; } .grid { grid-template-columns: 1fr; } }
</style></head><body><main>${content}</main></body></html>`;
  const url = URL.createObjectURL(new Blob([documentHtml], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
