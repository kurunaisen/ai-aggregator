type LogoSource = {
  logoUrl?: string | null;
  website: string;
};

export function resolveToolLogoUrl({ logoUrl, website }: LogoSource): string | null {
  if (logoUrl?.trim()) return logoUrl.trim();

  try {
    const hostname = new URL(website).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
}
