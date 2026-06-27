"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildCatalogUrl, emptyFilters } from "@/lib/catalog/filters";
import { SearchBar } from "@/components/tools/SearchBar";

export function HomeCatalogSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    router.push(
      buildCatalogUrl({
        ...emptyFilters(),
        q: query.trim(),
      }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-5">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Поиск инструментов..."
        className="w-full [&_input]:py-3 [&_input]:text-sm"
      />
    </form>
  );
}
