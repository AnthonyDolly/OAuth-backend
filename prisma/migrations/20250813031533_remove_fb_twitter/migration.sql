/*
  Warnings:

  - The values [facebook,twitter] on the enum `oauth_accounts_provider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `oauth_accounts` MODIFY `provider` ENUM('google', 'microsoft', 'github', 'linkedin') NOT NULL;
