// httpAPI 函数用于发送 HTTP 请求
async function httpAPI(path = "", method = "GET", body = null) {
    return new Promise((resolve) => {
        $httpAPI(method, path, body, resolve);
    });
};

// getParams 函数用于解析传递给脚本的参数
function getParams(param) {
    return Object.fromEntries(param.split("&").map(item => item.split("=").map(decodeURIComponent)));
}

// bytesToSize 函数用于将字节转换为易于阅读的格式
function bytesToSize(bytes) {
    if (bytes === 0) return "0B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

// speedTransform 函数用于将字节速度转换为易于阅读的格式
function speedTransform(bytes) {
    return bytes === 0 ? "0B/s"  :  bytesToSize(bytes) + "/s";
}

// del 函数用于从数组中删除指定元素
function del(arr, num) {
    return arr.filter(item => item !== num);
}

// 主异步函数，用于获取并处理交通数据
async function fetchTrafficData() {
    try {
        console.log("开始请求数据...");
        const trafficResponse = await httpAPI("/v1/traffic");
        console.log("请求结果：", trafficResponse);

        if (trafficResponse) {
            processTrafficData(trafficResponse);
        } else {
            console.log("未获取到有效的交通数据");
        }
    } catch (error) {
        console.error("获取交通数据时出错:", error);
    } finally {
        $done();
    }
}

// 处理并显示交通数据
function processTrafficData(data) {
    if (!data.connector || !data.interface) {
        console.log("数据格式不正确，缺少必要的字段");
        return;
    }

    let interfaceData = data.interface;
    let allNet = Object.keys(interfaceData);
    allNet = del(allNet, "lo0");

    let index = 0;
    let net = $persistentStore.read("NETWORK");
    if (net && allNet.includes(net)) {
        index = allNet.indexOf(net);
    }

    /* 手动执行时切换网络界面 */
    if($trigger == "button"){
        if(allNet.length > 1) index += 1;
        if(index >= allNet.length) index = 0;
        $persistentStore.write(allNet[index], "NETWORK");
        net = allNet[index];
    }

    let network = interfaceData[net];
    let netType = net === "en0" ? "WiFi" : "Cellular";
    let outCurrentSpeed = speedTransform(network.outCurrentSpeed);
    let outMaxSpeed = speedTransform(network.outMaxSpeed);
    let download = bytesToSize(network.in);
    let upload = bytesToSize(network.out);
    let inMaxSpeed = speedTransform(network.inMaxSpeed);
    let inCurrentSpeed = speedTransform(network.inCurrentSpeed);

    $done({
        title: "流量统计 | " + netType,
        content: `总计流量 ➟ ${upload} | ${download}\n` +
        `当前网速 ➟ ${outCurrentSpeed} | ${inCurrentSpeed}\n` +
        `峰值网速 ➟ ${outMaxSpeed} | ${inMaxSpeed}`,
        icon: params.icon,
        "icon-color": params.color
    });

    console.log(`----------------------------------`);
    console.log("网络类型 ➟ " + netType);
    console.log(`上行流量 ➟ ${upload}`);
    console.log(`下行流量 ➟ ${download}`);
    console.log(`当前速度 ➟ ${outCurrentSpeed} / ${inCurrentSpeed}`);
    console.log(`峰值网速 ➟ ${outMaxSpeed} | ${inMaxSpeed}`);

    printNetworkInfo("接口信息：", data.interface);
    printNetworkInfo("连接信息：", data.connector);
}

// 打印网络信息
function printNetworkInfo(title, networkData) {
    console.log(`----------------------------------`);
    console.log(title);
    for (let key in networkData) {
        const data = networkData[key];
        console.log(`----------------------------------`);
        console.log(`名称 ➟ ${key}`);
        console.log(`上行流量 ➟ ${bytesToSize(data.out)}`);
        console.log(`下行流量 ➟ ${bytesToSize(data.in)}`);
        console.log(`当前网速 ➟ ${speedTransform(data.outCurrentSpeed)} / ${speedTransform(data.inCurrentSpeed)}`);
        console.log(`峰值网速 ➟ ${speedTransform(data.outMaxSpeed)} | ${speedTransform(data.inMaxSpeed)}`);
    }
}

fetchTrafficData();