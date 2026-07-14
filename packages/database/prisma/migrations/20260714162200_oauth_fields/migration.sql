-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "provider_id" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_provider_id_key" ON "users"("provider", "provider_id");
