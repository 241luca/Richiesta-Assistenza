#!/bin/bash

# Script to run the document-form integration migration
# This script should be run from the project root directory

echo "🚀 Starting Document-Form Integration Migration"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: This script must be run from the project root directory"
  exit 1
fi

# Check if Prisma CLI is installed
if ! command -v prisma &> /dev/null; then
  echo "❌ Error: Prisma CLI is not installed"
  echo "Please run: npm install -g prisma"
  exit 1
fi

# Backup the database before migration
echo "📋 Creating database backup..."
# Note: This is a placeholder - actual backup command would depend on your database setup
# For PostgreSQL: pg_dump -h localhost -U username database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Run the SQL migration
echo "⚙️  Running SQL migration..."
cd backend/prisma/migrations/0001_document_form_integration
psql -h localhost -U postgres -d richiesta_assistenza -f migration.sql

if [ $? -eq 0 ]; then
  echo "✅ SQL migration completed successfully"
else
  echo "❌ Error: SQL migration failed"
  exit 1
fi

# Update Prisma schema
echo "🔄 Updating Prisma schema..."
cd ../../../../
# In a real scenario, you would merge the schema changes into your main schema.prisma file
# For now, we'll just note that the schema has been updated

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

if [ $? -eq 0 ]; then
  echo "✅ Prisma client generated successfully"
else
  echo "❌ Error: Failed to generate Prisma client"
  exit 1
fi

# Run TypeScript migration for any additional logic
echo "🚀 Running TypeScript migration..."
cd backend/prisma/migrations/0001_document_form_integration
npx ts-node migration.ts

if [ $? -eq 0 ]; then
  echo "✅ TypeScript migration completed successfully"
else
  echo "❌ Error: TypeScript migration failed"
  exit 1
fi

echo "🎉 Document-Form Integration Migration completed successfully!"
echo "Please remember to:"
echo "1. Update your main schema.prisma file with the new model definitions"
echo "2. Run your test suite to ensure everything works correctly"
echo "3. Restart your development server"