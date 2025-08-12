# WGU Student Groups Collector

Parses the Group Hubs directory page on cm.wgu.edu to extract group cards into structured data.

- Extracted fields: id, groupUid, name, description, url, imageUrl, membershipType, membershipCount, topicCount
- Example HTML lives in `examples/`
- Test harness uses JSDOM

## Run tests

npm run data:test:wgu-student-groups

This will parse the provided sample and print a summary.
