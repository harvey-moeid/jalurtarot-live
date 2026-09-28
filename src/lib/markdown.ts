/**
 * markdownToHtml — shared utility, diinject ke semua page sebagai JS string.
 */
export const markdownToHtmlFn = `function markdownToHtml(md) {
  if (!md) return '';
  return md
    .replace(/---/g, '<hr style="border:none;border-top:1px solid var(--ink-line);margin:1.25rem 0;" />')
    .replace(/^### (.+)$/gm, '<h3 style="font-family:var(--font-heading);color:var(--bone);letter-spacing:0.1em;margin:1.25rem 0 0.4rem;font-size:0.9rem;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-family:var(--font-heading);color:var(--bone);letter-spacing:0.12em;margin:1.5rem 0 0.5rem;font-size:1rem;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-family:var(--font-heading);color:var(--bone);letter-spacing:0.15em;margin:1.5rem 0 0.5rem;font-size:1.1rem;">$1</h1>')
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong style="color:var(--bone);">$1</strong>')
    .replace(/\\*(.+?)\\*/g, '<em style="color:var(--bone-faint);">$1</em>')
    .replace(/\\n\\n/g, '</p><p style="margin-bottom:1rem;color:var(--bone-dim);line-height:1.85;">')
    .replace(/\\n/g, '<br/>')
    .replace(/^/, '<p style="margin-bottom:1rem;color:var(--bone-dim);line-height:1.85;">')
    .replace(/$/, '</p>');
}`;