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

  // splash.png: 起動画面。ネイビー背景の中央にロゴを配置。
  const splashSize = 2732;
  const logoWidth = Math.round(splashSize * 0.38);
  const logo = await sharp(path.join(publicDir, "images", "logo.png"))
    .resize(logoWidth)
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();

  await sharp({
    create: { width: splashSize, height: splashSize, channels: 4, background: BRAND_NAVY },
  })
    .composite([
      {
        input: logo,
        left: Math.round((splashSize - logoWidth) / 2),
        top: Math.round((splashSize - (logoMeta.height ?? logoWidth)) / 2),
      },
    ])
    .png()
    .toFile(path.join(assetsDir, "splash.png"));

  console.log("Generated: assets/icon.png, icon-foreground.png, icon-background.png, splash.png");
}

main();
