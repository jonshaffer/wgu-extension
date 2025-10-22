#!/bin/bash

# Validation Testing Script
# Tests GraphQL input validation with various edge cases

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
ADMIN_ENDPOINT="${ADMIN_ENDPOINT:-http://localhost:5001/wgu-extension-site-prod/us-central1/adminApi}"
ADMIN_TOKEN="${ADMIN_TOKEN:-test-admin-token}"

echo -e "${PURPLE}======================================${NC}"
echo -e "${PURPLE}    Validation Testing Script         ${NC}"
echo -e "${PURPLE}======================================${NC}\n"

# Helper function
test_validation() {
    local query=$1
    local test_name=$2
    local expected_error=$3
    
    echo -e "\n${YELLOW}Testing: $test_name${NC}"
    echo -e "${BLUE}Expected error: $expected_error${NC}"
    
    response=$(curl -s -X POST \
        "$ADMIN_ENDPOINT" \
        -H 'Content-Type: application/json' \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$query" 2>&1)
    
    if echo "$response" | jq -e '.errors' > /dev/null 2>&1; then
        error_msg=$(echo "$response" | jq -r '.errors[0].message')
        if echo "$error_msg" | grep -q "$expected_error"; then
            echo -e "${GREEN}✅ Correctly rejected with expected error${NC}"
            echo "   Error: $error_msg"
        else
            echo -e "${RED}❌ Rejected but with unexpected error${NC}"
            echo "   Expected: $expected_error"
            echo "   Got: $error_msg"
        fi
    else
        echo -e "${RED}❌ Should have failed but succeeded${NC}"
        echo "$response" | jq '.'
    fi
}

echo -e "${PURPLE}\n=== Discord ID Validation ===${NC}"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "123",
      "name": "Test",
      "inviteUrl": "discord.gg/test"
    }
  }
}' "Discord ID too short (3 chars)" "Invalid Discord ID format"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "12345678901234567890123",
      "name": "Test",
      "inviteUrl": "discord.gg/test"
    }
  }
}' "Discord ID too long (23 chars)" "Invalid Discord ID format"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "abcdefghijklmnopqr",
      "name": "Test",
      "inviteUrl": "discord.gg/test"
    }
  }
}' "Discord ID with letters" "Invalid Discord ID format"

echo -e "${PURPLE}\n=== Discord Invite URL Validation ===${NC}"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "123456789012345678",
      "name": "Test",
      "inviteUrl": "not-a-url"
    }
  }
}' "Invalid URL format" "Invalid Discord invite URL format"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "123456789012345678",
      "name": "Test",
      "inviteUrl": "https://example.com/invite"
    }
  }
}' "Non-Discord URL" "Invalid Discord invite URL format"

echo -e "${PURPLE}\n=== Server Name Validation ===${NC}"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "123456789012345678",
      "name": "A",
      "inviteUrl": "discord.gg/test"
    }
  }
}' "Name too short (1 char)" "at least 2 characters"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "123456789012345678",
      "name": "'$(printf 'A%.0s' {1..101})'",
      "inviteUrl": "discord.gg/test"
    }
  }
}' "Name too long (101 chars)" "at most 100 characters"

echo -e "${PURPLE}\n=== Tag Validation ===${NC}"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "123456789012345678",
      "name": "Test Server",
      "inviteUrl": "discord.gg/test",
      "tags": ["valid-tag", "invalid tag!", "another@invalid"]
    }
  }
}' "Tags with invalid characters" "Tags can only contain"

test_validation '{
  "query": "mutation Test($input: DiscordServerInput!) { ingestDiscordServer(input: $input) { serverId } }",
  "variables": {
    "input": {
      "serverId": "123456789012345678",
      "name": "Test Server",
      "inviteUrl": "discord.gg/test",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11"]
    }
  }
}' "Too many tags (11)" "Cannot have more than 10 tags"

echo -e "${PURPLE}\n=== Reddit Subreddit Name Validation ===${NC}"

test_validation '{
  "query": "mutation Test($input: RedditCommunityInput!) { ingestRedditCommunity(input: $input) { subredditName } }",
  "variables": {
    "input": {
      "subreddit": "ab",
      "name": "Test",
      "url": "https://reddit.com/r/ab"
    }
  }
}' "Subreddit name too short (2 chars)" "at least 3 characters"

test_validation '{
  "query": "mutation Test($input: RedditCommunityInput!) { ingestRedditCommunity(input: $input) { subredditName } }",
  "variables": {
    "input": {
      "subreddit": "WGU CompSci",
      "name": "Test",
      "url": "https://reddit.com/r/WGU_CompSci"
    }
  }
}' "Subreddit name with space" "only contain letters, numbers, and underscores"

test_validation '{
  "query": "mutation Test($input: RedditCommunityInput!) { ingestRedditCommunity(input: $input) { subredditName } }",
  "variables": {
    "input": {
      "subreddit": "WGU-CompSci",
      "name": "Test",
      "url": "https://reddit.com/r/WGU-CompSci"
    }
  }
}' "Subreddit name with hyphen" "only contain letters, numbers, and underscores"

echo -e "${PURPLE}\n=== Course Code Validation ===${NC}"

test_validation '{
  "query": "mutation Test($input: CourseInput!) { upsertCourse(input: $input) { courseCode } }",
  "variables": {
    "input": {
      "courseCode": "CS172",
      "name": "Test Course",
      "units": 3
    }
  }
}' "Course code with two letters" "letter followed by 3 digits"

test_validation '{
  "query": "mutation Test($input: CourseInput!) { upsertCourse(input: $input) { courseCode } }",
  "variables": {
    "input": {
      "courseCode": "1234",
      "name": "Test Course",
      "units": 3
    }
  }
}' "Course code with no letter" "letter followed by 3 digits"

test_validation '{
  "query": "mutation Test($input: CourseInput!) { upsertCourse(input: $input) { courseCode } }",
  "variables": {
    "input": {
      "courseCode": "c172",
      "name": "Test Course",
      "units": 3
    }
  }
}' "Course code with lowercase letter" "letter followed by 3 digits"

echo -e "${PURPLE}\n=== Course Units Validation ===${NC}"

test_validation '{
  "query": "mutation Test($input: CourseInput!) { upsertCourse(input: $input) { courseCode } }",
  "variables": {
    "input": {
      "courseCode": "C172",
      "name": "Test Course",
      "units": 0
    }
  }
}' "Units = 0" "at least 1"

test_validation '{
  "query": "mutation Test($input: CourseInput!) { upsertCourse(input: $input) { courseCode } }",
  "variables": {
    "input": {
      "courseCode": "C172",
      "name": "Test Course",
      "units": 13
    }
  }
}' "Units > 12" "at most 12"

test_validation '{
  "query": "mutation Test($input: CourseInput!) { upsertCourse(input: $input) { courseCode } }",
  "variables": {
    "input": {
      "courseCode": "C172",
      "name": "Test Course",
      "units": 3.5
    }
  }
}' "Units with decimal" "must be an integer"

echo -e "${PURPLE}\n=== Degree ID Validation ===${NC}"

test_validation '{
  "query": "mutation Test($input: DegreePlanInput!) { upsertDegreePlan(input: $input) { id } }",
  "variables": {
    "input": {
      "id": "BS-Computer-Science",
      "name": "Test Degree",
      "totalCUs": 120,
      "courses": []
    }
  }
}' "Degree ID with uppercase" "must be in kebab-case"

test_validation '{
  "query": "mutation Test($input: DegreePlanInput!) { upsertDegreePlan(input: $input) { id } }",
  "variables": {
    "input": {
      "id": "bs_computer_science",
      "name": "Test Degree",
      "totalCUs": 120,
      "courses": []
    }
  }
}' "Degree ID with underscores" "must be in kebab-case"

echo -e "${PURPLE}\n=== Empty Update Validation ===${NC}"

test_validation '{
  "query": "mutation Test($id: String!, $input: DiscordServerUpdateInput!) { updateDiscordServer(id: $id, input: $input) { serverId } }",
  "variables": {
    "id": "123456789012345678",
    "input": {}
  }
}' "Empty Discord update" "At least one field must be provided"

test_validation '{
  "query": "mutation Test($id: String!, $input: RedditCommunityUpdateInput!) { updateRedditCommunity(id: $id, input: $input) { subredditName } }",
  "variables": {
    "id": "WGU",
    "input": {}
  }
}' "Empty Reddit update" "At least one field must be provided"

echo -e "\n${PURPLE}======================================${NC}"
echo -e "${PURPLE}       Validation Test Complete       ${NC}"
echo -e "${PURPLE}======================================${NC}\n"