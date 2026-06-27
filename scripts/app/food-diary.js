export function getDiaryStats(checkIns, favorites, helpers = {}) {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthly = checkIns.filter((record) => String(record.checkedInAt || "").startsWith(monthPrefix));
  const reviewed = checkIns.filter((record) => helpers.hasReview?.(record));
  const topRated = reviewed
    .map((record) => ({ record, score: Number(helpers.getAverageRating?.(helpers.getReview?.(record)) || 0) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)[0];
  return {
    total: checkIns.length,
    monthly: monthly.length,
    favoriteCount: favorites.length,
    reviewed: reviewed.length,
    topRatedName: topRated?.record.restaurantName || "暂无",
    topRatedScore: topRated?.score || "",
    topCategory: getTopValue(checkIns.map((record) => helpers.getCategoryLabel?.(record.category) || record.category || "")),
    topDistrict: getTopValue(checkIns.map((record) => record.district || helpers.getDistrict?.(record.address, record) || "")),
  };
}

export function filterDiaryRecords(checkIns, filter, helpers = {}) {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let records = [...checkIns];
  if (filter === "month") {
    records = records.filter((record) => String(record.checkedInAt || "").startsWith(monthPrefix));
  }
  if (filter === "reviewed") {
    records = records.filter((record) => helpers.hasReview?.(record));
  }
  if (filter === "favorite") {
    records = records.filter((record) => helpers.isFavorite?.(record.restaurantId));
  }
  if (filter === "high") {
    records = records.filter((record) => Number(helpers.getAverageRating?.(helpers.getReview?.(record)) || 0) >= 4);
  }
  return records;
}

function getTopValue(values) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const [label, count] = [...counts.entries()].sort((left, right) => right[1] - left[1])[0] || [];
  return label ? `${label} · ${count} 次` : "暂无";
}
