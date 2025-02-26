import { Duplex, PassThrough, Writable } from "node:stream";
import { createReadStream, createWriteStream } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

const consumers = [randomUUID(), randomUUID()].map((id) =>
  Writable({
    write(chunk, enc, callback) {
      console.log(`[${id}] bytes: ${chunk.length}, received a message at: ${new Date().toISOString()}`);

      callback(null, chunk);
    },
  })
);

const onData = (chunk) => {
  consumers.forEach((consumer, index) => {
    if (consumer.writableEnded) {
      delete consumers[index];
      return;
    }

    consumer.write(chunk);
  });
};

const broadCaster = new PassThrough();

broadCaster.on("data", onData);

const stream = Duplex.from({
  readable: createReadStream(join(import.meta.dirname, "..", "..", "large-file.txt")),

  writable: createWriteStream(join(import.meta.dirname, "transformed-large-file.txt")),
});

stream.pipe(broadCaster).pipe(stream);

/**
 * OUTPUT:
 *
 * [039a4547-741c-4296-85df-b2326971c837] bytes: 369, received a message at: 2025-02-24T17:44:22.785Z
 * [c23cd7dc-231c-49cf-8336-e5567c5af9c9] bytes: 369, received a message at: 2025-02-24T17:44:22.799Z
 */
