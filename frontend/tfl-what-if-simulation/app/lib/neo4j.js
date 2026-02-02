import neo4j from "neo4j-driver";

const NEO4J_AURA_URI = process.env.NEO4J_AURA_URI;

const NEO4J_AURA_USER = process.env.NEO4J_AURA_USER;

const NEO4J_AURA_PASSWORD = process.env.NEO4J_AURA_PASSWORD;

const driver = neo4j.driver(
    NEO4J_AURA_URI,
    neo4j.auth.basic(
        NEO4J_AURA_USER, 
        NEO4J_AURA_PASSWORD
    )
);

export default driver;
