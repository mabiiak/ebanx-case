import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountsService {
  getBalance(): string {
    return 'Hello World!';
  }
}
