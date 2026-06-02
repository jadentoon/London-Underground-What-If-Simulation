import neo4j from "neo4j-driver";

const NEO4J_URI = process.env.NEO4J_URI || process.env.NEO4J_AURA_URI;

const NEO4J_USER = process.env.NEO4J_USER || process.env.NEO4J_AURA_USER;

const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || process.env.NEO4J_AURA_PASSWORD;

/**
 * Creates the shared Neo4j driver used by server-side API routes.
 * 
 * The driver reads either local Neo4j connection or Aura-style
 * fallback variables from the environment. API routes should reuse this driver
 * instead of creating new connections per request.
 * 
 * @returns {import("neo4j-driver").Driver} Shared Neo4j driver instance.
 */
const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(
        NEO4J_USER,
        NEO4J_PASSWORD
    )
);

export default driver;
