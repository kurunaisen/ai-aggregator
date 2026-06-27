"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/about", label: "О проекте" },
  { href: "/submit", label: "Добавить" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b divider-metallic bg-black/75 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-silver"
            onClick={() => setOpen(false)}
          >
            Deltaplan<span className="text-gold">AI</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-silver-dim transition-colors hover:text-gold-light"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button href="/catalog" variant="outline" className="hidden sm:inline-flex">
              Смотреть все
            </Button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border divider-metallic text-silver-dim md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Меню"
              aria-expanded={open}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t divider-metallic py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm text-silver hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/catalog"
                className="mt-2 rounded-lg bg-gradient-to-r from-gold/90 to-gold-light/90 px-3 py-2.5 text-center text-sm font-medium text-black"
                onClick={() => setOpen(false)}
              >
                Смотреть все
              </Link>
            </div>
          </nav>
        )}
      </Container>
    </header>
  );
}
