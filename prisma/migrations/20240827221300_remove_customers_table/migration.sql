/*
  Warnings:

  - You are about to drop the column `logo` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_userId_fkey";

-- AlterTable
ALTER TABLE "stores" DROP COLUMN "logo";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT;

-- DropTable
DROP TABLE "customers";
