#!/bin/bash

# Test script for new community features
# Focuses on the getCommunitiesForCourse V2 query and related functionality

set -e

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PUBLIC_ENDPOINT="${GRAPHQL_ENDPOINT:-http://localhost:5001/wgu-extension-site-prod/us-central1/publicApi}"

echo -e "${BLUE}Testing Community Features${NC}\n"

# Test courses with known community mappings
TEST_COURSES=("C172" "C182" "C195" "C867" "C482")

echo -e "${YELLOW}Testing getCommunitiesForCourse V2 for multiple courses...${NC}\n"

for course in "${TEST_COURSES[@]}"; do
    echo -e "${BLUE}Testing course: $course${NC}"
    
    # Make the request
    response=$(curl -s -X POST \
        "$PUBLIC_ENDPOINT" \
        -H 'Content-Type: application/json' \
        -d "{
            \"query\": \"query GetCommunitiesForCourseV2(\$courseCode: String!) { getCommunitiesForCourse(courseCode: \$courseCode) { courseCode courseName discord { id name description inviteUrl memberCount tags verified } reddit { id name description url subscriberCount type tags active } wguConnect { id courseCode name description memberCount resources { id title type url upvotes } } studentGroups { id name description type websiteUrl tags active } } }\",
            \"variables\": {\"courseCode\": \"$course\"}
        }")
    
    # Pretty print the response
    echo "$response" | jq '.'
    
    # Extract counts
    discord_count=$(echo "$response" | jq '.data.getCommunitiesForCourse.discord | length' 2>/dev/null || echo "0")
    reddit_count=$(echo "$response" | jq '.data.getCommunitiesForCourse.reddit | length' 2>/dev/null || echo "0")
    wgu_connect=$(echo "$response" | jq '.data.getCommunitiesForCourse.wguConnect' 2>/dev/null)
    student_groups_count=$(echo "$response" | jq '.data.getCommunitiesForCourse.studentGroups | length' 2>/dev/null || echo "0")
    
    echo -e "\n${GREEN}Summary for $course:${NC}"
    echo "- Discord servers: $discord_count"
    echo "- Reddit communities: $reddit_count"
    echo "- WGU Connect: $([ "$wgu_connect" != "null" ] && echo "Yes" || echo "No")"
    echo "- Student groups: $student_groups_count"
    echo -e "\n---\n"
done

# Test error handling
echo -e "${YELLOW}Testing error handling with invalid course code...${NC}"
curl -s -X POST \
    "$PUBLIC_ENDPOINT" \
    -H 'Content-Type: application/json' \
    -d '{
        "query": "query GetCommunitiesForCourseV2($courseCode: String!) { getCommunitiesForCourse(courseCode: $courseCode) { courseCode courseName discord { id name } reddit { id name } wguConnect { id name } studentGroups { id name } } }",
        "variables": {"courseCode": "INVALID123"}
    }' | jq '.'

echo -e "\n${GREEN}Community features test complete!${NC}"