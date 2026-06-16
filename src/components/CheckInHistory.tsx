import type { CheckInRecord } from '../types';

type CheckInHistoryProps = {
  records: CheckInRecord[];
  onDelete: (recordId: string) => void;
  onClear: () => void;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function CheckInHistory({ records, onDelete, onClear }: CheckInHistoryProps) {
  return (
    <section className="panel" aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">足迹</p>
          <h2 id="history-title">打卡历史</h2>
        </div>
        <button
          className="danger-action"
          type="button"
          onClick={onClear}
          disabled={records.length === 0}
        >
          清空全部记录
        </button>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">还没有打卡记录。</div>
      ) : (
        <div className="history-list">
          {records.map((record) => (
            <article className="list-card" key={record.id}>
              <div>
                <h3>{record.restaurantName}</h3>
                <p>{record.address || '暂无地址'}</p>
                {record.note ? <p className="muted">{record.note}</p> : null}
                <time>{formatTime(record.checkedInAt)}</time>
              </div>
              <button className="danger-action" type="button" onClick={() => onDelete(record.id)}>
                删除
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
