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

        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 600, destination: 1 })
            .expect(201);
        
        const response = await request(app.getHttpServer()).get('/balance/1').expect(200);
        expect(response.body.balance).toBe(800);
    })

    it('should create an account and failed deposit' , async () => {
        await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: 200, destination: 1 })
            .expect(201);

        const firstBalance = await request(app.getHttpServer()).get('/balance/1').expect(200);
        const depositInvalid = await request(app.getHttpServer()).post('/event')
            .send({ type: "deposit", amount: -100, destination: 1 })
            .expect(400);

        const secondBalance = await request(app.getHttpServer()).get('/balance/1').expect(200);
        expect(depositInvalid.body.message).toBe("Field amount is invalid");
        expect(secondBalance.body.balance).toEqual(firstBalance.body.balance);
    })
    
    afterEach(async () => {
        await app.close();
    });
});
