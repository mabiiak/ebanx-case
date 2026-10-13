import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { EventDto } from './accounts.eventDTO';

@Controller()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('/balance/:account_id')
  @ApiParam({ name: 'account_id', type: Number, example: 1 })
  getBalance(@Param('account_id', ParseIntPipe) account_id: number) {
    return this.accountsService.getBalance(account_id);
  }

  @Post('/event')
  @ApiOperation({ summary: "Post event"})
  postEvent(@Body() body: EventDto) {
    return this.accountsService.postEvent(body);
  }

  @Post('/reset')
  @ApiOperation({ summary: "Pos reset"})
  postReset() {
    return this.accountsService.postReset();
  }}
