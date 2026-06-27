export function normalizeWishList(value) {
  if (!value || typeof value !== "object") return [];
  const items = Array.isArray(value) ? value : value.items;
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items
    .filter((item) => item && typeof item.restaurantId === "string" && !seen.has(item.restaurantId))
    .map((item) => {
      seen.add(item.restaurantId);
      return {
        restaurantId: item.restaurantId,
        addedAt: typeof item.addedAt === "string" ? item.addedAt : new Date().toISOString(),
        source: typeof item.source === "string" ? item.source : "manual",
      };
    });
}

export function serializeWishList(items) {
  return JSON.stringify({ items });
}

export function isWishListed(items, restaurantId) {
  return items.some((item) => item.restaurantId === restaurantId);
}

export function getWishIds(items) {
  return items.map((item) => item.restaurantId);
}

export function toggleWishList(items, restaurantId, source = "manual") {
  if (isWishListed(items, restaurantId)) {
    return items.filter((item) => item.restaurantId !== restaurantId);
  }
  return [
    {
      restaurantId,
      addedAt: new Date().toISOString(),
      source,
    },
    ...items,
  ];
}

export function clearWishList() {
  return [];
}
