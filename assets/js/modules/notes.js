/* 土星计划 · 模块：笔记 */
(function () {
  "use strict";

  var UI = window.SaturnUI;
  var S = window.SaturnStore;
  var editingId = null;
  var query = "";

  function listNotes() {
    var notes = S.get().notes.slice();
    var q = query.trim().toLowerCase();
    if (q) {
      notes = notes.filter(function (n) {
        return (
          String(n.title || "").toLowerCase().indexOf(q) >= 0 ||
          String(n.body || "").toLowerCase().indexOf(q) >= 0 ||
          (n.tags || []).join(" ").toLowerCase().indexOf(q) >= 0
        );
      });
    }
    return notes.sort(function (a, b) {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }

  function findNote(id) {
    var notes = S.get().notes;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].id === id) return notes[i];
    }
    return null;
  }

  function noteCard(n) {
    var excerpt = String(n.body || "").replace(/\s+\n/g, "\n").slice(0, 180);
    return (
      '<article class="note-card ' + (n.pinned ? "is-pinned" : "") + '" data-id="' + n.id + '">' +
      "<h4>" + (n.pinned ? "◎ " : "") + UI.esc(n.title || "无标题") + "</h4>" +
      '<p class="note-excerpt">' + UI.esc(excerpt || "（空白笔记）") + "</p>" +
      '<div class="note-foot">' +
      (n.tags || []).map(function (t) { return '<span class="chip">' + UI.esc(t) + "</span>"; }).join("") +
      '<span style="margin-left:auto">' + UI.relTime(n.updatedAt) + "</span>" +
      "</div>" +
      "</article>"
    );
  }

  function render(root, focusNew) {
    var note = editingId ? findNote(editingId) : null;
    var notes = listNotes();
    var total = S.get().notes.length;

    root.innerHTML =
      '<div class="panel">' +
      '  <div class="panel-head">' +
      '    <h2>' + (note ? "编辑笔记" : "新建笔记") + "</h2>" +
      '    <span class="hint">共 ' + total + " 条</span>" +
      "  </div>" +
      '  <form id="note-form" class="stack">' +
      '    <div class="form-row">' +
      '      <div class="field">' +
      '        <label class="field-label" for="note-title">标题</label>' +
      '        <input id="note-title" type="text" maxlength="80" placeholder="一句话概括这条笔记" autocomplete="off" value="' +
      (note ? UI.esc(note.title) : "") + '">' +
      "      </div>" +
      "    </div>" +
      '    <div class="form-row">' +
      '      <div class="field">' +
      '        <label class="field-label" for="note-body">正文</label>' +
      '        <textarea id="note-body" placeholder="想到什么写什么，不会自动同步到云端">' +
      (note ? UI.esc(note.body) : "") + "</textarea>" +
      "      </div>" +
      "    </div>" +
      '    <div class="form-row form-row-2">' +
      '      <div class="field">' +
      '        <label class="field-label" for="note-tags">标签（逗号分隔）</label>' +
      '        <input id="note-tags" type="text" maxlength="60" placeholder="工作, 想法" autocomplete="off" value="' +
      (note ? UI.esc((note.tags || []).join(", ")) : "") + '">' +
      "      </div>" +
      '      <div class="field">' +
      '        <label class="field-label" for="note-pin">置顶</label>' +
      '        <select id="note-pin">' +
      '          <option value="0"' + (note && note.pinned ? "" : " selected") + ">不置顶</option>" +
      '          <option value="1"' + (note && note.pinned ? " selected" : "") + ">置顶显示</option>" +
      "        </select>" +
      "      </div>" +
      "    </div>" +
      '    <div class="quick" style="margin-top:0">' +
      '      <button type="submit" class="btn btn-primary">' + (note ? "保存修改" : "保存笔记") + "</button>" +
      (note ? '      <button type="button" class="btn" id="note-cancel">放弃编辑</button>' : "") +
      (note ? '      <button type="button" class="btn btn-danger" id="note-del">删除这条</button>' : "") +
      "    </div>" +
      "  </form>" +
      "</div>" +

      '<div class="panel">' +
      '  <div class="panel-head">' +
      "    <h2>笔记库</h2>" +
      '    <span class="hint">' + notes.length + " / " + total + "</span>" +
      "  </div>" +
      '  <div class="form-row" style="margin-bottom:12px">' +
      '    <input id="note-search" type="search" placeholder="搜索标题、正文或标签" value="' + UI.esc(query) + '">' +
      "  </div>" +
      (notes.length
        ? '<div class="note-grid">' + notes.map(noteCard).join("") + "</div>"
        : '<div class="empty">' + (total ? "没有匹配的笔记" : "还没有笔记，写一条试试") + "</div>") +
      "</div>";

    bind(root);
    if (focusNew) {
      var t = root.querySelector("#note-title");
      if (t) t.focus();
    }
  }

  function bind(root) {
    var form = root.querySelector("#note-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = root.querySelector("#note-title").value.trim();
      var body = root.querySelector("#note-body").value;
      var tags = root
        .querySelector("#note-tags")
        .value.split(/[,，]/)
        .map(function (s) { return s.trim(); })
        .filter(Boolean)
        .slice(0, 5);
      var pinned = root.querySelector("#note-pin").value === "1";

      if (!title && !body.trim()) {
        UI.toast("标题和正文至少写一样");
        return;
      }

      var wasEditing = editingId;
      editingId = null;
      S.commit(function (st) {
        if (wasEditing) {
          st.notes.forEach(function (n) {
            if (n.id === wasEditing) {
              n.title = title || "无标题";
              n.body = body;
              n.tags = tags;
              n.pinned = pinned;
              n.updatedAt = Date.now();
            }
          });
        } else {
          st.notes.push({
            id: S.uid(),
            title: title || "无标题",
            body: body,
            tags: tags,
            pinned: pinned,
            updatedAt: Date.now(),
          });
        }
      });
      UI.toast("已保存");
    });

    var cancel = root.querySelector("#note-cancel");
    if (cancel) {
      cancel.addEventListener("click", function () {
        editingId = null;
        render(root);
        UI.toast("已放弃修改");
      });
    }

    var del = root.querySelector("#note-del");
    if (del) {
      del.addEventListener("click", function () {
        if (!editingId) return;
        if (!window.confirm("删除后无法恢复，确定删除这条笔记？")) return;
        var id = editingId;
        editingId = null;
        S.commit(function (st) {
          st.notes = st.notes.filter(function (n) { return n.id !== id; });
        });
        UI.toast("已删除");
      });
    }

    root.querySelector("#note-search").addEventListener("input", function (e) {
      query = e.target.value;
      var caret = e.target.selectionStart;
      render(root);
      var box = root.querySelector("#note-search");
      if (box) {
        box.focus();
        try { box.setSelectionRange(caret, caret); } catch (err) {}
      }
    });

    var grid = root.querySelector(".note-grid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var card = e.target.closest(".note-card");
        if (!card) return;
        editingId = card.getAttribute("data-id");
        render(root);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  window.SaturnViews = window.SaturnViews || {};
  window.SaturnViews.notes = {
    title: "笔记",
    desc: "随手记下想法、会议要点和临时资料。支持搜索和标签，全部保存在本地。",
    render: function (root) { render(root, false); },
    resetEditing: function () { editingId = null; },
  };
})();
