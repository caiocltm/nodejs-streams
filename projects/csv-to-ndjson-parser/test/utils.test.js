import { describe, expect, it, jest, afterAll } from "@jest/globals";
import { log } from "../src/utils.js";
import Readline from "node:readline";

describe("Util Test Suite", () => {
  Readline.cursorTo = jest.fn().mockImplementation();
  process.stdout.write = jest.fn().mockImplementation();

  afterAll(() => jest.clearAllMocks());

  describe("log", () => {
    it("should log a message", () => {
      const message = "Test message";

      log(message);

      expect(Readline.cursorTo).toHaveBeenCalledWith(process.stdout, 0);
      expect(process.stdout.write).toHaveBeenCalledWith(message);
    });
  });
});
