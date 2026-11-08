/* 土星计划 · 模块：记账 */
(function () {
  "use strict";

  var UI = window.SaturnUI;
  var S = window.SaturnStore;

  var EXPENSE_CATS = ["餐饮", "交通", "购物", "居住", "娱乐", "医疗", "学习", "其他"];
  var INCOME_CATS = ["工资", "副业", "理财", "其他"];
  var CAT_COLOR = {
    餐饮: "#e7a445",
    交通: "#8195ad",
    购物: "#b47a2c",
    居住: "#74a98b",
    娱乐: "#c76b50",
    医疗: "#a586b3",
    学习: "#6f9fa8",
    其他: "#8b7f73",
    工资: "#74a98b",
    副业: "#8fb27a",
    理财: "#8195ad",
  };

  var month = UI.monthKey();
  var type = "expense";
  var chart = null;

  function months() {
    var set = {};
    S.get().entries.forEach(function (e) {
      if (e.date) set[String(e.date).slice(0, 7)] = true;
    });
    set[UI.monthKey()] = true;
    return Object.keys(set).sort().reverse();
  }

  function rows() {
    return S.get()
      .entries.filter(function (e) { return String(e.date || "").slice(0, 7) === month; })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return (b.id || "").localeCompare(a.id || "");
      });
  }

  function totals(list) {
    var income = 0;
    var expense = 0;
    list.forEach(function (e) {
      if (e.type === "income") income += Number(e.amount) || 0;
      else expense += Number(e.amount) || 0;
    });
    return { income: income, expense: expense, balance: income - expense };
  }

  function byCategory(list) {
    var map = {};
    list.forEach(function (e) {
      if (e.type !== "expense") return;
      var k = e.category || "其他";
      map[k] = (map[k] || 0) + (Number(e.amount) || 0);
    });
    return Object.keys(map)
      .map(function (k) { return { name: k, value: Math.round(map[k] * 100) / 100 }; })
      .sort(function (a, b) { return b.value - a.value; });
  }

  function monthLabel(m) {
    var p = m.split("-");
    return p[0] + " 年 " + Number(p[1]) + " 月";
  }

  function catOptions(t) {
    var cats = t === "income" ? INCOME_CATS : EXPENSE_CATS;
    return cats.map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("");
  }

  function catFallback(cats) {
    var total = cats.reduce(function (s, c) { return s + c.value; }, 0) || 1;
    return (
      '<div style="padding:4px 0">' +
      cats
        .map(function (c) {
          var pct = Math.round((c.value / total) * 100);
          return (
            '<div style="margin-bottom:10px">' +
            '<div style="display:flex;justify-content:space-between;font-size:13px;color:#c9bfb2;margin-bottom:4px">' +
            "<span>" + UI.esc(c.name) + "</span><span>" + UI.money(c.value) + " 元 · " + pct + "%</span></div>" +
            '<div class="bar"><span style="width:' + pct + '%;background:' + (CAT_COLOR[c.name] || "#8b7f73") + '"></span></div>' +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function drawChart(cats) {
    var el = document.getElementById("m-chart");
    if (!el) return;

    if (!window.echarts) {
      el.innerHTML = catFallback(cats);
      return;
    }
    if (chart) {
      chart.dispose();
      chart = null;
    }
    if (!cats.length) {
      el.innerHTML = '<div class="empty">本月没有支出，饼图留白</div>';
      return;
    }

    chart = window.echarts.init(el, null, { renderer: "canvas" });
    var total = cats.reduce(function (s, c) { return s + c.value; }, 0);
    chart.setOption({
      backgroundColor: "transparent",
      color: cats.map(function (c) { return CAT_COLOR[c.name] || "#8b7f73"; }),
      tooltip: {
        trigger: "item",
        backgroundColor: "#2a2520",
        borderColor: "#3b332c",
        textStyle: { color: "#ede7de", fontSize: 12 },
        formatter: function (p) {
          return p.name + "<br/>" + UI.money(p.value) + " 元 · " + p.percent + "%";
        },
      },
      legend: {
        orient: "vertical",
        right: 0,
        top: "middle",
        itemGap: 10,
        itemWidth: 9,
        itemHeight: 9,
        textStyle: { color: "#c9bfb2", fontSize: 12 },
        formatter: function (name) {
          var item = cats.filter(function (c) { return c.name === name; })[0];
          return name + "  " + (item ? UI.money(item.value) : "");
        },
      },
      series: [
        {
          type: "pie",
          radius: ["52%", "78%"],
          center: ["34%", "52%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#1d1916", borderWidth: 2 },
          label: { show: false },
          emphasis: { scale: true, scaleSize: 6 },
          data: cats,
        },
      ],
      graphic: [
        {
          type: "text",
          left: "27%",
          top: "43%",
          style: { text: "本月支出", fill: "#93857a", fontSize: 12 },
        },
        {
          type: "text",
          left: "27%",
          top: "49%",
          style: { text: UI.money(total), fill: "#ede7de", fontSize: 18, fontWeight: "500" },
        },
      ],
    });
  }

  function render(root) {
    var list = rows();
    var t = totals(list);
    var cats = byCategory(list);
    var ms = months();

    root.innerHTML =
      '<div class="panel">' +
      '  <div class="panel-head">' +
      "    <h2>记一笔</h2>" +
      '    <span class="hint">按自然月统计</span>' +
      "  </div>" +
      '  <form id="money-form" class="stack">' +
      '    <div class="form-row form-row-2">' +
      '      <div class="field">' +
      '        <label class="field-label" for="m-type">类型</label>' +
      '        <select id="m-type">' +
      '          <option value="expense"' + (type === "expense" ? " selected" : "") + ">支出</option>" +
      '          <option value="income"' + (type === "income" ? " selected" : "") + ">收入</option>" +
      "        </select>" +
      "      </div>" +
      '      <div class="field">' +
      '        <label class="field-label" for="m-amount">金额（元）</label>' +
      '        <input id="m-amount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00">' +
      "      </div>" +
      "    </div>" +
      '    <div class="form-row form-row-2">' +
      '      <div class="field">' +
      '        <label class="field-label" for="m-cat">分类</label>' +
      '        <select id="m-cat">' + catOptions(type) + "</select>" +
      "      </div>" +
      '      <div class="field">' +
      '        <label class="field-label" for="m-date">日期</label>' +
      '        <input id="m-date" type="date" value="' + S.iso() + '">' +
      "      </div>" +
      "    </div>" +
      '    <div class="form-row">' +
      '      <div class="field">' +
      '        <label class="field-label" for="m-note">备注（可选）</label>' +
      '        <input id="m-note" type="text" maxlength="40" placeholder="午饭、地铁、房租…" autocomplete="off">' +
      "      </div>" +
      "    </div>" +
      '    <div class="quick" style="margin-top:0">' +
      '      <button type="submit" class="btn btn-primary">记下</button>' +
      "    </div>" +
      "  </form>" +
      "</div>" +

      '<div class="panel">' +
      '  <div class="panel-head">' +
      "    <h2>" + UI.esc(monthLabel(month)) + "</h2>" +
      '    <select id="m-month" style="width:auto;min-height:36px;font-size:14px">' +
      ms.map(function (m) {
        return '<option value="' + m + '"' + (m === month ? " selected" : "") + ">" + m.replace("-", " / ") + "</option>";
      }).join("") +
      "    </select>" +
      "  </div>" +
      '  <div class="money-summary">' +
      '    <div class="stat">' +
      '      <div class="stat-label">支出</div>' +
      '      <div class="stat-value money-num" style="color:#e08a70">' + UI.money(t.expense) + '<span class="stat-unit">元</span></div>' +
      "    </div>" +
      '    <div class="stat">' +
      '      <div class="stat-label">收入</div>' +
      '      <div class="stat-value money-num" style="color:var(--good)">' + UI.money(t.income) + '<span class="stat-unit">元</span></div>' +
      "    </div>" +
      '    <div class="stat">' +
      '      <div class="stat-label">结余</div>' +
      '      <div class="stat-value money-num">' + UI.money(t.balance) + '<span class="stat-unit">元</span></div>' +
      "    </div>" +
      "  </div>" +
      '  <div id="m-chart" class="chart" style="margin-top:14px"></div>' +
      "</div>" +

      '<div class="panel">' +
      '  <div class="panel-head">' +
      "    <h2>明细</h2>" +
      '    <span class="hint">' + list.length + " 笔</span>" +
      "  </div>" +
      (list.length
        ? '<div style="overflow-x:auto"><table class="entry-table">' +
          "<colgroup><col><col><col><col><col></colgroup>" +
          '<thead><tr><th>日期</th><th>分类</th><th>备注</th><th style="text-align:right">金额</th><th></th></tr></thead>' +
          "<tbody>" +
          list.map(function (e) {
            return (
              "<tr>" +
              "<td>" + UI.fmtDate(e.date) + "</td>" +
              "<td>" + UI.esc(e.category || "其他") + "</td>" +
              '<td title="' + UI.esc(e.note || "") + '">' + UI.esc(e.note || "—") + "</td>" +
              '<td class="amount ' + (e.type === "income" ? "income" : "expense") + '">' +
              (e.type === "income" ? "+" : "−") + UI.money(e.amount) + "</td>" +
              '<td><button type="button" class="row-del" data-id="' + e.id + '" aria-label="删除">×</button></td>' +
              "</tr>"
            );
          }).join("") +
          "</tbody></table></div>"
        : '<div class="empty">这个月还没有记录</div>') +
      "</div>";

    bind(root);
    drawChart(cats);
  }

  function bind(root) {
    root.querySelector("#m-type").addEventListener("change", function (e) {
      type = e.target.value;
      root.querySelector("#m-cat").innerHTML = catOptions(type);
    });

    root.querySelector("#money-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var amount = Number(root.querySelector("#m-amount").value);
      if (!amount || amount <= 0) {
        UI.toast("金额要大于 0");
        root.querySelector("#m-amount").focus();
        return;
      }
      var t = root.querySelector("#m-type").value;
      var cat = root.querySelector("#m-cat").value;
      var date = root.querySelector("#m-date").value || S.iso();
      var note = root.querySelector("#m-note").value.trim();

      month = String(date).slice(0, 7);
      type = t;

      S.commit(function (st) {
        st.entries.push({
          id: S.uid(),
          type: t,
          amount: Math.round(amount * 100) / 100,
          category: cat,
          date: date,
          note: note,
        });
      });
      UI.toast("已记下 " + UI.money(amount) + " 元");
    });

    root.querySelector("#m-month").addEventListener("change", function (e) {
      month = e.target.value;
      render(root);
    });

    var table = root.querySelector(".entry-table");
    if (table) {
      table.addEventListener("click", function (e) {
        var b = e.target.closest(".row-del");
        if (!b) return;
        var id = b.getAttribute("data-id");
        S.commit(function (st) {
          st.entries = st.entries.filter(function (x) { return x.id !== id; });
        });
        UI.toast("已删除");
      });
    }
  }

  window.addEventListener("resize", function () {
    if (chart && !chart.isDisposed()) chart.resize();
  });

  window.SaturnViews = window.SaturnViews || {};
  window.SaturnViews.money = {
    title: "记账",
    desc: "记下每一笔进出，按月看支出结构和结余。数据只在本机，不联任何银行账户。",
    render: render,
  };
})();
