"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { getDict } from "@/lib/i18n/dict";

/** フッターに置く「ご意見・ご要望」リンク。押すとフィードバック送信モーダルを開く */
export function FeedbackLink() {
  const lang = useLang();
  const t = getDict(lang).footer;
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted underline decoration-line underline-offset-2 transition-colors hover:text-accent"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        {t.feedbackLink}
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
