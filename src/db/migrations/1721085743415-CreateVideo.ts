import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVideo1721085743415 implements MigrationInterface {
  name = 'CreateVideo1721085743415';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "video" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "url" character varying NOT NULL, "lastDiarizationJobId" character varying NOT NULL, CONSTRAINT "PK_1a2f3856250765d72e7e1636c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea76b332802cccfa1e19c80033" ON "video" ("createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ea76b332802cccfa1e19c80033"`,
    );
    await queryRunner.query(`DROP TABLE "video"`);
  }
}
