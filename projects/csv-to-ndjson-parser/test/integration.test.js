import { describe, expect, it, jest, afterAll } from "@jest/globals";
import CSVToNDJSON from "../src/streamComponents/csvToNDJSON";
import { pipeline } from "node:stream/promises";
import { Readable, Writable } from "node:stream";
import Reporter from "../src/streamComponents/reporter";

describe("CSV to NDJSON", () => {
  const reporter = new Reporter();

  it("should convert a CSV format stream into a valid NDJSON string", async () => {
    const csvString = `id,name,desc\n01,test,descript\n02,caio,descrpt\n03,hmhn,casas`;

    const csvToNDJSON = new CSVToNDJSON({ delimiter: ",", headers: ["id", "name", "desc"] });

    const spy = jest.fn();

    await pipeline(
      Readable.from(csvString),
      csvToNDJSON,
      reporter.progress(csvString.length),
      Writable({
        write(chunk, enc, cb) {
          spy(chunk);
          cb(null, chunk);
        },
      })
    );

    const times = csvString.split("\n").length - 1;

    expect(spy).toHaveBeenCalledTimes(times);

    const [firstCall, secondCall, thirdCall] = spy.mock.calls;

    expect(JSON.parse(firstCall)).toStrictEqual({
      id: "01",
      name: "test",
      desc: "descript",
    });
    expect(JSON.parse(secondCall)).toStrictEqual({
      id: "02",
      name: "caio",
      desc: "descrpt",
    });
    expect(JSON.parse(thirdCall)).toStrictEqual({
      id: "03",
      name: "hmhn",
      desc: "casas",
    });
  });
});
