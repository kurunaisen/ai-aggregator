import Link from "next/link";
import { Container } from "@/components/layout/Container";

const footerLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/about", label: "О проекте" },
  { href: "/submit", label: "Добавить инструмент" },
  { href: "/privacy", label: "Конфиденциальность" },
  { href: "/terms", label: "Условия" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t divider-metallic bg-black/90">
      <Container className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-silver">
              Deltaplan<span className="text-gold">AI</span>
            </p>
            <p className="mt-1 text-sm text-silver-dim">
              Каталог нейросетей и AI-инструментов
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-silver-dim transition-colors hover:text-gold-light"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-xs text-silver-dim/60">
          © {new Date().getFullYear()} DeltaplanAI. Все права защищены.
        </p>
      </Container>
    </footer>
  );
}
