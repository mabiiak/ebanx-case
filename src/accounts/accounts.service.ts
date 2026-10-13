import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { NotFoundException } from '@nestjs/common';
import { IEvent } from './accounts.interface';

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

    async checkExistAccount(accountId: string) {
        const account = await this.repository.findById(Number(accountId));

        if (!account) {
            throw new NotFoundException('Not Found');
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

    checkBodyEvent(amount: Number) {
        if (!amount) {
            throw new BadRequestException('Field amount is invalid');
        }            
    }

    async deposit(amount: number, destination: number) {        
        const account = await this.repository.findById(Number(destination));
        const destinationFormated = destination.toString();

        if (!account) {
            await this.repository.save({ account_id: destinationFormated, balance: amount });
        } else {
            await this.repository.save({ account_id: destinationFormated, balance: account.balance + amount });
        }
            
        const updatedAccount = await this.checkExistAccount(destinationFormated);
        return { destination: { id: updatedAccount.account_id, balance: updatedAccount.balance } }
    }

    async withdraw(amount: number, origin: number) {        
        const originFormated = origin.toString();
        const account = await this.checkExistAccount(originFormated);

        if (amount > account.balance) {
            throw new BadRequestException('Balance insufficient');
        }

        await this.repository.save({ account_id: originFormated, balance: account.balance - amount });
        const updatedAccount = await this.checkExistAccount(originFormated);
        
        return { origin: { id: updatedAccount.account_id, balance: updatedAccount.balance } }
    }

    async restoreBalances(snapshots: { account_id: string, balance: number }[]) {
        for (const snapshot of snapshots) {
            try {
                await this.repository.save(snapshot);
            } catch (error) {
                throw new Error(`Rollback failed for account, ${snapshot.account_id}`)
            }
        }
    }

async transfer(amount: number, destination: number, origin: number) {
    const originFormated = origin.toString();
    const destinationFormated = destination.toString();

    const accountClientOrigin = await this.checkExistAccount(originFormated);

    if (amount > accountClientOrigin.balance) {
        throw new BadRequestException('Balance insufficient');
    }

    const accountClientDestination = await this.repository.findById(destination);
    const destinationBalance = accountClientDestination?.balance ?? 0;

    const originSnapshot = { account_id: originFormated, balance: accountClientOrigin.balance };

    const destinationSnapshot = accountClientDestination ? { account_id: destinationFormated, balance: destinationBalance } : null;

    try {
        await this.repository.save({ account_id: originFormated, balance: accountClientOrigin.balance - amount });
        await this.repository.save({ account_id: destinationFormated, balance: destinationBalance + amount });
    } catch (error) {
        const snapshots = destinationSnapshot ? [destinationSnapshot, originSnapshot] : [originSnapshot];
        await this.restoreBalances(snapshots);
        throw error;
    }

    const updatedAccountOrigin = await this.checkExistAccount(originFormated);
    const updatedAccountDestination = await this.checkExistAccount(destinationFormated);

    return {
        origin: {
            id: updatedAccountOrigin.account_id,
            balance: updatedAccountOrigin.balance,
        },
        destination: {
            id: updatedAccountDestination.account_id,
            balance: updatedAccountDestination.balance,
        },
    };
}
    
    async postEvent({ type, amount, destination, origin }: IEvent) {
        await this.checkBodyEvent(amount);

        if (!amount || typeof amount === "string" || amount < 0) {
            throw new BadRequestException('Field amount is invalid');
        }

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
