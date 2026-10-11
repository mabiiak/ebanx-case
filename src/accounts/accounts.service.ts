import { Injectable } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { NotFoundException } from '@nestjs/common';
import { error } from 'console';
@Injectable()
export class AccountsService {
    constructor(private readonly repository: AccountsRepository) {}

    getBalance(account_id: number): number | NotFoundException {

        const accountBalance = this.repository.findById(account_id);

        if (!accountBalance) {
            throw new NotFoundException('Account not found')
        }

        return accountBalance.balance;
    }
}
