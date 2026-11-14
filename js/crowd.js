// ============================================================
// crowd.js — 混み具合表示の係（第6歩）
// Firebaseの掲示板（status/current）を見て、トップページの
// 「ただいまの混み具合」の札を書き換える。読み取り専用。
// ============================================================

// Firebaseの道具をインターネットから借りてくる（読み取りだけなので auth は借りない）
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// 自分の作業場の情報（テストページと同じ）
const firebaseConfig = {
  apiKey: "AIzaSyDBKtitG3RX_CXU8yX-48oJU26KUTgcGGw",
  authDomain: "ruran-bd4b8.firebaseapp.com",
  projectId: "ruran-bd4b8",
  storageBucket: "ruran-bd4b8.firebasestorage.app",
  messagingSenderId: "1020997535145",
  appId: "1:1020997535145:web:918676a3e98fe0ca5730b8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 札の置き場所（テストページと同じ）
const statusRef = doc(db, "status", "current");

/* ========== 判定ルール（第3歩〜第6歩-1と同じ） ========== */

const ALLDAY = ["定休日", "臨時休業", "本日は終了"];

function dateStr(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function segmentOf(mins) {
  if (mins < 11 * 60 + 30) return "before";
  if (mins < 15 * 60 + 30) return "lunch";
  if (mins < 18 * 60)      return "prep";
  if (mins < 21 * 60)      return "dinner";
  return "after";
}

function decide(data, now) {
  // 表示オフが最優先（時刻も札も関係なく、何も出さない）
  if (data && data.hidden) {
    return { show: false };
  }
  const seg = segmentOf(now.getHours() * 60 + now.getMinutes());
  const isMonday = now.getDay() === 1;

  if (data && data.status && data.updatedAt && data.updatedAt.toDate) {
    const setAt = data.updatedAt.toDate();
    // 札は「貼った時刻」より前には存在しない
    if (setAt.getTime() <= now.getTime()) {
      if (ALLDAY.includes(data.status)) {
        if (dateStr(setAt) === dateStr(now)) {
          return { show: true, status: data.status, manual: true, at: setAt };
        }
      } else {
        const setMins = setAt.getHours() * 60 + setAt.getMinutes();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const switches = [15 * 60 + 30, 18 * 60, 21 * 60];
        const expiry = switches.find((s) => s > setMins) ?? 24 * 60;
        if (dateStr(setAt) === dateStr(now) && nowMins < expiry && nowMins >= 11 * 60 + 30 && nowMins < 21 * 60) {
          return { show: true, status: data.status, manual: true, at: setAt };
        }
      }
    }
  }

  if (isMonday) return { show: true, status: "定休日" };
  if (seg === "before" || seg === "after") return { show: false };
  if (seg === "prep") return { show: true, status: "ディナー準備中" };
  // 営業中で札が無いときは、標準の「すぐにご案内できます」を出す（2026-11-08決定）
  return { show: true, status: "すぐにご案内できます" };
}

/* ========== 札の書き換え ========== */

// 状態ごとの丸印の色
const DOT_COLORS = {
  "すぐにご案内できます": "#2e9e5b", // 緑
  "少し混んでいます": "#d99a16",     // 黄
  "満席です": "#c0392b"              // 赤
};

const boxEl = document.querySelector("#crowdStatus");
const valueEl = document.querySelector("#crowdStatusValue");
const dotEl = document.querySelector("#crowdStatusDot");
const updatedEl = document.querySelector("#crowdStatusUpdated");

let latestData = null;

function render() {
  if (!boxEl) return;
  const result = decide(latestData, new Date());
  if (!result.show) {
    // 出さないときは枠ごと隠す
    boxEl.style.display = "none";
    return;
  }
  boxEl.style.display = "";
  valueEl.textContent = result.status;
  dotEl.style.background = DOT_COLORS[result.status] || "#738087";
  if (result.manual && result.at) {
    // 店員さんが貼った札のときだけ「最終更新」を出す
    const hh = String(result.at.getHours()).padStart(2, "0");
    const mm = String(result.at.getMinutes()).padStart(2, "0");
    updatedEl.textContent = "最終更新：" + hh + ":" + mm;
    updatedEl.style.display = "";
  } else {
    updatedEl.style.display = "none";
  }
}

// 掲示板が変わるたびに描き直す
onSnapshot(statusRef, (snap) => {
  latestData = snap.exists() ? snap.data() : null;
  render();
});

setInterval(render, 30000);
