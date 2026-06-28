import { FormEvent, useEffect, useState } from 'react';
import type { Restaurant, RestaurantInput } from '../types';

type RestaurantFormProps = {
  editingRestaurant?: Restaurant | null;
  onSubmit: (input: RestaurantInput) => boolean;
  onCancelEdit?: () => void;
};

export function RestaurantForm({
  editingRestaurant,
  onSubmit,
  onCancelEdit,
}: RestaurantFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    setName(editingRestaurant?.name ?? '');
    setAddress(editingRestaurant?.address ?? '');
    setNote(editingRestaurant?.note ?? '');
  }, [editingRestaurant]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submitted = onSubmit({
      name: name.trim(),
      address: address.trim() || undefined,
      note: note.trim() || undefined,
    });

    if (submitted && !editingRestaurant) {
      setName('');
      setAddress('');
      setNote('');
    }
  }

  return (
    <form className="restaurant-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>餐厅名称 *</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：餐厅 100"
            required
          />
        </label>
        <label>
          <span>地址</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="可选"
          />
        </label>
      </div>
      <label>
        <span>备注</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="口味、排队情况、推荐菜等"
          rows={3}
        />
      </label>
      <div className="form-actions">
        <button className="secondary-action" type="submit">
          {editingRestaurant ? '保存修改' : '添加餐厅'}
        </button>
        {editingRestaurant && onCancelEdit ? (
          <button className="ghost-action" type="button" onClick={onCancelEdit}>
            取消编辑
          </button>
        ) : null}
      </div>
    </form>
  );
}
