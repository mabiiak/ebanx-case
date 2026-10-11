import { Injectable } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
 import { NotFoundException } from '@nestjs/common';
import { IEvent } from './accounts.interface';
@Injectable()
export class AccountsService {
    constructor(private readonly repository: AccountsRepository) {}

    getBalance(account_id: number): number | NotFoundException {

        const accountBalance = this.repository.findById(account_id);

        if (!accountBalance) {
            throw new NotFoundException('Account not found')
        }

        return accountBalance.balance;
    postEvent({ type, amount, destination, origin }: IEvent) {
        const account = this.repository.findById(destination);

        if (type === 'deposit') {

            if (!account) {
                this.repository.save({ account_id: destination, balance: amount });
            } else {
                this.repository.save({ account_id: destination, balance: account.balance + amount });
            }
            
            const updatedAccount = this.repository.findById(destination);
            if (!updatedAccount) {
                throw new NotFoundException('Account not found');
            }

            return { destination: {id: updatedAccount.account_id, balance: updatedAccount.balance} }
        }
    }
}
