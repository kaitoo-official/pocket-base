"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, X } from "lucide-react";
import { createFeedback } from "@/lib/feedback";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

const MESSAGE_MAX = 1000;
const CONTACT_MAX = 200;

/**
 * フッターの「ご意見・ご要望」から開く、フィードバック送信モーダル。
 * 一覧表示はせず運営がFirebase Console側で直接確認する想定のため、
 * トレード投稿と違って送信後の内容確認UIは作っていない。
 */
export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const lang = useLang();
  const t = getDict(lang).feedback;

  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [honeypot, setHoneypot] = useState("");
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // bot対策: 人間には見えない欄が埋まっていたら送信を無視する
    if (honeypot) return;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError(t.messageRequiredError);
      return;
    }

    setSubmitting(true);
    try {
      await createFeedback({
        message: trimmedMessage.slice(0, MESSAGE_MAX),
        contact: contact.trim().slice(0, CONTACT_MAX),
      });
      setSent(true);
    } catch {
      setError(t.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="theme-reset-light fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[#0B2D5B]/40"
        style={{ animation: "sheet-fade-in 0.15s ease-out" }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.modalTitle}
        className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-xl sm:max-w-md sm:rounded-2xl"
        style={{ animation: "sheet-slide-up 0.2s ease-out" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">{t.modalTitle}</h2>
            {!sent && <p className="mt-0.5 text-xs text-muted">{t.modalDescription}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-teal-400 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">{t.successTitle}</p>
              <p className="mt-1 text-xs text-muted">{t.successDescription}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">{t.messageLabel}</label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={MESSAGE_MAX}
                  rows={5}
                  placeholder={t.messagePlaceholder}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-foreground shadow-xs focus:border-accent/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  {t.contactLabel} <span className="text-xs font-normal text-muted">{t.contactOptional}</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  maxLength={CONTACT_MAX}
                  placeholder={t.contactPlaceholder}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-foreground shadow-xs focus:border-accent/60 focus:outline-none"
                />
                <p className="mt-1.5 text-xs text-muted">{t.contactHint}</p>
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full cursor-pointer rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
