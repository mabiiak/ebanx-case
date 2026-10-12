import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AccountsModule } from './../src/accounts/accounts.module';

describe('Accounts controller (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AccountsModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('should find balance of a non-existing account' , async () => {
        const response = await request(app.getHttpServer()).get('/balance/1').expect(404);
        expect(response.body.message).toBe('Account not found');
    });

    it('should create acconut and return the balance', async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 50, destination: 1 })
            .expect(201);

        const response = await request(app.getHttpServer()).get('/balance/1').expect(200);
        expect(response.body.balance).toBe(50);
    });

    it('should create an account and deposit 800' , async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 200, destination: 1 })
            .expect(201);

        await request(app.getHttpServer()).get('/balance/1').expect(200);

    it('should create an account and withdraw', async () => {
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
    
    afterEach(async () => {
        await app.close();
    });
});
