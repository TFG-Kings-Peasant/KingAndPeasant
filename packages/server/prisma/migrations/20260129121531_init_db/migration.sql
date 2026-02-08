/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastname` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idUser` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    DROP COLUMN `lastname`,
    ADD COLUMN `games` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `idUser` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `losses` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `wins` INTEGER NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (`idUser`);

-- CreateIndex
CREATE UNIQUE INDEX `User_name_key` ON `User`(`name`);
