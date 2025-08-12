#!/bin/bash
# Ensure all DVC-managed data files are available
# This script should be run before any data processing operations

set -e

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo "📦 Ensuring all DVC-managed data files are available..."

# Check if DVC is available
if command -v dvc &> /dev/null; then
    echo "🔄 Running DVC pull to fetch all data files..."
    cd "$ROOT_DIR"
    
    # Pull all DVC-managed data
    echo "  📂 Pulling catalog files..."
    dvc pull data/catalogs/parsed/ data/catalogs/pdfs/
    
    echo "  📂 Pulling raw community data..."
    dvc pull data/discord/raw/ data/reddit/raw/ data/wgu-connect/raw/ data/wgu-student-groups/raw/
    
    echo "✅ DVC pull completed"
else
    echo "⚠️  DVC not found. Checking if data files exist..."
    
    # Check for catalog files
    if [ -z "$(ls -A $ROOT_DIR/data/catalogs/parsed/*.json 2>/dev/null)" ]; then
        echo "❌ No catalog files found and DVC is not available!"
        echo "Please install DVC or ensure data files are present."
        exit 1
    fi
    
    # Check for raw data files
    if [ -z "$(ls -A $ROOT_DIR/data/discord/raw/*.json 2>/dev/null)" ]; then
        echo "⚠️  No raw community data found. Some scripts may fail."
    fi
    
    echo "✅ Some data files already present"
fi