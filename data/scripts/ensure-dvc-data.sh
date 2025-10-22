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
    
    # Pull all DVC-managed data from sources/
    echo "  📂 Pulling all source data..."
    dvc pull data/sources/
    
    # Also pull parsed catalogs if they exist (legacy support during transition)
    if [ -d "$ROOT_DIR/data/catalogs/parsed" ]; then
        echo "  📂 Pulling legacy parsed catalog data..."
        dvc pull data/catalogs/parsed/ || true
    fi
    
    echo "✅ DVC pull completed"
else
    echo "⚠️  DVC not found. Checking if data files exist..."
    
    # Check for source files
    if [ -z "$(ls -A $ROOT_DIR/data/sources/catalogs/*.pdf 2>/dev/null)" ]; then
        echo "❌ No catalog PDFs found and DVC is not available!"
        echo "Please install DVC or ensure data files are present."
        exit 1
    fi
    
    # Check for community data files
    if [ -z "$(ls -A $ROOT_DIR/data/sources/discord/*.json 2>/dev/null)" ]; then
        echo "⚠️  No community data found. Some scripts may fail."
    fi
    
    echo "✅ Some data files already present"
fi