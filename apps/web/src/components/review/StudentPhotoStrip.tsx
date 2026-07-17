import { SmartImage } from '../feedback/SmartImage';

interface StudentPhotoStripProps {
  photos: { url: string; alt?: string }[];
  onPhotoClick: (url: string) => void;
}

export function StudentPhotoStrip({ photos, onPhotoClick }: StudentPhotoStripProps) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-semibold text-muted">Student photos</h3>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {photos.slice(0, 12).map((photo, i) => (
          <button
            key={`${photo.url}-${i}`}
            onClick={() => onPhotoClick(photo.url)}
            className="shrink-0 overflow-hidden rounded-xl"
          >
            <SmartImage
              src={photo.url}
              alt={photo.alt ?? 'Student photo'}
              ratio="1/1"
              containerClassName="size-24"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
