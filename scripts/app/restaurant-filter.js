export function createRestaurantFilterEngine({
  getCategoryTabs,
  inferCategory,
  matchesFoodSelection,
  getDistrict,
  getBusinessArea,
  getDistanceForRestaurant,
  parseAverageCost,
}) {
  let lastKey = "";
  let lastResult = [];

  function getFilteredRestaurants(restaurants, state) {
    const key = buildFilterKey(restaurants, state);
    if (key === lastKey) return lastResult;
    const activeTab = getCategoryTabs().find((tab) => tab.value === state.activeCategoryTab);
    const filtered = restaurants.filter((restaurant) => {
      const tabMatched = !activeTab?.categories.length || activeTab.categories.includes(inferCategory(restaurant));
      const categoryMatched = matchesFoodSelection(restaurant, state.selectedFoodValues);
      const locationMatched = state.selectedLocations.size === 0 ||
        state.selectedLocations.has(getDistrict(restaurant.address, restaurant));
      const businessMatched = state.selectedBusinessAreas.size === 0 ||
        state.selectedBusinessAreas.has(getBusinessArea(restaurant));
      const distance = getDistanceForRestaurant(restaurant);
      const distanceMatched = !state.selectedDistance || (distance !== null && distance <= state.selectedDistance);
      return tabMatched && categoryMatched && locationMatched && businessMatched && distanceMatched;
    });
    const sorted = sortRestaurants(filtered, state.selectedSort, getDistanceForRestaurant, parseAverageCost);
    lastKey = key;
    lastResult = state.selectedSort === "recommended" ? sorted : sorted.slice(0, 100);
    return lastResult;
  }

  function invalidate() {
    lastKey = "";
    lastResult = [];
  }

  return { getFilteredRestaurants, invalidate };
}

export function sortRestaurants(items, selectedSort, getDistanceForRestaurant, parseAverageCost) {
  const sorted = [...items];
  if (selectedSort === "distance") {
    return sorted.sort((left, right) =>
      (getDistanceForRestaurant(left) ?? Infinity) - (getDistanceForRestaurant(right) ?? Infinity)
    );
  }
  if (selectedSort === "rating") {
    return sorted.sort((left, right) => Number(right.rating || 0) - Number(left.rating || 0));
  }
  if (selectedSort === "cost-asc") {
    return sorted.sort((left, right) => (parseAverageCost(left) ?? Infinity) - (parseAverageCost(right) ?? Infinity));
  }
  if (selectedSort === "cost-desc") {
    return sorted.sort((left, right) => (parseAverageCost(right) ?? -1) - (parseAverageCost(left) ?? -1));
  }
  return sorted.sort((left, right) =>
    Number(right.rating || 0) - Number(left.rating || 0) ||
    Number(left.rank || Infinity) - Number(right.rank || Infinity)
  );
}

function buildFilterKey(restaurants, state) {
  return JSON.stringify({
    length: restaurants.length,
    ids: `${restaurants[0]?.id || ""}:${restaurants[restaurants.length - 1]?.id || ""}`,
    activeCategoryTab: state.activeCategoryTab,
    selectedFoodValues: [...state.selectedFoodValues].sort(),
    selectedLocations: [...state.selectedLocations].sort(),
    selectedBusinessAreas: [...state.selectedBusinessAreas].sort(),
    selectedDistance: state.selectedDistance,
    selectedSort: state.selectedSort,
    userPosition: state.userPosition
      ? `${state.userPosition.latitude.toFixed(5)},${state.userPosition.longitude.toFixed(5)}`
      : "",
  });
}
