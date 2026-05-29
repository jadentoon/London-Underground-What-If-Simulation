import neo4j from "neo4j-driver";
import dotenv from 'dotenv';
import path from 'path';

/**
 * Load environment variables from .env file located at project root.
 * process.cwd() ensures this works regardless of where the script is executed from.
 */
dotenv.config({ path: path.join(process.cwd(), ".env") });

/**
 * Neo4j password loaded securely from environment variables.
 */
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";

/**
 * Neo4j driver instance.
 * 
 * - Uses bolt protocol for high-performance binary transport.
 * - Authentication uses basic auth with usernaame "neo4j".
 * - Driver is designed to be reused across the application.
 */
export const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

