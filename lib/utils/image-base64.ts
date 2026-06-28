export async function fileToImagePayload(
  file: File,
): Promise<{ mimeType: string; data: string }> {
  const mimeType = file.type || "image/png";
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return { mimeType, data: btoa(binary) };
}
