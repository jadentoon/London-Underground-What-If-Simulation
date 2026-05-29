# COMP6030 Group Project - London Underground "What-If" Simulation

A web-based London Underground network simulator that uses TfL data, Neo4j and an interactive map to visualise routes, live service disruption, train movement and hypothetical station or line closures.

## Features

- Interactive London Underground map
- Live TfL line status and station disruption data
- What-If mode for closing stations and lines
- Route calculation between stations
- Visual disruption indicators
- Live or simulated train movement
- Saved hypothetical disruption scenarios

## Tech Stack

- Next.js / React
- Neo4j
- TfL Unified API
- Leaflet.js
- Node.js
- Jest
- Docker

## Running the Project Locally with Docker

This project can be run entirely with Docker. The local setup starts a Neo4j database, seeds it with the London Underground graph, imports travel times from the included CSV file, and runs the frontend connected to that database.

### Prerequisites

- Docker Desktop installed and running
- Internet access for the first setup and TfL route-data fetch

No Neo4j Aura credentials are required for the Docker setup.

### 1. Start Neo4j

```bash
docker compose up -d neo4j
```

Wait until Neo4j is healthy:
```bash
docker compose ps
```

### 2. Seed the Database

```bash
docker compose run --rm db-seed
```

This will:
- Fetch London Underground route data from the TfL API
- Create station nodes
- Create station-to-station `CONNECTS_TO` relationships
- Add fallback travel times
- Import real travel times from 
  `travel_time_data/tfl_station_travel_times.csv`

### 3. Start the Frontend

```bash
docker compose up frontend
```

Open the application at:
http://localhost:3000

### Local Neo4j Access

Neo4j Browser is available at:
```text
http://localhost:7474
```

Credentials:
```text
Username: neo4j
Password: password
```

The frontend connects to Neo4j automatically through Docker Compose using:
```text
bolt://neo4j:7687
```

No `.env` file is required for the Docker setup.

### Rebuilding the Database

To rerun the seed process against the existing local database:

```bash
docker compose run --rm db-seed
```

To completely remove the local database and rebuild it from scratch:

```bash
docker compose down -v
docker compose up -d neo4j
docker compose run --rm db-seed
docker compose up frontend
```

```md
> Note: `docker compose down -v` deletes the local Neo4j Docker volume.
```