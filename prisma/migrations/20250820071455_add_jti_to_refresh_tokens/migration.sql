/*
  Warnings:

  - A unique constraint covering the columns `[jti]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jti` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/

-- Clear existing refresh tokens to avoid conflicts
DELETE FROM `refresh_tokens`;

-- AlterTable
ALTER TABLE `refresh_tokens` ADD COLUMN `jti` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `refresh_tokens_jti_key` ON `refresh_tokens`(`jti`);

-- CreateIndex
CREATE INDEX `idx_jti` ON `refresh_tokens`(`jti`);
