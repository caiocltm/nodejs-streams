import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { Readable, Transform } from "node:stream";
import { TransformStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
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

  const abortController = new AbortController();

  request.once("close", () => {
    console.info(`Connection was closed! Items processed => ${itemsProcessed}`);
    abortController.abort();
  });

  const readStream = createReadStream("./animeflv.csv");

  const transform = new TransformStream({
    transform(chunk, controller) {
      const data = JSON.parse(Buffer.from(chunk));

      const mappedData = JSON.stringify({
        title: data.title,
        description: data.description,
        url: data.url_anime,
      });

      controller.enqueue(mappedData.concat("\n"));
    },
  });

  try {
    response.writeHead(200, headers);

    await Readable.toWeb(readStream)
      .pipeThrough(Transform.toWeb(CSVToJSON()))
      .pipeThrough(transform)
      .pipeTo(
        new WritableStream({
          write(chunk) {
            itemsProcessed += 1;

            response.write(chunk);
          },
          close() {
            response.end();
          },
          abort(reason) {
            console.warn(`Request aborted due to => ${reason}`);
          },
        }),
        { signal: abortController.signal }
      );

    console.log(`Finishing streaming the file!`);
  } catch (error) {
    if (!error.message.includes("abort")) throw error;

    console.error(`Streaming error: ${error.message}. Items processed => ${itemsProcessed}`);
  }
})
  .listen(PORT)
  .on("listening", () => console.info(`Application in running at port ${PORT}`));
