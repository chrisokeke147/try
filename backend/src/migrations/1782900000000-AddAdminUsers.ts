import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminUsers1782900000000 implements MigrationInterface {
    name = 'AddAdminUsers1782900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "admin_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_admin_users_email" UNIQUE ("email"), CONSTRAINT "PK_admin_users_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "admin_users"`);
    }

}
