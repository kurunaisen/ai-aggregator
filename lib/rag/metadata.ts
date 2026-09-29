const MONTHS =
  "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";

const BOILERPLATE =
  /^(утвержден[аоы]?|согласован[аоы]?|министерство(?:\s+транспорта)?|российская федерация|открытое акционерное общество.*|оао\s+.ржд.*)$/i;

export function extractTitle(text: string, filename: string): string {
  const lines = text
    .split(/\n/)
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 25);

  for (const line of lines) {
    if (line.length < 12 || line.length > 180) continue;
    if (BOILERPLATE.test(line)) continue;
    if (/^(№|от\s+\d|таблица\s+\d)/i.test(line)) continue;
    if (/^(?:пункт|п)\.?\s*\d/i.test(line) && line.length < 40) continue;
    return line;
  }

  const fallback = filename.replace(/\.[^.]+$/, "").trim();
  return fallback || "Документ";
}

export function extractDocumentNumber(text: string): string | null {
  const head = text.slice(0, 5000);
  const patterns = [
    /ГОСТ(?:\s+Р(?:\s+ИСО)?)?\s+\d+(?:\.\d+)*(?:\s*[-–—]\s*\d+)?/i,
    /СП\s+\d+(?:\.\d+)+/i,
    /СНиП\s+\d+(?:\.\d+)*(?:\s*[-–—]\s*\d+)?/i,
    /(?:приказ|распоряжение)\s+[^\n]{0,140}?№\s*\d+(?:[./\-]\d+)*/i,
    /№\s*\d+(?:[./\-]\d+)*/,
  ];

  for (const pattern of patterns) {
    const match = head.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ").trim();
  }

  return null;
}

export function extractDocumentDate(text: string): string | null {
  const head = text.slice(0, 5000);
  const written = head.match(new RegExp(`от\\s+(\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4}\\s*г?\\.?)`, "i"));
  if (written) return written[1].replace(/\s+/g, " ").trim();

  const prefixed = head.match(/от\s+(\d{2}\.\d{2}\.\d{4})/);
  if (prefixed) return prefixed[1];

  const numeric = head.match(/\b(\d{2}\.\d{2}\.\d{4})\b/);
  return numeric?.[1] ?? null;
}
