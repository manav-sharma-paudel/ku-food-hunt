import { Skeleton } from '../ui/skeleton';

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
      <Skeleton className="mt-4 h-[32vh] max-h-[380px] min-h-[200px] w-full rounded-card sm:mt-6" />
      <div className="relative -mt-16 px-3 sm:px-5">
        <div className="rounded-card border border-border bg-surface p-6 shadow-soft">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-11 w-44" />
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-24" />
          </div>
        </div>
        <div className="space-y-3 py-10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
