/* 土星计划 · 模块：习惯打卡 */
(function () {
  "use strict";

  var UI = window.SaturnUI;
  var S = window.SaturnStore;
  var SPAN = 21;

  function days() {
    var out = [];
    for (var i = SPAN - 1; i >= 0; i--) out.push(S.shiftDays(-i));
    return out;
  }

  function checkedToday(h) {
    return !!h.checks[S.iso()];
  }

  function streak(h) {
    var n = 0;
    var i = checkedToday(h) ? 0 : -1;
    while (true) {
      var d = S.shiftDays(i);
      if (h.checks[d]) {
        n++;
        i--;
      } else {
        break;
      }
      if (n > 3650) break;
    }
    return n;
  }

  function weekRate(h) {
    var n = 0;
    for (var i = 0; i < 7; i++) {
      if (h.checks[S.shiftDays(-i)]) n++;
    }
    return n;
  }

  function habitBlock(h, ds) {
    var st = streak(h);
    var wr = weekRate(h);
    return (
      '<div class="habit" data-id="' + h.id + '">' +
      '  <div class="habit-head">' +
      '    <div class="habit-name">' +
      '<i class="dot ' + (checkedToday(h) ? "prio-normal" : "prio-low") + '" aria-hidden="true"></i>' +
      "<span>" + UI.esc(h.name) + "</span>" +
      '      <span class="chip ' + (checkedToday(h) ? "chip-good" : "") + '">' +
      (checkedToday(h) ? "今日已打卡" : "今日未打卡") + "</span>" +
      "    </div>" +
      '    <div class="habit-streak">连续 <b>' + st + "</b> 天 · 近 7 天 " + wr + "/7 " +
      '<button type="button" class="row-del" data-act="del" aria-label="删除习惯">×</button>' +
      "</div>" +
      "  </div>" +
      '  <div class="habit-grid">' +
      ds.map(function (d) {
        var on = !!h.checks[d];
        var isToday = d === S.iso();
        return (
          '<button type="button" class="habit-day ' + (on ? "is-on" : "") + " " +
          (isToday ? "is-today" : "") + '" data-date="' + d + '" title="' +
          UI.fmtDateFull(d) + " · 星期" + UI.weekday(d) + '" aria-label="' +
          UI.fmtDateFull(d) + (on ? " 已打卡" : " 未打卡") + '"></button>'
        );
      }).join("") +
      "  </div>" +
      '  <div class="habit-weekdays">' +
      ds.map(function (d) { return "<span>" + UI.weekday(d) + "</span>"; }).join("") +
      "  </div>" +
      "</div>"
    );
  }

  function render(root) {
    var habits = S.get().habits;
    var todayDone = habits.filter(checkedToday).length;
    var ds = days();

    root.innerHTML =
      '<div class="panel">' +
      '  <div class="panel-head">' +
      "    <h2>新增习惯</h2>" +
      '    <span class="hint">今日 ' + todayDone + " / " + habits.length + " 已打卡</span>" +
      "  </div>" +
      '  <form id="habit-form" class="form-row form-row-2">' +
      '    <div class="field">' +
      '      <label class="field-label" for="h-name">习惯名称</label>' +
      '      <input id="h-name" type="text" maxlength="30" placeholder="例如：运动 30 分钟" autocomplete="off">' +
      "    </div>" +
      '    <div class="field">' +
      '      <label class="field-label">&nbsp;</label>' +
      '      <button type="submit" class="btn btn-primary" style="width:100%">添加习惯</button>' +
      "    </div>" +
      "  </form>" +
      "</div>" +

      '<div class="panel">' +
      '  <div class="panel-head">' +
      "    <h2>近 " + SPAN + " 天</h2>" +
      '    <span class="hint">点击方格补打卡</span>' +
      "  </div>" +
      (habits.length
        ? habits.map(function (h) { return habitBlock(h, ds); }).join("")
        : '<div class="empty">还没有习惯，先加一个想坚持的事</div>') +
      "</div>";

    bind(root);
  }

  function bind(root) {
    root.querySelector("#habit-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = root.querySelector("#h-name");
      var name = input.value.trim();
      if (!name) {
        UI.toast("先给习惯起个名字");
        input.focus();
        return;
      }
      S.commit(function (st) {
        st.habits.push({ id: S.uid(), name: name, checks: {} });
      });
      UI.toast("已添加");
    });

    var blocks = root.querySelectorAll(".habit");
    Array.prototype.forEach.call(blocks, function (block) {
      var id = block.getAttribute("data-id");

      block.querySelector(".habit-grid").addEventListener("click", function (e) {
        var day = e.target.closest(".habit-day");
        if (!day) return;
        var d = day.getAttribute("data-date");
        if (d > S.iso()) {
          UI.toast("未来的日子还不能打卡");
          return;
        }
        S.commit(function (st) {
          st.habits.forEach(function (h) {
            if (h.id !== id) return;
            if (h.checks[d]) delete h.checks[d];
            else h.checks[d] = true;
          });
        });
      });

      block.querySelector('[data-act="del"]').addEventListener("click", function () {
        if (!window.confirm("删除这个习惯及其全部打卡记录？")) return;
        S.commit(function (st) {
          st.habits = st.habits.filter(function (h) { return h.id !== id; });
        });
        UI.toast("已删除");
      });
    });
  }

  window.SaturnViews = window.SaturnViews || {};
  window.SaturnViews.habits = {
    title: "习惯打卡",
    desc: "每天点一下方格就算坚持了。看连续天数，比看计划更诚实。",
    render: render,
  };
})();
