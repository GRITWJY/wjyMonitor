let host = "cn-shanghai.log.aliyuncs.com";
let project = "wlsy-monitor";
let logstore = "wlsy-monitor-store";
let userAgent = require("user-agent");

function getExtraData() {
  return {
    title: document.title,
    url: location.href,
    timeStamp: Date.now(),
    userAgent: userAgent.parse(navigator.userAgent),
  };
}


class SenderTracker {
  constructor() {
    this.url = `http://${project}.${host}/logstores/${logstore}/track`; //上报的路径
    this.xhr = new XMLHttpRequest();
  }

  send(data = {}) {
    let extraData = getExtraData();
    let log = { ...extraData, ...data };

    // for (const key in log) {
    //   log[key] = `${log[key]}`;
    // }

	  for (const key in log) {
		  // if (typeof log[key] === "number") {
			  log[key] = JSON.stringify(log[key]);
		  // }
	  }
	  console.log(log)
    let body = JSON.stringify({
      __logs__: [log],
    });
    this.xhr.open("POST", this.url, true);
    this.xhr.setRequestHeader("Content-Type", "application/json;uft-8"); // 请求体类型
    this.xhr.setRequestHeader("x-log-apiversion", "0.6.0"); // 请求版本号
    this.xhr.setRequestHeader("x-log-bodyrawsize", body.length); // 请求体大小
    this.xhr.onload = function () {
      // console.log(this.xhr.response);
    };
    this.xhr.onerror = function (error) {
      // console.log(error);
    };
    this.xhr.send(body);
  }
}

export default new SenderTracker();
