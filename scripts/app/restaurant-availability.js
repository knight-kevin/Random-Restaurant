export function createDefaultAvailability() {
  return {
    skippedUntil: {},
    deferredIds: [],
    hiddenIds: [],
    recentPickIds: [],
  };
}

export function normalizeAvailability(value) {
  const fallback = createDefaultAvailability();
  if (!value || typeof value !== "object") return fallback;
  return {
    skippedUntil: normalizeRecord(value.skippedUntil),
    deferredIds: normalizeArray(value.deferredIds),
    hiddenIds: normalizeArray(value.hiddenIds),
    recentPickIds: normalizeArray(value.recentPickIds),
  };
}

export function getAvailabilitySummary(availability) {
  const today = getLocalDateKey();
  return {
    todaySkippedCount: Object.values(availability.skippedUntil || {}).filter((date) => date >= today).length,
    deferredCount: availability.deferredIds.length,
    hiddenCount: availability.hiddenIds.length,
    recentCount: availability.recentPickIds.length,
  };
}

export function filterAvailableRestaurants(restaurants, availability, now = new Date()) {
  const today = getLocalDateKey(now);
  const hidden = new Set(availability.hiddenIds);
  return restaurants.filter((restaurant) => {
    if (hidden.has(restaurant.id)) return false;
    const skipDate = availability.skippedUntil[restaurant.id];
    return !skipDate || skipDate < today;
  });
}

export function rankAvailablePool(restaurants, availability) {
  const deferred = new Set(availability.deferredIds);
  const recent = new Set(availability.recentPickIds);
  return [...restaurants].sort((left, right) => {
    const leftPenalty = (deferred.has(left.id) ? 1 : 0) + (recent.has(left.id) ? 1 : 0);
    const rightPenalty = (deferred.has(right.id) ? 1 : 0) + (recent.has(right.id) ? 1 : 0);
    return leftPenalty - rightPenalty;
  });
}

export function markPicked(availability, restaurantId, maxRecent = 12) {
  return {
    ...availability,
    recentPickIds: unique([restaurantId, ...availability.recentPickIds]).slice(0, maxRecent),
  };
}

export function skipForToday(availability, restaurantId, now = new Date()) {
  return {
    ...availability,
    skippedUntil: {
      ...availability.skippedUntil,
      [restaurantId]: getLocalDateKey(now),
    },
    deferredIds: availability.deferredIds.filter((id) => id !== restaurantId),
  };
}

export function deferRestaurant(availability, restaurantId, maxDeferred = 24) {
  return {
    ...availability,
    deferredIds: unique([restaurantId, ...availability.deferredIds]).slice(0, maxDeferred),
  };
}

export function hideRestaurant(availability, restaurantId) {
  return {
    ...availability,
    hiddenIds: unique([restaurantId, ...availability.hiddenIds]),
    deferredIds: availability.deferredIds.filter((id) => id !== restaurantId),
  };
}

export function restoreHiddenRestaurants(availability) {
  return {
    ...availability,
    hiddenIds: [],
  };
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, date]) => typeof key === "string" && typeof date === "string"),
  );
}

function normalizeArray(value) {
  return unique(Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
