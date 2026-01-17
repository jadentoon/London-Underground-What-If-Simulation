import neo4j from "neo4j-driver";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), ".env") });
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

export const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic("neo4j", NEO4J_PASSWORD)
);

