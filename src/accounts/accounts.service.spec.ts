import { Test, TestingModule } from "@nestjs/testing";
import { AccountsService } from "./accounts.service";
import { NotFoundException } from "@nestjs/common";
import { AccountsRepository } from "./accounts.repository";

describe('AccountsService', () => {
    let service: AccountsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AccountsService, AccountsRepository],
        }).compile();

        service = module.get<AccountsService>(AccountsService);
    })

    // Test 1: Get balance for non-existing account
    it('Get balance for non-existing account', () => {
        expect(() => service.getBalance(1211)).toThrow(
            new NotFoundException('Account not found')
        );
    })

    // Test 4: Get balance for existing account
    it('Get balance for existing account', () => {
        const accountClient = service.getBalance(1);
        expect(accountClient).toEqual({account_id: 1, balance: 500});
    })

})
