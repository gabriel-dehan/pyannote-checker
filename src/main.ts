import 'reflect-metadata';

import datasource from 'config/data-source';
import { useRepositories } from 'config/repositories-config';
import { routingConfigs } from 'config/routing-config';
import { useMiddlewares } from 'config/server-middlewares';
import * as dotenv from 'dotenv';
import Koa from 'koa';
import render from 'koa-ejs';
import path from 'path';
import { useContainer, useKoaServer } from 'routing-controllers';
import { getConfig } from 'src/utils/config';

dotenv.config();

async function bootstrap() {
  try {
    await datasource.initialize();
  } catch (e) {
    console.error('Error during Data Source initialization', e);
  }

  const config = getConfig();
  const koa: Koa = new Koa();

  useMiddlewares(koa);

  // DI from typedi
  const containerWithRepositories = useRepositories();
  useContainer(containerWithRepositories);

  const app: Koa = useKoaServer<Koa>(koa, routingConfigs);

  // Setup views
  render(app, {
    root: path.join(__dirname, 'views'),
    layout: 'layout',
    viewExt: 'ejs',
    cache: false,
    debug: false,
  });

  // TODO: Register cron jobs
  // cron.start();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

void bootstrap();
