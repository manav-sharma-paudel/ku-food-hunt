import { Link } from 'react-router';

import { EmptyState } from '../components/feedback/EmptyState';
import { Seo } from '../components/seo/Seo';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 items-center px-4 sm:px-6">
      <Seo title="Page not found" noindex />
      <EmptyState
        title="Page not found"
        description="This page has wandered off. Let’s get you back to finding good food."
        action={
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/">Go home</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/explore">Explore restaurants</Link>
            </Button>
          </div>
        }
        className="mx-auto"
      />
    </div>
  );
}
