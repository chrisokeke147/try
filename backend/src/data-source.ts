import 'dotenv/config';
import { DataSource } from 'typeorm';

// CLI-only config for generating/running migrations — kept separate from
// app.module.ts's TypeOrmModule.forRoot() because the TypeORM CLI needs a
// plain DataSource instance, not a NestJS-wrapped one.
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // __dirname-relative (not 'src/...') so this resolves correctly both via
  // ts-node locally (__dirname is .../src) and in the production image,
  // which only ships compiled dist/ (no src/) — a hardcoded 'src/...' glob
  // silently matched zero files there, making migration:run a no-op.
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
