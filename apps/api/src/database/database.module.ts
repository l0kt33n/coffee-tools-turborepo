import { Module, Global, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "DATABASE",
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger("DatabaseModule");
        const connectionString = configService.get<string>("DATABASE_URL");

        logger.log("Attempting to connect to the database...");

        if (!connectionString) {
          logger.error("DATABASE_URL environment variable is not set.");
          throw new Error("DATABASE_URL environment variable is not set.");
        }

        try {
          const pool = new Pool({
            connectionString,
          });

          const client = await pool.connect();
          logger.log("Database connection established successfully.");
          client.release();

          return drizzle(pool, { schema });
        } catch (error: unknown) {
          const err = error as Error;
          logger.error("Failed to connect to the database:", err.stack);
          throw error;
        }
      },
    },
  ],
  exports: ["DATABASE"],
})
export class DatabaseModule {}
