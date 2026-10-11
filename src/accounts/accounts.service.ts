import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
 import { NotFoundException } from '@nestjs/common';
import { IBalance, IEvent } from './accounts.interface';
import { ExceptionHandler } from '@nestjs/core/errors/exception-handler.js';

@Injectable()
export class AccountsService {
    constructor(private readonly repository: AccountsRepository) {}

    getBalance(account_id: number): IBalance | NotFoundException {        
        const accountBalance = this.repository.findById(account_id);

        if (!accountBalance) {
            throw new NotFoundException('Account not found');
        }

        return { balance: accountBalance.balance};
    }

    checkExistAccount(account_id: number) {
        const account = this.repository.findById(account_id);

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        return account;
    }

    deposit(amount: number, destination: number) {
        const account = this.repository.findById(destination);

        if (!account) {
            this.repository.save({ account_id: destination, balance: amount });
        } else {
            this.repository.save({ account_id: destination, balance: account.balance + amount });
        }
            
        const updatedAccount = this.checkExistAccount(destination);
        return { destination: {id: updatedAccount.account_id, balance: updatedAccount.balance} }
    }

    withdraw(amount: number, origin: number) {
        const account = this.checkExistAccount(origin);

        if (amount > account.balance) {
            throw new BadRequestException('Balance insufficient, check the amount and try again');
        }

        this.repository.save({ account_id: origin, balance: account.balance - amount });
        const updatedAccount = this.checkExistAccount(origin);
        
        return { origin: {id: updatedAccount.account_id, balance: updatedAccount.balance} }
    }
    
    postEvent({ type, amount, destination, origin }: IEvent) {
        if (destination && type === 'deposit') {
            return this.deposit(amount, destination);
        } else if (origin && type === 'withdraw') {
            return this.withdraw(amount, origin);
        }
    }    
}
