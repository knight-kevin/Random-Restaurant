export function readRestaurantState(options) {
  const {
    coreRestaurants,
    legacyCoreRestaurantCount,
    currentDatasetVersion,
    keys,
    inferCategory,
    readJson,
    safeSetItem,
    storage = window.localStorage,
  } = options;

  let changes = readJson(keys.changes, null, storage);
  let migratedFromLegacy = false;
  let repaired = false;

  if (!isRestaurantChanges(changes)) {
    changes = migrateLegacyRestaurants({
      stored: readJson(keys.restaurants, null, storage),
      coreRestaurants,
      legacyCoreRestaurantCount,
      inferCategory,
    });
    migratedFromLegacy = true;
    safeSetItem(keys.changes, JSON.stringify(changes));
    storage.removeItem(keys.restaurants);
  } else {
    const repairedChanges = repairRestaurantChanges({ changes, coreRestaurants, legacyCoreRestaurantCount });
    repaired = repairedChanges !== changes;
    changes = repairedChanges;
    if (repaired) safeSetItem(keys.changes, JSON.stringify(changes));
  }

  safeSetItem(keys.version, currentDatasetVersion);
  const restaurants = applyRestaurantChanges(coreRestaurants, changes);
  return {
    restaurants,
    changes,
    health: getRestaurantHealthReport({
      coreRestaurants,
      restaurants,
      changes,
      currentDatasetVersion,
      migratedFromLegacy,
      repaired,
      legacyCoreRestaurantCount,
    }),
  };
}

export function migrateLegacyRestaurants({
  stored,
  coreRestaurants,
  legacyCoreRestaurantCount,
  inferCategory,
}) {
  if (!Array.isArray(stored) || isPlaceholderRestaurantList(stored)) return emptyRestaurantChanges();
  const coreMap = new Map(coreRestaurants.map((restaurant) => [restaurant.id, restaurant]));
  const storedMap = new Map(stored.map((restaurant) => [restaurant.id, restaurant]));
  const comparableCore = stored.length < coreRestaurants.length
    ? coreRestaurants.slice(0, Math.min(legacyCoreRestaurantCount, coreRestaurants.length))
    : coreRestaurants;
  const deletedIds = comparableCore
    .filter((restaurant) => !storedMap.has(restaurant.id))
    .map((restaurant) => restaurant.id);
  const added = stored.filter((restaurant) => !coreMap.has(restaurant.id));
  const overrides = {};
  stored.forEach((restaurant) => {
    const original = coreMap.get(restaurant.id);
    if (original && hasEditableChanges(original, restaurant)) {
      overrides[restaurant.id] = pickEditableFields(restaurant, inferCategory);
    }
  });
  return { added, overrides, deletedIds };
}

export function repairRestaurantChanges({ changes, coreRestaurants, legacyCoreRestaurantCount }) {
  if (coreRestaurants.length <= legacyCoreRestaurantCount) return changes;
  const legacyCoreIds = new Set(
    coreRestaurants.slice(0, legacyCoreRestaurantCount).map((restaurant) => restaurant.id),
  );
  const nonLegacyDeletedIds = changes.deletedIds.filter((id) => !legacyCoreIds.has(id));
  if (nonLegacyDeletedIds.length < 500) return changes;
  return {
    ...changes,
    deletedIds: changes.deletedIds.filter((id) => legacyCoreIds.has(id)),
  };
}

export function applyRestaurantChanges(baseRestaurants, changes) {
  const deleted = new Set(changes.deletedIds);
  const base = baseRestaurants
    .filter((restaurant) => !deleted.has(restaurant.id))
    .map((restaurant) => changes.overrides[restaurant.id]
      ? { ...restaurant, ...changes.overrides[restaurant.id] }
      : restaurant);
  return [...changes.added, ...base];
}

export function buildRestaurantChanges(currentRestaurants, initialRestaurants, inferCategory) {
  const initialMap = new Map(initialRestaurants.map((restaurant) => [restaurant.id, restaurant]));
  const currentMap = new Map(currentRestaurants.map((restaurant) => [restaurant.id, restaurant]));
  const deletedIds = initialRestaurants
    .filter((restaurant) => !currentMap.has(restaurant.id))
    .map((restaurant) => restaurant.id);
  const added = currentRestaurants.filter((restaurant) => !initialMap.has(restaurant.id));
  const overrides = {};
  currentRestaurants.forEach((restaurant) => {
    const original = initialMap.get(restaurant.id);
    if (original && hasEditableChanges(original, restaurant)) {
      overrides[restaurant.id] = pickEditableFields(restaurant, inferCategory);
    }
  });
  return { added, overrides, deletedIds };
}

export function getRestaurantHealthReport({
  coreRestaurants,
  restaurants,
  changes,
  currentDatasetVersion,
  migratedFromLegacy = false,
  repaired = false,
  legacyCoreRestaurantCount = 1300,
}) {
  const officialIds = new Set(coreRestaurants.map((restaurant) => restaurant.id));
  const nonLegacyOfficialDeleted = changes.deletedIds.filter((id) =>
    officialIds.has(id) &&
    !coreRestaurants.slice(0, legacyCoreRestaurantCount).some((restaurant) => restaurant.id === id)
  );
  return {
    version: currentDatasetVersion,
    officialCount: coreRestaurants.length,
    currentCount: restaurants.length,
    userAddedCount: changes.added.length,
    userDeletedCount: changes.deletedIds.length,
    userOverrideCount: Object.keys(changes.overrides || {}).length,
    suspiciousDeletedCount: nonLegacyOfficialDeleted.length,
    migratedFromLegacy,
    repaired,
    healthy: coreRestaurants.length > 0 && restaurants.length > 0 && nonLegacyOfficialDeleted.length === 0,
  };
}

export function emptyRestaurantChanges() {
  return { added: [], overrides: {}, deletedIds: [] };
}

export function isRestaurantChanges(value) {
  return Boolean(value && Array.isArray(value.added) && value.overrides && Array.isArray(value.deletedIds));
}

function hasEditableChanges(original, current) {
  return ["name", "address", "note", "category"].some((field) =>
    String(original[field] ?? "") !== String(current[field] ?? "")
  );
}

function pickEditableFields(restaurant, inferCategory) {
  return {
    name: restaurant.name || "",
    address: restaurant.address || "",
    note: restaurant.note || "",
    category: restaurant.category || inferCategory(restaurant),
  };
}

function isPlaceholderRestaurantList(items) {
  return items.length === 99 && items.every((restaurant, index) =>
    restaurant.name === `餐厅 ${String(index + 1).padStart(3, "0")}`
  );
}
