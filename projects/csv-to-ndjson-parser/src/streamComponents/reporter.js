import { PassThrough } from "node:stream";
import { log } from "../utils.js";

export default class Reporter {
  CSV_CHUNK_BYTE_LENGTH_DIFF_TO_NDJSON = 40;
  #HUNDRED_PERCENT = 100;
  #loggerFn;

  constructor({ logger = log } = { logger: log }) {
    this.#loggerFn = logger;
  }

  #onData(amount) {
    let totalChunks = 0;

    return (chunk) => {
      totalChunks += chunk.length - this.CSV_CHUNK_BYTE_LENGTH_DIFF_TO_NDJSON;

      const processed = (this.#HUNDRED_PERCENT / amount) * totalChunks;

      this.#loggerFn(`processed ${processed.toFixed(2)}%`);
    };
  }

  progress(amount) {
    const progress = new PassThrough();

    progress.on("data", this.#onData(amount));
    progress.on("end", () => this.#loggerFn(`processed ${this.#HUNDRED_PERCENT}.00%`));

    return progress;
  }
}
