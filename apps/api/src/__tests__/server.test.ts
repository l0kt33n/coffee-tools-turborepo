import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createServer } from "../server";
import { FastifyInstance } from "fastify";

describe("server", () => {
  let app: FastifyInstance;

  beforeAll(() => {
    app = createServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it("status check returns 200", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/status"
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ ok: true });
  });

  it("message endpoint says hello", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/message/jared"
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ message: "hello jared" });
  });
});
