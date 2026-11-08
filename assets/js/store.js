/* 土星计划 · 数据层（localStorage） */
(function () {
  "use strict";

  var KEY = "saturn-plan:state:v1";

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function iso(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function shiftDays(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return iso(d);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function onDays(list) {
    var o = {};
    list.forEach(function (n) { o[shiftDays(n)] = true; });
    return o;
  }

  function seed() {
    var t = Date.now();
    var tasks = [
      { id: uid(), title: "整理本周复盘要点，输出一页总结", priority: "high", due: iso(), done: false, createdAt: t },
      { id: uid(), title: "把待办清单从备忘录迁到这个工作台", priority: "normal", due: iso(), done: false, createdAt: t },
      { id: uid(), title: "预约下周体检", priority: "low", due: shiftDays(3), done: false, createdAt: t },
      { id: uid(), title: "读完《长日将尽》第三章", priority: "normal", due: shiftDays(-1), done: true, createdAt: t },
    ];

    var notes = [
      {
        id: uid(),
        title: "工作台使用说明",
        body:
          "1. 所有数据只存在这台设备的浏览器里，键名 saturn-plan:state:v1。\n" +
          "2. 换设备、清浏览器缓存都会丢数据，重要内容请定期在「笔记」里备份文本。\n" +
          "3. 首次打开带了几条示例数据，可以在侧栏底部一键清空，从零开始。\n" +
          "4. 没有登录、没有云同步，所以也不需要联网就能用。",
        tags: ["说明"],
        pinned: true,
        updatedAt: t,
      },
      {
        id: uid(),
        title: "本周三件事",
        body: "一是把季度数据的口径跟财务对齐；二是把首页改版方案定稿；三是约老同学吃饭。",
        tags: ["本周"],
        pinned: false,
        updatedAt: t - 86400000,
      },
    ];

    var entries = [
      { id: uid(), type: "expense", amount: 28, category: "餐饮", date: iso(), note: "早餐" },
      { id: uid(), type: "expense", amount: 46, category: "餐饮", date: iso(), note: "午饭" },
      { id: uid(), type: "expense", amount: 12, category: "交通", date: shiftDays(-1), note: "地铁" },
      { id: uid(), type: "expense", amount: 320, category: "购物", date: shiftDays(-2), note: "日用品" },
      { id: uid(), type: "expense", amount: 1800, category: "居住", date: shiftDays(-4), note: "房租分摊" },
      { id: uid(), type: "expense", amount: 88, category: "娱乐", date: shiftDays(-5), note: "电影与零食" },
      { id: uid(), type: "income", amount: 1200, category: "副业", date: shiftDays(-6), note: "稿费" },
    ];

    var habits = [
      { id: uid(), name: "早起 7:00", checks: onDays([-6, -5, -4, -2, -1, 0]) },
      { id: uid(), name: "运动 30 分钟", checks: onDays([-5, -3, -1]) },
      { id: uid(), name: "阅读 20 页", checks: onDays([-4, -3, -2, -1, 0]) },
    ];

    return { version: 1, tasks: tasks, notes: notes, entries: entries, habits: habits };
  }

  function normalize(s) {
    s = s || {};
    return {
      version: 1,
      tasks: Array.isArray(s.tasks) ? s.tasks : [],
      notes: Array.isArray(s.notes) ? s.notes : [],
      entries: Array.isArray(s.entries) ? s.entries : [],
      habits: Array.isArray(s.habits) ? s.habits : [],
    };
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        var s = seed();
        localStorage.setItem(KEY, JSON.stringify(s));
        return s;
      }
      return normalize(JSON.parse(raw));
    } catch (e) {
      return seed();
    }
  }

  var listeners = [];
  var state = null;

  function get() {
    if (!state) state = read();
    return state;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* 存储额度用尽或隐私模式，会话内内存仍可用 */
    }
    listeners.forEach(function (fn) {
      try {
        fn(state);
      } catch (e) {
        /* 单个订阅者异常不影响其它视图 */
      }
    });
  }

  function commit(fn) {
    get();
    if (typeof fn === "function") fn(state);
    persist();
  }

  function subscribe(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  function reset() {
    state = seed();
    persist();
  }

  function clearAll() {
    state = { version: 1, tasks: [], notes: [], entries: [], habits: [] };
    persist();
  }

  window.SaturnStore = {
    KEY: KEY,
    uid: uid,
    iso: iso,
    shiftDays: shiftDays,
    get: get,
    commit: commit,
    subscribe: subscribe,
    reset: reset,
    clearAll: clearAll,
  };
})();
