const MONTHS: Record<string, string> = {
  января: "01",
  февраля: "02",
  марта: "03",
  апреля: "04",
  мая: "05",
  июня: "06",
  июля: "07",
  августа: "08",
  сентября: "09",
  октября: "10",
  ноября: "11",
  декабря: "12",
};

const MONTH_NAMES = Object.fromEntries(Object.entries(MONTHS).map(([name, number]) => [number, name]));

function compact(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = compact(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }
  return result.slice(0, 15);
}

function dateVariants(date: string): string[] {
  const numeric = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/.exec(date.trim());
  if (numeric) {
    const day = numeric[1].padStart(2, "0");
    const month = numeric[2].padStart(2, "0");
    const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
    const monthName = MONTH_NAMES[month];
    return [
      date,
      `${day}.${month}.${year}`,
      `${Number(day)}.${Number(month)}.${year}`,
      monthName ? `${Number(day)} ${monthName} ${year}` : "",
    ].filter(Boolean);
  }

  const written = new RegExp(
    `^(\\d{1,2})\\s+(${Object.keys(MONTHS).join("|")})\\s+(\\d{4})$`,
    "i",
  ).exec(date.trim());
  if (!written) return [date];

  const month = MONTHS[written[2].toLowerCase()];
  const year = written[3];
  return [
    date,
    `${written[1].padStart(2, "0")}.${month}.${year}`,
    `${Number(written[1])}.${Number(month)}.${year}`,
  ];
}

function appears(claim: string, sourceCompact: string): boolean {
  return dateVariants(claim).some((variant) => sourceCompact.includes(compact(variant)));
}

export function findUnsupportedClaims(reply: string, sources: string): string[] {
  const body = reply.replace(/\[[^\]\n]{0,240}\]/g, " ");
  const sourceCompact = compact(sources);
  const claims: string[] = [];

  const numericDates = body.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g) ?? [];
  const writtenDates =
    body.match(
      /\b\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4}\b/gi,
    ) ?? [];

  for (const date of [...numericDates, ...writtenDates]) {
    if (!appears(date, sourceCompact)) claims.push(date);
  }

  const numbers = body.match(/\b\d{1,3}(?:\s\d{3})+(?:[.,]\d+)?\b|\b\d{5,}(?:[.,]\d+)?\b/g) ?? [];
  for (const number of numbers) {
    const digits = number.replace(/\D/g, "");
    if (digits.length < 5) continue;
    if (sourceCompact.includes(digits)) continue;
    if (claims.some((claim) => claim.replace(/\D/g, "").includes(digits))) continue;
    claims.push(number);
  }

  const codes =
    body.match(/(?:ГОСТ|СП|СНиП|СанПиН)\s*\d+(?:\.\d+)*(?:-\d+)?/gi) ?? [];
  for (const code of codes) {
    if (!sourceCompact.includes(compact(code))) claims.push(code);
  }

  const documentNumbers = body.match(/№\s*[0-9A-Za-zА-Яа-яЁё./-]{2,}/g) ?? [];
  for (const item of documentNumbers) {
    const token = item.replace(/^№\s*/, "");
    if (!sourceCompact.includes(compact(token))) claims.push(item.trim());
  }

  return unique(claims);
}
