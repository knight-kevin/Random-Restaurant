import { useEffect, useMemo, useState } from 'react';
import { CheckInHistory } from './components/CheckInHistory';
import { RandomPicker } from './components/RandomPicker';
import { RestaurantForm } from './components/RestaurantForm';
import { RestaurantList } from './components/RestaurantList';
import { loadCheckIns, loadRestaurants, saveCheckIns, saveRestaurants } from './storage';
import type { CheckInRecord, Restaurant, RestaurantInput } from './types';

type ViewMode = 'home' | 'manage';

const ROLL_DURATION_MS = 3000;
const REEL_LENGTH = 34;

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createRestaurant(input: RestaurantInput): Restaurant {
  return {
    id: createId('restaurant'),
    name: input.name,
    address: input.address,
    note: input.note,
    createdAt: new Date().toISOString(),
  };
}

function createCheckInRecord(restaurant: Restaurant): CheckInRecord {
  return {
    id: createId('check-in'),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    address: restaurant.address,
    note: restaurant.note,
    checkedInAt: new Date().toISOString(),
  };
}

function shuffleRestaurants(restaurants: Restaurant[]) {
  return [...restaurants].sort(() => Math.random() - 0.5);
}

function buildRollingReel(restaurants: Restaurant[]) {
  return shuffleRestaurants(restaurants).slice(0, Math.min(REEL_LENGTH, restaurants.length));
}

function buildFinalReel(restaurants: Restaurant[], finalRestaurant: Restaurant) {
  return [
    finalRestaurant,
    ...shuffleRestaurants(restaurants.filter((restaurant) => restaurant.id !== finalRestaurant.id)).slice(
      0,
      Math.min(REEL_LENGTH - 1, Math.max(restaurants.length - 1, 0)),
    ),
  ];
}

export default function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => loadRestaurants());
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(() => loadCheckIns());
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [pendingRestaurant, setPendingRestaurant] = useState<Restaurant | null>(null);
  const [reelRestaurants, setReelRestaurants] = useState<Restaurant[]>(() =>
    buildRollingReel(loadRestaurants()),
  );
  const [isRolling, setIsRolling] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [message, setMessage] = useState('');

  const editingRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === editingRestaurantId) ?? null,
    [editingRestaurantId, restaurants],
  );

  useEffect(() => {
    saveRestaurants(restaurants);
  }, [restaurants]);

  useEffect(() => {
    saveCheckIns(checkIns);
  }, [checkIns]);

  useEffect(() => {
    if (
      selectedRestaurant &&
      !restaurants.some((restaurant) => restaurant.id === selectedRestaurant.id)
    ) {
      setSelectedRestaurant(null);
    }
  }, [restaurants, selectedRestaurant]);

  useEffect(() => {
    if (!isRolling && !selectedRestaurant) {
      setReelRestaurants(buildRollingReel(restaurants));
    }
  }, [restaurants, isRolling, selectedRestaurant]);

  useEffect(() => {
    if (!pendingRestaurant) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSelectedRestaurant(pendingRestaurant);
      setReelRestaurants(buildFinalReel(restaurants, pendingRestaurant));
      setPendingRestaurant(null);
      setIsRolling(false);
      showMessage('已锁定本次打卡餐厅。');
    }, ROLL_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [pendingRestaurant, restaurants]);

  function showMessage(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(''), 2600);
  }

  function handlePickRestaurant() {
    if (isRolling) {
      return;
    }

    if (restaurants.length === 0) {
      window.alert('当前没有可抽取的餐厅，请先添加餐厅');
      return;
    }

    const index = Math.floor(Math.random() * restaurants.length);
    const finalRestaurant = restaurants[index];
    setSelectedRestaurant(null);
    setPendingRestaurant(finalRestaurant);
    setReelRestaurants(buildRollingReel(restaurants));
    setIsRolling(true);
  }

  function handleCompleteCheckIn() {
    if (!selectedRestaurant) {
      return;
    }

    const shouldRemove = window.confirm('打卡完成！是否将该餐厅从待打卡库中移除？');
    const record = createCheckInRecord(selectedRestaurant);

    setCheckIns((current) => [record, ...current]);

    if (shouldRemove) {
      setRestaurants((current) =>
        current.filter((restaurant) => restaurant.id !== selectedRestaurant.id),
      );
    }

    setSelectedRestaurant(null);
    setReelRestaurants(buildRollingReel(shouldRemove ? restaurants.filter((restaurant) => restaurant.id !== selectedRestaurant.id) : restaurants));
    showMessage(shouldRemove ? '打卡成功，餐厅已从待打卡库移除。' : '打卡成功，餐厅已保留。');
  }

  function handleSubmitRestaurant(input: RestaurantInput) {
    if (!input.name) {
      window.alert('餐厅名称不能为空');
      return false;
    }

    if (editingRestaurant) {
      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant.id === editingRestaurant.id ? { ...restaurant, ...input } : restaurant,
        ),
      );

      if (selectedRestaurant?.id === editingRestaurant.id) {
        setSelectedRestaurant((current) => (current ? { ...current, ...input } : current));
      }

      setEditingRestaurantId(null);
      showMessage('餐厅信息已更新。');
      return true;
    }

    setRestaurants((current) => [createRestaurant(input), ...current]);
    showMessage('新餐厅已添加。');
    return true;
  }

  function handleDeleteRestaurant(restaurantId: string) {
    const restaurant = restaurants.find((item) => item.id === restaurantId);
    if (!restaurant) {
      return;
    }

    if (!window.confirm(`确定删除「${restaurant.name}」吗？`)) {
      return;
    }

    setRestaurants((current) => current.filter((item) => item.id !== restaurantId));

    if (editingRestaurantId === restaurantId) {
      setEditingRestaurantId(null);
    }

    if (selectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant(null);
    }

    showMessage('餐厅已删除。');
  }

  function handleDeleteCheckIn(recordId: string) {
    setCheckIns((current) => current.filter((record) => record.id !== recordId));
    showMessage('打卡记录已删除。');
  }

  function handleClearCheckIns() {
    if (checkIns.length === 0) {
      return;
    }

    if (window.confirm('确定清空全部打卡记录吗？此操作不可撤销。')) {
      setCheckIns([]);
      showMessage('打卡历史已清空。');
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Random Restaurant</p>
          <h1>人间寻味记</h1>
        </div>
        <nav className="top-actions" aria-label="页面导航">
          <button
            className={viewMode === 'home' ? 'nav-action is-active' : 'nav-action'}
            type="button"
            onClick={() => setViewMode('home')}
          >
            抽餐厅
          </button>
          <button
            className={viewMode === 'manage' ? 'nav-action is-active' : 'nav-action'}
            type="button"
            onClick={() => setViewMode('manage')}
          >
            管理餐厅
          </button>
        </nav>
      </header>

      {message ? (
        <div className="toast" role="status">
          {message}
        </div>
      ) : null}

      {viewMode === 'home' ? (
        <div className="home-grid">
          <RandomPicker
            restaurantCount={restaurants.length}
            reelRestaurants={reelRestaurants}
            selectedRestaurant={selectedRestaurant}
            isRolling={isRolling}
            onPick={handlePickRestaurant}
            onComplete={handleCompleteCheckIn}
          />
          <CheckInHistory
            records={checkIns}
            onDelete={handleDeleteCheckIn}
            onClear={handleClearCheckIns}
          />
        </div>
      ) : (
        <section className="panel manage-panel" aria-labelledby="management-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{restaurants.length} 家待打卡</p>
              <h2 id="management-title">餐厅管理</h2>
            </div>
            <button className="ghost-action" type="button" onClick={() => setViewMode('home')}>
              返回抽取
            </button>
          </div>
          <RestaurantForm
            editingRestaurant={editingRestaurant}
            onSubmit={handleSubmitRestaurant}
            onCancelEdit={() => setEditingRestaurantId(null)}
          />
          <RestaurantList
            restaurants={restaurants}
            editingRestaurantId={editingRestaurantId}
            onEdit={(restaurant) => setEditingRestaurantId(restaurant.id)}
            onDelete={handleDeleteRestaurant}
          />
        </section>
      )}
    </main>
  );
}
