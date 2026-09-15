import Image from "next/image";
import { ExternalLink, Play } from "lucide-react";
import { INFLUENCER_CHANNELS } from "@/lib/homeShowcase";
import { SectionHeader } from "@/components/SectionHeader";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

/**
 * ホーム画面の「インフルエンサー動画」セクション。lib/homeShowcase.ts で手動登録した
 * チャンネル単位で「チャンネルカード(アイコン+名前+YouTubeへのリンク)→動画サムネイル一覧」の
 * 階層で紹介する。動画サムネはクリックでYouTube側の動画ページを新しいタブで開く
 * (埋め込みプレイヤーは使わず、外部サイトへのリンクに留めている)。
 * INFLUENCER_CHANNELSが空の間は何も表示しない。
 */
export function InfluencerVideosSection({ lang }: { lang: Lang }) {
  if (INFLUENCER_CHANNELS.length === 0) return null;

  const t = getDict(lang).home;

  return (
    <section>
      <SectionHeader title={t.influencerVideos} />
      <div className="mt-5 space-y-6">
        {INFLUENCER_CHANNELS.map((channel) => (
          <div key={channel.id} className="overflow-hidden rounded-2xl border border-line shadow-xs">
            <div className="hero-dark bg-hero-gradient-dark px-4 py-3 sm:px-5">
              <a href={channel.channelUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-background ring-1 ring-line">
                  <Image src={channel.avatarUrl} alt={channel.channelName} fill sizes="44px" className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-accent">{channel.channelName}</p>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    YouTube
                    <ExternalLink className="h-3 w-3" />
                  </p>
                </div>
              </a>
            </div>
            <div className="grid grid-cols-1 gap-4 bg-surface p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
              {[...channel.videos]
                .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
                .map((video) => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-xl border border-line bg-background shadow-xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-background">
                    <Image
                      src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                      alt={lang === "en" ? video.titleEn : video.titleJa}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                      <Play className="h-10 w-10 fill-white text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {lang === "en" ? video.titleEn : video.titleJa}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
