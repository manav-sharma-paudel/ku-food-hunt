-- Per-account brute-force throttle
ALTER TABLE "Admin" ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Admin" ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- Session activity timestamp for the idle timeout
ALTER TABLE "AdminSession" ADD COLUMN "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
