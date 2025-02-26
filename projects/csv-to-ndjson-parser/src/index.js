import { join } from "node:path";
import CSVToNDJSON from "./streamComponents/csvToNDJSON.js";
import Reporter from "./streamComponents/reporter.js";
import { statSync, createReadStream, createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { performance, PerformanceObserver } from "node:perf_hooks";
import { log } from "./utils.js";

const inputFilePath = join(import.meta.dirname, "..", "..", "..", "large-file-input.csv");
const outputFilePath = join(import.meta.dirname, "..", "..", "..", "large-file-output.ndjson");
const { size: fileSize } = statSync(inputFilePath);

const csvToNDJSON = new CSVToNDJSON({ delimiter: ",", headers: ["id", "name", "desc", "age"] });
const reporter = new Reporter();

let counter = 0;

const processData = new Transform({
  transform(chunk, encoding, callback) {
    const data = JSON.parse(chunk);
    const result = JSON.stringify({
      ...data,
      id: counter++,
    }).concat("\n");

    callback(null, result);
  },
});

const exec = async () =>
  await pipeline(createReadStream(inputFilePath), csvToNDJSON, processData, reporter.progress(fileSize), createWriteStream(outputFilePath));

const wrapped = performance.timerify(exec);

const observer = new PerformanceObserver((list) => {
  log(`Successfully processed ${counter} CSV lines to NDJSON format file in ${(list.getEntries()[0].duration / 1000).toFixed(2)}s \n`);

  performance.clearMarks();
  performance.clearMeasures();
  observer.disconnect();
});

observer.observe({ entryTypes: ["function"] });

wrapped();
