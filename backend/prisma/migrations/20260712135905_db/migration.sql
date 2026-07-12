-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "insuranceSelected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "checkInTime" TEXT DEFAULT '14:00',
ADD COLUMN     "checkOutTime" TEXT DEFAULT '12:00';
