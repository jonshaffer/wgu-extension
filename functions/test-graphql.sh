#!/bin/bash

# Test GraphQL search endpoint

echo "Testing GraphQL search endpoint..."

# Simple search query
curl -X POST \
  http://localhost:5001/wgu-extension-site-prod/us-central1/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query TestSearch { search(query: \"test\") { query totalCount results { type name platform } } }"
  }' | jq .

echo -e "\n\nTesting course search..."

# Search for courses
curl -X POST \
  http://localhost:5001/wgu-extension-site-prod/us-central1/graphql \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query CourseSearch { search(query: \"C172\", limit: 5) { query totalCount results { type name courseCode platform description } } }"
  }' | jq .