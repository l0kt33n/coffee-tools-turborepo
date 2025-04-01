import { createServer } from "./server";
import { log } from "@repo/logger";

const port = Number(process.env.PORT) || 3001;
const server = createServer();

const start = async () => {
  try {
    await server.listen({ port, host: '0.0.0.0' });
    log(`api running on ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
