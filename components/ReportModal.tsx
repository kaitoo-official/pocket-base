"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, LogIn, X } from "lucide-react";
import { createReport, REPORT_REASONS, type ReportReason, type ReportTargetType } from "@/lib/reports";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/**
 * 投稿・コメント共通の通報モーダル。送信成功後は呼び出し側にonReported()で知らせ、
 * ボタン側の表示を「通報済み」に切り替えてもらう(同一対象への再通報防止のUIフィードバック)。
 */
export function ReportModal({
  targetType,
  targetId,
  postId,
  targetAuthorUid,
  onClose,
  onReported,
}: {
  targetType: ReportTargetType;
  targetId: string;
  postId: string;
  targetAuthorUid: string | null;
  onClose: () => void;
  onReported: () => void;
}) {
  const lang = useLang();
  const t = getDict(lang).safety;
  const { isSignedIn, signIn } = useAuth();
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createReport({ targetType, targetId, postId, targetAuthorUid, reason, details });
      setSent(true);
      onReported();
    } catch {
      setError(t.reportError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="theme-reset-light fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#0B2D5B]/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.reportModalTitle}
        className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-xl sm:max-w-sm sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-base font-bold text-foreground">{t.reportModalTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {!isSignedIn ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-muted">{t.reportSignInDescription}</p>
              <button
                type="button"
                onClick={() => void signIn()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
              >
                <LogIn className="h-4 w-4" />
                {t.reportSignInButton}
              </button>
            </div>
          ) : sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-teal-400 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">{t.reportSuccessTitle}</p>
              <p className="mt-1 text-xs text-muted">{t.reportSuccessDescription}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">{t.reportReasonLabel}</label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                        className="accent-accent"
                      />
                      {t.reportReasons[value === "personal_info" ? "personalInfo" : value]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  {t.reportDetailsLabel} <span className="text-xs font-normal text-muted">{t.reportDetailsOptional}</span>
                </label>
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder={t.reportDetailsPlaceholder}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent/60 focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
                >
                  {t.reportCancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 px-5 py-2 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? t.reportSubmitting : t.reportSubmit}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
