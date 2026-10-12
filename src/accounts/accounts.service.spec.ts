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
    
        it('Create account with invalid values: destination', async () => {
            await expect(() => service.postEvent({ type: "deposit", destination: Number("-999"), amount: 250 })).rejects.toThrow(
                new BadRequestException('Field destination is invalid')
            );
        })
    
        it('Create account with invalid values: amount', async () => {
            await expect(() => service.postEvent({ type: "deposit", destination: 1, amount: Number("eleven") })).rejects.toThrow(
                new BadRequestException('Field amount is invalid')
            );
        })
    
        it('Create account with initial balance', async () => {
            const sentEvent = await service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            expect(sentEvent).toEqual({ destination: {id: 1, balance: 250 }});
        })
    
        it('Deposit into existing account', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            const sentEvent = await service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            expect(sentEvent).toEqual({ destination: {id: 1, balance: 500 }});
        })
    
        it('Deposit with empty destination', async () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            await expect(() => service.postEvent({ type: "deposit", amount: 250 })).rejects.toThrow(
                new BadRequestException('Destination is required')
            );
        })

        it('Deposit with negative amount', async () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            await expect(() => service.postEvent({ type: "deposit", destination: 1, amount: -250 })).rejects.toThrow(
                new BadRequestException('Field amount is invalid')
            );
        })
    })

    describe('Get balance', () => {
        it('Get balance for non-existing account', async () => {
            await expect(() => service.getBalance(1211)).rejects.toThrow(
                new NotFoundException('Account not found')
            );
        })
    
        it('Get balance with invalid id account', async () => {
            await expect(() => service.getBalance("name account")).rejects.toThrow(
                new BadRequestException('Account id is invalid')
            );
        })
    
        it('Get balance for existing account', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            const accountClient = await service.getBalance(1);
            expect(accountClient).toEqual({ balance: 500 });
        })

        it("Get balance don't change the value balance", async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            const accountClientFirstTime = await service.getBalance(1);
            const accountSecondTime = await service.getBalance(1);
            expect(accountClientFirstTime.balance).toBe(accountSecondTime.balance);
        })
    })

    describe('Withdraw', () => {
        it('Withdraw from non-existing account', async () => {
            await expect(() => service.postEvent({ type: "withdraw", origin: 10, amount: 600 })).rejects.toThrow(
                new NotFoundException('Account not found')
            );
        })
    
        it('Withdraw with empty origin', async () => {
            await expect(() => service.postEvent({ type: "withdraw", amount: 600 })).rejects.toThrow(
                new BadRequestException('Origin is required')
            );
        })

        it('Withdraw without amount', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 100 });
            await expect(() => service.postEvent({ type: "withdraw", origin: 1, amount: 0 })).rejects.toThrow(
                new BadRequestException('Field amount is invalid')
            );
        })

        it('Withdraw with negative amount', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 100 });
            await expect(() => service.postEvent({ type: "withdraw", origin: 1, amount: -1000 })).rejects.toThrow(
                new BadRequestException('Field amount is invalid')
            );
        })

        it('Withdraw from account with balance', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            const sentEvent = await service.postEvent({ type: "withdraw", origin: 1, amount: 200 });
            expect(sentEvent).toEqual({ origin: { id: 1, balance: 300 }});
        })
    
        it('Withdraw from account without balance', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            await expect(() => service.postEvent({ type: "withdraw", origin: 1, amount: 600 })).rejects.toThrow(
                new BadRequestException('Balance insufficient, check the amount and try again')
            );
        })
    })

    describe('Transfer', () => {
        it('Transfer with empty origin', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            await service.postEvent({ type: "deposit", destination: 2, amount: 0 });
            await expect(() => service.postEvent({ type: "transfer", amount: 25, destination: 1 })).rejects.toThrow(
                new BadRequestException('Origin is required')
            );
        })
        
        it('Transfer from non-existing account origin', async () => {
            await service.postEvent({ type: "deposit", destination: 15, amount: 200 });
            await expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 25, destination: 15 })).rejects.toThrow(
                new NotFoundException('Account not found')
            );
        })
        
        it('Transfer with empty destination', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            await service.postEvent({ type: "deposit", destination: 2, amount: 0 });
            await expect(() => service.postEvent({ type: "transfer", amount: 200, origin: 1 })).rejects.toThrow(
                new BadRequestException('Destination is required')
            );
        })

        it('Transfer from non-existing account destination', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            await expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 25, destination: 15 })).rejects.toThrow(
                new NotFoundException('Account not found')
            );
        })
    
        it('Transfer between the same account', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 200 });
             await expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 25, destination: 1 })).rejects.toThrow(
                new BadRequestException('The transfer must be for different accounts, check the account and try again')
            );
        })
        
        it('Transfer from existing account', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            await service.postEvent({ type: "deposit", destination: 15, amount: 1 });
            const sentEvent = await service.postEvent({ type: "transfer", origin: 1, amount: 200, destination: 15 });
            expect(sentEvent).toEqual({ origin: { id: 1, balance: 300 }, destination: { id: 15, balance: 201 }});
        })
    
        it('Transfer from account without balance', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 25 });
            await service.postEvent({ type: "deposit", destination: 15, amount: 1 });
            await expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 50, destination: 15 })).rejects.toThrow(
                new BadRequestException('Balance insufficient, check the amount and try again')
            );
        })
    
        it('Failed transfer, revert the changes', async () => {
            await service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            await service.postEvent({ type: "deposit", destination: 15, amount: 0 });
    
            jest.spyOn(repository, "save")
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Operation was canceled'));
            
            await expect(
                service.postEvent({ type: "transfer", origin: 1, amount: 50, destination: 15 })
            ).rejects.toThrow('Operation was canceled');
    
            const accountClientOrigin = await service.getBalance(1);
            const accountClientDestination = await service.getBalance(15);

            expect(accountClientOrigin).toEqual({ balance: 250 });
            expect(accountClientDestination).toEqual({ balance: 0 });
        });
    })
})
