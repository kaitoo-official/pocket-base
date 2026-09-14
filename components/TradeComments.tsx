"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MoreVertical, Play, Trash2 } from "lucide-react";
import {
  createTradeComment,
  deleteTradeComment,
  subscribeToTradeComments,
  formatTradeDate,
  type TradeComment,
} from "@/lib/trade";
import { getRandomTrainerName } from "@/lib/trainerNames";
import { markPostAsCommented, markPostAsSeen } from "@/lib/tradeNotifications";
import { ensureAuthUid } from "@/lib/authUid";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

const NICKNAME_MAX = 20;
const TEXT_MAX = 200;

/** トレード投稿1件分のコメント欄。開いている間だけFirestoreを購読する */
export function TradeComments({ postId }: { postId: string }) {
  const lang = useLang();
  const t = getDict(lang).trade.comments;
  // コメント欄のクリックで挿入できる定型文。「○○」の部分はカード名などに書き換えて使う想定
  const COMMENT_PRESETS = t.presets;
  const [comments, setComments] = useState<TradeComment[]>([]);
  const [loading, setLoading] = useState(true);
  // 「お名前」は歴代ポケモンシリーズのトレーナーの種類からランダムに1つ初期入力しておく
  // (あくまで初期値。投稿者はそのまま使っても、自由に書き換えてもよい。英語表示時は
  // 対応する翻訳データが無いため、あえて空欄のままにする)
  const [nickname, setNickname] = useState(() => (lang === "en" ? "" : getRandomTrainerName()));
  const [text, setText] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 「自分のコメント」判定用(削除メニュー表示のため)。ログイン機能が無いため、
  // 裏でサインインしているFirebase匿名認証のUIDと照合する
  const [myUid, setMyUid] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // 定型文チップ: 既存の入力の後ろにスペース区切りで追記する(1行の入力欄のため改行は使わない)
  function addCommentPreset(preset: string) {
    setText((prev) => {
      const trimmedPrev = prev.trim();
      const next = trimmedPrev ? `${trimmedPrev} ${preset}` : preset;
      return next.slice(0, TEXT_MAX);
    });
  }

  useEffect(() => {
    const unsubscribe = subscribeToTradeComments(postId, (next) => {
      setComments(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [postId]);

  useEffect(() => {
    ensureAuthUid().then(setMyUid);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // bot対策: 人間には見えない欄が埋まっていたら送信を無視する
    if (honeypot) return;

    const trimmedText = text.trim();
    if (!trimmedText) {
      setError(t.emptyCommentError);
      return;
    }

    setSubmitting(true);
    try {
      await createTradeComment(postId, {
        nickname: nickname.trim().slice(0, NICKNAME_MAX),
        text: trimmedText.slice(0, TEXT_MAX),
      });
      // 自分のコメントで通知バッジが立たないよう、既読扱いにしておく
      markPostAsCommented(postId);
      markPostAsSeen(postId);
      setText("");
    } catch {
      setError(t.sendFailed);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setOpenMenuId(null);
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await deleteTradeComment(postId, commentId);
    } catch {
      window.alert(t.deleteFailed);
    }
  }

  return (
    <div>
      {loading && <p className="text-sm text-muted">{t.loading}</p>}
      {!loading && comments.length === 0 && (
        <p className="text-sm text-muted">{t.empty}</p>
      )}

      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => {
            const isMine = !!myUid && comment.authorUid === myUid;
            return (
              <div key={comment.id} className="relative rounded-lg border border-line bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-muted">{t.nameLabel}</p>
                    <span className="text-sm font-medium text-foreground">
                      {comment.nickname || t.anonymous}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-[11px] text-muted">{formatTradeDate(comment.createdAt, lang)}</span>
                    {isMine && (
                      <CommentMenu
                        isOpen={openMenuId === comment.id}
                        onToggle={() =>
                          setOpenMenuId((current) => (current === comment.id ? null : comment.id))
                        }
                        onClose={() => setOpenMenuId(null)}
                        onDelete={() => handleDelete(comment.id)}
                      />
                    )}
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 「既にあるコメント」と見分けやすいよう、投稿フォームは背景色を変えた枠で区切っている */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 space-y-2 rounded-xl border border-accent/20 bg-accent/5 p-3"
      >
        <p className="text-sm font-semibold text-foreground">{t.postCommentTitle}</p>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            {t.nameLabel} <span className="font-normal text-muted">{t.nameOptional}</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={NICKNAME_MAX}
            placeholder={t.namePlaceholder}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
            {t.commentLabel}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
            <span className="sr-only">{t.required}</span>
          </label>
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {COMMENT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => addCommentPreset(preset)}
                className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors duration-150 hover:border-accent/40 hover:text-accent"
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={TEXT_MAX}
                placeholder={t.commentPlaceholder}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 pr-14 text-sm text-foreground focus:border-accent/60 focus:outline-none"
              />
              <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-muted">
                {text.length}/{TEXT_MAX}
              </span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
            >
              {t.submit}
              <Play className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <input
          type="text"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

function CommentMenu({
  isOpen,
  onToggle,
  onClose,
  onDelete,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const lang = useLang();
  const t = getDict(lang).trade.comments;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label={t.commentMenuLabel}
        className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 z-10 mt-1 w-32 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-surface-hover"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t.deleteButton}
          </button>
        </div>
      )}
    </div>
  );
}
