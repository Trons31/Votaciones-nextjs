export function normalizeText(text: string): string {
  // Similar a Python: unicodedata.normalize('NFKD') + remove accents + lowercase
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
