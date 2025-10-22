#!/bin/bash

# Admin API Testing Script
# Tests all admin mutations with validation

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ADMIN_ENDPOINT="${ADMIN_ENDPOINT:-http://localhost:5001/wgu-extension-site-prod/us-central1/adminApi}"
ADMIN_TOKEN="${ADMIN_TOKEN:-test-admin-token}" # In production, this would be a real Firebase auth token

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}     Admin API Testing Script         ${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Helper function to make GraphQL requests
make_request() {
    local query=$1
    local description=$2
    local should_fail=${3:-false}
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    
    response=$(curl -s -X POST \
        "$ADMIN_ENDPOINT" \
        -H 'Content-Type: application/json' \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$query" 2>&1)
    
    # Check if response contains errors
    if echo "$response" | jq -e '.errors' > /dev/null 2>&1; then
        if [ "$should_fail" = true ]; then
            echo -e "${GREEN}✅ Expected failure: $description${NC}"
            echo "$response" | jq '.errors[0].message' | head -20
        else
            echo -e "${RED}❌ Failed: $description${NC}"
            echo "$response" | jq '.errors'
            return 1
        fi
    else
        if [ "$should_fail" = true ]; then
            echo -e "${RED}❌ Expected to fail but succeeded: $description${NC}"
            return 1
        else
            echo -e "${GREEN}✅ Success: $description${NC}"
            echo "$response" | jq '.' | head -20
        fi
    fi
}

# Test counter
total_tests=0
passed_tests=0

run_test() {
    ((total_tests++))
    if make_request "$@"; then
        ((passed_tests++))
    fi
}

echo -e "${BLUE}\n=== Discord Server Tests ===${NC}"

# Test 1: Create valid Discord server
run_test '{
  "query": "mutation IngestDiscordServer($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId name inviteUrl memberCount tags verified } }",
  "variables": {
    "input": {
      "serverId": "123456789012345678",
      "name": "WGU Computer Science",
      "description": "Official WGU CS Discord server",
      "inviteUrl": "https://discord.gg/wgucs",
      "memberCount": 2500,
      "tags": ["computer-science", "official"],
      "verified": true
    }
  }
}' "Create valid Discord server"

# Test 2: Invalid Discord ID (should fail)
run_test '{
  "query": "mutation IngestDiscordServer($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "invalid-id",
      "name": "Test Server",
      "inviteUrl": "https://discord.gg/test"
    }
  }
}' "Create Discord server with invalid ID (should fail)" true

# Test 3: Invalid invite URL (should fail)
run_test '{
  "query": "mutation IngestDiscordServer($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "234567890123456789",
      "name": "Test Server",
      "inviteUrl": "not-a-discord-url"
    }
  }
}' "Create Discord server with invalid invite URL (should fail)" true

# Test 4: Update Discord server
run_test '{
  "query": "mutation UpdateDiscordServer($id: String!, $input: DiscordServerUpdateInput!) { updateDiscordServer(id: $id, input: $input) { serverId name memberCount tags } }",
  "variables": {
    "id": "123456789012345678",
    "input": {
      "name": "Updated WGU CS Discord",
      "memberCount": 3000,
      "tags": ["computer-science", "official", "updated"]
    }
  }
}' "Update Discord server"

echo -e "${BLUE}\n=== Reddit Community Tests ===${NC}"

# Test 5: Create valid Reddit community
run_test '{
  "query": "mutation IngestRedditCommunity($input: RedditCommunityInput!) { ingestRedditCommunity(input: $input) { subredditName name url memberCount tags } }",
  "variables": {
    "input": {
      "subreddit": "WGU_CompSci",
      "name": "WGU Computer Science",
      "description": "Subreddit for WGU CS students",
      "url": "https://reddit.com/r/WGU_CompSci",
      "memberCount": 25000,
      "tags": ["computer-science", "bs-cs"]
    }
  }
}' "Create valid Reddit community"

# Test 6: Invalid subreddit name (should fail)
run_test '{
  "query": "mutation IngestRedditCommunity($input: RedditCommunityInput!) { ingestRedditCommunity(input: $input) { subredditName } }",
  "variables": {
    "input": {
      "subreddit": "WGU Comp-Sci!",
      "name": "Invalid Community",
      "url": "https://reddit.com/r/WGU_CompSci"
    }
  }
}' "Create Reddit community with invalid name (should fail)" true

echo -e "${BLUE}\n=== Course Tests ===${NC}"

# Test 7: Create valid course
run_test '{
  "query": "mutation UpsertCourse($input: CourseInput!) { upsertCourse(input: $input) { courseCode name units level } }",
  "variables": {
    "input": {
      "courseCode": "C172",
      "name": "Network and Security - Foundations",
      "description": "Introduction to networking and security",
      "units": 3,
      "level": "undergraduate"
    }
  }
}' "Create valid course"

# Test 8: Invalid course code (should fail)
run_test '{
  "query": "mutation UpsertCourse($input: CourseInput!) { upsertCourse(input: $input) { courseCode } }",
  "variables": {
    "input": {
      "courseCode": "CS172",
      "name": "Invalid Course",
      "units": 3
    }
  }
}' "Create course with invalid code (should fail)" true

# Test 9: Invalid units (should fail)
run_test '{
  "query": "mutation UpsertCourse($input: CourseInput!) { upsertCourse(input: $input) { courseCode } }",
  "variables": {
    "input": {
      "courseCode": "C173",
      "name": "Test Course",
      "units": 15
    }
  }
}' "Create course with invalid units (should fail)" true

echo -e "${BLUE}\n=== Degree Plan Tests ===${NC}"

# Test 10: Create valid degree plan
run_test '{
  "query": "mutation UpsertDegreePlan($input: DegreePlanInput!) { upsertDegreePlan(input: $input) { id name totalCUs courses } }",
  "variables": {
    "input": {
      "id": "bs-computer-science",
      "name": "Bachelor of Science in Computer Science",
      "description": "Computer Science degree program",
      "totalCUs": 122,
      "courses": ["C172", "C175", "C867"]
    }
  }
}' "Create valid degree plan"

# Test 11: Invalid degree ID format (should fail)
run_test '{
  "query": "mutation UpsertDegreePlan($input: DegreePlanInput!) { upsertDegreePlan(input: $input) { id } }",
  "variables": {
    "input": {
      "id": "BS_Computer_Science",
      "name": "Invalid Degree",
      "totalCUs": 120,
      "courses": []
    }
  }
}' "Create degree plan with invalid ID (should fail)" true

echo -e "${BLUE}\n=== Query Tests ===${NC}"

# Test 12: List Discord servers
run_test '{
  "query": "query ListDiscordServers { discordServers(limit: 10) { totalCount items { serverId name memberCount } } }"
}' "List Discord servers"

# Test 13: List courses
run_test '{
  "query": "query ListCourses { courses(limit: 10) { totalCount items { courseCode name units } } }"
}' "List courses"

# Test 14: Get ingestion stats
run_test '{
  "query": "query GetStats { ingestionStats { discordServers redditCommunities courses degreePlans lastUpdated } }"
}' "Get ingestion stats"

echo -e "${BLUE}\n=== Delete Tests ===${NC}"

# Test 15: Delete Discord server
run_test '{
  "query": "mutation DeleteDiscordServer($id: String!) { deleteDiscordServer(id: $id) }",
  "variables": {
    "id": "123456789012345678"
  }
}' "Delete Discord server"

# Test 16: Delete course
run_test '{
  "query": "mutation DeleteCourse($courseCode: String!) { deleteCourse(courseCode: $courseCode) }",
  "variables": {
    "courseCode": "C172"
  }
}' "Delete course"

# Summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}           Test Summary               ${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Total tests: ${total_tests}"
echo -e "Passed: ${GREEN}${passed_tests}${NC}"
echo -e "Failed: ${RED}$((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed 😞${NC}"
    exit 1
fi