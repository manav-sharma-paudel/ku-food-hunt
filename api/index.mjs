// Vercel serverless entry — re-exports the tsup-bundled Express app.
// buildCommand in vercel.json runs `prisma generate && tsup` first,
// producing apps/api/dist/index.js.
import app from '../apps/api/dist/index.js';
export default app;
