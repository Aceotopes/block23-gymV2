-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'STAFF', 'MANAGER');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('STANDARD_PRODUCT', 'SERVING_BASED_PRODUCT');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('MEMBER', 'WALK_IN');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AdjustmentReasonCategory" AS ENUM ('DAMAGE', 'EXPIRY', 'THEFT', 'COUNT_CORRECTION', 'NATURAL_WASTAGE', 'PROMOTION', 'OTHER', 'FORCED_SALE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CLIENT_TRANSACTION', 'POS_SALE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'GCASH', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "VoidReasonCategory" AS ENUM ('DUPLICATE_ENTRY', 'WRONG_AMOUNT', 'WRONG_PRODUCT', 'CLIENT_CANCELLED', 'SYSTEM_ERROR', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('MEMBERSHIP', 'WALK_IN_FEE', 'PRODUCT');

-- CreateTable
CREATE TABLE "gym" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact_info" TEXT NOT NULL,
    "default_walkin_fee" DECIMAL(12,2) NOT NULL,
    "expiration_warning_days" INTEGER NOT NULL,
    "walkin_inactivity_threshold_days" INTEGER NOT NULL DEFAULT 7,
    "member_inactivity_warning_days" INTEGER NOT NULL DEFAULT 14,
    "walkin_conversion_prompt_visits" INTEGER NOT NULL DEFAULT 5,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "contact_number" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "date_registered" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plan" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "default_price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "membership_plan_id" UUID,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "price_paid" DECIMAL(12,2) NOT NULL,
    "renewed_from_membership_id" UUID,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "time_in" TIME NOT NULL,
    "time_out" TIME,
    "visit_type" "VisitType" NOT NULL,
    "membership_id" UUID,
    "fee_charged" DECIMAL(12,2),
    "created_by" UUID NOT NULL,
    "correction_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "selling_price" DECIMAL(12,2) NOT NULL,
    "cost_price" DECIMAL(12,2),
    "image_url" TEXT,
    "current_stock" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "servings_per_container" INTEGER,
    "container_selling_price" DECIMAL(12,2),
    "low_stock_threshold" DECIMAL(12,2) NOT NULL,
    "reorder_point" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transaction" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity_delta" DECIMAL(12,2) NOT NULL,
    "resulting_stock" DECIMAL(12,2) NOT NULL,
    "reference_transaction_line_item_id" UUID,
    "adjustment_reason_category" "AdjustmentReasonCategory",
    "total_restock_cost" DECIMAL(12,2),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "client_id" UUID,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "void_reason_category" "VoidReasonCategory",
    "void_reason_note" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_line_item" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "reference_membership_id" UUID,
    "reference_product_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "cost_price_snapshot" DECIMAL(12,2),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "fee_override_note" TEXT,

    CONSTRAINT "transaction_line_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_gym_id_idx" ON "user"("gym_id");

-- CreateIndex
CREATE INDEX "client_gym_id_idx" ON "client"("gym_id");

-- CreateIndex
CREATE INDEX "client_gym_id_deleted_at_idx" ON "client"("gym_id", "deleted_at");

-- CreateIndex
CREATE INDEX "membership_plan_gym_id_idx" ON "membership_plan"("gym_id");

-- CreateIndex
CREATE INDEX "membership_gym_id_idx" ON "membership"("gym_id");

-- CreateIndex
CREATE INDEX "membership_client_id_idx" ON "membership"("client_id");

-- CreateIndex
CREATE INDEX "membership_client_id_end_date_idx" ON "membership"("client_id", "end_date");

-- CreateIndex
CREATE INDEX "attendance_gym_id_idx" ON "attendance"("gym_id");

-- CreateIndex
CREATE INDEX "attendance_client_id_idx" ON "attendance"("client_id");

-- CreateIndex
CREATE INDEX "attendance_gym_id_visit_date_idx" ON "attendance"("gym_id", "visit_date");

-- CreateIndex
CREATE INDEX "product_category_gym_id_idx" ON "product_category"("gym_id");

-- CreateIndex
CREATE INDEX "product_gym_id_idx" ON "product"("gym_id");

-- CreateIndex
CREATE INDEX "product_category_id_idx" ON "product"("category_id");

-- CreateIndex
CREATE INDEX "product_gym_id_deleted_at_idx" ON "product"("gym_id", "deleted_at");

-- CreateIndex
CREATE INDEX "inventory_transaction_gym_id_idx" ON "inventory_transaction"("gym_id");

-- CreateIndex
CREATE INDEX "inventory_transaction_product_id_idx" ON "inventory_transaction"("product_id");

-- CreateIndex
CREATE INDEX "inventory_transaction_reference_transaction_line_item_id_idx" ON "inventory_transaction"("reference_transaction_line_item_id");

-- CreateIndex
CREATE INDEX "transaction_gym_id_idx" ON "transaction"("gym_id");

-- CreateIndex
CREATE INDEX "transaction_client_id_idx" ON "transaction"("client_id");

-- CreateIndex
CREATE INDEX "transaction_gym_id_transaction_date_idx" ON "transaction"("gym_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transaction_line_item_gym_id_idx" ON "transaction_line_item"("gym_id");

-- CreateIndex
CREATE INDEX "transaction_line_item_transaction_id_idx" ON "transaction_line_item"("transaction_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_plan" ADD CONSTRAINT "membership_plan_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_membership_plan_id_fkey" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_renewed_from_membership_id_fkey" FOREIGN KEY ("renewed_from_membership_id") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transaction" ADD CONSTRAINT "inventory_transaction_reference_transaction_line_item_id_fkey" FOREIGN KEY ("reference_transaction_line_item_id") REFERENCES "transaction_line_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_line_item" ADD CONSTRAINT "transaction_line_item_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_line_item" ADD CONSTRAINT "transaction_line_item_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_line_item" ADD CONSTRAINT "transaction_line_item_reference_membership_id_fkey" FOREIGN KEY ("reference_membership_id") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_line_item" ADD CONSTRAINT "transaction_line_item_reference_product_id_fkey" FOREIGN KEY ("reference_product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
