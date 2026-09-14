// トレード投稿フォームの「画像でシェア」ボタン専用の、SNS共有用カード画像を生成する処理。
// 投稿フォームに入力中のカード構成・フレンドID・メモをそのまま使って1枚のPNG画像を作る
// (投稿データそのものはどこにも保存しない、その場限りの画像)。
//
// デザイン方針: 白ベース+Pocket Baseブランドカラー(navy/blue/cyan)によるミニマルな配色。
// Offering/Wanted/フレンドIDの各アイコンは、サイト本体で使っているlucide-reactのアイコン
// (Send/Star/UserRound/Copy)と同じSVGパスをCanvas上でストローク描画し、見た目を揃えている。

import QRCode from "qrcode";
import type { CardOption } from "@/lib/trade";
import type { Lang } from "@/lib/i18n/lang";

export interface TradeShareImageInput {
  offerCards: CardOption[];
  wantCards: CardOption[];
  friendId: string;
  memo: string;
  lang: Lang;
}

/** 本番ドメイン未設定時は、sitemap.ts/robots.tsと同じフォールバックにしておく */
function getSiteUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
  return base.replace(/\/$/, "");
}

// ブランドカラー
const COLOR_NAVY = "#0B2D5B";
const COLOR_BLUE = "#2563EB";
const COLOR_CYAN = "#06B6D4";
const COLOR_LIGHT_GRAY = "#E5EAF2";
const COLOR_TEXT_MUTED = "#64748b";
const COLOR_TEXT_SUBTLE = "#94a3b8";

const CANVAS_WIDTH = 1200;
const CONTENT_X = 88;
const CONTENT_RIGHT = CANVAS_WIDTH - 88;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_X;

// カードの縦横比(pokemon-tcg-pocket-cardsの画像に合わせた245:342)
const CARD_ASPECT = 342 / 245;
const CARD_GAP = 16;

// 5枚以上の時: 5列グリッド(最大2段)
const GRID_COLS = 5;
const GRID_SLOT_WIDTH = (CONTENT_WIDTH - CARD_GAP * (GRID_COLS - 1)) / GRID_COLS;
const GRID_SLOT_HEIGHT = GRID_SLOT_WIDTH * CARD_ASPECT;
// 2〜4枚の時: 1段・中サイズ
const ROW_SLOT_WIDTH = 220;
const ROW_SLOT_HEIGHT = ROW_SLOT_WIDTH * CARD_ASPECT;
// 1枚だけの時: 大きめのヒーロー表示
const HERO_SLOT_WIDTH = 320;
const HERO_SLOT_HEIGHT = HERO_SLOT_WIDTH * CARD_ASPECT;
// 0枚の時: カード枠は出さず、1行のコンパクトな表示にする
const EMPTY_ROW_HEIGHT = 56;

// 縦方向のレイアウト定数(計測パス・描画パスの両方で同じ値を使うことで、ズレを防ぐ)
const HEADER_AND_TITLE_HEIGHT = 300; // ロゴ〜TRADE POST〜サブ見出しまでの固定ブロック高さ
const SECTION_HEADER_HEIGHT = 64; // セクション見出し(アイコン+タイトル)からカード段までの余白込みの高さ
const SECTION_GAP = 56; // Offeringの末尾からWanted見出しまでの余白
const BOTTOM_GAP = 48; // Wantedの末尾からフレンドID/QR行までの余白
const FRIEND_ID_BAR_HEIGHT = 96;
const QR_CTA_BAR_HEIGHT = 176;
const MEMO_LINE_HEIGHT = 30;
const MEMO_MAX_LINES = 2;
const FOOTER_HEIGHT = 72; // 免責テキスト+下端余白

// タイプごとの縁取り色(TypeBadge等のTailwindクラスと揃えた、canvas用の16進数版)
const TYPE_ACCENT_COLOR: Record<string, string> = {
  Grass: "#16a34a",
  Fire: "#ef4444",
  Water: "#0ea5e9",
  Lightning: "#eab308",
  Psychic: "#9333ea",
  Fighting: "#ea580c",
  Darkness: "#334155",
  Metal: "#71717a",
  Dragon: "#4d7c0f",
  Colorless: "#9ca3af",
  Item: "#0891b2",
  ItemFossil: "#78716c",
  Supporter: "#f43f5e",
  Tool: "#0d9488",
  Stadium: "#059669",
};
const DEFAULT_ACCENT_COLOR = "#94a3b8";

// 読み込み済み画像を使い回すための簡易キャッシュ(同じカードを何度も生成する時の無駄な再取得を防ぐ)
const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`画像の読み込みに失敗しました: ${url}`));
    img.src = url;
  });
  imageCache.set(url, promise);
  return promise;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 日本語のような「単語間にスペースが無い言語」でも折り返せるよう、1文字ずつ幅を測って折り返す */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const char of text) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// --- lucide-reactと同じSVGパス(24x24 viewBox, stroke-basedのアウトラインアイコン) ---
// サイト本体のOffering/Wanted/フレンドIDアイコンと同じ見た目にするため、
// 自作の図形ではなくlucide-react本体のパスデータをそのまま使う。
const SEND_PATH_1 =
  "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z";
const SEND_PATH_2 = "m21.854 2.147-10.94 10.939";
const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";
const USER_ROUND_SHOULDERS_PATH = "M20 21a8 8 0 0 0-16 0";
const COPY_BODY_PATH = "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2";

/** lucideのアイコンパス(24x24基準)を、指定サイズ・色でストローク描画する */
function drawLucidePath(ctx: CanvasRenderingContext2D, d: string, cx: number, cy: number, size: number, color: string) {
  const scale = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(d));
  ctx.restore();
}

function drawSendIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  drawLucidePath(ctx, SEND_PATH_1, cx, cy, size, color);
  drawLucidePath(ctx, SEND_PATH_2, cx, cy, size, color);
}

function drawStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  drawLucidePath(ctx, STAR_PATH, cx, cy, size, color);
}

function drawUserRoundIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  const scale = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(12, 8, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.stroke(new Path2D(USER_ROUND_SHOULDERS_PATH));
  ctx.restore();
}

function drawCopyIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  const scale = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 / scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  roundRect(ctx, 8, 8, 14, 14, 2);
  ctx.stroke();
  ctx.stroke(new Path2D(COPY_BODY_PATH));
  ctx.restore();
}

function gridRows(count: number): number {
  return Math.ceil(count / GRID_COLS);
}

/** カード枚数に応じた表示エリアの高さ(枚数が少ない時に無駄な余白ができないよう、段階的に変える) */
function getCardAreaHeight(count: number): number {
  if (count === 0) return EMPTY_ROW_HEIGHT;
  if (count === 1) return HERO_SLOT_HEIGHT;
  if (count <= 4) return ROW_SLOT_HEIGHT;
  const rows = gridRows(count);
  return rows * GRID_SLOT_HEIGHT + (rows - 1) * CARD_GAP;
}

/**
 * 実際に描画する前に、カード枚数・フレンドID有無・メモの行数から必要な画像の高さを計算する。
 * カード枚数によって表示サイズ・段数が変わるため、常に固定サイズの画像にはできず、
 * 内容に合わせて可変にしている。
 */
function computeCanvasHeight(ctx: CanvasRenderingContext2D, input: TradeShareImageInput): number {
  let y = HEADER_AND_TITLE_HEIGHT;
  y += SECTION_HEADER_HEIGHT + getCardAreaHeight(input.offerCards.length);
  y += SECTION_GAP;
  y += SECTION_HEADER_HEIGHT + getCardAreaHeight(input.wantCards.length);
  y += BOTTOM_GAP;

  if (input.memo) {
    ctx.font = "400 22px sans-serif";
    const lines = Math.min(wrapText(ctx, input.memo, CONTENT_WIDTH).length, MEMO_MAX_LINES);
    y += lines * MEMO_LINE_HEIGHT + 24;
  }

  if (input.friendId) {
    y += FRIEND_ID_BAR_HEIGHT + 20;
  }
  y += QR_CTA_BAR_HEIGHT + 28;

  return Math.round(y + FOOTER_HEIGHT);
}

/**
 * 白ベースの背景。外周にごく薄いnavy→blue→cyanの縁取りを入れ、
 * 四隅にはブランドイメージとして半透明のカード形状を、情報より目立たない濃さで置く。
 */
function drawBackground(ctx: CanvasRenderingContext2D, canvasHeight: number) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, canvasHeight);

  const margin = 20;
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, canvasHeight);
  gradient.addColorStop(0, COLOR_NAVY);
  gradient.addColorStop(0.5, COLOR_BLUE);
  gradient.addColorStop(1, COLOR_CYAN);
  ctx.save();
  ctx.globalAlpha = 0.18;
  roundRect(ctx, margin / 2, margin / 2, CANVAS_WIDTH - margin, canvasHeight - margin, 28);
  ctx.lineWidth = margin;
  ctx.strokeStyle = gradient;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, margin, margin, CANVAS_WIDTH - margin * 2, canvasHeight - margin * 2, 24);
  ctx.fill();

  // ブランドイメージとして、白い台紙の内側の右上に半透明のカード形状を1枚だけ、
  // 情報の裏に隠れる程度の薄さで置く(コンテンツの高さは可変なので、確実に空く
  // ヘッダー上部だけに留め、カード段やテキストと重ならないようにしている)。
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = COLOR_BLUE;
  ctx.translate(CANVAS_WIDTH - margin - 70, margin + 40);
  ctx.rotate((18 * Math.PI) / 180);
  roundRect(ctx, -70, -95, 140, 190, 20);
  ctx.fill();
  ctx.restore();
}

async function drawHeader(ctx: CanvasRenderingContext2D, lang: Lang) {
  const logo = await loadImage("/images/logo.png").catch(() => null);
  const logoHeight = 52;
  const logoWidth = logo ? (logo.naturalWidth / logo.naturalHeight) * logoHeight : 0;
  const headerY = 84;

  if (logo) {
    ctx.drawImage(logo, CONTENT_X, headerY - logoHeight + 10, logoWidth, logoHeight);
  }

  const textX = CONTENT_X + logoWidth + 16;
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 28px sans-serif";
  ctx.fillStyle = COLOR_NAVY;
  const pocketWidth = ctx.measureText("Pocket ").width;
  ctx.fillText("Pocket ", textX, headerY);
  ctx.fillStyle = COLOR_BLUE;
  ctx.fillText("Base", textX + pocketWidth, headerY);

  ctx.font = "700 12px sans-serif";
  ctx.fillStyle = COLOR_TEXT_MUTED;
  ctx.fillText("COLLECT. TRADE. CONNECT.", textX, headerY + 22);

  // 右上のブランドコピー(主役はTRADE POSTなので、控えめなサイズにする)
  ctx.textAlign = "right";
  ctx.font = "700 12px sans-serif";
  ctx.fillStyle = COLOR_TEXT_SUBTLE;
  const brandLines =
    lang === "en" ? ["A BIGGER PLAYGROUND", "FOR CARD FANS"] : ["好きなカードが、もっと見つかる。", "もっとつながる。"];
  brandLines.forEach((line, i) => ctx.fillText(line, CONTENT_RIGHT, headerY - 24 + i * 16));
  ctx.textAlign = "left";
}

function drawTitle(ctx: CanvasRenderingContext2D, lang: Lang) {
  const titleY = 206;
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 62px sans-serif";
  ctx.fillStyle = COLOR_NAVY;
  ctx.fillText("TRADE", CONTENT_X, titleY);
  const tradeWidth = ctx.measureText("TRADE ").width;
  ctx.fillStyle = COLOR_BLUE;
  ctx.fillText("POST", CONTENT_X + tradeWidth, titleY);

  ctx.font = "600 22px sans-serif";
  ctx.fillStyle = COLOR_TEXT_MUTED;
  ctx.fillText(lang === "en" ? "Looking for trade partners" : "トレード相手募集中", CONTENT_X, titleY + 38);
}

interface SectionIcon {
  gradientFrom: string;
  gradientTo: string;
  draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => void;
}

const OFFERING_ICON: SectionIcon = {
  gradientFrom: "#8b5cf6",
  gradientTo: "#6366f1",
  draw: (ctx, cx, cy, size) => drawSendIcon(ctx, cx, cy, size, "#ffffff"),
};

const WANTED_ICON: SectionIcon = {
  gradientFrom: "#22d3ee",
  gradientTo: COLOR_CYAN,
  draw: (ctx, cx, cy, size) => drawStarIcon(ctx, cx, cy, size, "#ffffff"),
};

function drawSectionHeader(
  ctx: CanvasRenderingContext2D,
  icon: SectionIcon,
  title: string,
  subtitle: string,
  count: string,
  y: number
) {
  const r = 24;
  const cx = CONTENT_X + r;
  const cy = y + r;
  const gradient = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  gradient.addColorStop(0, icon.gradientFrom);
  gradient.addColorStop(1, icon.gradientTo);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  icon.draw(ctx, cx, cy, 26);

  const textX = CONTENT_X + r * 2 + 16;
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 28px sans-serif";
  ctx.fillStyle = COLOR_NAVY;
  ctx.fillText(title, textX, cy + 4);
  const titleWidth = ctx.measureText(title).width;

  ctx.font = "600 13px sans-serif";
  ctx.fillStyle = COLOR_TEXT_SUBTLE;
  ctx.fillText(subtitle, textX + titleWidth + 12, cy + 3);

  ctx.textAlign = "right";
  ctx.font = "600 18px sans-serif";
  ctx.fillStyle = COLOR_TEXT_MUTED;
  ctx.fillText(count, CONTENT_RIGHT, cy + 4);
  ctx.textAlign = "left";
}

/**
 * カード1枚分の枠を描く(画像は事前に読み込み済みのものを渡す)。
 * Canvas 2Dのsave/clip/restoreはコンテキスト全体で1本のスタックを共有するため、
 * 画像の読み込み待ち(await)を挟んだまま複数枚を並行実行すると、互いのclip/restoreが
 * 混線して描画が壊れる。そのため画像読み込みは呼び出し側で先にすべて終わらせておき、
 * この関数自体は同期処理のみにしている。
 */
function drawCardSlot(
  ctx: CanvasRenderingContext2D,
  card: CardOption,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const accent = TYPE_ACCENT_COLOR[card.type] ?? DEFAULT_ACCENT_COLOR;

  ctx.save();
  roundRect(ctx, x, y, w, h, 16);
  ctx.clip();
  ctx.fillStyle = COLOR_LIGHT_GRAY;
  ctx.fillRect(x, y, w, h);

  if (img) {
    // 縦横比を維持したまま枠いっぱいに収める(歪ませない)
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - drawWidth) / 2, y + (h - drawHeight) / 2, drawWidth, drawHeight);
  }
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 16);
  ctx.lineWidth = 4;
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.restore();
}

/** カードが0枚の時の、コンパクトな1行表示(カード枠と同じ高さを占有しない) */
function drawUndecidedLine(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  const r = 14;
  const cy = y + EMPTY_ROW_HEIGHT / 2;
  ctx.beginPath();
  ctx.arc(x + r, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = COLOR_LIGHT_GRAY;
  ctx.fill();
  ctx.fillStyle = COLOR_TEXT_MUTED;
  ctx.font = "700 15px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", x + r, cy + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = "600 20px sans-serif";
  ctx.fillStyle = COLOR_TEXT_MUTED;
  ctx.fillText(label, x + r * 2 + 16, cy + 7);
}

/**
 * カード一覧を、枚数に応じたサイズ・レイアウトで描く。
 * 0枚→コンパクトな1行、1枚→大きめ1枚、2〜4枚→中サイズ1段、5〜10枚→5列×最大2段。
 * 画像はまず全部並行で読み込み終えてから、まとめて同期的に描画する
 * (drawCardSlotのコメント参照。読み込みと描画を混ぜると並行実行でclipが壊れるため)。
 */
async function drawCardArea(ctx: CanvasRenderingContext2D, cards: CardOption[], y: number, undecidedLabel: string) {
  if (cards.length === 0) {
    drawUndecidedLine(ctx, CONTENT_X, y, undecidedLabel);
    return;
  }

  if (cards.length === 1) {
    const img = await loadImage(cards[0].image).catch(() => null);
    drawCardSlot(ctx, cards[0], img, CONTENT_X, y, HERO_SLOT_WIDTH, HERO_SLOT_HEIGHT);
    return;
  }

  if (cards.length <= 4) {
    const images = await Promise.all(cards.map((card) => loadImage(card.image).catch(() => null)));
    cards.forEach((card, i) => {
      drawCardSlot(ctx, card, images[i], CONTENT_X + i * (ROW_SLOT_WIDTH + CARD_GAP), y, ROW_SLOT_WIDTH, ROW_SLOT_HEIGHT);
    });
    return;
  }

  const images = await Promise.all(cards.map((card) => loadImage(card.image).catch(() => null)));
  cards.forEach((card, index) => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    drawCardSlot(
      ctx,
      card,
      images[index],
      CONTENT_X + col * (GRID_SLOT_WIDTH + CARD_GAP),
      y + row * (GRID_SLOT_HEIGHT + CARD_GAP),
      GRID_SLOT_WIDTH,
      GRID_SLOT_HEIGHT
    );
  });
}

/** フレンドIDの横長バー(常に全幅)。右端にコピーアイコンを、バーの高さの中央に揃えて置く */
function drawFriendIdBar(ctx: CanvasRenderingContext2D, friendId: string, x: number, y: number, width: number) {
  ctx.fillStyle = COLOR_LIGHT_GRAY;
  roundRect(ctx, x, y, width, FRIEND_ID_BAR_HEIGHT, 20);
  ctx.fill();

  const r = 24;
  const cx = x + 24 + r;
  const cy = y + FRIEND_ID_BAR_HEIGHT / 2;
  const gradient = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  gradient.addColorStop(0, "#8b5cf6");
  gradient.addColorStop(1, "#6366f1");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  drawUserRoundIcon(ctx, cx, cy, 26, "#ffffff");

  const textX = cx + r + 20;
  ctx.textBaseline = "alphabetic";
  ctx.font = "600 15px sans-serif";
  ctx.fillStyle = COLOR_TEXT_MUTED;
  ctx.fillText("Friend ID", textX, cy - 7);
  ctx.font = "800 30px sans-serif";
  ctx.fillStyle = COLOR_NAVY;
  ctx.fillText(friendId, textX, cy + 26);

  // 右端のコピーアイコン(静止画のため実際にはコピーできないが、実UIと同じ見た目の視覚要素として置く)
  const copySize = 20;
  const copyCx = x + width - 40;
  const copyCy = cy;
  ctx.beginPath();
  ctx.arc(copyCx, copyCy, 18, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  drawCopyIcon(ctx, copyCx, copyCy, copySize, COLOR_TEXT_MUTED);
}

/**
 * QRコード+サイト誘導メッセージを1つにまとめた、目立つグラデーション帯。
 * この投稿画像自体がPocket Baseへの入口(広告)になるように、見た人がその場で
 * トレード掲示板にアクセスできるようにしている。CTAを兼ねるため、navy→blue→cyanの
 * グラデーション背景で強調する(実際に押せるボタンではなく、あくまで視覚的な要素)。
 */
async function drawQrCtaBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, lang: Lang) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, COLOR_NAVY);
  gradient.addColorStop(0.5, COLOR_BLUE);
  gradient.addColorStop(1, COLOR_CYAN);
  roundRect(ctx, x, y, width, QR_CTA_BAR_HEIGHT, 20);
  ctx.fillStyle = gradient;
  ctx.fill();

  const padding = 18;
  const qrOuter = QR_CTA_BAR_HEIGHT - padding * 2;
  const qrOuterX = x + padding;
  const qrOuterY = y + padding;
  roundRect(ctx, qrOuterX, qrOuterY, qrOuter, qrOuter, 12);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const qrInnerPadding = 8;
  const qrSize = qrOuter - qrInnerPadding * 2;
  const siteUrl = `${getSiteUrl()}/trade`;
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, siteUrl, {
    width: qrSize,
    margin: 0,
    color: { dark: COLOR_NAVY, light: "#ffffff" },
  });
  ctx.drawImage(qrCanvas, qrOuterX + qrInnerPadding, qrOuterY + qrInnerPadding, qrSize, qrSize);

  const textX = qrOuterX + qrOuter + 30;
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 32px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(lang === "en" ? "Find a trade partner" : "Pocket Baseで", textX, y + 72);
  ctx.fillText(lang === "en" ? "on Pocket Base!" : "トレード相手を探そう！", textX, y + 112);
  ctx.font = "700 13px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("SCAN THE QR CODE", textX, y + 140);
}

function drawFooter(ctx: CanvasRenderingContext2D, canvasHeight: number, lang: Lang) {
  const y = canvasHeight - 40;
  ctx.textAlign = "center";
  ctx.font = "600 15px sans-serif";
  ctx.fillStyle = COLOR_TEXT_SUBTLE;
  ctx.fillText(
    lang === "en"
      ? "This is an unofficial fan site. Not affiliated with Pokémon."
      : "本サイトは非公式のファンサイトです。",
    CANVAS_WIDTH / 2,
    y
  );
  ctx.textAlign = "left";
}

async function drawTradeShareCanvas(ctx: CanvasRenderingContext2D, input: TradeShareImageInput, canvasHeight: number) {
  const { offerCards, wantCards, friendId, memo, lang } = input;
  const undecidedLabel = lang === "en" ? "Open to offers" : "要相談";

  drawBackground(ctx, canvasHeight);
  await drawHeader(ctx, lang);
  drawTitle(ctx, lang);

  let y = HEADER_AND_TITLE_HEIGHT;
  drawSectionHeader(
    ctx,
    OFFERING_ICON,
    "Offering",
    lang === "en" ? "" : "交換できるカード",
    `${offerCards.length}/10 ${lang === "en" ? "cards" : "枚"}`,
    y
  );
  const offeringCardsY = y + SECTION_HEADER_HEIGHT;
  await drawCardArea(ctx, offerCards, offeringCardsY, undecidedLabel);
  y += SECTION_HEADER_HEIGHT + getCardAreaHeight(offerCards.length) + SECTION_GAP;

  drawSectionHeader(
    ctx,
    WANTED_ICON,
    "Wanted",
    lang === "en" ? "" : "探しているカード",
    `${wantCards.length}/10 ${lang === "en" ? "cards" : "枚"}`,
    y
  );
  const wantedCardsY = y + SECTION_HEADER_HEIGHT;
  await drawCardArea(ctx, wantCards, wantedCardsY, undecidedLabel);
  y += SECTION_HEADER_HEIGHT + getCardAreaHeight(wantCards.length) + BOTTOM_GAP;

  if (memo) {
    ctx.font = "400 22px sans-serif";
    ctx.fillStyle = "#334155";
    const lines = wrapText(ctx, memo, CONTENT_WIDTH).slice(0, MEMO_MAX_LINES);
    lines.forEach((line, i) => ctx.fillText(line, CONTENT_X, y + i * MEMO_LINE_HEIGHT));
    y += lines.length * MEMO_LINE_HEIGHT + 24;
  }

  if (friendId) {
    drawFriendIdBar(ctx, friendId, CONTENT_X, y, CONTENT_WIDTH);
    y += FRIEND_ID_BAR_HEIGHT + 20;
  }

  await drawQrCtaBar(ctx, CONTENT_X, y, CONTENT_WIDTH, lang);
  y += QR_CTA_BAR_HEIGHT + 28;

  drawFooter(ctx, canvasHeight, lang);
}

/** 「画像でシェア」ボタン用に、入力中のトレード内容からPNG画像をBlobとして生成する */
export async function generateTradeShareImage(input: TradeShareImageInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");

  const canvasHeight = computeCanvasHeight(ctx, input);
  canvas.height = canvasHeight;

  await drawTradeShareCanvas(ctx, input, canvasHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("画像の生成に失敗しました"));
    }, "image/png");
  });
}
