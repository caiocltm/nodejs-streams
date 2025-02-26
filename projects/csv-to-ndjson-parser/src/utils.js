import Readline from "node:readline";

const log = (message) => {
  Readline.cursorTo(process.stdout, 0);
  process.stdout.write(message);
};

export { log };
