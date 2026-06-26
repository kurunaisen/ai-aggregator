"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Поиск по названию или описанию...",
}: SearchBarProps) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск инструментов"
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 py-3.5 pl-12 pr-4 text-base text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-violet-500/50 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 sm:text-sm"
      />
    </div>
  );
}
