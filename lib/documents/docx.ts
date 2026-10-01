import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

function paragraphFromLine(line: string): Paragraph {
  const heading = /^(#{1,3})\s+(.+)$/.exec(line);
  if (heading) {
    const level =
      heading[1].length === 1
        ? HeadingLevel.HEADING_1
        : heading[1].length === 2
          ? HeadingLevel.HEADING_2
          : HeadingLevel.HEADING_3;
    return new Paragraph({ text: heading[2], heading: level });
  }

  const bold = /^\*\*(.+)\*\*$/.exec(line);
  if (bold) {
    return new Paragraph({
      children: [new TextRun({ text: bold[1], bold: true })],
    });
  }

  return new Paragraph({
    children: [new TextRun(line.length > 0 ? line : " ")],
  });
}

export async function textToDocx(title: string, text: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
          ...text.split(/\n/).map(paragraphFromLine),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export function downloadFilename(title: string, extension: "docx" | "txt"): string {
  const stem = title
    .trim()
    .replace(/[^\w.\- ()а-яА-ЯёЁ]+/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return `${stem || "dokument"}.${extension}`;
}
