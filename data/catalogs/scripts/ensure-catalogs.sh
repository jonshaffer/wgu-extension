#!/bin/bash
# Ensure catalog files are available by pulling from DVC
# This script should be run before any catalog processing operations

set -e

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../../.." && pwd )"

echo "📦 Ensuring catalog files are available..."

# Check if DVC is available
if command -v dvc &> /dev/null; then
    echo "🔄 Running DVC pull to fetch catalog files..."
    cd "$ROOT_DIR"
    dvc pull data/catalogs/parsed/
    echo "✅ DVC pull completed"
else
    echo "⚠️  DVC not found. Checking if catalog files exist..."
    if [ -z "$(ls -A $ROOT_DIR/data/catalogs/parsed/*.json 2>/dev/null)" ]; then
        echo "❌ No catalog files found and DVC is not available!"
        echo "Please install DVC or ensure catalog files are present."
        exit 1
    else
        echo "✅ Catalog files already present"
    fi
fi