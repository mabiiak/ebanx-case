import { Account } from "./entities/accounts.entity";

export class AccountsRepository {

    private accounts = new Map<number, Account>();

    public async findById(accountId: number): Promise<Account | undefined> {
        return (this.accounts.get(accountId));
    }

    async save(account: Account): Promise<void> {
        this.accounts.set(account.account_id, account);
    }

    public reset(): void {
        this.accounts.clear();
    }
}
