import { Navigate, useParams } from 'react-router';

/**
 * SEO-friendly category URLs (/categories/momo) resolve to the canonical Explore
 * view so there's a single source of truth for listing state.
 */
export default function CategoryRedirect() {
  const { slug = '' } = useParams();
  return <Navigate to={`/explore?categories=${encodeURIComponent(slug)}`} replace />;
}
