import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseFilters } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { EventDto } from './accounts.eventDTO';
import { AccountNotFoundFilter } from './account-not-found.filter';

@UseFilters(AccountNotFoundFilter)
@Controller()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('balance')
  @ApiParam({ name: 'account_id', type: Number, example: 1 })
  getBalance(@Query('account_id') accountId: string) {
    return this.accountsService.getBalance(Number(accountId));
  }

  @Post('/event')
  @ApiOperation({ summary: "Post event"})
  postEvent(@Body() body: EventDto) {
    return this.accountsService.postEvent(body);
  }

  @Post('/reset')
  @HttpCode(200)
  @ApiOperation({ summary: "Pos reset"})
  postReset() {
    return this.accountsService.postReset();
  }}
