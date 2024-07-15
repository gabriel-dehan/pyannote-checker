import datasource from 'config/data-source';
import { seedApplication } from 'src/db/seeds';

(async () => {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('This script should only be run in development mode');
  }

  process.stdout.write('Establishing connection... ');
  void datasource.initialize().then(async () => {
    process.stdout.write('\x1b[32mOK\x1b[39m\x1b[0m\n');

    process.stdout.write('Dropping database... ');
    await datasource.dropDatabase();
    process.stdout.write('\x1b[32mOK\x1b[39m\x1b[0m\n');

    process.stdout.write('Running migrations... ');
    await datasource.runMigrations();
    process.stdout.write('\x1b[32mOK\x1b[39m\x1b[0m\n');

    process.stdout.write('Database populate... ');
    await seedApplication(datasource);
    process.stdout.write('\x1b[32mOK\x1b[39m\x1b[0m\n');

    process.stdout.write('Closing setup datasource... ');
    await datasource.destroy();
    process.stdout.write('\x1b[32mOK\x1b[39m\x1b[0m\n');
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
