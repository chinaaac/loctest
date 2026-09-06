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
    console.log("[Location Rewrite] 已改写：" + $request.url);
    $done({ body: buildForm(items) });
  } else {
    $done({});
  }
} catch (error) {
  console.log("[Location Rewrite] 解析失败：" + error);
  $done({});
}
