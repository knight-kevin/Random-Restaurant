export const PICK_SCENES = [
  { value: "daily", label: "日常随机", description: "保留当前筛选，交给一点运气。" },
  { value: "solo", label: "一个人吃", description: "偏向小吃、面食、咖啡和轻量餐。" },
  { value: "friends", label: "朋友聚餐", description: "偏向火锅、烧烤、自助和大桌菜。" },
  { value: "date", label: "约会氛围", description: "偏向咖啡、西餐、日料韩餐和环境感。" },
  { value: "budget", label: "想省钱", description: "优先人均较低或快餐小吃。" },
  { value: "premium", label: "想吃好的", description: "优先评分高、人均稍高或榜单靠前。" },
  { value: "nearby", label: "不想跑远", description: "定位可用时优先近处。" },
];

export function createDefaultPickState() {
  return {
    scene: "daily",
    pickType: "single",
    prioritizeWishList: false,
  };
}

export function normalizePickState(value) {
  const fallback = createDefaultPickState();
  if (!value || typeof value !== "object") return fallback;
  return {
    scene: PICK_SCENES.some((scene) => scene.value === value.scene) ? value.scene : fallback.scene,
    pickType: value.pickType === "triple" ? "triple" : "single",
    prioritizeWishList: Boolean(value.prioritizeWishList),
  };
}

export function getPickScene(sceneValue) {
  return PICK_SCENES.find((scene) => scene.value === sceneValue) || PICK_SCENES[0];
}

export function buildPickPool(restaurants, state, helpers, options = {}) {
  const minSceneCandidates = options.minSceneCandidates ?? 8;
  const wishIds = new Set(options.wishIds || []);
  const scenePool = applyScenePreference(restaurants, state.scene, helpers);
  const sceneMatched = scenePool.length >= minSceneCandidates;
  const sceneBase = sceneMatched ? scenePool : restaurants;
  if (state.prioritizeWishList && wishIds.size) {
    const wishScenePool = sceneBase.filter((restaurant) => wishIds.has(restaurant.id));
    if (wishScenePool.length) {
      return { pool: wishScenePool, sceneMatched, wishMatched: true };
    }
    const wishBasePool = restaurants.filter((restaurant) => wishIds.has(restaurant.id));
    if (wishBasePool.length) {
      return { pool: wishBasePool, sceneMatched, wishMatched: true };
    }
  }
  return { pool: sceneBase, sceneMatched, wishMatched: false };
}

export function applyScenePreference(restaurants, sceneValue, helpers) {
  if (sceneValue === "daily") return restaurants;
  const scene = getPickScene(sceneValue).value;
  const categorySet = {
    solo: new Set(["snack", "noodle", "dessert", "asian"]),
    friends: new Set(["hotpot", "bbq", "buffet", "local", "seafood"]),
    date: new Set(["dessert", "western", "asian", "local"]),
  }[scene];

  return restaurants.filter((restaurant) => {
    const category = helpers.inferCategory(restaurant);
    const rating = Number(restaurant.rating || 0);
    const cost = helpers.parseAverageCost(restaurant);
    const distance = helpers.getDistanceForRestaurant(restaurant);
    if (categorySet) return categorySet.has(category);
    if (scene === "budget") return category === "snack" || category === "noodle" || category === "dessert" || (cost !== null && cost <= 70);
    if (scene === "premium") return rating >= 4.6 || (cost !== null && cost >= 120) || Number(restaurant.rank || 9999) <= 30;
    if (scene === "nearby") return distance !== null && distance <= 3000;
    return true;
  });
}

export function getPickModeLabel(pickType) {
  return pickType === "triple" ? "三选一" : "单抽";
}
