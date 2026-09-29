// アプリアイコン・スプラッシュ画面の元画像(assets/)を、既存のロゴから生成するワンショットスクリプト。
// 生成後は `npx capacitor-assets generate` で各サイズのAndroidリソースに変換する。
import sharp from "sharp";
import path from "node:path";

const BRAND_NAVY = "#0b2d5b";
const projectRoot = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(projectRoot, "public");
const assetsDir = path.join(projectRoot, "assets");

async function main() {
  // icon.png: レガシー(丸型)アイコン用。既存のicon-512(背景色込み)をそのまま1024角に拡大。
  await sharp(path.join(publicDir, "icon-512.png"))
    .resize(1024, 1024)
    .toFile(path.join(assetsDir, "icon.png"));

  // icon-foreground.png: アダプティブアイコンの前景。セーフゾーン込みのmaskable版を流用。
  await sharp(path.join(publicDir, "icon-maskable-512.png"))
    .resize(1024, 1024)
    .toFile(path.join(assetsDir, "icon-foreground.png"));

  // icon-background.png: アダプティブアイコンの背景。ロゴと同じネイビーの単色。
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: BRAND_NAVY },
  })
    .png()
    .toFile(path.join(assetsDir, "icon-background.png"));

  // splash.png: 起動画面。中央が淡く光るグラデーション背景 + ロゴ + "Pocket Base" の文字。
  const splashSize = 2732;
  const logoWidth = Math.round(splashSize * 0.3);
  const logo = await sharp(path.join(publicDir, "images", "logo.png"))
    .resize(logoWidth)
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const logoHeight = logoMeta.height ?? logoWidth;
  const logoTop = Math.round(splashSize * 0.3);
  const textBaselineY = logoTop + logoHeight + 150;

  const splashBackground = await sharp(
    Buffer.from(`
      <svg width="${splashSize}" height="${splashSize}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glowBig" cx="50%" cy="38%" r="70%">
            <stop offset="0%" stop-color="#1d3f82" stop-opacity="0.5"/>
            <stop offset="60%" stop-color="#12295c" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="${BRAND_NAVY}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="glowTight" cx="50%" cy="32%" r="24%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#22d3ee"/>
          </linearGradient>
        </defs>
        <rect width="${splashSize}" height="${splashSize}" fill="${BRAND_NAVY}"/>
        <rect width="${splashSize}" height="${splashSize}" fill="url(#glowBig)"/>
        <rect width="${splashSize}" height="${splashSize}" fill="url(#glowTight)"/>
        <text x="50%" y="${textBaselineY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="132" font-weight="800" xml:space="preserve">
          <tspan fill="#f5f8ff">Pocket </tspan><tspan fill="url(#titleGrad)">Base</tspan>
        </text>
      </svg>
    `)
  )
    .png()
    .toBuffer();

  await sharp(splashBackground)
    .composite([
      {
        input: logo,
        left: Math.round((splashSize - logoWidth) / 2),
        top: logoTop,
      },
    ])
    .png()
    .toFile(path.join(assetsDir, "splash.png"));

  console.log("Generated: assets/icon.png, icon-foreground.png, icon-background.png, splash.png");
}

main();
