import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { Readable, Writable, Transform } from "node:stream";
import { TransformStream } from "node:stream/web";
import CSVToJSON from "csvtojson";

const PORT = 3000;

createServer(async (request, response) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
  };

  if (request.method === "OPTIONS") {
    response.writeHead(204, headers);
    response.end();
    return;
  }

  let itemsProcessed = 0;

  request.once("close", () => console.info(`Connection was closed! Items processed => ${itemsProcessed}`));

  const readStream = createReadStream("./animeflv.csv");

  const transform = new TransformStream({
    transform(chunk, controller) {
      if (itemsProcessed === 0) {
        controller.enqueue(Buffer.from("["));
        controller.enqueue(chunk);

        itemsProcessed += 1;

        return;
      }

      controller.enqueue(Buffer.from(","));
      controller.enqueue(chunk);

      itemsProcessed += 1;
    },
    flush(controller) {
      controller.enqueue(Buffer.from("]"));
    },
  });

  response.setHeader("Content-Type", "application/json");

  try {
    await Readable.toWeb(Readable.from(readStream))
      .pipeThrough(Transform.toWeb(CSVToJSON()))
      .pipeThrough(transform)
      .pipeTo(Writable.toWeb(response));

    console.log(`Finishing streaming the file!`);
  } catch (error) {
    console.error(`Streaming error: ${error.message}. Items processed => ${itemsProcessed}`);

    readStream.destroy();
  }
})
  .listen(PORT)
  .on("listening", () => console.info(`Application in running at port ${PORT}`));
