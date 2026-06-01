#!/usr/bin/env sh
cd "$(dirname "$0")/../.." || exit 1
docker compose -f docker-compose.test.yml run --rm all-tests
