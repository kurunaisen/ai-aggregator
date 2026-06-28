type LogoSource = {
  slug?: string;
  logoUrl?: string | null;
  website: string;
};

const TOOL_LOGO_BY_SLUG: Record<string, string> = {
  nanobanana: "/logos/nanobanana.svg",
  flux: "/logos/flux.svg",
};

export function resolveToolLogoUrl({ slug, logoUrl, website }: LogoSource): string | null {
  if (slug && TOOL_LOGO_BY_SLUG[slug]) {
    return TOOL_LOGO_BY_SLUG[slug];
  }

  if (logoUrl?.trim()) return logoUrl.trim();

  try {
    const hostname = new URL(website).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return null;
  }
}
