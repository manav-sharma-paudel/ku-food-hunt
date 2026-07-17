const nprFormatter = new Intl.NumberFormat('en-IN');

/** "Rs. 1,25,000" — lakh-style digit grouping, as used in Nepal. */
export function formatNpr(amount: number): string {
  return `Rs. ${nprFormatter.format(amount)}`;
}
