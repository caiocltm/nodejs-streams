import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

console.log(`Initializing process ${process.pid}`);

process.once("message", async (file) => {
  try {
    let buffer = "";

    await pipeline(createReadStream(file), async function* (source) {
      for await (const chunk of source) {
        if (!chunk.length) continue;

        buffer += chunk;

        const items = buffer.split("\n");

        items.forEach((item) => {
          if (item.endsWith("}")) {
            const parsedItem = JSON.parse(item);

            if (parsedItem.email.includes("gmail")) process.send({ status: "success", message: parsedItem });
          }
        });

        buffer = items[items.length - 1];
      }
    });
  } catch (error) {
    process.send({ status: "error", message: error.message });
  }
});
