import { Account } from "./entities/accounts.entity";

export class AccountsRepository {

    private accounts = new Map<number, Account>();

    public findById(account_id: number): Account | undefined {
        return this.accounts.get(account_id);
    }

    save(account: Account): void {
        this.accounts.set(account.account_id, account);
    }
}
