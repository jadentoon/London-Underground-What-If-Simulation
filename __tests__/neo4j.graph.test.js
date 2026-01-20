import { driver } from '../db/neo4jClient.js';

import { jest } from '@jest/globals';


// this test suite focuses on verifying the integrity of the graph data in Neo4j
//checking if station nodes exist as expected
//check if neo4j is running and accessible before running tests
// test missing, duplicate nodes




// increase default timeout in case the database is cold
jest.setTimeout(20000);

describe('Database (Neo4j) Tests - Graph Integrity', () => {
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

  test('Station Nodes Exist - Waterloo', async () => {
    const stationName = 'Waterloo Underground Station';

    const result = await session.run(
      'MATCH (s:Station {name: $name}) RETURN count(s) AS cnt',
      { name: stationName }
    );

    const record = result.records[0];
    const cnt = record.get('cnt').toNumber ? record.get('cnt').toNumber() : record.get('cnt');

    // expect exactly one node for the station named 'Waterloo'
    expect(cnt).toBe(1);
  });
});
