"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/auth/deleteAccount";
import { getDict } from "@/lib/i18n/dict";
import type { Lang } from "@/lib/i18n/lang";

type Step = "closed" | "confirm" | "working";

/**
 * 削除完了の画面。削除が終わるとFirebaseがログアウト状態になり、RequireAuthが子要素ごと外してしまうため、
 * 完了表示は(RequireAuthの外にある)親側から出す。
 */
export function AccountDeletedNotice({ lang }: { lang: Lang }) {
  const t = getDict(lang).accountDeletion;
  const router = useRouter();
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-teal-400 text-white">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-bold text-foreground">{t.doneTitle}</p>
      <p className="mt-1 text-xs text-muted">{t.doneDescription}</p>
      <button
        type="button"
        onClick={() => router.replace("/")}
        className="mt-5 w-full max-w-xs cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        {t.goHome}
      </button>
    </main>
  );
}

/** マイページ下部の「アカウントを削除」。確認モーダル → 再ログイン → 削除、の順に進み、完了は onDeleted で親に伝える */
export function DeleteAccountSection({ lang, onDeleted }: { lang: Lang; onDeleted: () => void }) {
  const t = getDict(lang).accountDeletion;
  const [step, setStep] = useState<Step>("closed");
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setStep("working");
    const result = await deleteAccount();
    if (result.status === "success") {
      onDeleted();
      return;
    }
    setStep("confirm");
    if (result.status === "cancelled") return;
    setError(
      result.reason === "account-mismatch" ? t.errorMismatch : result.reason === "not-signed-in" ? t.errorNotSignedIn : t.errorFailed
    );
  }

  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="text-sm font-bold text-foreground">{t.sectionTitle}</h2>
      <p className="mt-1 text-xs text-muted">{t.sectionDescription}</p>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setStep("confirm");
        }}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" />
        {t.button}
      </button>

      {step !== "closed" && (
        <div className="theme-reset-light fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-[#0B2D5B]/40" onClick={step === "confirm" ? () => setStep("closed") : undefined} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.modalTitle}
            className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-xl sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <h2 className="text-lg font-bold text-foreground">{t.modalTitle}</h2>
            <p className="mt-3 text-sm text-foreground">{t.modalIntro}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {t.deletedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-semibold text-foreground">{t.retainedHeading}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
              {t.retainedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-semibold text-red-600">{t.irreversible}</p>
            <p className="mt-1 text-xs text-muted">{t.reauthNote}</p>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {step === "working" && <p className="mt-3 text-sm text-muted">{t.working}</p>}
          </div>
          <div className="flex shrink-0 gap-2 border-t border-line px-4 py-3">
            <button
              type="button"
              onClick={() => setStep("closed")}
              disabled={step === "working"}
              className="flex-1 cursor-pointer rounded-lg border border-line px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={step === "working"}
              className="flex-1 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.confirm}
            </button>
          </div>
          </div>
        </div>
      )}
    </section>
  );
}
