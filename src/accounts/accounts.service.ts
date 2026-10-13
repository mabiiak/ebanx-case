import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { NotFoundException } from '@nestjs/common';
import { IEvent } from './accounts.interface';
import { ExceptionHandler } from '@nestjs/core/errors/exception-handler.js';

@Injectable()
export class AccountsService {
    constructor(private readonly repository: AccountsRepository) {}

    async getBalance(accountId: Number): Promise<Number> { 
        if (Number(accountId) <= 0) {
            throw new BadRequestException('Account id is invalid');
        }     
    
        const accountBalance = await this.repository.findById(Number(accountId));

        if (!accountBalance) {
            throw new NotFoundException;
        }

        return accountBalance.balance;
    }

    async checkExistAccount(accountId: number) {
        const account = await this.repository.findById(accountId);

        if (!account) {
            throw new NotFoundException('Account not found');
        }

        return account;
    }

    postReset() {
        try {
            this.repository.reset();
            return 'OK';
        }  catch (error) {
            throw new Error(`Reset failed, ${error}`)
        }
    }

    checkBodyEvent({ type, amount, destination, origin }: IEvent) {
        const requiresOrigin = ['transfer', 'withdraw'].includes(type);
        const requiresDestination = ['deposit', 'transfer'].includes(type);

        if (!amount || amount <= 0) {
            throw new BadRequestException('Field amount is invalid');
        }            

        if (requiresOrigin && origin === undefined) {
            throw new BadRequestException('Origin is required');
        }

        if (requiresDestination && destination === undefined) {
            throw new BadRequestException('Destination is required');
        }

        const fields = { amount, origin, destination };

        for (const [field, value] of Object.entries(fields)) {
            if (value === undefined) continue;
            
            if (!Number.isFinite(value) || value < 0) {
                throw new BadRequestException(`Field ${field} is invalid`);
            }
        }
    }

    async deposit(amount: number, destination: number) {
        const account = await this.repository.findById(destination);

        if (!account) {
            await this.repository.save({ account_id: destination, balance: amount });
        } else {
            await this.repository.save({ account_id: destination, balance: account.balance + amount });
        }
            
        const updatedAccount = await this.checkExistAccount(destination);
        return { destination: {id: updatedAccount.account_id, balance: updatedAccount.balance} }
    }

    async withdraw(amount: number, origin: number) {
        const account = await this.checkExistAccount(origin);

        if (amount > account.balance) {
            throw new BadRequestException('Balance insufficient, check the amount and try again');
        }

        await this.repository.save({ account_id: origin, balance: account.balance - amount });
        const updatedAccount = await this.checkExistAccount(origin);
        
        return { origin: { id: updatedAccount.account_id, balance: updatedAccount.balance } }
    }

    async restoreBalances(snapshots: { account_id: number, balance: number }[]) {
        for (const snapshot of snapshots) {
            try {
                await this.repository.save(snapshot);
            } catch (error) {
                throw new Error(`Rollback failed for account, ${snapshot.account_id}`)
            }
        }
    }

    async transfer(amount: number, destination: number, origin: number) {
        const accountClientOrigin = await this.checkExistAccount(origin);
        const accountClientDestination = await this.checkExistAccount(destination);
        
        if (origin === destination) {
            throw new BadRequestException('The transfer must be for different accounts, check the account and try again');
        }

        if (amount > accountClientOrigin.balance) {            
            throw new BadRequestException('Balance insufficient, check the amount and try again');
        }

        const originSnapshot = { account_id: origin, balance: accountClientOrigin.balance };
        const destinationSnapshot = { account_id: destination, balance: accountClientDestination.balance };

        try {
            await this.repository.save({ account_id: origin, balance: accountClientOrigin.balance - amount });
            await this.repository.save({ account_id: destination, balance: accountClientDestination.balance + amount });
        } catch (error) {
            await this.restoreBalances([destinationSnapshot, originSnapshot]);
            throw error;
        }
        
        const updatedAccountOrigin = await this.checkExistAccount(origin);
        const updatedAccountDestination = await this.checkExistAccount(destination);

        return {
            'origin': {  id: updatedAccountOrigin.account_id, balance: updatedAccountOrigin.balance },
            'destination': {  id: updatedAccountDestination.account_id, balance: updatedAccountDestination.balance }
        };
    }
    
    async postEvent({ type, amount, destination, origin }: IEvent) {
        await this.checkBodyEvent({type, amount, destination, origin});
        
        if (destination && type === 'deposit') {
            return this.deposit(amount, destination);
        } else if (origin && type === 'withdraw') {
            return this.withdraw(amount, origin);
        } else if (origin && destination && type === 'transfer') {
            return this.transfer(amount, destination, origin);
        } else {
            throw new BadRequestException('Type operation is invalid');
        }
    }    
}
