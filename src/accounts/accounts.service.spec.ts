import { Test, TestingModule } from "@nestjs/testing";
import { AccountsService } from "./accounts.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
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
        service.postEvent({ type: "deposit", destination: 1, amount: 500 });
        const accountClient = service.getBalance(1);
        expect(accountClient).toEqual({ balance: 500 });
    })

    it('Withdraw from non-existing account', () => {
        expect(() => service.postEvent({ type: "withdraw", origin: 10, amount: 600 })).toThrow(
            new NotFoundException('Account not found')
        );
    })

    it('Withdraw from account with balance', () => {
        service.postEvent({ type: "deposit", destination: 1, amount: 500 });
        const sentEvent = service.postEvent({ type: "withdraw", origin: 1, amount: 200 });
        expect(sentEvent).toEqual({ origin: { id: 1, balance: 300 }});
    })

    it('Withdraw from account without balance', () => {
        service.postEvent({ type: "deposit", destination: 1, amount: 200 });
        expect(() => service.postEvent({ type: "withdraw", origin: 1, amount: 600 })).toThrow(
            new BadRequestException('Balance insufficient, check the amount and try again')
        );
    })

})
