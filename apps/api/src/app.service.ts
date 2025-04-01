import { Injectable, Inject } from '@nestjs/common';
import { type DrizzleInstance } from './database/types';
import { users } from './database/schema';

@Injectable()
export class AppService {
  constructor(@Inject('DATABASE') private db: DrizzleInstance) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getUsers() {
    return this.db.select().from(users);
  }

  async createUser(name: string, email: string) {
    return this.db.insert(users).values({ name, email });
  }
}
