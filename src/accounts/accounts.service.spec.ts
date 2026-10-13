import { Test, TestingModule } from "@nestjs/testing";
import { AccountsService } from "./accounts.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AccountsRepository } from "./accounts.repository";

describe('Accounts services', () => {
    let service: AccountsService;
    let repository: AccountsRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AccountsService, AccountsRepository],
        }).compile();

        service = module.get<AccountsService>(AccountsService);
        repository = module.get<AccountsRepository>(AccountsRepository);
    })

    describe('Deposit', () => {
        it('Send a request with invalid type', async () => {
            await expect(() => service.postEvent({ type: "pix", destination: 1, amount: 250 })).rejects.toThrow(
                new BadRequestException('Type operation is invalid')
            );
        })
    
        it('Create account with invalid values: amount', async () => {
            await expect(() => service.postEvent({ type: "deposit", destination: 1, amount: Number("eleven") })).rejects.toThrow(
                new BadRequestException('Field amount is invalid')
            );
        })
    
        it('Create account with initial balance', async () => {
            const sentEvent = await service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            expect(sentEvent).toEqual({ destination: { id: '1', balance: 250 }});
        })
    
        it('Deposit into existing account', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            const sentEvent = await service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            expect(sentEvent).toEqual({ destination: { id: '1', balance: 500 }});
        })

        it('Deposit with negative amount', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            await expect(() => service.postEvent({ type: "deposit", destination: 1, amount: -250 })).rejects.toThrow(
                new BadRequestException('Field amount is invalid')
            );
        })
    })

    describe('Get balance', () => {
        it('Get balance for non-existing account', async () => {
            await expect(() => service.getBalance(1211)).rejects.toThrow(
                new NotFoundException('Not Found')
            );
        })
    
        it('Get balance with invalid id account', async () => {
            await expect(() => service.getBalance(-1)).rejects.toThrow(
                new BadRequestException('Account id is invalid')
            );
        })
    
        it('Get balance for existing account', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            const accountClient = await service.getBalance(1);
            expect(accountClient).toBe(500);
        })

        it("Get balance don't change the value balance", async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            const accountClientFirstTime = await service.getBalance(1);
            const accountSecondTime = await service.getBalance(1);
            expect(accountClientFirstTime).toBe(accountSecondTime);
        })
    })

    describe('Withdraw', () => {
        it('Withdraw from non-existing account', async () => {
            await expect(() => service.postEvent({ type: "withdraw", origin: 10, amount: 600 })).rejects.toThrow(
                new NotFoundException('Not Found')
            );
        })

        it('Withdraw from account with balance', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            const sentEvent = await service.postEvent({ type: "withdraw", origin: 1, amount: 200 });
            expect(sentEvent).toEqual({ origin: { id: '1', balance: 300 }});
        })
    
        it('Withdraw from account without balance', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            await expect(() => service.postEvent({ type: "withdraw", origin: 1, amount: 600 })).rejects.toThrow(
                new BadRequestException('Balance insufficient')
            );
        })
    })

    describe('Transfer', () => {
        it('Transfer from non-existing account origin', async () => {
            await service.postEvent({ type: "deposit", destination: 15, amount: 200 });
            await expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 25, destination: 15 })).rejects.toThrow(
                new NotFoundException('Not Found')
            );
        })
        
        it('Transfer to non-existing account destination creates the account', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            const sentEvent = await service.postEvent({ type: "transfer", origin: 1, amount: 25, destination: 15 });
            expect(sentEvent).toEqual({ origin: { id: '1', balance: 175 }, destination: { id: '15', balance: 25 }});
        })
        
        it('Transfer from existing account', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            await service.postEvent({ type: "deposit", destination: 15, amount: 1 });
            const sentEvent = await service.postEvent({ type: "transfer", origin: 1, amount: 200, destination: 15 });
            expect(sentEvent).toEqual({ origin: { id: '1', balance: 300 }, destination: { id: '15', balance: 201 }});
        })
    
        it('Transfer from account without balance', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 25 });
            await service.postEvent({ type: "deposit", destination: 15, amount: 1 });
            await expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 50, destination: 15 })).rejects.toThrow(
                new BadRequestException('Balance insufficient')
            );
        })
    
        it('Failed transfer, revert the changes', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            await service.postEvent({ type: "deposit", destination: 15, amount: 10 });
    
            const originalSave = repository.save.bind(repository);
            jest.spyOn(repository, "save")
                .mockImplementationOnce(originalSave)
                .mockRejectedValueOnce(new Error('Operation was canceled'));

            await expect(
                service.postEvent({ type: "transfer", origin: 1, amount: 50, destination: 15 })
            ).rejects.toThrow('Operation was canceled');
    
            const accountClientOrigin = await service.getBalance(1);
            const accountClientDestination = await service.getBalance(15);

            expect(accountClientOrigin).toBe(250);
            expect(accountClientDestination).toBe(10);
        });
    })
})
