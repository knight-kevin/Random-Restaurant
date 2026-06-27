export function getPickReasons(context) {
  const {
    restaurant,
    activeCategoryLabel,
    selectedLocations = [],
    selectedBusinessAreas = [],
    selectedDistanceLabel = "",
    selectedSortLabel = "",
    distanceText = "",
    averageCost = null,
    hasCheckedIn = false,
    wasRecentPick = false,
    categoryLabel = "",
  } = context;

  const reasons = [];
  if (categoryLabel && activeCategoryLabel && activeCategoryLabel !== "全部") {
    reasons.push(`符合你当前想吃的「${activeCategoryLabel}」`);
  } else if (categoryLabel) {
    reasons.push(`这次落在「${categoryLabel}」这个口味上`);
  }

  const locationLabel = selectedBusinessAreas[0] || selectedLocations[0] || restaurant.businessArea || restaurant.district || "";
  if (locationLabel) reasons.push(`位置匹配「${locationLabel}」附近的选择`);
  if (distanceText && selectedDistanceLabel) reasons.push(`距离在「${selectedDistanceLabel}」范围内，约 ${distanceText}`);
  if (Number(restaurant.rating) >= 4.6) reasons.push(`高德评分 ${restaurant.rating} 分，口碑靠前`);
  else if (Number(restaurant.rating) >= 4.3) reasons.push(`评分 ${restaurant.rating} 分，整体评价不错`);
  if (averageCost && averageCost <= 80) reasons.push(`人均约 ¥${averageCost}，比较轻松`);
  if (!hasCheckedIn) reasons.push("你还没有打卡过它");
  if (!wasRecentPick) reasons.push("近期没有反复抽到它");
  if (selectedSortLabel && selectedSortLabel !== "排序") reasons.push(`当前排序偏好是「${selectedSortLabel}」`);

  return unique(reasons).slice(0, 4);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
