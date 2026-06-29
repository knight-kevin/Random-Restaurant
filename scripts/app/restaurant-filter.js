export function createRestaurantFilterEngine({
  getDistrict,
  getBusinessArea,
  getDistanceForRestaurant,
}) {
  let lastKey = "";
  let lastResult = [];

  function getFilteredRestaurants(restaurants, state) {
    const key = buildFilterKey(restaurants, state);
    if (key === lastKey) return lastResult;

    const filtered = restaurants.filter((restaurant) => {
      const locationMatched = state.selectedLocations.size === 0 ||
        state.selectedLocations.has(getDistrict(restaurant.address, restaurant));
      const businessMatched = state.selectedBusinessAreas.size === 0 ||
        state.selectedBusinessAreas.has(getBusinessArea(restaurant));
      const distance = getDistanceForRestaurant(restaurant);
      const distanceMatched = !state.selectedDistance || (distance !== null && distance <= state.selectedDistance);
      return locationMatched && businessMatched && distanceMatched;
    });

    lastKey = key;
    lastResult = sortRestaurants(filtered);
    return lastResult;
  }

  function invalidate() {
    lastKey = "";
    lastResult = [];
  }

  return { getFilteredRestaurants, invalidate };
}

export function sortRestaurants(items) {
  return [...items].sort((left, right) =>
    Number(right.rating || 0) - Number(left.rating || 0) ||
    Number(left.rank || Infinity) - Number(right.rank || Infinity)
  );
}

function buildFilterKey(restaurants, state) {
  return JSON.stringify({
    length: restaurants.length,
    ids: `${restaurants[0]?.id || ""}:${restaurants[restaurants.length - 1]?.id || ""}`,
    selectedLocations: [...state.selectedLocations].sort(),
    selectedBusinessAreas: [...state.selectedBusinessAreas].sort(),
    selectedDistance: state.selectedDistance,
    userPosition: state.userPosition
      ? `${state.userPosition.latitude.toFixed(5)},${state.userPosition.longitude.toFixed(5)}`
      : "",
  });
}
