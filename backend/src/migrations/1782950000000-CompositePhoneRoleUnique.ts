import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompositePhoneRoleUnique1782950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the single-column unique constraint on phoneNumber so the same
    // phone number can be registered as both a rider and a driver.
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_a000cca60bcf04454e727699490"`);
    // Also try the name TypeORM auto-generates in case the above differs.
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conrelid = 'users'::regclass
            AND contype = 'u'
            AND conname NOT IN ('UQ_users_phone_role', 'PK_a3ffb1c0c8416b9fc6f907b7433')
            AND array_length(conkey, 1) = 1
            AND conkey[1] = (
              SELECT attnum FROM pg_attribute
              WHERE attrelid = 'users'::regclass AND attname = 'phoneNumber'
            )
        ) THEN
          EXECUTE (
            SELECT 'ALTER TABLE users DROP CONSTRAINT ' || conname
            FROM pg_constraint
            WHERE conrelid = 'users'::regclass
              AND contype = 'u'
              AND conname NOT IN ('UQ_users_phone_role', 'PK_a3ffb1c0c8416b9fc6f907b7433')
              AND array_length(conkey, 1) = 1
              AND conkey[1] = (
                SELECT attnum FROM pg_attribute
                WHERE attrelid = 'users'::regclass AND attname = 'phoneNumber'
              )
          );
        END IF;
      END $$
    `);

    // Add composite unique: one phone number per role (rider OR driver, not both).
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_phone_role" UNIQUE ("phoneNumber", "role")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_phone_role"`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phoneNumber")`);
  }
}
