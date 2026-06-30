import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1782749268766 implements MigrationInterface {
    name = 'InitialSchema1782749268766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Needed for uuid_generate_v4() below — the postgis/postgis image used in
        // infra/docker/docker-compose.yml enables this cluster-wide by default, but
        // don't assume that holds on other Postgres providers.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "balance" double precision NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2ecdb33f23e9a6fc392025c0b97" UNIQUE ("userId"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."ledger_entries_type_enum" AS ENUM('rider_topup', 'trip_fare_debit', 'driver_earning_credit', 'commission_debit', 'commission_credit_try', 'driver_withdrawal')`);
        await queryRunner.query(`CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "walletId" character varying NOT NULL, "type" "public"."ledger_entries_type_enum" NOT NULL, "amount" double precision NOT NULL, "tripId" character varying, "externalReference" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6cae70a89c769af848b94a16ae2" UNIQUE ("externalReference"), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('rider', 'driver', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."users_kycstatus_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phoneNumber" character varying NOT NULL, "fullName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "profilePhotoUrl" text, "tricyclePlateNumber" character varying, "tricyclePlatePhotoUrl" text, "driverLicenseNumber" character varying, "nin" character varying, "city" character varying, "levyReceiptUrl" character varying, "kycStatus" "public"."users_kycstatus_enum" DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."trips_status_enum" AS ENUM('requested', 'matched', 'driver_enroute', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "public"."trips_paymentmethod_enum" AS ENUM('wallet', 'cash')`);
        await queryRunner.query(`CREATE TABLE "trips" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "riderId" character varying NOT NULL, "driverId" character varying, "status" "public"."trips_status_enum" NOT NULL DEFAULT 'requested', "paymentMethod" "public"."trips_paymentmethod_enum" NOT NULL, "pickupLat" double precision NOT NULL, "pickupLng" double precision NOT NULL, "dropoffLat" double precision NOT NULL, "dropoffLng" double precision NOT NULL, "estimatedFare" double precision, "finalFare" double precision, "commissionAmount" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "trips"`);
        await queryRunner.query(`DROP TYPE "public"."trips_paymentmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."trips_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_kycstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "ledger_entries"`);
        await queryRunner.query(`DROP TYPE "public"."ledger_entries_type_enum"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
    }

}
