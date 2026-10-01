import assert from "node:assert/strict";
import { findUnsupportedClaims } from "./verify";

const sources = "Договор № 14-С от 12 мая 2026. Сумма 250 000 рублей. Работы по СП 48.13330.";

const clean = findUnsupportedClaims(
  "Акт по договору № 14-С от 12.05.2026 на сумму 250000 рублей. Норма СП 48.13330.",
  sources,
);
assert.deepEqual(clean, []);

const dirty = findUnsupportedClaims(
  "Акт № 99-А от 1 января 2024 на сумму 875000 рублей по ГОСТ 12345.",
  sources,
);
assert.ok(dirty.some((item) => item.includes("99-А") || item.includes("№ 99-А")));
assert.ok(dirty.some((item) => item.includes("875")));
assert.ok(dirty.some((item) => /гост/i.test(item)));
assert.equal(dirty.includes("12345"), false);
assert.ok(dirty.some((item) => item.includes("2024") || item.includes("января")));

const marked = findUnsupportedClaims("Сумма [уточнить: 999999 рублей].", sources);
assert.deepEqual(marked, []);

console.log("claim checks ok", { dirty });
