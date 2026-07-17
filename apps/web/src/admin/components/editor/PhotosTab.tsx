import { IMAGE_TYPES, type AdminRestaurantDto, type ImageTypeValue } from '@ku-food-hunt/shared';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { useRef } from 'react';

import { ApiError } from '../../../api/client';
import { SmartImage } from '../../../components/feedback/SmartImage';
import { cn } from '../../../lib/cn';
import { adminEndpoints } from '../../api/adminEndpoints';
import { useSaveRestaurant } from '../../pages/AdminRestaurantEditor';
import { adminInput } from '../adminStyles';

const TYPE_LABEL: Record<ImageTypeValue, string> = {
  COVER: 'Cover',
  GALLERY: 'Gallery',
  MENU_SCAN: 'Menu scan',
};

export function PhotosTab({ restaurant }: { restaurant: AdminRestaurantDto }) {
  const onSaved = useSaveRestaurant(restaurant.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const images = restaurant.images;

  const addPhoto = useMutation({
    mutationFn: async (file: File) => {
      const { url } = await adminEndpoints.uploadPhoto(file);
      return adminEndpoints.addImage(restaurant.id, {
        url,
        type: images.length === 0 ? 'COVER' : 'GALLERY',
        alt: `Photo of ${restaurant.name}`,
      });
    },
    onSuccess: onSaved,
  });
  const updateImage = useMutation({
    mutationFn: (v: { imageId: string; body: { alt?: string; type?: ImageTypeValue } }) =>
      adminEndpoints.updateImage(restaurant.id, v.imageId, v.body),
    onSuccess: onSaved,
  });
  const deleteImage = useMutation({
    mutationFn: (imageId: string) => adminEndpoints.deleteImage(restaurant.id, imageId),
    onSuccess: onSaved,
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminEndpoints.reorderImages(restaurant.id, ids),
    onSuccess: onSaved,
  });

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const ids = images.map((i) => i.id);
    const a = ids[index];
    const b = ids[target];
    if (!a || !b) return;
    ids[index] = b;
    ids[target] = a;
    reorder.mutate(ids);
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    for (const file of files) await addPhoto.mutateAsync(file).catch(() => {});
  };

  const uploadError = addPhoto.error;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={addPhoto.isPending}
          className="inline-flex items-center gap-2 rounded-btn border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 disabled:opacity-50"
        >
          {addPhoto.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          Upload photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFiles}
          className="hidden"
        />
        {uploadError != null && (
          <span className="text-xs text-danger">
            {uploadError instanceof ApiError ? uploadError.message : 'Upload failed.'}
          </span>
        )}
      </div>

      {images.length === 0 ? (
        <p className="rounded-card border border-dashed border-border py-12 text-center text-sm text-muted">
          No photos yet. The first upload becomes the cover.
        </p>
      ) : (
        <div className="space-y-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="flex gap-3 rounded-card border border-border bg-surface p-3"
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-btn">
                <SmartImage
                  src={img.url}
                  alt={img.alt ?? ''}
                  ratio="1/1"
                  containerClassName="size-24"
                />
                {img.type === 'COVER' && (
                  <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-primary-strong px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    <Star className="size-2.5 fill-current" /> Cover
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  defaultValue={img.alt ?? ''}
                  placeholder="Alt text (describe the photo)"
                  onBlur={(e) => {
                    if (e.target.value !== (img.alt ?? ''))
                      updateImage.mutate({ imageId: img.id, body: { alt: e.target.value } });
                  }}
                  className={cn(adminInput, 'py-1.5 text-xs')}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={img.type}
                    onChange={(e) =>
                      updateImage.mutate({
                        imageId: img.id,
                        body: { type: e.target.value as ImageTypeValue },
                      })
                    }
                    className={cn(adminInput, 'w-32 py-1.5 text-xs')}
                  >
                    {IMAGE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>

                  <div className="ml-auto flex items-center gap-1">
                    <IconBtn label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowLeft className="size-4" />
                    </IconBtn>
                    <IconBtn
                      label="Move later"
                      disabled={i === images.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowRight className="size-4" />
                    </IconBtn>
                    <IconBtn
                      label="Delete photo"
                      danger
                      onClick={() => {
                        if (confirm('Delete this photo?')) deleteImage.mutate(img.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  danger,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'rounded-btn p-1.5 transition-colors disabled:opacity-30',
        danger
          ? 'text-muted hover:bg-danger/10 hover:text-danger'
          : 'text-muted hover:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}
