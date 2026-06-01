Set-Location (Resolve-Path "$PSScriptRoot\..\..")
docker compose -f docker-compose.test.yml run --rm all-tests
