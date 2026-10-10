import { Test, TestingModule } from "@nestjs/testing";
import { AccountsService } from "./accounts.service";
import { NotFoundException } from "@nestjs/common";

describe('AccountsService', () => {
    let service: AccountsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AccountsService],
        }).compile();

        service = module.get<AccountsService>(AccountsService);
    })

    // Test 1: Get balance for non-existing account
    it('Get balance for non-existing account', () => {
        expect(() => service.findOne(1211).toThown(NotFoundException));
    })

    // Test 4: Get balance for existing account
    it('Get balance for existing account', () => {
        const accountClient = service.findOne(1);
        expect(accountClient).toEqual({account_id: 1, balance: 500})
    })

})
