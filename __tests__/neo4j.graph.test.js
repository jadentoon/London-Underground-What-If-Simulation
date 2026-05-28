import { jest } from "@jest/globals";

import { driver } from "../db/neo4jClient.js";

const describeIfNeo4j = process.env.RUN_NEO4J_TESTS === "true" ? describe : describe.skip;

// This suite is opt-in because it requires a running local Neo4j instance.
describeIfNeo4j("Database (Neo4j) Tests - Graph Integrity", () => {
  let session;

  beforeAll(() => {
    session = driver.session();
  });

  afterAll(async () => {
    try {
      if (session) await session.close();
    } finally {
      await driver.close();
    }
  });

  test("Station Nodes Exist - Waterloo", async () => {
    const stationName = "Waterloo Underground Station";

    const result = await session.run(
      "MATCH (s:Station {name: $name}) RETURN count(s) AS cnt",
      { name: stationName },
    );

    const record = result.records[0];
    const count = record.get("cnt").toNumber ? record.get("cnt").toNumber() : record.get("cnt");

    expect(count).toBe(1);
  });
});
