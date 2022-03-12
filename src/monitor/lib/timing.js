import tracker from "../utils/tracker";
import onload from "../utils/onload";
import getLastEvent from "../utils/getLastEvent";
import getSelector from "../utils/getSelector";

export function timing() {
  let FMP, LCP;
  // 增加一个性能条目的观察者
  new PerformanceObserver((entries, observer) => {
    let perfEntries = entries.getEntries();
    FMP = perfEntries[0];
    observer.disconnect();
  }).observe({ entryTypes: ["element"] }); // 观察页面中有意义的元素

  new PerformanceObserver((entries, observer) => {
    let perfEntries = entries.getEntries();
    LCP = perfEntries[0];
    observer.disconnect();
  }).observe({ entryTypes: ["largest-contentful-paint"] });

  // FID
  new PerformanceObserver((entries, observer) => {
    let firstInput = entries.getEntries()[0];
    let lastEvent = getLastEvent();
    if (firstInput) {
      // processingStart开始处理的时间， startTime开始点击的时间，差值就是处理的延迟
      let inputDelay = firstInput.processingStart - firstInput.startTime;
      let duration = firstInput.duration; // 处理耗时
      if (inputDelay > 0 || duration > 0) {
        tracker.send({
          kind: "experience", // 用户体验指标，
          type: "firstInputDelay", // 统计每个阶段的时间
          inputDelay, // 延时的时间
          duration, // 处理的时间
          startTime: firstInput.startTime,
          selector: lastEvent
            ? getSelector(lastEvent.path || lastEvent.target)
            : "",
        });
      }
    }
    observer.disconnect();
  }).observe({ type: "first-input", buffered: true }); //用户的第一次交互，点击页面。。。

  onload(function () {
    setTimeout(() => {
      const {
        unloadEventStart, // 表征了unload (en-US)事件抛出时的UNIX时间戳
        unloadEventEnd, //表征了unload (en-US)事件处理完成时的UNIX时间戳

        redirectStart, // 表征了第一个HTTP重定向开始时的UNIX时间戳
        redirectEnd, // 表征了最后一个HTTP重定向完成时（也就是说是HTTP响应的最后一个比特直接被收到的时间）的UNIX时间

        fetchStart, // 浏览器准备好使用HTTP请求来获取

        domainLookupStart, // 表征了域名查询开始的UNIX时间戳
        domainLookupEnd, // 表征了域名查询结束的UNIX时间戳

        connectStart, // HTTP请求开始向服务器发送时的Unix毫秒时间
        connectEnd, // 返回浏览器与服务器之间的连接建立时的Unix毫秒时间戳.连接建立指的是所有握手和认证过程全部结束。

        secureConnectionStart, //  浏览器与服务器开始安全链接的握手时的Unix毫秒时间戳

        requestStart, // 浏览器向服务器发出HTTP请求时

        responseStart, // 浏览器从服务器收到（或从本地缓存读取）第一个字节时的Unix毫秒时间戳
        responseEnd, // 浏览器从服务器收到（或从本地缓存读取，或从本地资源读取）最后一个字节时

        domLoading, // 当前网页DOM结构开始解析时,即Document.readyState属性变为“loading”、相应的 readystatechange (en-US)事件触发时
        domInteractive, // 当前网页DOM结构结束解析、开始加载内嵌资源时（即Document.readyState属性变为“interactive”、相应的readystatechange (en-US)事件触发时
        domContentLoadedEventStart, //所有需要被执行的脚本已经被解析时
        domContentLoadedEventEnd, //当所有需要立即执行的脚本已经被执行（不论执行顺序）
        domComplete, // 返回当前文档解析完成
        loadEventStart, //该文档下，load (en-US)事件被发送时的Unix毫秒时间戳
        loadEventEnd, // 即加载事件完成时的Unix毫秒时间戳
      } = performance.timing;

      tracker.send({
        kind: "experience", // 用户体验指标，
        type: "timing", // 统计每个阶段的时间
        ttfb: responseStart - requestStart, // 首个字节到达,发出页面请求到接受应答的首个字节
        responseTime: responseEnd - responseStart, // 响应读取时间
        parseDomTime: loadEventStart - domLoading, // dom解析时间，js阻塞等等
        domcontentloadedtme:
          domContentLoadedEventEnd - domContentLoadedEventStart, //等待样式表、图像、子框架加载完成
        resources: domComplete - domContentLoadedEventEnd, // 资源加载耗时，可观察文档流是否过大
        timeToInteractive: domInteractive - fetchStart, // 首次可交互时间
        loadTime: loadEventStart - fetchStart, // 完成的加载时间
      });

      // 开始发送性能指标

      let FP = performance.getEntriesByName("first-paint")[0];
      let FCP = performance.getEntriesByName("first-contentful-paint")[0];

      tracker.send({
        kind: "experience", // 用户体验指标，
        type: "paint", // 统计每个阶段的时间
        FP: FP ? FP.startTime : "",
        FCP: FCP ? FCP.startTime : "",
        FMP: FMP ? FMP.startTime : "",
        LCP: LCP ? LCP.startTime : "",
      });
    }, 3000);
  });
}
