/* 土星计划 · 模块：概览 */
(function () {
  "use strict";

  var UI = window.SaturnUI;
  var S = window.SaturnStore;

  function greetWord() {
    var h = new Date().getHours();
    if (h < 5) return "夜深了";
    if (h < 11) return "早上好";
    if (h < 14) return "中午好";
    if (h < 18) return "下午好";
    return "晚上好";
  }

  function monthExpense() {
    var key = UI.monthKey();
    return S.get().entries.reduce(function (sum, e) {
      if (e.type === "expense" && String(e.date || "").slice(0, 7) === key) {
        return sum + (Number(e.amount) || 0);
      }
      return sum;
    }, 0);
  }

  function bestStreak() {
    var best = 0;
    S.get().habits.forEach(function (h) {
      var n = 0;
      var i = 0;
      while (h.checks[S.shiftDays(i)] && i > -400) {
        n++;
        i--;
      }
      if (!h.checks[S.iso()] && h.checks[S.shiftDays(-1)]) {
        n = 0;
        i = -1;
        while (h.checks[S.shiftDays(i)] && i > -400) {
          n++;
          i--;
        }
      }
      best = Math.max(best, n);
    });
    return best;
  }

  function stat(label, value, unit, foot, go) {
    return (
      '<div class="stat" data-go="' + go + '" style="cursor:pointer">' +
      '<div class="stat-label">' + label + "</div>" +
      '<div class="stat-value">' + value + '<span class="stat-unit">' + unit + "</span></div>" +
      '<div class="stat-foot">' + foot + "</div>" +
      "</div>"
    );
  }

  function render(root) {
    var all = S.get().tasks;
    var openToday = all.filter(function (t) {
      return !t.done && (!t.due || t.due <= S.iso());
    });
    var doneToday = all.filter(function (t) {
      return t.done && t.due === S.iso();
    });
    var rank = { high: 0, normal: 1, low: 2 };
    var todayList = openToday
      .slice()
      .sort(function (a, b) { return (rank[a.priority] || 1) - (rank[b.priority] || 1); })
      .slice(0, 5);

    var habits = S.get().habits;
    var doneHabits = habits.filter(function (h) { return h.checks[S.iso()]; });
    var notes = S.get().notes;
    var expense = monthExpense();

    root.innerHTML =
      '<div class="ring-hero">' +
      '<svg class="ring-bg" viewBox="0 0 200 200" aria-hidden="true">' +
      '<ellipse cx="100" cy="100" rx="96" ry="30" transform="rotate(-22 100 100)" fill="none" stroke="#e7a445" stroke-opacity="0.28" stroke-width="2"/>' +
      '<ellipse cx="100" cy="100" rx="74" ry="21" transform="rotate(-22 100 100)" fill="none" stroke="#e7a445" stroke-opacity="0.16" stroke-width="1.2"/>' +
      '<circle cx="100" cy="100" r="44" fill="#e7a445" fill-opacity="0.07" stroke="#e7a445" stroke-opacity="0.35" stroke-width="1"/>' +
      "</svg>" +
      '<div class="ring-hero-inner">' +
      '<p class="greet">' + greetWord() + "，今天要做的都在下面。</p>" +
      '<p class="greet-sub">' + UI.fmtDateFull(S.iso()) + " · 星期" + UI.weekday(S.iso()) +
      " · 今日待办 " + doneToday.length + "/" + (openToday.length + doneToday.length) + " 已完成" +
      "</p>" +
      '<div class="quick">' +
      '<button type="button" class="btn btn-primary" data-go="tasks">去加一条待办</button>' +
      '<button type="button" class="btn" data-go="notes">写一条笔记</button>' +
      '<button type="button" class="btn" data-go="money">记一笔账</button>' +
      "</div>" +
      "</div>" +
      "</div>" +

      '<div class="grid" style="margin-top:14px">' +
      stat("今日待办", openToday.length, "项", "项待处理", "tasks") +
      stat("本月支出", UI.money(expense), "元", UI.monthKey().replace("-", " / ") + " 累计", "money") +
      stat("最长连续", bestStreak(), "天", "打卡记录", "habits") +
      stat("笔记", notes.length, "条", "本地保存", "notes") +
      "</div>" +

      '<div class="overview-cols" style="margin-top:14px">' +
      '  <div class="panel">' +
      '    <div class="panel-head"><h2>今天该做</h2><span class="hint">' + openToday.length + " 项</span></div>" +
      (todayList.length
        ? '<div class="today-list">' +
          todayList
            .map(function (t) {
              return (
                '<div class="today-item">' +
                '<i class="dot prio-' + (t.priority || "normal") + '" aria-hidden="true"></i>' +
                '<span class="t">' + UI.esc(t.title) + "</span>" +
                (t.due && t.due < S.iso() ? '<span class="chip chip-bad" style="margin-left:auto">逾期</span>' : "") +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        : '<div class="empty">今天没有到期的事，或者已经清空了</div>') +
      '    <div class="quick" style="margin-top:12px">' +
      '      <button type="button" class="btn btn-sm" data-go="tasks">查看全部待办</button>' +
      "    </div>" +
      "  </div>" +

      '  <div class="panel">' +
      '    <div class="panel-head"><h2>今日打卡</h2><span class="hint">' + doneHabits.length + " / " + habits.length + "</span></div>" +
      (habits.length
        ? habits
            .map(function (h) {
              var on = !!h.checks[S.iso()];
              return (
                '<div class="mini-stat"><span>' + UI.esc(h.name) + "</span>" +
                '<span class="chip ' + (on ? "chip-good" : "") + '">' + (on ? "已打卡" : "待打卡") + "</span></div>"
              );
            })
            .join("")
        : '<div class="empty">还没有习惯，去「习惯打卡」建一个</div>') +
      '    <div class="quick" style="margin-top:12px">' +
      '      <button type="button" class="btn btn-sm" data-go="habits">去打卡</button>' +
      "    </div>" +
      "  </div>" +
      "</div>" +

      '<div class="panel" style="margin-top:14px">' +
      '  <div class="panel-head"><h2>说明</h2><span class="hint">纯前端 · 无后端</span></div>' +
      '  <p style="margin:0;font-size:13px;line-height:1.8;color:var(--text-2)">' +
      "这个工作台把待办、笔记、记账、习惯四件事放在一起，数据全部存在当前浏览器里（localStorage）。" +
      "因为部署在 GitHub Pages 这种静态托管上，没有服务器，也就没有账号和云同步：换设备或清理浏览器缓存后，数据不会跟着走。" +
      "重要内容建议定期导出文本备份。" +
      "</p>" +
      "</div>";

    root.querySelectorAll("[data-go]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        location.hash = "#/" + btn.getAttribute("data-go");
      });
    });
  }

  window.SaturnViews = window.SaturnViews || {};
  window.SaturnViews.overview = {
    title: "概览",
    desc: "",
    render: render,
  };
})();
