/* 土星计划 · 应用外壳：路由、导航、全局动作 */
(function () {
  "use strict";

  var UI = window.SaturnUI;
  var S = window.SaturnStore;

  var ROUTES = ["overview", "tasks", "notes", "money", "habits"];
  var DEFAULT_ROUTE = "overview";
  var current = DEFAULT_ROUTE;
  var root = null;

  function routeFromHash() {
    var h = String(location.hash || "").replace(/^#\/?/, "").trim();
    return ROUTES.indexOf(h) >= 0 ? h : DEFAULT_ROUTE;
  }

  function markNav() {
    var items = document.querySelectorAll(".nav-item");
    Array.prototype.forEach.call(items, function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-route") === current);
    });
  }

  function render() {
    var view = window.SaturnViews[current];
    if (!view) return;
    root.innerHTML = "";

    var header = document.createElement("div");
    header.className = "page-head";
    header.innerHTML =
      '<div class="topbar">' +
      '<div><h1 class="page-title">' + UI.esc(view.title) + "</h1>" +
      (view.desc ? '<p class="page-desc">' + UI.esc(view.desc) + "</p>" : "") +
      "</div>" +
      '<div class="topbar-right">今日 ' + UI.fmtDateFull(S.iso()) + " · 星期" + UI.weekday(S.iso()) + "</div>" +
      "</div>";
    root.appendChild(header);

    var mount = document.createElement("div");
    root.appendChild(mount);
    view.render(mount);

    markNav();
  }

  function go(route) {
    if (ROUTES.indexOf(route) < 0) route = DEFAULT_ROUTE;
    if (route === current && location.hash === "#/" + route) {
      render();
      return;
    }
    location.hash = "#/" + route;
  }

  function onHashChange() {
    var next = routeFromHash();
    if (next !== current) {
      if (window.SaturnViews.notes && window.SaturnViews.notes.resetEditing) {
        window.SaturnViews.notes.resetEditing();
      }
      current = next;
      window.scrollTo({ top: 0 });
    }
    render();
  }

  function exportBackup() {
    try {
      var data = JSON.stringify(S.get(), null, 2);
      var blob = new Blob([data], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "saturn-plan-backup-" + S.iso() + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
      UI.toast("已导出 JSON 备份");
    } catch (e) {
      UI.toast("导出失败，可以稍后再试");
    }
  }

  function resetAll() {
    if (!window.confirm("清空后本地数据无法恢复。建议先导出备份，确定继续？")) return;
    if (window.SaturnViews.notes && window.SaturnViews.notes.resetEditing) {
      window.SaturnViews.notes.resetEditing();
    }
    S.clearAll();
    UI.toast("已清空，从一张白纸开始");
  }

  function seedDemo() {
    if (!window.confirm("会用示例数据覆盖当前全部内容，确定继续？")) return;
    if (window.SaturnViews.notes && window.SaturnViews.notes.resetEditing) {
      window.SaturnViews.notes.resetEditing();
    }
    S.reset();
    UI.toast("已载入示例数据");
  }

  function init() {
    root = document.getElementById("view-root");

    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (b) {
      b.addEventListener("click", function () {
        go(b.getAttribute("data-route"));
      });
    });

    var exp = document.getElementById("action-export");
    if (exp) exp.addEventListener("click", exportBackup);

    var res = document.getElementById("action-reset");
    if (res) res.addEventListener("click", resetAll);

    var seedBtn = document.getElementById("action-seed");
    if (seedBtn) seedBtn.addEventListener("click", seedDemo);

    window.addEventListener("hashchange", onHashChange);

    S.subscribe(function () {
      render();
    });

    window.SaturnChartsReady = function () {
      if (current === "money") render();
    };

    current = routeFromHash();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
