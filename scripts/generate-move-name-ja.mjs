// カードデータに登場する「技名」のうち、まだ lib/data/move-name-ja.json に無いものを
// PokeAPI(https://pokeapi.co)の /move エンドポイントで機械的に補う。
// 実際のゲームの技と同名のポケポケの技だけがヒットする(TCG専用の技名はヒットせず、
// lib/data/move-name-ja.skipped.json に一覧を書き出すので、追加対応する場合はそちらを参照)。
//
// 実行方法: node scripts/generate-move-name-ja.mjs
// 既存のmove-name-ja.jsonの内容は上書きせず、無いキーだけ追加する。

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

const existingPath = path.join(root, "lib/data/move-name-ja.json");
const existing = JSON.parse(fs.readFileSync(existingPath, "utf-8"));

const allNames = new Set();
for (const c of gameplay) {
  if (!c.attacks) continue;
  for (const slot of ["1", "2"]) {
    const a = c.attacks[slot];
    if (a?.name) allNames.add(a.name);
  }
}

const missingNames = [...allNames].filter((n) => !(n in existing));
console.log(`技名の総数: ${allNames.size}件 / 既存対応済み: ${Object.keys(existing).length}件 / 未対応: ${missingNames.length}件`);

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
  const res = await fetch(`https://pokeapi.co/api/v2/move/${slug}`);
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

console.log(`PokeAPIで新規取得できた技名: ${Object.keys(found).length}件 / 未ヒット(TCG専用技等): ${skipped.length}件`);

const merged = { ...existing, ...found };
fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
console.log(`書き出し完了: ${existingPath} (合計${Object.keys(merged).length}件)`);

const skippedPath = path.join(root, "lib/data/move-name-ja.skipped.json");
fs.writeFileSync(skippedPath, JSON.stringify(skipped.sort(), null, 2) + "\n", "utf-8");
console.log(`未対応(TCG専用技など)一覧: ${skippedPath} (${skipped.length}件)`);
