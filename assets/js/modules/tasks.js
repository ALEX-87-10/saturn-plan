/* 土星计划 · 模块：待办 */
(function () {
  "use strict";

  var UI = window.SaturnUI;
  var S = window.SaturnStore;
  var filter = "open";
  var prioLabel = { high: "高", normal: "中", low: "低" };

  function sorted(list) {
    var rank = { high: 0, normal: 1, low: 2 };
    return list.slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      var d = (rank[a.priority] || 1) - (rank[b.priority] || 1);
      if (d !== 0) return d;
      if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
      if (a.due && !b.due) return -1;
      if (!a.due && b.due) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  function visible() {
    var all = S.get().tasks;
    if (filter === "open") return all.filter(function (t) { return !t.done; });
    if (filter === "done") return all.filter(function (t) { return t.done; });
    return all;
  }

  function taskList(list) {
    return (
      '<div class="task-list">' +
      list.map(function (t) {
        var overdue = t.due && !t.done && t.due < S.iso();
        return (
          '<div class="task ' + (t.done ? "is-done" : "") + '" data-id="' + t.id + '">' +
          '<button type="button" class="task-check ' + (t.done ? "is-on" : "") + '" data-act="toggle" aria-label="' +
          (t.done ? "标记为未完成" : "标记为完成") + '">' + UI.icons.check + "</button>" +
          '<div class="task-body">' +
          '<div class="task-title">' + UI.esc(t.title) + "</div>" +
          '<div class="task-meta">' +
          '<i class="dot prio-' + (t.priority || "normal") + '" aria-hidden="true"></i>' +
          "<span>" + (prioLabel[t.priority] || "中") + "优先级</span>" +
          (t.due
            ? '<span class="chip ' + (overdue ? "chip-bad" : "") + '">' +
              (overdue ? "已逾期 " : "截止 ") + UI.fmtDate(t.due) + "</span>"
            : "") +
          (t.done ? '<span class="chip chip-good">已完成</span>' : "") +
          "</div>" +
          "</div>" +
          '<button type="button" class="task-del" data-act="del" aria-label="删除">×</button>' +
          "</div>"
        );
      }).join("") +
      "</div>"
    );
  }

  function render(root) {
    var all = S.get().tasks;
    var open = all.filter(function (t) { return !t.done; }).length;
    var done = all.length - open;
    var pct = all.length ? Math.round((done / all.length) * 100) : 0;
    var list = sorted(visible());

    root.innerHTML =
      '<div class="panel">' +
      '  <div class="panel-head">' +
      "    <h2>新增待办</h2>" +
      '    <span class="hint">' + open + " 项未完成 · " + done + " 项已完成</span>" +
      "  </div>" +
      '  <form id="task-form" class="stack">' +
      '    <div class="form-row">' +
      '      <div class="field">' +
      '        <label class="field-label" for="task-title">要做的事</label>' +
      '        <input id="task-title" type="text" maxlength="120" placeholder="例如：把季度数据口径跟财务对齐" autocomplete="off">' +
      "      </div>" +
      "    </div>" +
      '    <div class="form-row form-row-2">' +
      '      <div class="field">' +
      '        <label class="field-label" for="task-prio">优先级</label>' +
      '        <select id="task-prio">' +
      '          <option value="normal">中</option>' +
      '          <option value="high">高</option>' +
      '          <option value="low">低</option>' +
      "        </select>" +
      "      </div>" +
      '      <div class="field">' +
      '        <label class="field-label" for="task-due">截止日期</label>' +
      '        <input id="task-due" type="date" value="' + S.iso() + '">' +
      "      </div>" +
      "    </div>" +
      '    <div class="quick" style="margin-top:0">' +
      '      <button type="submit" class="btn btn-primary">添加待办</button>' +
      '      <button type="button" class="btn btn-ghost" id="task-clear-due">改为不限日期</button>' +
      "    </div>" +
      "  </form>" +
      "</div>" +

      '<div class="panel">' +
      '  <div class="panel-head">' +
      "    <h2>清单</h2>" +
      '    <div class="seg" id="task-seg">' +
      '      <button type="button" data-filter="open" class="' + (filter === "open" ? "is-active" : "") + '">未完成</button>' +
      '      <button type="button" data-filter="done" class="' + (filter === "done" ? "is-active" : "") + '">已完成</button>' +
      '      <button type="button" data-filter="all" class="' + (filter === "all" ? "is-active" : "") + '">全部</button>' +
      "    </div>" +
      "  </div>" +
      '  <div class="bar" style="margin-bottom:12px"><span style="width:' + pct + '%"></span></div>' +
      (list.length ? taskList(list) : '<div class="empty">' + (all.length ? "这个筛选下没有待办" : "还没有待办，先添加一条") + "</div>") +
      "</div>";

    bind(root);
  }

  function bind(root) {
    var form = root.querySelector("#task-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var title = root.querySelector("#task-title").value.trim();
        if (!title) {
          UI.toast("先写一句要做的事");
          root.querySelector("#task-title").focus();
          return;
        }
        var prio = root.querySelector("#task-prio").value;
        var due = root.querySelector("#task-due").value;
        S.commit(function (st) {
          st.tasks.push({ id: S.uid(), title: title, priority: prio, due: due, done: false, createdAt: Date.now() });
        });
        UI.toast("已添加");
      });
    }

    var clearDue = root.querySelector("#task-clear-due");
    if (clearDue) {
      clearDue.addEventListener("click", function () {
        root.querySelector("#task-due").value = "";
        UI.toast("设为不限日期");
      });
    }

    var seg = root.querySelector("#task-seg");
    if (seg) {
      seg.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-filter]");
        if (!b) return;
        filter = b.getAttribute("data-filter");
        render(root);
      });
    }

    var list = root.querySelector(".task-list");
    if (list) {
      list.addEventListener("click", function (e) {
        var el = e.target.closest("[data-act]");
        if (!el) return;
        var row = e.target.closest(".task");
        if (!row) return;
        var id = row.getAttribute("data-id");
        var act = el.getAttribute("data-act");
        if (act === "toggle") {
          S.commit(function (st) {
            st.tasks.forEach(function (t) { if (t.id === id) t.done = !t.done; });
          });
          UI.toast("已更新");
        } else if (act === "del") {
          S.commit(function (st) {
            st.tasks = st.tasks.filter(function (t) { return t.id !== id; });
          });
          UI.toast("已删除");
        }
      });
    }
  }

  window.SaturnViews = window.SaturnViews || {};
  window.SaturnViews.tasks = {
    title: "待办清单",
    desc: "先写下要做的事，再按优先级和截止日期排序。勾掉一条就少一件挂着的事。",
    render: render,
  };
})();
