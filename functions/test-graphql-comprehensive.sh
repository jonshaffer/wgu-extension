#!/bin/bash

# Comprehensive GraphQL endpoint testing
# This script tests all major GraphQL queries including the new community features

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PUBLIC_ENDPOINT="${GRAPHQL_ENDPOINT:-http://localhost:5001/wgu-extension-site-prod/us-central1/publicApi}"
ADMIN_ENDPOINT="${ADMIN_ENDPOINT:-http://localhost:5001/wgu-extension-site-prod/us-central1/adminApi}"

echo -e "${YELLOW}Starting comprehensive GraphQL endpoint tests...${NC}\n"

# Helper function to make GraphQL requests
make_request() {
    local endpoint=$1
    local query=$2
    local description=$3
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    response=$(curl -s -X POST \
        "$endpoint" \
        -H 'Content-Type: application/json' \
        -d "$query")
    
    # Check if response contains errors
    if echo "$response" | jq -e '.errors' > /dev/null 2>&1; then
        echo -e "${RED}❌ Failed: $description${NC}"
        echo "$response" | jq '.errors'
        return 1
    else
        echo -e "${GREEN}✅ Success: $description${NC}"
        echo "$response" | jq '.' | head -20
        echo "..."
        return 0
    fi
}

# Test counter
total_tests=0
passed_tests=0

# Function to increment test counter
run_test() {
    total_tests=$((total_tests + 1))
    if make_request "$@"; then
        passed_tests=$((passed_tests + 1))
    fi
    echo ""
}

echo -e "${YELLOW}=== PUBLIC API TESTS ===${NC}\n"

# 1. Test ping query
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query Ping { ping }"}' \
    "Ping query"

# 2. Test basic search
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query Search($query: String!, $limit: Int) { search(query: $query, limit: $limit) { results { type id title description url courseCode tags } totalCount } }", "variables": {"query": "C172", "limit": 5}}' \
    "Basic search for C172"

# 3. Test course fetching
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetCourse($courseCode: String!) { course(courseCode: $courseCode) { courseCode name description units level competencyUnits prerequisites corequisites } }", "variables": {"courseCode": "C172"}}' \
    "Get course details for C172"

# 4. Test course list
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetCourses($limit: Int, $offset: Int) { courses(limit: $limit, offset: $offset) { items { courseCode name description units level } totalCount } }", "variables": {"limit": 5, "offset": 0}}' \
    "Get course list"

# 5. Test Discord servers
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetDiscordServers($limit: Int, $offset: Int) { discordServers(limit: $limit, offset: $offset) { items { id name icon memberCount description categories } totalCount } }", "variables": {"limit": 3}}' \
    "Get Discord servers"

# 6. Test Reddit communities
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetRedditCommunities($limit: Int, $offset: Int) { redditCommunities(limit: $limit, offset: $offset) { items { name fullName description subscriberCount isActive college } totalCount } }", "variables": {"limit": 3}}' \
    "Get Reddit communities"

# 7. Test multi-subreddit search
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query SearchSubreddits($query: String!, $subreddits: [String!]!, $sortBy: RedditSortBy, $timeWindow: RedditTimeWindow, $limit: Int) { searchSubreddits(query: $query, subreddits: $subreddits, sortBy: $sortBy, timeWindow: $timeWindow, limit: $limit) { results { id title text url author subreddit score upvoteRatio numComments created permalink tags } totalCount searchQuery subreddits sortBy timeWindow } }", "variables": {"query": "python", "subreddits": ["WGU", "WGU_CompSci"], "limit": 3}}' \
    "Multi-subreddit search"

# 8. Test WGU Connect groups
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetWguConnectGroups($limit: Int, $offset: Int) { wguConnectGroups(limit: $limit, offset: $offset) { items { id name courseCode memberCount lastActivity } totalCount } }", "variables": {"limit": 3}}' \
    "Get WGU Connect groups"

# 9. Test Student Groups
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetStudentGroups($limit: Int, $offset: Int) { studentGroups(limit: $limit, offset: $offset) { items { id name type platform memberCount description tags } totalCount } }", "variables": {"limit": 3}}' \
    "Get Student Groups"

# 10. Test legacy communities for course
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetCommunitiesForCourse($courseCode: String!) { search(query: $courseCode, limit: 50) { results { type id title description url courseCode tags } totalCount } }", "variables": {"courseCode": "C172"}}' \
    "Get communities for course (legacy)"

# 11. Test NEW V2 communities for course
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetCommunitiesForCourseV2($courseCode: String!) { getCommunitiesForCourse(courseCode: $courseCode) { courseCode courseName discord { id name description inviteUrl memberCount tags verified } reddit { id name description url subscriberCount type tags active } wguConnect { id courseCode name description memberCount resources { id title type url upvotes } } studentGroups { id name description type websiteUrl tags active } } }", "variables": {"courseCode": "C172"}}' \
    "Get communities for course V2 (NEW)"

# 12. Test degree plans
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query GetDegreePlans($limit: Int, $offset: Int) { degreePlans(limit: $limit, offset: $offset) { items { id name description totalCUs courses } totalCount } }", "variables": {"limit": 3}}' \
    "Get degree plans"

# 13. Test advanced search with filters
run_test "$PUBLIC_ENDPOINT" \
    '{"query": "query AdvancedSearch($query: String!, $filters: [SearchFilter!], $textSearch: String, $limit: Int, $offset: Int) { advancedSearch(query: $query, filters: $filters, textSearch: $textSearch, limit: $limit, offset: $offset) { results { type courseCode name url description icon platform memberCount competencyUnits college degreeType level units serverId subredditName groupId degreeId studentGroupId tags } totalCount query appliedFilters } }", "variables": {"query": "python", "limit": 5}}' \
    "Advanced search"

echo -e "\n${YELLOW}=== ADMIN API TESTS ===${NC}\n"

# Admin API tests would go here, but they require authentication
# For now, just test that the endpoint responds appropriately

# 14. Test admin ping (should fail without auth)
run_test "$ADMIN_ENDPOINT" \
    '{"query": "{ ping }"}' \
    "Admin ping (expecting auth error)"

echo -e "\n${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Total tests: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi