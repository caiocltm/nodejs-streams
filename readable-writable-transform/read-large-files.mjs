import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";

const filename = path.join(import.meta.dirname, "..", "large-file.txt");

const file = await readFile(filename);

const stats = await stat(filename);

console.log(`File read: ${filename}\n\n`);
console.log(`File Size: ${file.byteLength / 1e6}MB\n\n`);
console.table(stats);

const readStream = createReadStream(filename, { highWaterMark: 70000 }); // Should read 70KB (as defined ion HighWaterMark property) of content per time. Default: 65KB

let chunksConsumed = 0;

// Will read 70KB of data at time (When available), as set in HighWaterMark property.
readStream
  // Triggered by the first readStream.read call once.
  .once("data", (data) => console.log(`OnceData: Chunk data length => ${data.toString().length}`))
  // Triggers `onData` event handler when calling `readStream.read` passing only the size of bytes passed into the `read()` method.
  // On this case, we're reading only 100 Bytes once. The maximum allowed per event is 70KB, as set in the HighWaterMark property.
  // If you pass into the `read()` method more bytes than expected as set in HighWaterMark, the method `read()` will return null,
  // since the internal buffer hasn't consumed all the necessary data at the time the readable event is emitted.
  .once("readable", (_) => {
    console.log(`OnceReadable: Read => ${readStream.read(100).toString().length}`);
    console.log(`OnceReadable: Read => ${readStream.read(200).toString().length}`);

    chunksConsumed += 100;
    chunksConsumed += 200;
  })
  .on("readable", (_) => {
    let chunk;

    while (null !== (chunk = readStream.read())) {
      chunksConsumed += chunk.length;
    }
  })
  .on("end", () => console.log(`onEnd: Stream has ended. Consumed a total of ${chunksConsumed / 1e6}MB of data`));
