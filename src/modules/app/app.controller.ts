import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { AppService } from './app.service';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @ApiOperation({ operationId: 'AppGet' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
