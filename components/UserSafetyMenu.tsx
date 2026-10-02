"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, MoreVertical, UserX } from "lucide-react";
import { ReportModal } from "@/components/ReportModal";
import { hasReported, type ReportTargetType } from "@/lib/reports";
import { blockUser } from "@/lib/blockedUsers";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * 他人の投稿/コメントに対する「通報する」「ユーザーをブロック」をまとめた「…」メニュー。
 * 自分自身のコンテンツには表示しない(呼び出し側で isOwn を見て出し分ける)。
 */
export function UserSafetyMenu({
  targetType,
  targetId,
  postId,
  targetAuthorUid,
  targetNickname,
}: {
  targetType: ReportTargetType;
  targetId: string;
  postId: string;
  targetAuthorUid: string | null;
  targetNickname: string | null;
}) {
  const lang = useLang();
  const t = getDict(lang).safety;
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockError, setBlockError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    hasReported(targetType, targetId)
      .then((value) => {
        if (!cancelled) setReported(value);
      })
      // Firestoreルール未反映時などの読み取り失敗時は「未通報」扱いのままにする
      // (通報メニュー自体は引き続き使える状態を維持するための安全側のフォールバック)
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleBlock() {
    setBlockError(false);
    try {
      await blockUser(targetAuthorUid as string, targetNickname);
      setBlocked(true);
      setIsOpen(false);
    } catch {
      setBlockError(true);
    }
  }

  if (blocked) {
    return <p className="text-[11px] text-muted">{t.blockedNotice}</p>;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t.menuLabel}
        className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
          <button
            type="button"
            disabled={reported}
            onClick={() => {
              setIsOpen(false);
              setReportOpen(true);
            }}
            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-surface-hover disabled:cursor-default disabled:text-muted disabled:hover:bg-transparent"
          >
            <Flag className="h-3.5 w-3.5" />
            {reported ? t.reportAlready : t.reportButton}
          </button>
          {targetAuthorUid && isSignedIn && (
            <button
              type="button"
              onClick={() => void handleBlock()}
              className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-surface-hover"
            >
              <UserX className="h-3.5 w-3.5" />
              {t.blockButton}
            </button>
          )}
        </div>
      )}
      {blockError && <p className="absolute top-full right-0 mt-1 w-40 text-[11px] text-red-600">{t.blockError}</p>}

      {reportOpen && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          postId={postId}
          targetAuthorUid={targetAuthorUid}
          onClose={() => setReportOpen(false)}
          onReported={() => setReported(true)}
        />
      )}
    </div>
  );
}
