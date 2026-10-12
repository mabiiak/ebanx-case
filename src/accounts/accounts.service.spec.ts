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
        it('Send a request with invalid type', () => {
            expect(() => service.postEvent({ type: "pix", destination: 1, amount: 250 })).toThrow(
                new BadRequestException('Type operation is invalid')
            );
        })
    
        it('Create account with invalid values: destination', () => {
            expect(() => service.postEvent({ type: "deposit", destination: Number("-999"), amount: 250 })).toThrow(
                new BadRequestException('Field destination is invalid')
            );
        })
    
        it('Create account with invalid values: amount', () => {
            expect(() => service.postEvent({ type: "deposit", destination: 1, amount: Number("eleven") })).toThrow(
                new BadRequestException('Field amount is invalid')
            );
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
    
        it('Deposit with empty destination', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            expect(() => service.postEvent({ type: "deposit", amount: 250 })).toThrow(
                new BadRequestException('Destination is required')
            );
        })

        it('Deposit with negative amount', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            expect(() => service.postEvent({ type: "deposit", destination: 1, amount: -250 })).toThrow(
                new BadRequestException('Field amount is invalid')
            );
        })
    })

    describe('Get balance', () => {
        it('Get balance for non-existing account', () => {
            expect(() => service.getBalance(1211)).toThrow(
                new NotFoundException('Account not found')
            );
        })
    
        it('Get balance with invalid id account', () => {
            expect(() => service.getBalance("name account")).toThrow(
                new BadRequestException('Account id is invalid')
            );
        })
    
        it('Get balance for existing account', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            const accountClient = service.getBalance(1);
            expect(accountClient).toEqual({ balance: 500 });
        })

        it("Get balance don't change the value balance", () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            const accountClientFirstTime = service.getBalance(1);
            const accountSecondTime = service.getBalance(1);
            expect(accountClientFirstTime.balance).toBe(accountSecondTime.balance);
        })
    })

    describe('Withdraw', () => {
        it('Withdraw from non-existing account', () => {
            expect(() => service.postEvent({ type: "withdraw", origin: 10, amount: 600 })).toThrow(
                new NotFoundException('Account not found')
            );
        })
    
        it('Withdraw with empty origin', () => {
            expect(() => service.postEvent({ type: "withdraw", amount: 600 })).toThrow(
                new BadRequestException('Origin is required')
            );
        })

        it('Withdraw without amount', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 100 });
            expect(() => service.postEvent({ type: "withdraw", origin: 1, amount: 0 })).toThrow(
                new BadRequestException('Field amount is invalid')
            );
        })

        it('Withdraw with negative amount', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 100 });
            expect(() => service.postEvent({ type: "withdraw", origin: 1, amount: -1000 })).toThrow(
                new BadRequestException('Field amount is invalid')
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

    describe('Transfer', () => {
        it('Transfer with empty origin', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            service.postEvent({ type: "deposit", destination: 2, amount: 0 });
            expect(() => service.postEvent({ type: "transfer", amount: 25, destination: 1 })).toThrow(
                new BadRequestException('Origin is required')
            );
        })
        
        it('Transfer from non-existing account origin', () => {
            service.postEvent({ type: "deposit", destination: 15, amount: 200 });
            expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 25, destination: 15 })).toThrow(
                new NotFoundException('Account not found')
            );
        })
        
        it('Transfer with empty destination', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            service.postEvent({ type: "deposit", destination: 2, amount: 0 });
            expect(() => service.postEvent({ type: "transfer", amount: 200, origin: 1 })).toThrow(
                new BadRequestException('Destination is required')
            );
        })

        it('Transfer from non-existing account destination', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 25, destination: 15 })).toThrow(
                new NotFoundException('Account not found')
            );
        })
    
        it('Transfer between the same account', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 200 });
            expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 25, destination: 1 })).toThrow(
                new BadRequestException('The transfer must be for different accounts, check the account and try again')
            );
        })
        
        it('Transfer from existing account', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 500 });
            service.postEvent({ type: "deposit", destination: 15, amount: 1 });
            const sentEvent = service.postEvent({ type: "transfer", origin: 1, amount: 200, destination: 15 });
            expect(sentEvent).toEqual({ origin: { id: 1, balance: 300 }, destination: { id: 15, balance: 201 }});
        })
    
        it('Transfer from account without balance', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 25 });
            service.postEvent({ type: "deposit", destination: 15, amount: 1 });
            expect(() => service.postEvent({ type: "transfer", origin: 1, amount: 50, destination: 15 })).toThrow(
                new BadRequestException('Balance insufficient, check the amount and try again')
            );
        })
    
        it('Failed transfer, revert the changes', () => {
            service.postEvent({ type: "deposit", destination: 1, amount: 250 });
            service.postEvent({ type: "deposit", destination: 15, amount: 0 });
    
            jest.spyOn(repository, "save")
                .mockResolvedValueOnce(true as never)
                .mockImplementationOnce(() => new Error('Operation was canceled'));
            
            expect(() => {
                service.postEvent({ type: "transfer", origin: 1, amount: 50, destination: 15 });
            }).toThrow('Operation was canceled');
    
    
            const accountClientOrigin = service.getBalance(1);
            const accountClientDestiantion = service.getBalance(15);
    
            expect(accountClientOrigin).toEqual({ balance: 250 });
            expect(accountClientDestiantion).toEqual({ balance: 0 });
        })
    })
})
