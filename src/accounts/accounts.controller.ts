import { Controller, Get, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('/balance/:account_id')
  getBalance(@Param('account_id') account_id: number) {
    return this.accountsService.getBalance(account_id);
  }
}
