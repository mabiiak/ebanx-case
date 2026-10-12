import { Account } from "./entities/accounts.entity";

export class AccountsRepository {

    private accounts = new Map<number, Account>();

    public async findById(account_id: number): Promise<Account | undefined> {
        return (this.accounts.get(account_id));
    }

    async save(account: Account): Promise<void> {
        this.accounts.set(account.account_id, account);
    }
}
