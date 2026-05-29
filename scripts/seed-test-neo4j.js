import { driver } from "../db/neo4jClient.js";

async function seedTestNeo4j() {
  const session = driver.session();

  try {
    await session.run("MATCH (n) DETACH DELETE n");

    await session.run(`
      CREATE (:Station {
        id: "940GZZLUWLO",
        name: "Waterloo Underground Station",
        lat: 51.5036,
        lon: -0.1143
      })
    `);

    console.log("Neo4j test database seeded.");
  } finally {
    await session.close();
    await driver.close();
  }
}

await seedTestNeo4j();
