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
  
  async testDatabaseConnection() {
    try {
      // Use raw query execution to test connection
      const result = await this.db.query.users.findFirst();
      
      return {
        status: 'success',
        message: 'Database connection is working',
        connected: true,
        testQuery: result !== undefined ? 'User table accessible' : 'User table exists but empty'
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      };
    }
  }
}
