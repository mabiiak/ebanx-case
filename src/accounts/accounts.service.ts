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
    transfer(amount: number, destination: number, origin: number) {
        const accountClientOrigin = this.checkExistAccount(origin);
        const accountClientDestiantion = this.checkExistAccount(destination);

        const lastBalanceOrigin = accountClientOrigin.balance;
        const lastBalanceDestination = accountClientDestiantion.balance;

        if (origin === destination) {
            throw new BadRequestException('The transfer must be for different accounts, check the account and try again');
        }

        if (amount > accountClientOrigin.balance) {            
            throw new BadRequestException('Balance insufficient, check the amount and try again');
        }
        
        this.repository.save({ account_id: origin, balance: accountClientOrigin.balance - amount });
        this.repository.save({ account_id: destination, balance: accountClientDestiantion.balance + amount });

        const updatedAccountOrigin = this.checkExistAccount(origin);
        const updatedAccountDestination = this.checkExistAccount(destination);
        
        if ((lastBalanceOrigin - amount) !== updatedAccountOrigin.balance) {
            this.repository.save({ account_id: origin, balance: lastBalanceOrigin });
            throw new BadRequestException('Operation was canceled');
        }
        
        if ((lastBalanceDestination + amount) !== updatedAccountDestination.balance) {
            this.repository.save({ account_id: destination, balance:lastBalanceDestination });
            throw new BadRequestException('Operation was canceled');
        }
                
        return {
            'origin': {  id: updatedAccountOrigin.account_id, balance: updatedAccountOrigin.balance },
            'destination': {  id: updatedAccountDestination.account_id, balance: updatedAccountDestination.balance }
        };
    }
    
    postEvent({ type, amount, destination, origin }: IEvent) {
        if (destination && type === 'deposit') {
            return this.deposit(amount, destination);
        } else if (origin && type === 'withdraw') {
            return this.withdraw(amount, origin);
        } else if (origin && destination && type === 'transfer') {
            return this.transfer(amount, destination, origin);
        } else {
            throw new BadRequestException('Type event unknown');
        }
    }    
}
