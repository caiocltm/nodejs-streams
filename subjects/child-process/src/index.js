import { readdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { fork } from "node:child_process";
import { Readable, PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";

const backgroundJob = "./src/background.js";
const outputFileName = "./database/output-data.ndjson";

console.time("Child process");

function merge(streams) {
  let pass = new PassThrough();
  let waiting = streams.length;

  for (const stream of streams) {
    pass = stream.pipe(pass, { end: false });

    stream.once("end", () => --waiting === 0 && pass.emit("end"));
  }

  return pass;
}

function childProcessAsStream(childProcess, file) {
  const stream = Readable({ read() {} });

  childProcess.on("message", ({ status, message }) => {
    if (status === "error") {
      console.log({ message: "Error thrown!", file, pid: childProcess.pid, message: message.split("\n") });

      stream.push(null);

      return;
    }

    stream.push(JSON.stringify({ ...message, file, pid: childProcess.pid }).concat("\n"));
  });

  childProcess.send(file);

  return stream;
}

function transform() {
  return async function* (source) {
    for await (const chunk of source) {
      for (const line of chunk.toString().trim().split("\n")) {
        const { file, ...data } = JSON.parse(line);

        counters[data.pid].counter += 1;

        yield JSON.stringify(data).concat("\n");
      }
    }
  };
}

const counters = {};
const childProcesses = [];
const output = createWriteStream(outputFileName);
const files = (await readdir("./database")).filter((file) => !file.includes("output-data"));

for (const file of files) {
  const cp = fork(backgroundJob, [], { silent: false });

  counters[cp.pid] = { counter: 1 };

  const stream = childProcessAsStream(cp, `./database/${file}`);

  childProcesses.push(stream);
}

const allStreams = merge(childProcesses);

pipeline(allStreams, transform(), output);

console.timeEnd("Child process");
