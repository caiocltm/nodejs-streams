import { createServer, get } from "node:http";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { setTimeout } from "node:timers/promises";
import { PassThrough } from "node:stream";
import { mock } from "node:test";
import { deepStrictEqual } from "node:assert";

const fileStream1 = createReadStream(join(import.meta.dirname, "..", "..", "large-file.txt"), { highWaterMark: 1 });
const fileStream2 = createReadStream(join(import.meta.dirname, "..", "..", "large-file.txt"), { highWaterMark: 1 });

createServer((request, response) => {
  console.info("Connection received from API 01 (pipe)");

  // pipe() can consume a stream content PARTIALLY.
  fileStream1.pipe(response);
}).listen(3000, () => {
  console.info("Server is listening on port 3000");
});

createServer(async (request, response) => {
  console.info("Connection received from API 02 (pipeline)");

  // pipeline() can ONLY consume a stream content FULLY, otherwise,
  // will throw an error (ERR_STREAM_PREMATURE_CLOSE) if the process haven't finished.
  await pipeline(fileStream2, response);
}).listen(3001, () => {
  console.info("Server is listening on port 3001");
});

await setTimeout(500);

const getHttpStream = (url) => new Promise((resolve, reject) => get(url, (response) => resolve(response)));

const pass = () => new PassThrough();

const streamPipe = await getHttpStream("http://localhost:3000");
streamPipe.pipe(pass());

const streamPipeline = await getHttpStream("http://localhost:3001");
streamPipeline.pipe(pass());

streamPipe.destroy();
streamPipeline.destroy();

const callback = mock.fn((data) => {
  console.info("Stream.pipeline rejects if you don't fully consume it");

  deepStrictEqual(data.message, "Premature close");

  process.exit();
});

process.on("uncaughtException", callback);

await setTimeout(10);
