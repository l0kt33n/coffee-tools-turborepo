import { Controller, Get, Post, Body, Inject, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './database/schema';
import { sql } from 'drizzle-orm';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    @Inject('DATABASE') private db: NodePgDatabase<typeof schema>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('users')
  getUsers() {
    return this.appService.getUsers();
  }

  @Post('users')
  createUser(@Body() userData: { name: string; email: string }) {
    return this.appService.createUser(userData.name, userData.email);
  }

  @Get('test-db')
  async testDbConnection() {
    this.logger.log('GET /test-db endpoint called');
    try {
      // Use a simple query that works on any PostgreSQL database
      const result = await this.db.execute(sql`SELECT NOW();`);
      this.logger.log('Database query successful', result);
      return {
        message: 'Database connection successful!',
        currentTime: result.rows[0],
      };
    } catch (error) {
      this.logger.error('Database query failed', error.stack);
      return {
        message: 'Database connection failed!',
        error: error.message,
      };
    }
  }
}
