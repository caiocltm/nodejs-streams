import { pipeline } from "node:stream/promises";
import { setInterval } from "node:timers/promises";
import { Readable } from "node:stream";

async function* myCustomReadable() {
  // async function* myCustomReadable(abortController)
  for await (const interval of setInterval(200)) {
    // if (abortController.signal.aborted) break; // One of the ways to abort the operation inside the piped operations.

    yield Buffer.from(`Tick: ${new Date().toISOString()}`);
  }
}

async function* myCustomWritable(stream) {
  for await (const chunk of stream) {
    console.log("[Writable] chunk => ", chunk.toString());
  }
}

const abortController = new AbortController();

// This is called before finishing the process.
abortController.signal.onabort = () => {
  console.error("Readable operations was aborted!");
};

setTimeout(() => abortController.abort("System abortion"), 500);

try {
  await pipeline(
    //   myCustomReadable, // Here, the AbortController is passed via function parameter as mentioned above in the line 6
    Readable.from(myCustomReadable()), // It is a good practice to CONVERT async iterators kind of function to type Readable.
    myCustomWritable,
    { signal: abortController.signal }
  );
} catch (error) {
  if (error.code !== "ABORT_ERR") throw error;

  console.error(`[${error.code}] ${error.message} due to reason => ${abortController.signal.reason}`);
}
