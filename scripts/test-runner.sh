#!/usr/bin/env bash
set -e

echo "🚀 [Test Runner] Initializing isolated test environment..."

# 1. Ensure .env.test exists
if [ ! -f ".env.test" ]; then
  echo "❌ Error: .env.test file not found!"
  exit 1
fi

# 2. Automatically create test database if running under local docker container
if docker ps --format '{{.Names}}' | grep -q "workout-tracker-postgres"; then
  docker exec -i workout-tracker-postgres psql -U postgres -c "CREATE DATABASE workout_tracker_test;" 2>/dev/null || true
fi

# 3. Push database schema to the test database
echo "📦 [Test Runner] Syncing schema to test database..."
NODE_ENV=test npx dotenv -e .env.test -- prisma db push --skip-generate --accept-data-loss

# 4. Run Jest with experimental VM modules for native ES Modules
echo "🧪 [Test Runner] Running test suite with Jest..."
npx cross-env NODE_ENV=test NODE_OPTIONS="--experimental-vm-modules" dotenv -e .env.test -- jest --runInBand "$@"

echo "✅ [Test Runner] All tests completed successfully!"
