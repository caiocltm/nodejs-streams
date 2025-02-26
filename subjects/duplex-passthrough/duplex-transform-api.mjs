import { Duplex, Transform } from "node:stream";

const server = new Duplex({
  objectMode: true,

  write(chunk, enc, callback) {
    console.count(`[Write] ==== ${chunk}`);
    callback();
  },

  read(duplex, size) {
    const everySecond = (intervalContext) => {
      this.counter = this.counter ?? 0;

      if (this.counter++ <= 5) {
        // As the counter is below 5, we'll keeping push data to the stream.
        this.push(`[Read] Hi ${this.counter}, testing read function`);

        return;
      }

      clearInterval(intervalContext);

      // As soon we hit 5 in the counter, here we need to push(null)
      // to indicate that no more data will be read on this stream.
      this.push(null);
    };

    setInterval(function () {
      everySecond(this);
    });
  },
});

server.on("data", (chunk) => console.count(`[onData] => ${chunk}`));
server.on("close", () => console.count(`[onClose]`));
server.on("end", () => console.count(`[onEnd]`));
server.on("finish", () => console.count(`[onFinish]`));
server.on("resume", () => console.count(`[onResume]`));
server.on("drain", () => console.count(`[onDrain]`));
server.on("pause", () => console.count(`[onPause]`));
server.on("pipe", () => console.count(`[onPipe]`));
server.on("unpipe", () => console.count(`[onUnpipe]`));
server.on("error", (error) => console.count(`[onError] ==> ${error.message}`));

// To prove the Duplex has different communication channels,
// this operation to write will trigger the writable stream of our Duplex instance.
server.write(`[Duplex] writing data`);

// On data => the event listener server.on('data')
// will be trigger every time we call the server.push operation.
server.push(`[Duplex] pushing data`);

const transformToUpperCase = new Transform({
  objectMode: true,

  transform(chunk, enc, callback) {
    callback(null, chunk.toUpperCase());
  },
});

// The data write here should pass through the write stream and then be transformed by uppercase.
transformToUpperCase.write(`[Transform] testing writing with transform stream`);

// We can do the same thing using .push(data) function, but now, the data will not passthrough the uppercase transformation,
// since we're triggering only the readable channel stream here.
transformToUpperCase.push(`[Transform] testing pushing with transform stream`);

// Here we're piping the server duplex stream to a transform stream
// and then piping the duplex stream again.
server
  .pipe(transformToUpperCase)
  // It'll redirect all data to the duplex writable channel stream only
  .pipe(server);

/*
OUTPUT:


[Write] ==== [Duplex] writing data: 1
[onPipe]: 1
[onResume]: 1
[onData] => [Duplex] pushing data: 1
[Write] ==== [TRANSFORM] TESTING WRITING WITH TRANSFORM STREAM: 1
[Write] ==== [Transform] testing pushing with transform stream: 1
[Write] ==== [DUPLEX] PUSHING DATA: 1
[onData] => [Read] Hi 1, testing read function: 1
[Write] ==== [READ] HI 1, TESTING READ FUNCTION: 1
[onData] => [Read] Hi 2, testing read function: 1
[Write] ==== [READ] HI 2, TESTING READ FUNCTION: 1
[onData] => [Read] Hi 3, testing read function: 1
[Write] ==== [READ] HI 3, TESTING READ FUNCTION: 1
[onData] => [Read] Hi 4, testing read function: 1
[Write] ==== [READ] HI 4, TESTING READ FUNCTION: 1
[onData] => [Read] Hi 5, testing read function: 1
[Write] ==== [READ] HI 5, TESTING READ FUNCTION: 1
[onData] => [Read] Hi 6, testing read function: 1
[Write] ==== [READ] HI 6, TESTING READ FUNCTION: 1
[onEnd]: 1
[onPause]: 1
[onFinish]: 1
[onUnpipe]: 1
[onClose]: 1
**/
