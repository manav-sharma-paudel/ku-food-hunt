import type { ReviewDto } from '@ku-food-hunt/shared';
import { ThumbsUp } from 'lucide-react';
import { useState } from 'react';

import { useVoteHelpful } from '../../api/queries';
import { cn } from '../../lib/cn';
import { formatRelativeDate } from '../../lib/date';
import { hasVotedHelpful, persistHelpfulVote } from '../../lib/helpful-votes';
import { SmartImage } from '../feedback/SmartImage';
import { RatingStars } from '../restaurant/RatingStars';

interface ReviewCardProps {
  review: ReviewDto;
  onPhotoClick?: (url: string) => void;
}

export function ReviewCard({ review, onPhotoClick }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const name = review.authorName || 'KU Student';
  const initial = name.charAt(0).toUpperCase();
  const isLong = review.body.length > 240;

  const vote = useVoteHelpful();
  const [voted, setVoted] = useState(() => hasVotedHelpful(review.id));
  const [count, setCount] = useState(review.helpfulCount);

  const handleVote = () => {
    if (vote.isPending) return;
    const prevVoted = voted;
    const prevCount = count;
    const next = !voted;

    // Optimistic — reconcile with the server's authoritative count on success.
    setVoted(next);
    setCount(Math.max(0, prevCount + (next ? 1 : -1)));
    persistHelpfulVote(review.id, next);

    vote.mutate(review.id, {
      onSuccess: (data) => {
        setVoted(data.voted);
        setCount(data.helpfulCount);
        persistHelpfulVote(review.id, data.voted);
      },
      onError: () => {
        setVoted(prevVoted);
        setCount(prevCount);
        persistHelpfulVote(review.id, prevVoted);
      },
    });
  };

  return (
    <article className="border-b border-border py-5 last:border-0">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary-strong">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted">{formatRelativeDate(review.createdAt)}</p>
        </div>
        <RatingStars value={review.rating} className="ml-auto" />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/90">
        {isLong && !expanded ? `${review.body.slice(0, 240)}… ` : review.body}
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="font-medium text-primary-strong hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      {review.images.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.images.map((img) => (
            <button
              key={img.id}
              onClick={() => onPhotoClick?.(img.url)}
              className="overflow-hidden rounded-lg"
            >
              <SmartImage
                src={img.url}
                alt={`Photo from ${name}'s review`}
                ratio="1/1"
                containerClassName="size-20"
              />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3.5">
        <button
          type="button"
          onClick={handleVote}
          disabled={vote.isPending}
          aria-pressed={voted}
          aria-label={voted ? 'Remove your helpful vote' : 'Mark this review helpful'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
            voted
              ? 'border-primary/30 bg-primary/10 text-primary-strong'
              : 'border-border text-muted hover:bg-surface-2 hover:text-foreground',
          )}
        >
          <ThumbsUp className={cn('size-3.5', voted && 'fill-current')} />
          {count > 0 ? `Helpful · ${count}` : 'Helpful'}
        </button>
      </div>
    </article>
  );
}
