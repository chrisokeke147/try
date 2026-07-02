import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRatingAndFraudFlags1783100000000 implements MigrationInterface {
  name = 'AddRatingAndFraudFlags1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" ADD COLUMN "riderRating" integer`);
    await queryRunner.query(`ALTER TABLE "trips" ADD COLUMN "riderComment" text`);

    await queryRunner.query(`
      CREATE TABLE "fraud_flags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "userId" character varying,
        "tripId" character varying,
        "reason" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fraud_flags_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "fraud_flags"`);
    await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN "riderComment"`);
    await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN "riderRating"`);
  }
}
