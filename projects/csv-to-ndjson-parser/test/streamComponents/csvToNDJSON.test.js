import { expect, describe, it, jest } from "@jest/globals";
import CSVToNDJSON from "../../src/streamComponents/csvToNDJSON.js";

describe("CSV to NDJSON Test Suite", () => {
  it("should return a NDJSON string given a CSV string", () => {
    const csvString = `id,name,address\n01,caio,street1\n`;

    const csvToNDJSON = new CSVToNDJSON({ delimiter: ",", headers: ["id", "name", "address"] });

    const expected = { id: "01", name: "caio", address: "street1" };
    const fn = jest.fn();

    csvToNDJSON.on("data", fn);
    csvToNDJSON.write(csvString);
    csvToNDJSON.end();

    const [current] = fn.mock.lastCall;

    expect(JSON.parse(current)).toStrictEqual(expected);
  });

  it("should work with strings without break lines at the end", () => {
    const csvString = `id,name,address\n01,caio,street1`;

    const csvToNDJSON = new CSVToNDJSON({ delimiter: ",", headers: ["id", "name", "address"] });

    const expected = { id: "01", name: "caio", address: "street1" };
    const fn = jest.fn();

    csvToNDJSON.on("data", fn);
    csvToNDJSON.write(csvString);
    csvToNDJSON.end();

    const [current] = fn.mock.lastCall;

    expect(JSON.parse(current)).toStrictEqual(expected);
  });

  it("should work with files content containing break lines in the beginning of the string", () => {
    const csvString = `\n\nid,name,address\n\n01,caio,street1\n\n02,cesar,street2\n`;

    const csvToNDJSON = new CSVToNDJSON({ delimiter: ",", headers: ["id", "name", "address"] });

    const expected = [
      { id: "01", name: "caio", address: "street1" },
      { id: "02", name: "cesar", address: "street2" },
    ];
    const fn = jest.fn();

    csvToNDJSON.on("data", fn);
    csvToNDJSON.write(csvString);
    csvToNDJSON.end();

    const [first, last] = fn.mock.calls;

    expect(JSON.parse(first)).toStrictEqual(expected[0]);
    expect(JSON.parse(last)).toStrictEqual(expected[1]);
  });
});
