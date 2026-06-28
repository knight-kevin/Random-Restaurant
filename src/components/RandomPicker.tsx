import type { CSSProperties } from 'react';
import type { Restaurant } from '../types';

type RandomPickerProps = {
  restaurantCount: number;
  reelRestaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  isRolling: boolean;
  onPick: () => void;
  onComplete: () => void;
};

export function RandomPicker({
  restaurantCount,
  reelRestaurants,
  selectedRestaurant,
  isRolling,
  onPick,
  onComplete,
}: RandomPickerProps) {
  return (
    <section className="hero-stage" aria-labelledby="random-picker-title">
      <div className="hero-copy">
        <p className="eyebrow">今天吃哪家</p>
        <h2 id="random-picker-title">让命运先替你排个号</h2>
      </div>

      <div className="reel-shell" aria-live="polite">
        <div className="reel-window">
          <div className="reel-marker" />
          {reelRestaurants.length > 0 ? (
            <div
              className={`reel-track ${isRolling ? 'is-rolling' : ''} ${
                selectedRestaurant ? 'is-revealed' : ''
              } ${!isRolling && !selectedRestaurant ? 'is-idle' : ''}`}
            >
              {reelRestaurants.map((restaurant, index) => (
                <article
                  className={`reel-card ${selectedRestaurant && index === 0 ? 'is-final' : ''}`}
                  key={`${restaurant.id}-${index}`}
                  style={getSphereStyle(index, reelRestaurants.length, Boolean(selectedRestaurant))}
                >
                  <div
                    className="food-photo"
                    style={{ '--food-image': `url('${getRestaurantImage(restaurant)}')` } as CSSProperties}
                  >
                    <span>{restaurant.name.slice(0, 2)}</span>
                  </div>
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.address || '暂无地址'}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="reel-placeholder">准备好后，餐厅会在球体上转动起来。</div>
          )}
        </div>
      </div>

      <div className="random-controls">
        <div className="count-pill">
          <strong>{restaurantCount}</strong>
          <span>家待打卡</span>
        </div>
        <button className="random-button" type="button" onClick={onPick} disabled={isRolling}>
          {isRolling ? '正在抽取...' : '随机抽一家餐厅'}
        </button>
      </div>

      {selectedRestaurant ? (
        <article className="result-card">
          <div>
            <p className="eyebrow">锁定目的地</p>
            <h3>{selectedRestaurant.name}</h3>
          </div>
          <dl>
            <div>
              <dt>地址</dt>
              <dd>{selectedRestaurant.address || '暂无地址'}</dd>
            </div>
            <div>
              <dt>推荐菜</dt>
              <dd>{selectedRestaurant.note || '暂无推荐菜'}</dd>
            </div>
          </dl>
          <button className="success-action" type="button" onClick={onComplete}>
            完成打卡
          </button>
        </article>
      ) : (
        <div className="quiet-hint">
          {isRolling ? '餐厅正在球面上转动，马上揭晓。' : '还没有抽取餐厅。'}
        </div>
      )}
    </section>
  );
}

function getSphereStyle(index: number, total: number, revealed = false): CSSProperties {
  if (revealed && index === 0) {
    return {
      '--theta': '0deg',
      '--phi': '0deg',
      '--radius': '232px',
      '--depth-opacity': 1,
      '--depth-saturation': 1.12,
      '--card-scale': 1,
    } as CSSProperties;
  }

  const adjustedIndex = revealed ? index - 1 : index;
  const adjustedTotal = Math.max(revealed ? total - 1 : total, 1);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (adjustedIndex / Math.max(adjustedTotal - 1, 1)) * 2;
  const horizontalRadius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * adjustedIndex;
  const x = Math.cos(theta) * horizontalRadius;
  const z = Math.sin(theta) * horizontalRadius;
  const cardTheta = (Math.atan2(x, z) * 180) / Math.PI;
  const cardPhi = (Math.asin(y) * 180) / Math.PI;
  const depthOpacity = Math.max(0.24, 0.56 + z * 0.38).toFixed(2);
  const depthSaturation = Math.max(0.58, 0.82 + z * 0.24).toFixed(2);
  const cardScale = Math.max(0.62, 0.8 + z * 0.18).toFixed(2);

  return {
    '--theta': `${cardTheta.toFixed(2)}deg`,
    '--phi': `${cardPhi.toFixed(2)}deg`,
    '--radius': '214px',
    '--depth-opacity': depthOpacity,
    '--depth-saturation': depthSaturation,
    '--card-scale': cardScale,
  } as CSSProperties;
}

function getRestaurantImage(restaurant: Restaurant) {
  const text = `${restaurant.name} ${restaurant.note ?? ''} ${restaurant.address ?? ''}`;
  const imageMap: Array<[string[], string]> = [
    [['火锅', '涮', '羊蝎子'], 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=520&q=80'],
    [['烧烤', '烤', '串', '生蚝'], 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=520&q=80'],
    [['面', '拌川', '粉', '麻辣烫'], 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=520&q=80'],
    [['小龙虾', '龙虾', '虾'], 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=520&q=80'],
    [['牛', '牛肉', '牛蛙'], 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=520&q=80'],
    [['鸡', '鸡公煲', '鸭', '鹅'], 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?auto=format&fit=crop&w=520&q=80'],
    [['鱼', '海鲜', '蟹', '鲳'], 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=520&q=80'],
    [['汉堡', '肯德基', '麦当劳', '必胜客', '汉堡王'], 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=520&q=80'],
    [['砂锅', '煲', '菜馆', '小炒'], 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=520&q=80'],
  ];
  const matched = imageMap.find(([keywords]) => keywords.some((keyword) => text.includes(keyword)));

  return matched?.[1] ?? 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=520&q=80';
}
