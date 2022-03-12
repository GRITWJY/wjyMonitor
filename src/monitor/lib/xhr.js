import tracker from "../utils/tracker";

export function injectXHR() {
  let XMLHttpRequest = window.XMLHttpRequest;
  let oldOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async) {
  	// 判断
	  if (!url.match(/logstores/)) {
		  this.logData = { method, url, async };
	  }
    return oldOpen.apply(this, arguments);
  };
  let oldSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    if (this.logData) {
      let startTime = Date.now(); // 发送前记录开始时间
      let handler = (type) => (event) => {
        let duration = Date.now() - startTime;
        let status = this.status;
        let statusText = this.statusText;
        tracker.send({
          kind: "stability",
          type: "xhr",
          eventType: type, // Load,error,abort
          pathname: this.logData.url, // 请求路径
          status: status + "-" + statusText, // 状态码
	        method:this.logData.method,
          duration,
          response: this.response ? JSON.stringify(this.response) : "", // 响应体
          params: body || "", // 参数
        });
      };
      this.addEventListener("load", handler("load"), false);
      this.addEventListener("error", handler("error"), false);
      this.addEventListener("abort", handler("abort"), false);
    }
    return oldSend.apply(this, arguments);
  };
}
