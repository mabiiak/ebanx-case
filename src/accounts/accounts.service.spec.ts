import { Test, TestingModule } from "@nestjs/testing";
import { AccountsService } from "./accounts.service";
import { NotFoundException } from "@nestjs/common";
import { AccountsRepository } from "./accounts.repository";

describe('Accounts services', () => {
    let service: AccountsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AccountsService, AccountsRepository],
        }).compile();

        service = module.get<AccountsService>(AccountsService);
    })

    it('Create account with initial balance', () => {
        const sentEvent = service.postEvent({ type: "deposit", destination: 1, amount: 250 });
        expect(sentEvent).toEqual({ destination: {id: 1, balance: 250 }});
    })

    it('Deposit into existing account', () => {
        service.postEvent({ type: "deposit", destination: 1, amount: 250 });
        const sentEvent = service.postEvent({ type: "deposit", destination: 1, amount: 250 });
        expect(sentEvent).toEqual({ destination: {id: 1, balance: 500 }});
    })

    it('Get balance for non-existing account', () => {
        expect(() => service.getBalance(1211)).toThrow(
            new NotFoundException('Account not found')
        );
    })

    it('Get balance for existing account', () => {
        const accountClient = service.getBalance(1);
        expect(accountClient).toEqual({account_id: 1, balance: 500});
    })

})
