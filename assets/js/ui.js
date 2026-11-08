/* 土星计划 · 通用 UI 工具 */
(function () {
  "use strict";

  var ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return ESC[c];
    });
  }

  function money(n) {
    var v = Number(n) || 0;
    return v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function today() {
    return SaturnStore.iso();
  }

  function fmtDate(d) {
    if (!d) return "";
    var parts = String(d).split("-");
    if (parts.length !== 3) return d;
    return Number(parts[1]) + "/" + Number(parts[2]);
  }

  function fmtDateFull(d) {
    if (!d) return "";
    var parts = String(d).split("-");
    if (parts.length !== 3) return d;
    return parts[0] + " 年 " + Number(parts[1]) + " 月 " + Number(parts[2]) + " 日";
  }

  function weekday(d) {
    var x = new Date(String(d) + "T00:00:00");
    return "日一二三四五六".charAt(x.getDay());
  }

  function daysBetween(a, b) {
    var x = new Date(a + "T00:00:00").getTime();
    var y = new Date(b + "T00:00:00").getTime();
    return Math.round((y - x) / 86400000);
  }

  function relTime(ts) {
    var diff = Date.now() - Number(ts || 0);
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
    if (diff < 86400000) return Math.floor(diff / 3600000) + " 小时前";
    if (diff < 86400000 * 7) return Math.floor(diff / 86400000) + " 天前";
    var d = new Date(Number(ts));
    return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
  }

  function monthKey(d) {
    return String(d || today()).slice(0, 7);
  }

  var toastTimer = null;
  function toast(msg) {
    var node = document.getElementById("toast");
    if (!node) {
      node = document.createElement("div");
      node.id = "toast";
      node.className = "toast";
      document.body.appendChild(node);
    }
    node.textContent = msg;
    node.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove("is-on"); }, 2200);
  }

  var icons = {
    overview:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3.4 9.6h17.2"/><path d="M8 3.9 9.6 9.6"/><path d="M16 3.9 14.4 9.6"/></svg>',
    tasks:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h10"/><path d="M4 12h10"/><path d="M4 18h7"/><path d="m16.5 16.5 2 2 4-4.5"/></svg>',
    notes:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>',
    money:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 11h18"/><circle cx="16.5" cy="15" r="1.4"/></svg>',
    habits:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 8h7"/><path d="M5 13h5"/><path d="M5 18h7"/><path d="m15 17 2 2 4-5"/><circle cx="17.5" cy="7.5" r="2.5"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m4 12 5.5 5.5L20 6.5"/></svg>',
  };

  window.SaturnUI = {
    esc: esc,
    money: money,
    today: today,
    fmtDate: fmtDate,
    fmtDateFull: fmtDateFull,
    weekday: weekday,
    daysBetween: daysBetween,
    relTime: relTime,
    monthKey: monthKey,
    toast: toast,
    icons: icons,
  };
})();
