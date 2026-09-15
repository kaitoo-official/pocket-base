"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Expansion, Pack } from "@/types/card";
import { getPackImageUrl } from "@/lib/getCardImage";
import { useLang } from "@/lib/i18n/LanguageProvider";

/** Hero右側のパックカルーセルで使う、パック1件分の表示情報 */
export interface FeaturedPack {
  pack: Pack;
  expansion: Expansion;
  label: string;
  cardCount: number;
}

const AUTOPLAY_INTERVAL_MS = 4500;
const RESUME_DELAY_MS = 5000;
const TRANSITION_MS = 550;
const SWIPE_THRESHOLD_PX = 40;

// 前後のパックが中央からどれだけ離れて見えるか(コンテナ幅に対する割合)
const OFFSET_PERCENT = 62;
// さらに外側(1つ手前の待機列)の位置。ここに透明な状態で置いておき、
// 「見えない位置からスッと現れる/スッと消えていく」滑らかさを出す
const OUTER_OFFSET_PERCENT = 105;
// 位置合わせ用のtransform(常にこのイージングで動かす。少しだけ行き過ぎてから収まる「back-ease」)
const MOVE_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
// 濃さ・ぼかしの変化用(ご指定の、行き過ぎないなめらかなイージング)
const FADE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** index を current からの相対位置(-1, 0, +1 ...)に変換する。円環(最初/最後がつながる)前提 */
function getOffset(index: number, current: number, length: number): number {
  let diff = (index - current) % length;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Home右側に置く、注目パックのカルーセル。
 * 中央=選択中のパックを大きく、その前後のパックを少し縮小・半透明・ぼかして両脇に見せることで、
 * 「パック自体が奥行きのある空間を移動している」ように見せている(単純な画像の差し替えはしない)。
 * 中央のパックをクリックするとそのパックの詳細ページへ、左右のパックをクリックするとまず中央へ移動する。
 */
export function HeroVisual({ packs }: { packs: FeaturedPack[] }) {
  const lang = useLang();
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isManualRef = useRef(false);
  const dragRef = useRef<{ startX: number; deltaX: number } | null>(null);

  const length = packs.length;

  const advance = useCallback(
    (delta: number, manual: boolean) => {
      if (manual) isManualRef.current = true;
      setCurrent((c) => ((c + delta) % length + length) % length);
    },
    [length]
  );

  const jumpTo = useCallback((index: number) => {
    isManualRef.current = true;
    setCurrent(index);
  }, []);

  // 自動再生: hover中・drag中は止める。手動操作の直後だけ、次の自動送りまで少し長めに待つ
  useEffect(() => {
    if (length <= 1) return;
    if (isHovering || isDragging) return;
    if (prefersReducedMotion()) return;

    const delay = isManualRef.current ? RESUME_DELAY_MS : AUTOPLAY_INTERVAL_MS;
    const timer = setTimeout(() => {
      isManualRef.current = false;
      advance(1, false);
    }, delay);
    return () => clearTimeout(timer);
  }, [current, isHovering, isDragging, length, advance]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") advance(-1, true);
    if (event.key === "ArrowRight") advance(1, true);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = { startX: event.clientX, deltaX: 0 };
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    dragRef.current.deltaX = event.clientX - dragRef.current.startX;
  }

  function endDrag() {
    const drag = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);
    if (!drag) return;
    if (Math.abs(drag.deltaX) > SWIPE_THRESHOLD_PX) {
      advance(drag.deltaX < 0 ? 1 : -1, true);
    }
  }

  if (length === 0) return null;
  const centerPack = packs[current];

  return (
    <div>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="注目パック"
        tabIndex={0}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative mx-auto h-64 w-full max-w-xs touch-pan-y select-none overflow-hidden [perspective:1000px] focus:outline-none sm:h-80 sm:max-w-sm lg:h-[26rem] lg:max-w-none"
      >
        {/* パックを浮かせて見せる、ごく薄いradialグラデーション */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.10), transparent 60%)",
          }}
        />

        {packs.map((item, index) => {
          const offset = getOffset(index, current, length);
          const absOffset = Math.abs(offset);
          // 外側の待機列(±2)は、円環が小さい(4枚以下)と手前の枠と同じ位置に重なってしまうため、
          // その場合だけ描画をあきらめる(=以前と同じ3枚表示に留める)
          const maxOffset = length > 4 ? 2 : 1;
          if (absOffset > maxOffset) return null;

          const isCenter = offset === 0;
          const isOuter = absOffset === 2;
          const translatePercent = isOuter ? Math.sign(offset) * OUTER_OFFSET_PERCENT : offset * OFFSET_PERCENT;

          const style: CSSProperties = {
            transform: `translate(-50%, -50%) translateX(${translatePercent}%) translateZ(${-absOffset * 60}px) scale(${
              isCenter ? 1 : isOuter ? 0.72 : 0.85
            })`,
            opacity: isCenter ? 1 : isOuter ? 0 : 0.55,
            filter: isCenter ? "blur(0px)" : isOuter ? "blur(3px)" : "blur(1.5px)",
            zIndex: 20 - absOffset * 10,
            pointerEvents: isOuter ? "none" : undefined,
            transitionProperty: "transform, opacity, filter",
            transitionDuration: `${TRANSITION_MS}ms`,
            transitionTimingFunction: `${MOVE_EASE}, ${FADE_EASE}, ${FADE_EASE}`,
          };

          const content = (
            <div
              className={`relative aspect-[334/644] h-56 sm:h-72 lg:h-[22rem] ${
                isCenter ? "drop-shadow-xl" : "drop-shadow-md"
              }`}
            >
              <Image
                src={getPackImageUrl(item.pack)}
                alt={isCenter ? item.label : ""}
                fill
                sizes="288px"
                className="object-contain"
              />
            </div>
          );

          // 位置合わせ(transform)を持つ「外枠」は、中央/両脇/外側リングのどれであっても
          // 常に同じdiv要素にする。中に入れる中身(Link/button/ただの画像)だけを出し分けることで、
          // Reactが要素の種類の違いでDOMを作り直してしまい、
          // トランジションの起点が無いまま瞬間移動して見える(「バチン」の正体)のを防いでいる。
          let inner: ReactNode;
          if (isOuter) {
            inner = content;
          } else if (isCenter) {
            inner = (
              <Link
                href={`/packs/${item.pack.id}`}
                aria-label={`${item.label}のカード一覧を見る`}
                className="block cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]"
              >
                {content}
              </Link>
            );
          } else {
            inner = (
              <button
                type="button"
                aria-label={`${item.label}を中央に表示`}
                onClick={() => jumpTo(index)}
                className="block cursor-pointer"
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={item.pack.id}
              aria-hidden={isOuter || undefined}
              className="absolute top-1/2 left-1/2 block"
              style={style}
            >
              {inner}
            </div>
          );
        })}

        {length > 1 && (
          <>
            <button
              type="button"
              aria-label="前のパック"
              onClick={() => advance(-1, true)}
              className="absolute top-1/2 left-0 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-md transition-colors hover:border-accent/40 hover:bg-surface-hover"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="次のパック"
              onClick={() => advance(1, true)}
              className="absolute top-1/2 right-0 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-foreground shadow-md transition-colors hover:border-accent/40 hover:bg-surface-hover"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {packs.map((item, index) => (
            <button
              key={item.pack.id}
              type="button"
              aria-label={`${index + 1}枚目のパックを表示`}
              onClick={() => jumpTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === current ? "w-6 bg-accent" : "w-3 bg-line-strong hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-base font-bold text-foreground">{centerPack.label}</p>
        <p className="mt-0.5 text-xs text-muted">
          {lang === "en"
            ? `${centerPack.cardCount.toLocaleString()} cards`
            : `${centerPack.cardCount.toLocaleString()}枚収録`}
          {centerPack.expansion.releaseDate && ` · ${centerPack.expansion.releaseDate}`}
        </p>
        <Link
          href={`/packs/${centerPack.pack.id}`}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-strong"
        >
          {lang === "en" ? "View pack →" : "パックを見る →"}
        </Link>
      </div>
    </div>
  );
}
