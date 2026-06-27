import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ToolUpdatesMarquee } from "@/components/layout/ToolUpdatesMarquee";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b divider-metallic bg-black/75 backdrop-blur-md">
      <Container>
        <div className="flex h-14 items-center gap-4 sm:gap-6 lg:h-16">
          <Link
            href="/"
            className="shrink-0 text-lg font-semibold tracking-tight text-silver"
          >
            Deltaplan<span className="text-gold">AI</span>
          </Link>

          <ToolUpdatesMarquee />
        </div>
      </Container>
    </header>
  );
}
