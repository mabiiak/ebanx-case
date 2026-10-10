import { NestFactory } from '@nestjs/core';
import { AccountsModule } from './accounts/accounts.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AccountsModule);

  const config = new DocumentBuilder()
    .setTitle('Accounts API')
    .setDescription('API para operações bancárias')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
