export function getDeviceProfile(userAgent = navigator.userAgent) {
  return {
    isAppleMobile: /iPhone|iPad|iPod/i.test(userAgent),
    isAppleDesktop: /Macintosh/i.test(userAgent),
    isAndroidFamily: /Android|HarmonyOS|HUAWEI/i.test(userAgent),
  };
}

export function getMapProviders(userAgent = navigator.userAgent) {
  const device = getDeviceProfile(userAgent);
  const common = [
    { value: "amap", label: "高德地图", symbol: "高" },
    { value: "baidu", label: "百度地图", symbol: "百" },
    { value: "tencent", label: "腾讯地图", symbol: "腾" },
  ];
  if (device.isAppleMobile || device.isAppleDesktop) {
    return [{ value: "apple", label: "Apple 地图", symbol: "A" }, ...common];
  }
  return common;
}

export function getMapUrl(restaurant, provider, userAgent = navigator.userAgent) {
  const device = getDeviceProfile(userAgent);
  const city = restaurant.city || "杭州市";
  const query = `${city} ${restaurant.address || ""} ${restaurant.name || restaurant.restaurantName || ""}`.trim();
  const [longitude = "", latitude = ""] = String(restaurant.location || "").split(",");
  const encodedQuery = encodeURIComponent(query);
  const encodedCity = encodeURIComponent(city);
  const name = restaurant.name || restaurant.restaurantName || "";
  const address = restaurant.address || "";

  if (provider === "baidu") {
    if (device.isAppleMobile || device.isAndroidFamily) {
      return `baidumap://map/place/search?query=${encodedQuery}&region=${encodedCity}&src=webapp.renjianxunweiji`;
    }
    return `https://map.baidu.com/search/${encodedQuery}`;
  }

  if (provider === "tencent") {
    if ((device.isAppleMobile || device.isAndroidFamily) && latitude && longitude) {
      const marker = encodeURIComponent(`coord:${latitude},${longitude};title:${name};addr:${address}`);
      return `qqmap://map/marker?marker=${marker}&referer=renjianxunweiji`;
    }
    return `https://map.qq.com/?type=search&keyword=${encodedQuery}&region=${encodedCity}`;
  }

  if (provider === "apple") {
    const coordinate = latitude && longitude ? `&ll=${encodeURIComponent(`${latitude},${longitude}`)}` : "";
    return `https://maps.apple.com/?q=${encodeURIComponent(name || query)}${coordinate}`;
  }

  if (restaurant.location) {
    const params = `sourceApplication=${encodeURIComponent("人间寻味记")}&poiname=${encodeURIComponent(name)}&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&dev=0`;
    if (device.isAppleMobile) return `iosamap://viewMap?${params}`;
    if (device.isAndroidFamily) return `androidamap://viewMap?${params}`;
    return `https://uri.amap.com/marker?position=${encodeURIComponent(restaurant.location)}&name=${encodeURIComponent(name)}&src=renjianxunweiji&callnative=1`;
  }

  if (device.isAppleMobile) {
    return `iosamap://poi?sourceApplication=${encodeURIComponent("人间寻味记")}&name=${encodeURIComponent(query)}`;
  }
  if (device.isAndroidFamily) {
    return `androidamap://poi?sourceApplication=${encodeURIComponent("人间寻味记")}&keywords=${encodeURIComponent(query)}&dev=0`;
  }
  return `https://uri.amap.com/search?keyword=${encodedQuery}&src=renjianxunweiji&callnative=1`;
}

export function getCopyAddressText(restaurant, includeName = false) {
  const name = restaurant.name || restaurant.restaurantName || "";
  const address = restaurant.address || "";
  return includeName ? `${name} ${address}`.trim() : address || name;
}
