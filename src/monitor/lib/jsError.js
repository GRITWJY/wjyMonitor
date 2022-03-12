import getLastEvent from "../utils/getLastEvent";
import getSelector from "../utils/getSelector";
import tracker from "../utils/tracker";

export function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener(
    "error",
    function (event) {
      let lastEvent = getLastEvent(); // 最后一个交互事件
      // 脚本加载错误
      if (event.target && (event.target.src || event.target.href)) {
        tracker.send({
          kind: "stability", // 监控指标的大类，稳定性
          type: "error", // 小类型，这是一个错误
          errorType: "resourceError", // JS资源加载
          filename: event.target.src || event.target.href,
          tagName: event.target.tagName,
          // body div#container div.content input
          selector: getSelector(event.target), // 代表最后一个操作的元素
        });
      } else {
        // 错误事件对象
        tracker.send({
          kind: "stability", // 监控指标的大类，
          type: "error", // 小类型，这是一个错误
          errorType: "jsError", // JS执行错误
          url: "", // 访问那个路径报错了
          message: event.message, // 报错信息
          filename: event.filename,
          position: `${event.lineno}:${event.colno}`,
          stack: getLines(event.error.stack),
          // body div#container div.content input
          selector: lastEvent ? getSelector(lastEvent.path) : "", // 代表最后一个操作的元素
        });
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    function (event)  {
      let lastEvent = getLastEvent();
      let message;
      let filename;
      let line = 0;
      let colnum = 0;
      let stack = "";
      let reason = event.reason;

      if (typeof reason === "string") {
        message = reason;
      } else if (typeof reason === "object") {
        if (reason.stack) {
          let matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/);
          filename = matchResult[1];
          line = matchResult[2];
          colnum = matchResult[3];
        }
        message = reason.message;
        stack = getLines(reason.stack);
      }
      tracker.send({
        kind: "stability", // 监控指标的大类，
        type: "error", // 小类型，这是一个错误
        errorType: "promiseError", // JS执行错误
        message, // 报错信息
        filename,
        position: `${line}:${colnum}`,
        stack,
        // body div#container div.content input
        selector: lastEvent ? getSelector(lastEvent.path) : "", // 代表最后一个操作的元素
      });
    },
    true
  );

  function getLines(stack) {
    return stack
      .split("\n")
      .slice(1)
      .map((item) => item.replace(/^\s+at\s+/g, ""))
      .join("^");
  }
}
