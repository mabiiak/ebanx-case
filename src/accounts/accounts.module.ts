import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller'
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';

@Module({
  imports: [],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
})
export class AccountsModule {}
