export function getPlatformSearchQuery(restaurant = {}) {
  const city = normalizeText(restaurant.city || "");
  const name = normalizeText(restaurant.name || restaurant.restaurantName || "");
  const address = getAddressFragment(restaurant.address || "");
  return [city, name, address].filter(Boolean).join(" ");
}

export function getPlatformSearchLinks(restaurant = {}) {
  const query = getPlatformSearchQuery(restaurant);
  if (!query) return [];
  const encodedQuery = encodeURIComponent(query);
  return [
    {
      value: "meituan",
      label: "\u7f8e\u56e2\u641c\u8fd9\u5bb6",
      url: `https://www.meituan.com/s/${encodedQuery}/`,
    },
    {
      value: "dianping",
      label: "\u5927\u4f17\u70b9\u8bc4\u641c\u8fd9\u5bb6",
      url: `https://www.dianping.com/search/keyword/0/10_${encodedQuery}`,
    },
  ];
}

function getAddressFragment(address) {
  const normalized = normalizeText(address);
  return normalized.length > 48 ? normalized.slice(0, 48) : normalized;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
