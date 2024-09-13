/*
  Warnings:

  - You are about to drop the column `variantName` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `variantValue` on the `product_variants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "variantName",
DROP COLUMN "variantValue";

-- CreateTable
CREATE TABLE "product_variant_options" (
    "id" TEXT NOT NULL,
    "variantTypeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "product_variant_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_types" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "variant_types_userId_name_key" ON "variant_types"("userId", "name");

-- AddForeignKey
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_variantTypeId_fkey" FOREIGN KEY ("variantTypeId") REFERENCES "variant_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_types" ADD CONSTRAINT "variant_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
