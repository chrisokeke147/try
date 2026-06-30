import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitlistEntries1783050000000 implements MigrationInterface {
  name = 'AddWaitlistEntries1783050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "waitlist_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "phoneNumber" character varying NOT NULL,
        "role" character varying NOT NULL,
        "city" character varying NOT NULL DEFAULT 'Onitsha',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_waitlist_phone_role" UNIQUE ("phoneNumber", "role"),
        CONSTRAINT "PK_waitlist_entries_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "waitlist_entries"`);
  }
}
