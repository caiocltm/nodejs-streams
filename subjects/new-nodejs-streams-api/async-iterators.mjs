import { pipeline } from "node:stream/promises";
import { setTimeout } from "node:timers/promises";

async function* myCustomReadable() {
  yield Buffer.from("This is my");
  await setTimeout(100);
  yield Buffer.from("custom readable");
}

async function* myCustomTransform(stream) {
  for await (const chunk of stream) {
    yield chunk.toString().replace(/\s/g, "_");
  }
}

async function* myCustomWritable(stream) {
  for await (const chunk of stream) {
    console.log("chunk => ", chunk.toString());
  }
}

async function* myCustomDuplex(stream) {
  const wholeString = [];
  let bytesRead = 0;

  for await (const chunk of stream) {
    console.log("[Duplex Writable] chunk => ", chunk.toString());
    bytesRead += chunk.length;

    wholeString.push(chunk);
  }

  yield `Whole string: ${wholeString.join()}`;
  yield `Bytes read: ${bytesRead}`;
}

await pipeline(myCustomReadable, myCustomTransform, myCustomDuplex, myCustomWritable);
