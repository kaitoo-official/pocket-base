// カードデータに登場する「特性名」のうち、まだ lib/data/ability-name-ja.json に無いものを
// PokeAPI(https://pokeapi.co)の /ability エンドポイントで機械的に補う。
// 実際のゲームの特性と同名のポケポケの特性だけがヒットする(TCG専用の特性名はヒットせず、
// lib/data/ability-name-ja.skipped.json に一覧を書き出す)。
//
// 実行方法: node scripts/generate-ability-name-ja.mjs
// 既存のability-name-ja.jsonの内容は上書きせず、無いキーだけ追加する。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const gameplay = JSON.parse(
  fs.readFileSync(
    path.join(root, "node_modules/pokemon-tcg-pocket-cards/data/v5/cards.gameplay.no-image.min.json"),
    "utf-8"
  )
);

const existingPath = path.join(root, "lib/data/ability-name-ja.json");
const existing = JSON.parse(fs.readFileSync(existingPath, "utf-8"));

const allNames = new Set();
for (const c of gameplay) {
  if (c.ability?.name) allNames.add(c.ability.name);
}

const missingNames = [...allNames].filter((n) => !(n in existing));
console.log(`特性名の総数: ${allNames.size}件 / 既存対応済み: ${Object.keys(existing).length}件 / 未対応: ${missingNames.length}件`);

function toSlug(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\./g, "")
    .replace(/[+]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function fetchJaName(slug, attempt = 0) {
  const res = await fetch(`https://pokeapi.co/api/v2/ability/${slug}`);
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    return fetchJaName(slug, attempt + 1);
  }
  if (!res.ok) return null;
  const data = await res.json();
  const jaEntry =
    data.names.find((n) => n.language.name === "ja-hrkt") ?? data.names.find((n) => n.language.name === "ja");
  return jaEntry?.name ?? null;
}

const found = {};
const skipped = [];
let index = 0;

async function worker() {
  while (index < missingNames.length) {
    const i = index++;
    const name = missingNames[i];
    try {
      const ja = await fetchJaName(toSlug(name));
      if (ja) found[name] = ja;
      else skipped.push(name);
    } catch {
      skipped.push(name);
    }
  }
}

const CONCURRENCY = 8;
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`PokeAPIで新規取得できた特性名: ${Object.keys(found).length}件 / 未ヒット(TCG専用特性等): ${skipped.length}件`);

const merged = { ...existing, ...found };
fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
console.log(`書き出し完了: ${existingPath} (合計${Object.keys(merged).length}件)`);

const skippedPath = path.join(root, "lib/data/ability-name-ja.skipped.json");
fs.writeFileSync(skippedPath, JSON.stringify(skipped.sort(), null, 2) + "\n", "utf-8");
console.log(`未対応(TCG専用特性など)一覧: ${skippedPath} (${skipped.length}件)`);
