/** Visually hidden until keyboard-focused; jumps past the nav to main content. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-btn bg-primary-strong px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]"
    >
      Skip to content
    </a>
  );
}
