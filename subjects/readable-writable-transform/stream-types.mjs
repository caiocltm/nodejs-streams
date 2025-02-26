import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Readable, Writable, Transform } from "node:stream";

const csvFilePath = path.join(import.meta.dirname, "file.csv");

const readable = new Readable({
  highWaterMark: 70000, // Setting internal buffer size to 70KB (Default: 65KB)
  read() {
    for (let index = 0; index < 1000; index++) {
      const data = {
        id: randomUUID(),
        test: `Test-Data-N${index}`,
      };

      this.push(JSON.stringify(data));
    }

    this.push(null); // This means there's no data available to be read anymore.
  },
});

const mapHeaders = new Transform({
  transform(chunk, enc, cb) {
    this.counter = this.counter ?? 0;

    if (this.counter) return cb(null, chunk);

    this.counter += 1;

    const chunkWithHeader = `id,name\n`.concat(chunk);

    cb(null, chunkWithHeader);
  },
});

const mapFields = new Transform({
  transform(chunk, enc, cb) {
    const parsedData = JSON.parse(chunk);
    const result = `${parsedData.id},${parsedData.test.split("").reverse().join("")}\n`;

    cb(null, result);
  },
});

readable
  .pipe(mapFields) // Map the CSV fields
  .pipe(mapHeaders) // Map the CSV headers
  //   .pipe(process.stdout) // Print all the content read into the console (process.stdout)
  .pipe(createWriteStream(csvFilePath)) // Creates a new CSV file and input all the formatted content into the file.
  .on("end", () => console.log("onEnd: Stream piping has ended"));
