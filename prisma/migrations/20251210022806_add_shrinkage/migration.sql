-- AlterTable
ALTER TABLE "simulations" ADD COLUMN     "shrinkageId" TEXT;

-- CreateTable
CREATE TABLE "shrinkage_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL,

    CONSTRAINT "shrinkage_profiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_shrinkageId_fkey" FOREIGN KEY ("shrinkageId") REFERENCES "shrinkage_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
