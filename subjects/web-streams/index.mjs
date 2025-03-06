import { Readable } from "node:stream";
import { ReadableStream, WritableStream, TransformStream, TextDecoderStream } from "node:stream/web";
import { setInterval, setTimeout } from "node:timers/promises";

const readable1 = new ReadableStream({
  async start(controller) {
    for await (const _ of setInterval(200)) {
      controller.enqueue(`Hi-${new Date().toISOString()}`);
    }
  },
  cancel(reason) {
    console.log(`Cancelling unused streams due to reason: ${reason}`);
  },
});

const customReadable = async function* () {
  yield Buffer.from("Testing custom readable");
  await setTimeout(200);
  yield Buffer.from("...");
};

const readable2 = Readable.toWeb(Readable.from(customReadable()));

const transform = new TransformStream({
  transform(chunk, controller) {
    const transformedChunk = chunk.toLowerCase();

    console.info(`Transformed to => ${transformedChunk}`);

    controller.enqueue(transformedChunk);
  },
  flush(controller) {
    console.log(`Transform.flush!\n`);
  },
});

const decoder = new TextDecoderStream("utf-8");

const writable = new WritableStream({
  write(chunk, controller) {
    console.log(chunk);
  },
  close() {
    console.log(`Writable closed!\n`);
  },
  abort(reason) {
    console.log(`ABORT => ${reason}`);
  },
});

await readable2.pipeThrough(decoder).pipeThrough(transform).pipeTo(writable);

readable1.cancel("Not in use");
