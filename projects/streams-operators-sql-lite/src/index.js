import Database from "./database.js";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { join } from "node:path";

async function* selectAsStream() {
  const limit = 100;
  let skip = 0;

  console.time(`[1] Fetching users from database...`);

  while (true) {
    const users = Database.prepare(`SELECT * FROM users LIMIT ${limit} OFFSET ${skip};`).all();

    skip += limit;

    if (!users.length) break;

    for (const user of users) yield user;
  }

  console.timeEnd(`[1] Fetching users from database...`);
}

let processed = 0;

const stream = Readable.from(selectAsStream())
  //   .filter(({ age }) => age > 25 && age < 50)
  .map(async (item) => {
    const name = await Promise.resolve(item.name.toUpperCase());

    return {
      ...item,
      name,
      at: new Date().toISOString(),
    };
  })
  .map((item) => {
    processed++;
    return JSON.stringify(item).concat("\n");
  });

console.time(`[2] Writing user data into a NDJSON file...`);
await pipeline(stream, createWriteStream(join(import.meta.dirname, "..", "data", "users.ndjson")));
console.timeEnd(`[2] Writing user data into a NDJSON file...`);
