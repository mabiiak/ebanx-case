import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AccountsModule } from './../src/accounts/accounts.module';
import { AccountsRepository } from '../src/accounts/accounts.repository';

describe('Accounts controller (e2e)', () => {
    let app: INestApplication<App>;
    let repository: AccountsRepository;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AccountsModule],
        }).compile();

    repository = moduleFixture.get<AccountsRepository>(AccountsRepository);
    app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('should return 404 when the account does not exist' , async () => {
        const response = await request(app.getHttpServer()).get('/balance/1').expect(404);
        expect(response.body.message).toBe('Account not found');
    });

    it('should create accounts and return their respective balances', async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 50, destination: 1 })
            .expect(201);

        await request(app.getHttpServer()).post('/event')
        .send({ type: "deposit", amount: 200, destination: 2 })
        .expect(201);
        
        await request(app.getHttpServer()).post('/event')
        .send({ type: "deposit", amount: 600, destination: 2 })
        .expect(201);

        const responseAccountOne = await request(app.getHttpServer()).get('/balance/1').expect(200);        
        const accountTwo = await request(app.getHttpServer()).get('/balance/2').expect(200);

        expect(responseAccountOne.body.balance).toBe(50);
        expect(accountTwo.body.balance).toBe(800);
    });

    it('should reject invalid deposits without changing the balance' , async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 200, destination: 1 })
            .expect(201);

        const firstBalance = await request(app.getHttpServer()).get('/balance/1').expect(200);
        const firstDeposit = await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: -100, destination: 1 })
            .expect(400);
        const secondDeposit = await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 10 })
            .expect(400);

        const secondBalance = await request(app.getHttpServer()).get('/balance/1').expect(200);
        expect(firstDeposit.body.message).toBe("Field amount is invalid");
        expect(secondDeposit.body.message).toBe("Destination is required");
        expect(secondBalance.body.balance).toEqual(firstBalance.body.balance);
    })

    it('should withdraw successfully and update the balance', async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 50, destination: 1 })
            .expect(201);

        const firstBalance = await request(app.getHttpServer()).get('/balance/1').expect(200);
        const response = await request(app.getHttpServer()).post('/event')
            .send({ type: "withdraw", amount: 50, origin: 1 })
            .expect(201);
        
        const secondBalance = await request(app.getHttpServer()).get('/balance/1').expect(200);
        expect(firstBalance.body.balance).toBe(50);
        expect(secondBalance.body.balance).toBe(0);
        expect(response.body.origin.balance).toBe(0);
    })

    it('should reject invalid withdrawals without changing the balance', async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 5, destination: 1 })
            .expect(201);

        const firstBalance = await request(app.getHttpServer()).get('/balance/1').expect(200);

        const firstWithDraw = await request(app.getHttpServer()).post('/event')
            .send({ type: "withdraw", amount: 500, origin: 1 })
            .expect(400);

        const secondWithDraw = await request(app.getHttpServer()).post('/event')
            .send({ type: "withdraw", amount: 5 })
            .expect(400);

        const thirdWithDraw = await request(app.getHttpServer()).post('/event')
            .send({ type: "withdraw", origin: 1 })
            .expect(400);

        const fourthWithDraw = await request(app.getHttpServer()).post('/event')
            .send({ type: "withdraw", origin: 10, amount: 1 })
            .expect(404);
        
        const secondBalance = await request(app.getHttpServer()).get('/balance/1').expect(200);

        expect(secondBalance.body.balance).toBe(firstBalance.body.balance);
        expect(firstWithDraw.body.message).toBe('Balance insufficient, check the amount and try again');
        expect(secondWithDraw.body.message).toBe('Origin is required');
        expect(thirdWithDraw.body.message).toBe('Field amount is invalid');
        expect(fourthWithDraw.body.message).toBe('Account not found');
    })

    it('should transfer funds and update both balances' , async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 500, destination: 1 })
            .expect(201);

        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 150, destination: 2 })
            .expect(201);
        
        await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: 150, origin: 1, destination: 2 })
            .expect(201);

        let accountOne = await request(app.getHttpServer()).get('/balance/1').expect(200);        
        let accountTwo = await request(app.getHttpServer()).get('/balance/2').expect(200);

        expect(accountOne.body.balance).toBe(350);
        expect(accountTwo.body.balance).toBe(300);

        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 400, destination: 2 })
            .expect(201);

        accountTwo = await request(app.getHttpServer()).get('/balance/2').expect(200);

        expect(accountTwo.body.balance).toBe(700);

        await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: 150, origin: 2, destination: 1 })
            .expect(201);

        accountOne = await request(app.getHttpServer()).get('/balance/1').expect(200);        
        accountTwo = await request(app.getHttpServer()).get('/balance/2').expect(200);

        expect(accountOne.body.balance).toBe(500);
        expect(accountTwo.body.balance).toBe(550);
    })

    it('should reject invalid transfers without changing the balance' , async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 100, destination: 1 })
            .expect(201);

        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 150, destination: 2 })
            .expect(201);

        const fisrtTransfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: 5000, origin: 1, destination: 2 })
            .expect(400);

        const secondTransfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: -150, origin: 1, destination: 2 })
            .expect(400);

        const thirthTransfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", origin: 1, destination: 2 })
            .expect(400);

        const fourthTransfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", origin: 15, amount: 150, destination: 2 })
            .expect(404);

        const fivethTransfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: 150, origin: 1, destination: 5 })
            .expect(404);

        const sixthTransfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: 150, destination: 2 })
            .expect(400);

        const seventhTransfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: 150, origin: 1 })
            .expect(400);

        const eigththTransfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: 0, origin: 1, destination: 2 })
            .expect(400);

        const accountOne = await request(app.getHttpServer()).get('/balance/1').expect(200);        
        const accountTwo = await request(app.getHttpServer()).get('/balance/2').expect(200);

        expect(accountOne.body.balance).toBe(100);
        expect(accountTwo.body.balance).toBe(150);
        expect(fisrtTransfer.body.message).toBe('Balance insufficient, check the amount and try again');
        expect(secondTransfer.body.message).toBe('Field amount is invalid');
        expect(thirthTransfer.body.message).toBe('Field amount is invalid');
        expect(fourthTransfer.body.message).toBe('Account not found');
        expect(fivethTransfer.body.message).toBe('Account not found');
        expect(sixthTransfer.body.message).toBe('Origin is required');
        expect(seventhTransfer.body.message).toBe('Destination is required');
        expect(eigththTransfer.body.message).toBe('Field amount is invalid');
    })

    it('should roll back a transfer when a save operation fails' , async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 150, destination: 1 })
            .expect(201);

        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 150, destination: 2 })
            .expect(201);

        const originalSave = repository.save.bind(repository);

        const saveSpy = jest.spyOn(repository, "save" as any)
            .mockImplementationOnce((entity : any) => originalSave(entity))
            .mockRejectedValueOnce(new Error('Operation was canceled'));

        const firstBalanceAccountOne = await request(app.getHttpServer()).get('/balance/1').expect(200);
        const firstBalanceAccountTwo = await request(app.getHttpServer()).get('/balance/2').expect(200);
            
        const transfer = await request(app.getHttpServer()).post('/event')
            .send({ type: "transfer", amount: 150, origin: 1, destination: 2 })
            .expect(500);

        const secondBalanceAccountOne = await request(app.getHttpServer()).get('/balance/1').expect(200);
        const secondBalanceAccountTwo = await request(app.getHttpServer()).get('/balance/2').expect(200);
        
        expect(transfer.body.message).toBe('Internal server error');
        expect(secondBalanceAccountOne.body.balance).toEqual(firstBalanceAccountOne.body.balance);
        expect(secondBalanceAccountTwo.body.balance).toEqual(firstBalanceAccountTwo.body.balance);
        expect(saveSpy).toHaveBeenCalledTimes(4);
        expect(saveSpy).toHaveBeenNthCalledWith(1, { account_id: 1, balance: 0 });
        expect(saveSpy).toHaveBeenNthCalledWith(3, { account_id: 2, balance: 150 });
        expect(saveSpy).toHaveBeenNthCalledWith(4, { account_id: 1, balance: 150 });
    })

    afterEach(async () => {
        await app.close();
        jest.restoreAllMocks();
    });
});
