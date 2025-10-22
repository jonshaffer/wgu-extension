# Testing GraphQL Search

## Prerequisites
1. Ensure you have the Firebase emulator installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Install dependencies:
   ```bash
   npm install --workspace=functions
   ```

3. Ensure you have real data in the data directories (from DVC):
   ```bash
   npm run dvc:pull --workspace=data
   npm run catalog:generate-processed --workspace=data
   ```

## Testing Steps

### 1. Start the Firebase Emulators
In one terminal, start the emulators:
```bash
cd functions
npm run serve
```

This will start:
- Functions emulator at http://localhost:5001
- Firestore emulator at http://localhost:8080

### 2. Seed the Emulator with Real Data
In another terminal, seed the Firestore emulator:
```bash
cd functions
npm run test:seed
```

This will load real data from:
- Academic registry (courses and degree programs)
- Discord communities
- Reddit communities
- WGU Student Groups
- WGU Connect groups

### 3. Test GraphQL Search

Visit the GraphQL endpoint (the URL will be shown in the emulator output):
```
http://localhost:5001/[project-id]/us-central1/graphql
```

### 4. Example Queries

#### Search for courses by code:
```graphql
query {
  search(query: "C172") {
    query
    totalCount
    results {
      type
      name
      description
      courseCode
      platform
      competencyUnits
    }
  }
}
```

#### Search for networking-related content:
```graphql
query {
  search(query: "network", limit: 10) {
    query
    totalCount
    results {
      type
      name
      description
      url
      platform
      memberCount
    }
  }
}
```

#### Search for cybersecurity resources:
```graphql
query {
  search(query: "cybersecurity") {
    query
    totalCount
    results {
      type
      name
      description
      platform
      ... on Course {
        courseCode
        competencyUnits
      }
      ... on Community {
        url
        memberCount
      }
    }
  }
}
```

#### Search for degree programs:
```graphql
query {
  search(query: "computer science") {
    query
    totalCount
    results {
      type
      name
      description
      platform
      college
      degreeType
      competencyUnits
    }
  }
}
```

## Search Capabilities

The search function searches across:
1. **Academic Registry**
   - Courses (by code, name, description, CCN)
   - Degree Programs (by name, code, college)

2. **Community Resources**
   - Discord servers (by name, description)
   - Reddit communities (by name, description)
   - WGU Student Groups (by name, description, course code)
   - WGU Connect groups (by name, description)

## Troubleshooting

1. **No results returned**: Ensure the seed script ran successfully and showed counts for each data type.

2. **Emulator not starting**: Check that ports 5001 and 8080 are not in use.

3. **Missing data**: Run the data generation scripts in the data workspace:
   ```bash
   npm run catalog:generate-processed --workspace=data
   npm run ingest:discord --workspace=data
   npm run ingest:reddit --workspace=data
   ```

4. **GraphQL errors**: Check the Functions emulator logs in the terminal for detailed error messages.