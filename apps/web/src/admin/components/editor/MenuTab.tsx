import type { AdminRestaurantDto } from '@ku-food-hunt/shared';
import { useMutation } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../../lib/cn';
import { adminEndpoints } from '../../api/adminEndpoints';
import { useSaveRestaurant } from '../../pages/AdminRestaurantEditor';
import { adminInput } from '../adminStyles';
import { SaveButton } from './SaveButton';

interface ItemState {
  name: string;
  description: string;
  priceNpr: string;
  isAvailable: boolean;
  isPopular: boolean;
  isVegetarian: boolean;
}
interface CategoryState {
  name: string;
  items: ItemState[];
}

const blankItem = (): ItemState => ({
  name: '',
  description: '',
  priceNpr: '',
  isAvailable: true,
  isPopular: false,
  isVegetarian: false,
});

function initialMenu(restaurant: AdminRestaurantDto): CategoryState[] {
  return restaurant.menu.map((c) => ({
    name: c.name,
    items: c.items.map((it) => ({
      name: it.name,
      description: it.description ?? '',
      priceNpr: it.priceNpr.toString(),
      isAvailable: it.isAvailable,
      isPopular: it.isPopular,
      isVegetarian: it.isVegetarian,
    })),
  }));
}

export function MenuTab({ restaurant }: { restaurant: AdminRestaurantDto }) {
  const onSaved = useSaveRestaurant(restaurant.id);
  const [cats, setCats] = useState<CategoryState[]>(() => initialMenu(restaurant));

  const mapCat = (ci: number, fn: (c: CategoryState) => CategoryState) =>
    setCats((prev) => prev.map((c, i) => (i === ci ? fn(c) : c)));
  const setCatName = (ci: number, name: string) => mapCat(ci, (c) => ({ ...c, name }));
  const removeCat = (ci: number) => setCats((prev) => prev.filter((_, i) => i !== ci));
  const addCat = () => setCats((prev) => [...prev, { name: '', items: [blankItem()] }]);
  const addItem = (ci: number) => mapCat(ci, (c) => ({ ...c, items: [...c.items, blankItem()] }));
  const removeItem = (ci: number, ii: number) =>
    mapCat(ci, (c) => ({ ...c, items: c.items.filter((_, i) => i !== ii) }));
  const patchItem = (ci: number, ii: number, patch: Partial<ItemState>) =>
    mapCat(ci, (c) => ({
      ...c,
      items: c.items.map((it, i) => (i === ii ? { ...it, ...patch } : it)),
    }));
  const moveItem = (ci: number, ii: number, dir: -1 | 1) =>
    mapCat(ci, (c) => {
      const target = ii + dir;
      if (target < 0 || target >= c.items.length) return c;
      const items = c.items.slice();
      const a = items[ii];
      const b = items[target];
      if (!a || !b) return c;
      items[ii] = b;
      items[target] = a;
      return { ...c, items };
    });

  const save = useMutation({
    mutationFn: () => {
      const categories = cats
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          items: c.items
            .filter((it) => it.name.trim())
            .map((it) => ({
              name: it.name.trim(),
              description: it.description.trim() || null,
              priceNpr: Math.max(0, Math.round(Number(it.priceNpr) || 0)),
              isAvailable: it.isAvailable,
              isPopular: it.isPopular,
              isVegetarian: it.isVegetarian,
            })),
        }));
      return adminEndpoints.putMenu(restaurant.id, { categories });
    },
    onSuccess: onSaved,
  });

  return (
    <div className="max-w-2xl space-y-4">
      {cats.map((cat, ci) => (
        <div key={ci} className="rounded-card border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <input
              value={cat.name}
              placeholder="Category name (e.g. Momo)"
              onChange={(e) => setCatName(ci, e.target.value)}
              className={cn(adminInput, 'font-medium')}
            />
            <button
              type="button"
              onClick={() => removeCat(ci)}
              className="shrink-0 text-muted hover:text-danger"
              aria-label="Remove category"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <div className="space-y-2">
            {cat.items.map((item, ii) => (
              <div key={ii} className="rounded-btn border border-border bg-surface-2/30 p-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={item.name}
                    placeholder="Dish name"
                    onChange={(e) => patchItem(ci, ii, { name: e.target.value })}
                    className={cn(adminInput, 'flex-1 py-1.5')}
                  />
                  <input
                    value={item.priceNpr}
                    type="number"
                    inputMode="numeric"
                    placeholder="Rs."
                    onChange={(e) => patchItem(ci, ii, { priceNpr: e.target.value })}
                    className={cn(adminInput, 'w-24 py-1.5')}
                  />
                  <button
                    type="button"
                    onClick={() => moveItem(ci, ii, -1)}
                    disabled={ii === 0}
                    className="text-muted hover:text-foreground disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(ci, ii, 1)}
                    disabled={ii === cat.items.length - 1}
                    className="text-muted hover:text-foreground disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(ci, ii)}
                    className="text-muted hover:text-danger"
                    aria-label="Remove item"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <input
                  value={item.description}
                  placeholder="Short description (optional)"
                  onChange={(e) => patchItem(ci, ii, { description: e.target.value })}
                  className={cn(adminInput, 'mt-2 py-1.5 text-xs')}
                />
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <Toggle
                    label="Available"
                    checked={item.isAvailable}
                    onChange={(v) => patchItem(ci, ii, { isAvailable: v })}
                  />
                  <Toggle
                    label="Popular"
                    checked={item.isPopular}
                    onChange={(v) => patchItem(ci, ii, { isPopular: v })}
                  />
                  <Toggle
                    label="Vegetarian"
                    checked={item.isVegetarian}
                    onChange={(v) => patchItem(ci, ii, { isVegetarian: v })}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addItem(ci)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-strong hover:underline"
          >
            <Plus className="size-3.5" /> Add dish
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addCat}
        className="inline-flex items-center gap-1.5 rounded-btn border border-dashed border-border px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2"
      >
        <Plus className="size-4" /> Add category
      </button>

      <div className="border-t border-border pt-4">
        <SaveButton
          onSave={() => save.mutate()}
          isPending={save.isPending}
          isSuccess={save.isSuccess}
          error={save.error}
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-primary"
      />
      {label}
    </label>
  );
}
