import { NestFactory } from '@nestjs/core';
import { AccountsModule } from './accounts/accounts.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AccountsModule);

  app.useGlobalPipes(
    new ValidationPipe({ transform: true }),
  );

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
