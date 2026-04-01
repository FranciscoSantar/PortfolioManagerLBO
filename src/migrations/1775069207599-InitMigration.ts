import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1775069207599 implements MigrationInterface {
    name = 'InitMigration1775069207599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "asset_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, CONSTRAINT "UQ_87758911368763df188cb8763f7" UNIQUE ("type"), CONSTRAINT "PK_9b5ee2748943131ed9d9831e8c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "portfolio_asset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" numeric(12,6) NOT NULL, "avg_buy_price" numeric(12,4) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "portfolio_id" uuid, "asset_id" uuid, CONSTRAINT "PK_7a34cba817d89ca9851e8f39047" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "unique_asset_portfolio" ON "portfolio_asset" ("asset_id", "portfolio_id") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE TABLE "asset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticker" character varying NOT NULL, "name" character varying NOT NULL, "exchange" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "type_id" uuid, CONSTRAINT "UQ_d0578e74412d1169a279ee39249" UNIQUE ("ticker"), CONSTRAINT "UQ_119b2d1c1bdccc42057c303c44f" UNIQUE ("name"), CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_transaction_type_enum" AS ENUM('BUY', 'SELL')`);
        await queryRunner.query(`CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" numeric(12,6) NOT NULL, "transaction_type" "public"."transaction_transaction_type_enum" NOT NULL, "unit_price" numeric(12,4) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "commission_amount" numeric(12,4) NOT NULL DEFAULT '0', "portfolio_id" uuid, "asset_id" uuid, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."portfolio_base_coin_enum" AS ENUM('ARS', 'USD', 'EUR')`);
        await queryRunner.query(`CREATE TABLE "portfolio" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "base_coin" "public"."portfolio_base_coin_enum" NOT NULL, "description" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid, CONSTRAINT "PK_6936bb92ca4b7cda0ff28794e48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e0cf3de1fa085aa0dba5e4ec52" ON "portfolio" ("name", "user_id") `);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "unique_email_active_users" ON "user" ("email") WHERE deleted_at IS NULL`);
        await queryRunner.query(`ALTER TABLE "portfolio_asset" ADD CONSTRAINT "FK_652ab807c1f084496675644b8d9" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio_asset" ADD CONSTRAINT "FK_d216225603e45e1a90e5b837ab3" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset" ADD CONSTRAINT "FK_9b5ee2748943131ed9d9831e8c9" FOREIGN KEY ("type_id") REFERENCES "asset_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_c033854633dbf897560d91e80c9" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD CONSTRAINT "FK_bc2bb84a9d3e0d3aee8ca499174" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "portfolio" ADD CONSTRAINT "FK_89055af4a272bb99a3d3ed2f247" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio" DROP CONSTRAINT "FK_89055af4a272bb99a3d3ed2f247"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_bc2bb84a9d3e0d3aee8ca499174"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_c033854633dbf897560d91e80c9"`);
        await queryRunner.query(`ALTER TABLE "asset" DROP CONSTRAINT "FK_9b5ee2748943131ed9d9831e8c9"`);
        await queryRunner.query(`ALTER TABLE "portfolio_asset" DROP CONSTRAINT "FK_d216225603e45e1a90e5b837ab3"`);
        await queryRunner.query(`ALTER TABLE "portfolio_asset" DROP CONSTRAINT "FK_652ab807c1f084496675644b8d9"`);
        await queryRunner.query(`DROP INDEX "public"."unique_email_active_users"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e0cf3de1fa085aa0dba5e4ec52"`);
        await queryRunner.query(`DROP TABLE "portfolio"`);
        await queryRunner.query(`DROP TYPE "public"."portfolio_base_coin_enum"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_transaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "asset"`);
        await queryRunner.query(`DROP INDEX "public"."unique_asset_portfolio"`);
        await queryRunner.query(`DROP TABLE "portfolio_asset"`);
        await queryRunner.query(`DROP TABLE "asset_type"`);
    }

}
