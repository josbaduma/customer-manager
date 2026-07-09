/*
  Warnings:

  - You are about to drop the column `bill_id` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_bill_id_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "bill_id",
ADD COLUMN     "store_id" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
