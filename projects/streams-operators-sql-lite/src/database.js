import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export default new DatabaseSync(join(import.meta.dirname, "..", "data", ".db"));
