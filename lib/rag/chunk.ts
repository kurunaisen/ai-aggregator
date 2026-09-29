export type PageText = {
  page: number | null;
  text: string;
};

export type DraftChunk = {
  text: string;
  clause: string | null;
  section: string | null;
  page: number | null;
  table: boolean;
};

const TARGET = 1400;
const MAX = 2200;
const TABLE_MAX = 2500;

type Line = {
  text: string;
  page: number | null;
};

type ClauseMatch = {
  clause: string;
  rest: string;
};

function plausibleClause(num: string): boolean {
  return num.split(".").every((part) => part.length > 0 && part.length <= 3 && Number(part) < 500);
}

export function matchClause(line: string): ClauseMatch | null {
  const trimmed = line.trim();
  const prefixed = trimmed.match(/^(?:пункт|п)\.?\s*(\d+(?:\.\d+)*)\b\.?\s*(.*)$/i);
  if (prefixed && plausibleClause(prefixed[1])) {
    return { clause: prefixed[1], rest: prefixed[2].trim() };
  }

  const dotted = trimmed.match(/^(\d+\.\d+(?:\.\d+)*)\.?\s+(.*)$/);
  if (dotted && plausibleClause(dotted[1])) {
    return { clause: dotted[1], rest: dotted[2].trim() };
  }

  const simple = trimmed.match(/^(\d{1,2})[.)]\s+(.*)$/);
  if (simple && plausibleClause(simple[1])) {
    return { clause: simple[1], rest: simple[2].trim() };
  }

  return null;
}

function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if ((trimmed.match(/\|/g) ?? []).length >= 2) return true;
  if (trimmed.includes("\t")) return true;
  const gaps = trimmed.match(/\S\s{2,}\S/g);
  return (gaps?.length ?? 0) >= 2;
}

function headingOf(line: string): string | null {
  const trimmed = line.trim();
  const markdown = trimmed.match(/^#{1,6}\s+(.+)$/);
  if (markdown) return markdown[1].trim();
  if (/^(?:глава|раздел|приложение|статья|часть)\s+\S+/i.test(trimmed) && trimmed.length <= 140) {
    return trimmed;
  }

  const letters = trimmed.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
  if (
    trimmed.length >= 8 &&
    trimmed.length <= 90 &&
    letters.length >= 6 &&
    letters === letters.toUpperCase() &&
    !/[.!?]$/.test(trimmed) &&
    !isTableLine(trimmed)
  ) {
    return trimmed;
  }

  return null;
}

function flatten(pages: PageText[]): Line[] {
  const lines: Line[] = [];
  for (const page of pages) {
    const parts = page.text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    for (const part of parts) {
      lines.push({ text: part.replace(/\s+$/g, ""), page: page.page });
    }
  }
  return lines;
}

function splitLongText(text: string): string[] {
  if (text.length <= MAX) return [text];
  const paragraphs = text.split(/\n{2,}/);
  const pieces: string[] = [];
  let buffer = "";

  const pushSentence = (sentence: string) => {
    if (sentence.length > MAX && !buffer) {
      for (let index = 0; index < sentence.length; index += TARGET) {
        pieces.push(sentence.slice(index, index + TARGET).trim());
      }
      return;
    }
    if (buffer && buffer.length + sentence.length + 1 > TARGET) {
      pieces.push(buffer.trim());
      buffer = sentence;
      return;
    }
    buffer = buffer ? `${buffer} ${sentence}` : sentence;
  };

  for (const paragraph of paragraphs) {
    if ((buffer ? buffer.length + paragraph.length + 2 : paragraph.length) <= TARGET) {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
      continue;
    }
    if (buffer) {
      pieces.push(buffer.trim());
      buffer = "";
    }
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    if (sentences.length === 1) {
      pushSentence(paragraph);
      continue;
    }
    for (const sentence of sentences) pushSentence(sentence);
  }

  if (buffer.trim()) pieces.push(buffer.trim());
  return pieces.filter(Boolean);
}

function mergeTiny(chunks: DraftChunk[]): DraftChunk[] {
  const merged: DraftChunk[] = [];
  for (const chunk of chunks) {
    const previous = merged[merged.length - 1];
    const canMerge =
      previous &&
      !previous.table &&
      !chunk.table &&
      previous.text.length < 120 &&
      (previous.clause === null || previous.clause === chunk.clause) &&
      (previous.section === null || previous.section === chunk.section || chunk.section === null);

    if (previous && canMerge) {
      previous.text = `${previous.text}\n\n${chunk.text}`.trim();
      previous.clause = previous.clause ?? chunk.clause;
      previous.section = previous.section ?? chunk.section;
      previous.page = previous.page ?? chunk.page;
      continue;
    }

    merged.push({ ...chunk });
  }
  return merged;
}

export function chunkPages(pages: PageText[]): DraftChunk[] {
  const lines = flatten(pages);
  const chunks: DraftChunk[] = [];
  let section: string | null = null;
  let clause: string | null = null;
  let buffer: string[] = [];
  let bufferPage: number | null = null;
  let bufferClause: string | null = null;
  let bufferSection: string | null = null;
  let bufferTable = false;

  const flush = () => {
    const text = buffer.join("\n").trim();
    buffer = [];
    if (!text) return;
    const parts = bufferTable ? [text] : splitLongText(text);
    for (const part of parts) {
      chunks.push({
        text: part,
        clause: bufferClause,
        section: bufferSection,
        page: bufferPage,
        table: bufferTable,
      });
    }
  };

  const begin = (line: Line, nextClause: string | null, nextSection: string | null, table: boolean) => {
    flush();
    bufferPage = line.page;
    bufferClause = nextClause;
    bufferSection = nextSection;
    bufferTable = table;
  };

  const push = (line: Line) => {
    if (buffer.length === 0) {
      bufferPage = line.page;
      bufferClause = clause;
      bufferSection = section;
    }
    buffer.push(line.text.trim());
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.text.trim();

    if (!trimmed) {
      if (bufferTable && buffer.length > 0) {
        flush();
        bufferTable = false;
      } else if (!bufferTable && buffer.join("\n").length >= 900) {
        flush();
      } else if (buffer.length > 0) {
        buffer.push("");
      }
      continue;
    }

    const nextTrimmed = lines[index + 1]?.text.trim() ?? "";
    const tableStart = isTableLine(trimmed) && (bufferTable || isTableLine(nextTrimmed));

    if (tableStart && !bufferTable) {
      begin(line, clause, section, true);
    }

    if (bufferTable || tableStart) {
      if (!isTableLine(trimmed)) {
        flush();
        bufferTable = false;
        index -= 1;
        continue;
      }
      if (buffer.length === 0) begin(line, clause, section, true);
      buffer.push(trimmed);
      if (buffer.join("\n").length >= TABLE_MAX) {
        const header = buffer[0];
        flush();
        bufferTable = true;
        bufferClause = clause;
        bufferSection = section;
        bufferPage = line.page;
        if (header && isTableLine(header)) buffer = [header];
      }
      continue;
    }

    const clauseMatch = matchClause(trimmed);
    const heading = headingOf(trimmed);

    if (clauseMatch) {
      clause = clauseMatch.clause;
      if (
        clauseMatch.rest.length > 0 &&
        clauseMatch.rest.length <= 80 &&
        !/[.!?]$/.test(clauseMatch.rest)
      ) {
        section = clauseMatch.rest;
      }
      begin(line, clause, section, false);
      buffer.push(trimmed);
      continue;
    }

    if (heading) {
      section = heading;
      clause = null;
      begin(line, null, section, false);
      buffer.push(trimmed);
      continue;
    }

    push(line);
    if (buffer.join("\n").length >= TARGET) flush();
  }

  flush();

  return mergeTiny(chunks).map((chunk) => ({
    ...chunk,
    text: chunk.text
      .split("\n")
      .map((line) => line.replace(/^#{1,6}\s+/, ""))
      .join("\n")
      .trim(),
  }));
}
