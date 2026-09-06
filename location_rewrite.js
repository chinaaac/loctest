/* Shadowrocket request-body rewrite script
 * 只修改 bundleV2 中已经存在的定位字段。
 */

// ===== 只需要修改这里 =====
const TARGET_LATITUDE = "31.230400";   // 目标纬度，例如上海
const TARGET_LONGITUDE = "121.473700"; // 目标经度，例如上海
const TARGET_RADIUS = "10";
// ==========================

function decodeFormComponent(value) {
  return decodeURIComponent(String(value || "").replace(/\+/g, " "));
}

function parseForm(body) {
  const result = [];
  String(body || "").split("&").forEach(function (part) {
    if (!part) return;
    const index = part.indexOf("=");
    const rawKey = index >= 0 ? part.slice(0, index) : part;
    const rawValue = index >= 0 ? part.slice(index + 1) : "";
    result.push({
      key: decodeFormComponent(rawKey),
      value: decodeFormComponent(rawValue)
    });
  });
  return result;
}

function buildForm(items) {
  return items.map(function (item) {
    return encodeURIComponent(item.key) + "=" + encodeURIComponent(item.value);
  }).join("&");
}

try {
  const items = parseForm($request.body);
  let changed = false;

  items.forEach(function (item) {
    if (item.key !== "bundleV2") return;

    const data = JSON.parse(item.value);
    const replacements = {
      latitude: TARGET_LATITUDE,
      longitude: TARGET_LONGITUDE,
      lat: TARGET_LATITUDE,
      lng: TARGET_LONGITUDE,
      oriLat: TARGET_LATITUDE,
      oriLng: TARGET_LONGITUDE,
      radius: TARGET_RADIUS
    };

    Object.keys(replacements).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = replacements[key];
        changed = true;
      }
    });

    if (changed) item.value = JSON.stringify(data);
  });

  if (changed) {
    const newBody = buildForm(items);
    const headers = Object.assign({}, $request.headers || {});
    // 正文长度变化后必须同步更新，否则服务器可能直接断开连接。
    delete headers["content-length"];
    headers["Content-Length"] = String(newBody.length);
    console.log("[Location Rewrite] 已改写：" + $request.url);
    console.log("[Location Rewrite] 新正文长度：" + newBody.length);
    $done({ headers: headers, body: newBody });
  } else {
    $done({});
  }
} catch (error) {
  console.log("[Location Rewrite] 解析失败：" + error);
  $done({});
}
