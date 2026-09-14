// フッターの「ご意見・ご要望」フォームから送られたフィードバックをFirestoreに保存する窓口。
// トレード投稿と違い一覧表示はせず、運営(自分)がFirebase Console側で直接確認する想定のため、
// 読み取りはFirestoreのセキュリティルール側で禁止している(firestore.rules参照)。

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDeviceId } from "@/lib/deviceId";

const FEEDBACK_COLLECTION = "feedback";

export interface NewFeedback {
  message: string;
  contact: string;
}

export async function createFeedback(feedback: NewFeedback): Promise<void> {
  await addDoc(collection(db, FEEDBACK_COLLECTION), {
    ...feedback,
    createdAt: serverTimestamp(),
    authorDeviceId: getDeviceId(),
  });
}
