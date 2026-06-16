import type { Restaurant } from '../types';

type RestaurantListProps = {
  restaurants: Restaurant[];
  editingRestaurantId?: string | null;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (restaurantId: string) => void;
};

export function RestaurantList({
  restaurants,
  editingRestaurantId,
  onEdit,
  onDelete,
}: RestaurantListProps) {
  if (restaurants.length === 0) {
    return <div className="empty-state">当前没有可抽取的餐厅，请先添加餐厅。</div>;
  }

  return (
    <div className="restaurant-list">
      {restaurants.map((restaurant) => (
        <article
          className={`list-card ${editingRestaurantId === restaurant.id ? 'is-editing' : ''}`}
          key={restaurant.id}
        >
          <div>
            <h3>{restaurant.name}</h3>
            <p>{restaurant.address || '暂无地址'}</p>
            {restaurant.note ? <p className="muted">{restaurant.note}</p> : null}
          </div>
          <div className="row-actions">
            <button className="ghost-action" type="button" onClick={() => onEdit(restaurant)}>
              编辑
            </button>
            <button className="danger-action" type="button" onClick={() => onDelete(restaurant.id)}>
              删除
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
