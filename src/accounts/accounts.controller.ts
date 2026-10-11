import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { EventDto } from './accounts.eventDTO';

@Controller()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('/balance/:account_id')
  getBalance(@Param('account_id') account_id: number) {
    return this.accountsService.getBalance(account_id);
  }

  @Post('/event')
  @ApiOperation({ summary: "Pos event"})
  postEvent(@Body() body: EventDto) {
    return this.accountsService.postEvent(body);
  }
}
