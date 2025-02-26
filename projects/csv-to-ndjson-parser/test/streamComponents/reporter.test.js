import { describe, expect, it, jest } from "@jest/globals";
import Reporter from "../../src/streamComponents/reporter";

describe("Reporter Test Suite", () => {
  it("should print progress status correctly", () => {
    const loggerMock = jest.fn();

    const reporter = new Reporter({ logger: loggerMock });
    reporter.CSV_CHUNK_BYTE_LENGTH_DIFF_TO_NDJSON = 0;

    const multiple = 10;
    const progress = reporter.progress(multiple);

    for (let i = 1; i < multiple; i++) {
      progress.write("1");
    }

    progress.emit("end");

    expect(loggerMock.mock.calls.length).toEqual(multiple);

    for (const index in loggerMock.mock.calls) {
      const [call] = loggerMock.mock.calls[index];

      const percent = (Number(index) + 1) * multiple;
      const expected = `processed ${percent.toFixed(2)}%`;

      expect(call).toStrictEqual(expected);
    }
  });
});
