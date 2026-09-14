// カードデータに登場する「ポケモンカード名」から、PokeAPI(https://pokeapi.co)を使って
// 正式な日本語名を取得し、lib/data/pokemon-name-ja.json として保存するスクリプト。
//
// 実行方法: node scripts/generate-pokemon-name-ja.mjs
// 新しい拡張パックが追加され、新しいポケモンが登場した時にまた実行すればよい。
// PokeAPIは無料・登録不要で使える、ポケモンの公式データを集めたサイト。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const gameplay = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "node_modules/pokemon-tcg-pocket-cards/data/v5/cards.gameplay.no-image.min.json"
    ),
    "utf-8"
  )
);

// 地方フォルム・特殊フォルムなど、自動翻訳すると不正確になりやすいパターン。
// これらは今回は対象外にし、英語名のまま扱う。
// (オーガポンの仮面違いはUNSUPPORTED扱いにせず、下のOGERPON_MASK_FORMSで個別対応する)
const UNSUPPORTED_FORM_PATTERNS = [
  /^Alolan /,
  /^Galarian /,
  /^Hisuian /,
  /^Paldean /,
  /^Origin Forme /,
  /^(Heat|Wash|Frost|Fan|Mow) Rotom$/,
  /^Castform (Sunny|Rainy|Snowy) Form$/,
  /^(Rapid|Single) Strike /,
  /^(Dawn Wings|Dusk Mane) /,
  /^Ultra Necrozma$/,
];

// オーガポンの仮面違いは、種族名(オーガポン)だけでは正しい表記にならない
// (公式は「みどりのめんオーガポン」のように仮面名を頭に付ける)。
// PokeAPIの pokemon-species(種族名) とは別に pokemon-form(フォーム名) を
// 問い合わせる必要があるため、専用のテーブルで対応する。
// カード名側の表記ゆれ("Teal MaskOgerpon" のようにスペースが無い場合がある)にも対応する。
const OGERPON_MASK_FORMS = [
  { pattern: /^Teal\s?Mask\s?Ogerpon$/, formSlug: "ogerpon" },
  { pattern: /^Wellspring\s?Mask\s?Ogerpon$/, formSlug: "ogerpon-wellspring-mask" },
  { pattern: /^Hearthflame\s?Mask\s?Ogerpon$/, formSlug: "ogerpon-hearthflame-mask" },
  { pattern: /^Cornerstone\s?Mask\s?Ogerpon$/, formSlug: "ogerpon-cornerstone-mask" },
];

function matchOgerponMaskForm(base) {
  for (const { pattern, formSlug } of OGERPON_MASK_FORMS) {
    if (pattern.test(base)) return formSlug;
  }
  return null;
}

async function fetchFormJaName(formSlug, attempt = 0) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-form/${formSlug}`);
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    return fetchFormJaName(formSlug, attempt + 1);
  }
  if (!res.ok) return null;
  const data = await res.json();
  const jaEntry = data.form_names.find((n) => n.language.name === "ja");
  return jaEntry?.name ?? null;
}

function parseCardName(name) {
  let n = name;
  let hasEx = false;
  let isMega = false;
  let megaForm = "";
  let hasRocket = false;

  if (/ ex$/.test(n)) {
    hasEx = true;
    n = n.replace(/ ex$/, "");
  }
  // "Team Rocket's Moltres" のような特殊プロモ名 → 日本語では「ロケット団の◯◯」になる
  if (/^Team Rocket's /.test(n)) {
    hasRocket = true;
    n = n.replace(/^Team Rocket's /, "");
  }
  if (/^Mega /.test(n)) {
    isMega = true;
    n = n.replace(/^Mega /, "");
    const formMatch = n.match(/ (X|Y)$/);
    if (formMatch) {
      megaForm = formMatch[1];
      n = n.replace(/ (X|Y)$/, "");
    }
  }
  return { base: n, hasEx, isMega, megaForm, hasRocket };
}

function isUnsupportedForm(base) {
  return UNSUPPORTED_FORM_PATTERNS.some((re) => re.test(base));
}

function toSlug(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // アクセント記号(é など)を取り除く
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/'/g, "")
    .replace(/\./g, "")
    .replace(/:/g, "")
    .replace(/\s+/g, "-");
}

const pokemonNames = new Set();
for (const c of gameplay) {
  if (c.type === "Pokémon") pokemonNames.add(c.name);
}

const entries = [];
const skipped = [];
const ogerponEntries = [];

for (const name of pokemonNames) {
  const { base, hasEx, isMega, megaForm, hasRocket } = parseCardName(name);
  const ogerponFormSlug = matchOgerponMaskForm(base);
  if (ogerponFormSlug) {
    ogerponEntries.push({ name, hasEx, formSlug: ogerponFormSlug });
    continue;
  }
  if (isUnsupportedForm(base)) {
    skipped.push(name);
    continue;
  }
  entries.push({ name, base, slug: toSlug(base), hasEx, isMega, megaForm, hasRocket });
}

const uniqueSlugs = [...new Set(entries.map((e) => e.slug))];

console.log(
  `対象カード名: ${pokemonNames.size}件 / フォーム違いでスキップ: ${skipped.length}件 / 問い合わせ種族数: ${uniqueSlugs.length}件`
);

async function fetchJaName(slug, attempt = 0) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${slug}`);
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    return fetchJaName(slug, attempt + 1);
  }
  if (!res.ok) return null;
  const data = await res.json();
  const jaEntry =
    data.names.find((n) => n.language.name === "ja") ??
    data.names.find((n) => n.language.name === "ja-Hrkt");
  return jaEntry?.name ?? null;
}

const slugToJaBase = new Map();
const failures = [];
let index = 0;

async function worker() {
  while (index < uniqueSlugs.length) {
    const i = index++;
    const slug = uniqueSlugs[i];
    try {
      const ja = await fetchJaName(slug);
      if (ja) slugToJaBase.set(slug, ja);
      else failures.push(slug);
    } catch {
      failures.push(slug);
    }
  }
}

const CONCURRENCY = 8;
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`取得成功: ${slugToJaBase.size}件 / 失敗: ${failures.length}件`);
if (failures.length) console.log("失敗した種族スラッグ:", failures);

const result = {};
// ベースとなる種族名(接頭辞・接尾辞を外す前)だけの対応表。
// パック名(例: "Charizard" "Mega Blaziken")のように、"ex"が付かない場面でも使えるようにする。
const speciesResult = {};

for (const e of entries) {
  const jaBase = slugToJaBase.get(e.slug);
  if (!jaBase) continue;

  speciesResult[e.base] = jaBase;

  let jaName = jaBase;
  if (e.isMega) jaName = `メガ${jaName}${e.megaForm}`;
  if (e.hasRocket) jaName = `ロケット団の${jaName}`;
  if (e.hasEx) jaName = `${jaName} ex`;
  result[e.name] = jaName;
}

// オーガポンの仮面違い: 「みどりのめん」等のフォーム名(pokemon-form)+「オーガポン」(pokemon-species)を組み合わせる。
// 公式のTCG表記("みどりのめんオーガポンex"等)に合わせている。
if (ogerponEntries.length > 0) {
  const ogerponSpeciesJa = await fetchJaName("ogerpon");
  const ogerponFormSlugs = [...new Set(ogerponEntries.map((e) => e.formSlug))];
  const formSlugToJaName = new Map();
  for (const slug of ogerponFormSlugs) {
    const ja = await fetchFormJaName(slug);
    if (ja) formSlugToJaName.set(slug, ja);
  }

  for (const e of ogerponEntries) {
    const formJa = formSlugToJaName.get(e.formSlug);
    if (!formJa || !ogerponSpeciesJa) {
      skipped.push(e.name);
      continue;
    }
    result[e.name] = e.hasEx ? `${formJa}${ogerponSpeciesJa} ex` : `${formJa}${ogerponSpeciesJa}`;
  }
}

const outPath = path.join(root, "lib/data/pokemon-name-ja.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n", "utf-8");
console.log(`書き出し完了: ${outPath} (${Object.keys(result).length}件)`);

const speciesOutPath = path.join(root, "lib/data/species-name-ja.json");
fs.writeFileSync(speciesOutPath, JSON.stringify(speciesResult, null, 2) + "\n", "utf-8");
console.log(`書き出し完了: ${speciesOutPath} (${Object.keys(speciesResult).length}件)`);

const skippedPath = path.join(root, "lib/data/pokemon-name-ja.skipped.json");
fs.writeFileSync(skippedPath, JSON.stringify(skipped.sort(), null, 2) + "\n", "utf-8");
console.log(`未対応(フォーム違い)一覧: ${skippedPath} (${skipped.length}件)`);
