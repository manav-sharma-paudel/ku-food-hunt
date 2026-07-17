/**
 * Remembers which reviews this browser has marked helpful. Votes are anonymous,
 * so the server can't tell us the caller's state on a plain GET — we persist it
 * locally to keep the button in the right state across reloads.
 */
const KEY = 'kfh-helpful-votes';

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function hasVotedHelpful(reviewId: string): boolean {
  return read().has(reviewId);
}

export function persistHelpfulVote(reviewId: string, voted: boolean): void {
  try {
    const set = read();
    if (voted) set.add(reviewId);
    else set.delete(reviewId);
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // Private mode / storage disabled — vote still registers server-side this session.
  }
}
