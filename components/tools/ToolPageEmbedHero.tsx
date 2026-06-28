import type { EmbedHeaderContent } from "@/data/embed-tools";
import { ToolLogo } from "@/components/tools/ToolLogo";
import { ToolPreviewVideo } from "@/components/tools/ToolPreviewVideo";

type ToolPageEmbedHeroProps = {
  slug: string;
  name: string;
  website: string;
  logoUrl: string | null | undefined;
  header: EmbedHeaderContent;
};

export function ToolPageEmbedHero({
  slug,
  name,
  website,
  logoUrl,
  header,
}: ToolPageEmbedHeroProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
        <ToolLogo
          slug={slug}
          name={name}
          website={website}
          logoUrl={logoUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-silver sm:text-4xl">
            {name}
          </h1>
          <p className="text-sm leading-relaxed text-silver-dim">{header.description}</p>
          {header.highlights && header.highlights.length > 0 && (
            <ul className="space-y-1.5 pt-0.5">
              {header.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs leading-relaxed text-silver-dim/90"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="w-full shrink-0 sm:mx-auto sm:max-w-lg lg:mx-0 lg:w-80 xl:w-96 2xl:w-[28rem]">
        {header.previewVideoUrl ? (
          <ToolPreviewVideo
            src={header.previewVideoUrl}
            label={`Демо ${name}`}
          />
        ) : (
          <div
            className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-gold/20 bg-black/25"
            aria-hidden
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-black/40 text-gold/40">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-0.5 h-5 w-5"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
