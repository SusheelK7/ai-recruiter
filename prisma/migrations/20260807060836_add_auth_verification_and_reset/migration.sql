-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPasswordResetSentAt" TIMESTAMP(3),
ADD COLUMN     "lastVerificationSentAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPasswordResetSentAt" TIMESTAMP(3),
ADD COLUMN     "lastVerificationSentAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetAt" TIMESTAMP(3);
