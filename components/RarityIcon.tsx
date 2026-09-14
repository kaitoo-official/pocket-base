// レアリティを表す、まるいバッジ画像(裸のアイコン部分)。
// ダイヤ・星は記号の個数分がまとめて描かれた1枚画像なので、高さを揃えて幅は自動で伸ばす。
// 画像が無いレアリティ(プロモ)は、他のタイプアイコンと同じ「色付き円+絵柄」で代用する。
import Image from "next/image";
import { Ticket } from "lucide-react";
import { getRarityImage } from "@/lib/rarityLabels";

export function RarityIcon({
  rarity,
  shiny = false,
  className = "h-5",
}: {
  rarity: string;
  shiny?: boolean;
  className?: string;
}) {
  const image = getRarityImage(rarity, shiny);

  if (!image) {
    return (
      <span
        className={`inline-flex aspect-square shrink-0 items-center justify-center rounded-full bg-gray-400 text-white ${className}`}
      >
        <Ticket className="h-[55%] w-[55%]" />
      </span>
    );
  }

  return (
    <Image
      src={image.src}
      alt=""
      width={image.width}
      height={image.height}
      className={`w-auto shrink-0 object-contain ${className}`}
    />
  );
}
