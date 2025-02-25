import net from "node:net";
import Readline from "node:readline";
import { Writable, PassThrough } from "node:stream";

let connectionRetryDelay = 1000;

const getOutputStream = () => {
  return new Writable({
    write(chunk, enc, callback) {
      const { id, message } = JSON.parse(chunk);

      if (!message) {
        log(`\nMy username is ${id}\n`);
        log(`\ntype here: `);

        return callback(null, chunk);
      }

      if (message !== "\n") {
        log(`\n\nReply from ${id}: ${message}`);
        log(`\ntype here: `);
      }

      callback(null, chunk);
    },
  });
};

const log = (message) => {
  Readline.cursorTo(process.stdout, 0);
  process.stdout.write(message);
};

const retry = (callback) => {
  log(`\n\nRetrying to connect to server in ${connectionRetryDelay / 1000}s...`);

  setTimeout(() => {
    callback();

    connectionRetryDelay += (1000 + connectionRetryDelay) / 2;
  }, connectionRetryDelay);
};

const instantiateServerConnection = (port) => {
  return net.connect({ port, keepAlive: true });
};

const setupPipes = (resetChatAfterSent, serverConnection, output) => {
  process.stdin.pipe(resetChatAfterSent).pipe(serverConnection).pipe(output);
};

const setup = () => {
  const serverConnection = instantiateServerConnection(3000);

  const resetChatAfterSent = new PassThrough();

  const output = getOutputStream();

  resetChatAfterSent.on("data", (_) => {
    log("\ntype here: ");
  });

  serverConnection
    .on("end", () => {
      log("\n\nServer connection was ended. Trying to establish connection with the server...");

      resetChatAfterSent.destroy();
      serverConnection.destroy();
      output.destroy();

      retry(setup);
    })
    .on("error", (error) => log(`\nError detail: ${error.message}`))
    .on("connect", () => {
      log("\n\nSuccessfully connected to Chat App!\n");

      connectionRetryDelay = 1000;
    })
    .on("connectionAttemptFailed", () => {
      log("3:[ConnectionAttemptFailed]");

      resetChatAfterSent.destroy();
      serverConnection.destroy();
      output.destroy();

      retry(setup);
    })
    .on("connectionAttempt", () => log(`\n\n1:[ConnectionAttempt]`))
    .on("connectionAttemptTimeout", () => {
      log(`2:[ConnectionAttemptTimeout]`);

      resetChatAfterSent.destroy();
      serverConnection.destroy();
      output.destroy();

      retry(setup);
    });

  setupPipes(resetChatAfterSent, serverConnection, output);
};

setup();
