import Image from "next/image";

// ロゴ画像の縦横比(public/images/logo.png の実サイズに合わせている)
const LOGO_ASPECT = 1048 / 1119;

interface LogoProps {
  withTagline?: boolean;
  size?: "sm" | "lg";
}

export function Logo({ withTagline = false, size = "sm" }: LogoProps) {
  const isLarge = size === "lg";
  const height = isLarge ? 64 : 28;
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <span className={`inline-flex items-center ${isLarge ? "gap-4" : "gap-2"}`}>
      <Image
        src="/images/logo.png"
        alt="Pocket Base"
        width={width}
        height={height}
        priority={isLarge}
      />
      <span className="flex flex-col leading-tight">
        <span
          className={`font-bold tracking-wide text-foreground ${isLarge ? "text-4xl" : ""}`}
        >
          Pocket{" "}
          <span className="bg-gradient-to-r from-accent to-accent-strong bg-clip-text text-transparent">
            Base
          </span>
        </span>
        {withTagline && (
          <span
            className={`font-medium tracking-[0.3em] text-muted ${
              isLarge ? "mt-1 text-xs" : "text-[9px]"
            }`}
          >
            CARD DATABASE
          </span>
        )}
      </span>
    </span>
  );
}
