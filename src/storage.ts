import { initialRestaurants } from './initialRestaurants';
import type { CheckInRecord, Restaurant } from './types';

const RESTAURANTS_KEY = 'random-restaurant-checkin:restaurants';
const CHECK_INS_KEY = 'random-restaurant-checkin:check-ins';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadRestaurants(): Restaurant[] {
  const storedRestaurants = readJson<Restaurant[]>(RESTAURANTS_KEY, initialRestaurants);

  if (isPlaceholderRestaurantList(storedRestaurants)) {
    return initialRestaurants;
  }

  return storedRestaurants;
}

export function saveRestaurants(restaurants: Restaurant[]) {
  writeJson(RESTAURANTS_KEY, restaurants);
}

export function loadCheckIns(): CheckInRecord[] {
  return readJson<CheckInRecord[]>(CHECK_INS_KEY, []);
}

export function saveCheckIns(records: CheckInRecord[]) {
  writeJson(CHECK_INS_KEY, records);
}

function isPlaceholderRestaurantList(restaurants: Restaurant[]) {
  return (
    restaurants.length === 99 &&
    restaurants.every((restaurant, index) => {
      const number = String(index + 1).padStart(3, '0');
      return restaurant.name === `餐厅 ${number}`;
    })
  );
}
