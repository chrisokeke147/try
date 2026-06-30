import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompositePhoneRoleUnique1782950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop whatever single-column unique constraint currently sits on phoneNumber
    // (name varies depending on how it was created) so the same phone number can
    // be registered as both a rider and a driver. Identifier must be quoted via
    // format(%I) since TypeORM-generated constraint names are case-sensitive.
    await queryRunner.query(`
      DO $$
      DECLARE
        existing_constraint text;
      BEGIN
        SELECT conname INTO existing_constraint
        FROM pg_constraint
        WHERE conrelid = 'users'::regclass
          AND contype = 'u'
          AND array_length(conkey, 1) = 1
          AND conkey[1] = (
            SELECT attnum FROM pg_attribute
            WHERE attrelid = 'users'::regclass AND attname = 'phoneNumber'
          )
        LIMIT 1;

        IF existing_constraint IS NOT NULL THEN
          EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', existing_constraint);
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
