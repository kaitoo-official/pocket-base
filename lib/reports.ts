// トレード投稿・コメントの通報(Report)機能。Apple App Store Guideline 1.2対応の一部。
// 通報内容はfirestore.rules側で「本人以外は読めない」ようにしている(運営はFirebase Console経由で確認する。
// 詳細はdocs/operations/MODERATION.md参照)。

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const REPORTS_COLLECTION = "reports";

export type ReportTargetType = "tradePost" | "comment";
export type ReportReason = "inappropriate" | "harassment" | "spam" | "scam" | "personal_info" | "other";

export const REPORT_REASONS: ReportReason[] = [
  "inappropriate",
  "harassment",
  "spam",
  "scam",
  "personal_info",
  "other",
];

const DETAILS_MAX = 300;

export interface NewReport {
  targetType: ReportTargetType;
  /** tradePostなら投稿ID、commentならコメントID */
  targetId: string;
  /** コメント通報の場合、親となる投稿ID(tradePostの場合はtargetIdと同じ値)。管理者がFirebase Console上で対象を特定するために保持する */
  postId: string;
  /** 通報対象の投稿者/コメント投稿者のUID。古い匿名投稿など取得できない場合はnull */
  targetAuthorUid: string | null;
  reason: ReportReason;
  details: string;
}

/** 同一ユーザーが同じ対象を複数回通報できないよう、決定的なIDを使う(2回目は更新扱いになりルールで拒否される) */
function buildReportId(reporterUid: string, targetType: ReportTargetType, targetId: string): string {
  return `${reporterUid}_${targetType}_${targetId}`;
}

/**
 * 通報を送信する。ログイン(Google/Apple)必須。
 * 同じ対象への2回目の通報はFirestoreルール側の allow update: if false により拒否されるため、
 * 呼び出し側は事前に hasReported() で確認し、ボタンを「通報済み」表示に切り替えておくこと。
 */
export async function createReport(report: NewReport): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) {
    throw new Error("ログインが必要です");
  }

  const reportId = buildReportId(user.uid, report.targetType, report.targetId);
  await setDoc(doc(db, REPORTS_COLLECTION, reportId), {
    reporterUid: user.uid,
    targetType: report.targetType,
    targetId: report.targetId,
    postId: report.postId,
    targetAuthorUid: report.targetAuthorUid,
    reason: report.reason,
    details: report.details.trim().slice(0, DETAILS_MAX),
    createdAt: serverTimestamp(),
    status: "open",
  });
}

/** 自分がこの対象を既に通報済みかどうかを確認する(通報ボタンの表示切り替え用) */
export async function hasReported(targetType: ReportTargetType, targetId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return false;
  const reportId = buildReportId(user.uid, targetType, targetId);
  const snapshot = await getDoc(doc(db, REPORTS_COLLECTION, reportId));
  return snapshot.exists();
}
