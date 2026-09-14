// このアプリにはログイン機能が無いため、「自分の投稿・コメント」を判定する目的だけに、
// ブラウザのlocalStorageに緩い匿名IDを1つ持たせている。アカウントではないので、
// 別のブラウザ・シークレットモード・ストレージ削除後は引き継がれない。
const STORAGE_KEY = "pocketbase_device_id";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // 古いブラウザ向けの簡易フォールバック(一意性の厳密さより「一応動く」ことを優先)
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** このブラウザの匿名IDを返す(無ければ作って保存する)。サーバー側では空文字を返す */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const created = generateId();
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return "";
  }
}
