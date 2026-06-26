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
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-zinc-100"
            onClick={() => setOpen(false)}
          >
            Deltaplan<span className="text-violet-400">AI</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 md:hidden"
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
          <nav className="border-t border-zinc-800 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-900"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/catalog"
                className="mt-2 rounded-lg bg-zinc-100 px-3 py-2.5 text-center text-sm font-medium text-zinc-950"
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
