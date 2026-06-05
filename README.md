# London Underground "What-If" Simulation

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
- TfL Unified API Key

No Neo4j Aura credentials are required for the Docker setup.

### 1. Add a TfL API Key

Create a `.env` file in the project root:

```text
TFL_APP_KEY=your_tfl_api_key_here
```

This key is used by the database seed step to fetch London Underground route data from the TfL API.

### 2. Start Neo4j

```bash
docker compose up -d neo4j
```

Wait until Neo4j is healthy:
```bash
docker compose ps
```

### 3. Seed the Database

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

### 4. Start the Frontend

```bash
docker compose up frontend
```

Open the application at:
```text
http://localhost:3000
```

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

No Neo4j/Aura environment variables is required for the Docker setup.

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

> Note: `docker compose down -v` deletes the local Neo4j Docker volume.

## Running Tests

The test suite can be run entirely with Docker. The test setup creates its own Neo4j test database, seeds it with deterministic test data, and then runs both the root and frontend Jest test suites.

```bash
docker compose -f docker-compose.test.yml run --rm all-tests
```

This will:
- Start a separate neo4j-test container
- Wait until Neo4j is healthy
- Seed the test database
- Run the root Jest tests
- Run the frontend Jest tests

## Authors

- Sinead Parkinson - Project Manager
- Jaden Toon - Software Development Lead
- Sattyaj Paul - Testing Lead
- Saf Sikder - Documentation Lead

## Screenshots
<p>
  <img width="1919" height="876" alt="image" src="https://github.com/user-attachments/assets/5396aaa0-a52e-474f-a340-1b0fc0c3e6bc" />
  <em>The Main screen of the London Underground What-If Simulation, displaying the interactive network map, station search, route planning and scenario modelling controls. </em>
</p>
<br>
<p>
  <img width="1919" height="868" alt="image" src="https://github.com/user-attachments/assets/b4ef1689-b306-4916-a59b-d9ffc16547c3" />
  <em>Light Mode of the main screen.</em>
</p>
<br>
<p>
  <img width="1919" height="873" alt="image" src="https://github.com/user-attachments/assets/fae3f5e1-04e5-485b-b998-d40612b0493c" />
  <em>What-If Mode – Demonstrates dynamic route recalculation by showing a journey from Tottenham Court Road to Bond Street with Oxford Circus closed, forcing the routing engine to find an alternative path through the network.</em>
</p>

