const EARTH_RADIUS_METERS = 6371008.8;

export function requestCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("当前浏览器不支持定位"));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      (error) => reject(new Error(getLocationErrorMessage(error))),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  });
}

export function getRestaurantDistance(restaurant, userPosition) {
  if (!userPosition || !restaurant.location) return null;
  const [longitude, latitude] = String(restaurant.location).split(",").map(Number);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  const gcjPosition = wgs84ToGcj02(userPosition.longitude, userPosition.latitude);
  return haversineDistance(gcjPosition.latitude, gcjPosition.longitude, latitude, longitude);
}

export function formatDistance(distance) {
  if (!Number.isFinite(distance)) return "";
  if (distance < 1000) return `${Math.max(1, Math.round(distance))}m`;
  return `${(distance / 1000).toFixed(distance < 10000 ? 1 : 0)}km`;
}

export function parseAverageCost(restaurant) {
  if (Number.isFinite(Number(restaurant.averageCost))) return Number(restaurant.averageCost);
  const match = String(restaurant.note || "").match(/人均\s*[：:]\s*([\d.]+)/);
  return match ? Number(match[1]) : null;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

function wgs84ToGcj02(longitude, latitude) {
  if (outsideChina(longitude, latitude)) return { longitude, latitude };
  const a = 6378245;
  const eccentricity = 0.006693421622965943;
  let dLat = transformLatitude(longitude - 105, latitude - 35);
  let dLon = transformLongitude(longitude - 105, latitude - 35);
  const radLat = latitude / 180 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - eccentricity * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / ((a * (1 - eccentricity)) / (magic * sqrtMagic) * Math.PI);
  dLon = (dLon * 180) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
  return { longitude: longitude + dLon, latitude: latitude + dLat };
}

function outsideChina(longitude, latitude) {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271;
}

function transformLatitude(x, y) {
  let result = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  result += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
  result += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
  return result;
}

function transformLongitude(x, y) {
  let result = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
  result += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
  result += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
  return result;
}

function getLocationErrorMessage(error) {
  if (error.code === error.PERMISSION_DENIED) return "定位权限未开启，请在浏览器设置中允许访问位置";
  if (error.code === error.POSITION_UNAVAILABLE) return "暂时无法获取当前位置";
  if (error.code === error.TIMEOUT) return "定位超时，请稍后重试";
  return "定位失败，请稍后重试";
}
