import { Context } from 'koa';
import { Controller, Ctx, Get } from 'routing-controllers';
import { Service } from 'typedi';

@Controller()
@Service()
export class PageController {
  constructor() {}

  // Main page
  @Get('/')
  async home(@Ctx() ctx: Context) {
    await ctx.render('pages/home', { title: 'Diarize' });

    return ctx.body;
  }
}
