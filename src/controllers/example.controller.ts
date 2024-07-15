import { Authorized, Body, Get, JsonController } from 'routing-controllers';
import { User } from 'src/entities/user.entity';
import { ExampleService } from 'src/services/example.service';
import { Service } from 'typedi';

@JsonController('/examples')
@Service()
export class ExamplesController {
  constructor(private exampleService: ExampleService) {}

  @Get('/')
  @Authorized()
  async index(user: User, @Body() input: Record<string, any>) {
    return await this.exampleService.someMethod(user.id);
  }

  @Get('/no-auth')
  async noAuth(@Body() input: Record<string, any>) {
    return await this.exampleService.someMethod(undefined);
  }
}
