import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuspensionAndCancelledBy1783000000000 implements MigrationInterface {
  name = 'AddSuspensionAndCancelledBy1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "isSuspended" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "trips" ADD COLUMN "cancelledBy" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN "cancelledBy"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isSuspended"`);
  }
}
