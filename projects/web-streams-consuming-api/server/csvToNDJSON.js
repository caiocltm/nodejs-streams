import { Transform } from "node:stream";

export default class CSVToNDJSON extends Transform {
  #BREAK_LINE_SYMBOL = "\n";
  #INDEX_NOT_FOUND = -1;
  #delimiter = "";
  #headers = [];
  #buffer = Buffer.alloc(0);

  constructor({ delimiter = ",", headers }) {
    super();

    this.#delimiter = delimiter;
    this.#headers = headers;
  }

  *#updateBuffer(chunk) {
    // It'll ensure if we got a chunk that is not completed and doesn't have a break line (\n)
    // will concat with the previous read chunk
    this.#buffer = Buffer.concat([this.#buffer, chunk]);

    let breakLineIndex = 0;

    while (breakLineIndex !== this.#INDEX_NOT_FOUND) {
      breakLineIndex = this.#buffer.indexOf(Buffer.from(this.#BREAK_LINE_SYMBOL));

      if (breakLineIndex === this.#INDEX_NOT_FOUND) break;

      const lineToProcessIndex = breakLineIndex + this.#BREAK_LINE_SYMBOL.length;
      const line = this.#buffer.subarray(0, lineToProcessIndex);
      const lineData = line.toString();

      // It'll remove the data from the main buffer that was already processed.
      this.#buffer = this.#buffer.subarray(lineToProcessIndex);

      // If it's an empty line, ignore it!
      if (lineData === this.#BREAK_LINE_SYMBOL) continue;

      const ndJSONLine = [];
      const headers = Array.from(this.#headers);

      for (const item of lineData.split(this.#delimiter)) {
        const key = headers.shift();
        const value = item.replace(this.#BREAK_LINE_SYMBOL, "");

        if (key === value) break;

        ndJSONLine.push(`"${key}": "${value}"`);
      }

      if (!ndJSONLine.length) continue;

      const ndJSONData = ndJSONLine.join(",");

      yield Buffer.from("{".concat(ndJSONData).concat("}").concat(this.#BREAK_LINE_SYMBOL));
    }
  }

  /**
   * The `_transform(chunk, encoding, callback)` is called for each chunk of data that is being transformed while passing through the stream.
   *
   * @param {Buffer} chunk
   * @param {string} encoding @default utf-8
   * @param {(error?, chunk) =>} callback
   * @returns {void}
   */
  _transform(chunk, encoding, callback) {
    for (const item of this.#updateBuffer(chunk)) {
      this.push(item);
    }

    return callback();
  }

  /**
   * This method in a Node.js Transform stream is called when there is no more data to be written (when call this.push(null) on a readable stream) to the stream.
   * In this specific implementation, the `_final` method simply calls the provided `callback` function to signal that the end of the stream has been reached.
   * This allows the stream to perform any necessary cleanup or finalization tasks before ending.
   *
   * @param {() =>} callback
   * @returns {void}
   * */
  _final(callback) {
    if (!this.#buffer.length) return callback();

    for (const item of this.#updateBuffer(Buffer.from(this.#BREAK_LINE_SYMBOL))) {
      this.push(item);
    }

    callback();
  }
}
