#!/bin/bash

# Run migrations
echo "Running database migrations..."
npm run migration:run

# Check if migrations succeeded
if [ $? -ne 0 ]; then
  echo "Migrations failed!"
  exit 1
fi

echo "Migrations completed successfully!"
echo "Starting the application..."

# Start the application
npm run start:dev
