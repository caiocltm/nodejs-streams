import Database from "./database.js";
import { faker } from "@faker-js/faker";

console.time(`\n\n[1] Creating users table.:`);
Database.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT, name TEXT, age NUMBER, company TEXT);`);
console.timeEnd(`\n\n[1] Creating users table.:`);

const generateUserData = () => {
  const user = {
    id: faker.database.mongodbObjectId(),
    name: faker.internet.username(),
    company: faker.company.name(),
    age: faker.number.int({ min: 18, max: 85 }),
  };

  return [user.id, user.name, user.age, user.company];
};

console.time(`\n\n[2] Inserting 10000 fake users.:`);
for (let nUsers = 0; nUsers < 10000; nUsers++) {
  const user = generateUserData();

  Database.prepare(`INSERT INTO users(id, name, age, company) VALUES (${user.map((_) => "?").join(",")})`).run(...user);
}
console.timeEnd(`\n\n[2] Inserting 10000 fake users.:`);

console.time(`\n\n[3] Selecting top 100 seeded users.:`);
const users = Database.prepare(`SELECT u.* FROM users u ORDER BY u.name LIMIT 100;`).all();
console.timeEnd(`\n\n[3] Selecting top 100 seeded users.:`);
console.table(users);
console.info("\n");

console.time(`\n\n[4] Closing database connection.:`);
Database.close();
console.timeEnd(`\n\n[4] Closing database connection.:`);
