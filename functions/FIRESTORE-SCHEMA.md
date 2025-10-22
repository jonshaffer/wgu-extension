# Firestore Schema Documentation

## Database Architecture

### Dual Database Setup
- **Default Database**: Public community data for read-only GraphQL access
- **Admin Database**: Suggestions, metadata, and administrative operations

---

## Default Database Collections

### 📚 `courses`
**Document ID**: Course code (e.g., `C779`)
```typescript
{
  courseCode: string;         // "C779"
  name: string;              // "Web Development Foundations"
  description?: string;
  units: number;             // 3
  level: 'undergraduate' | 'graduate';
  type: 'general' | 'major' | 'elective';
  prerequisites?: string[];   // ["C777", "C778"]
  
  // Metadata
  firstSeenCatalog: string;   // "catalog-2025-01"
  lastSeenCatalog: string;    // "catalog-2025-08"
  catalogHistory: Array<{
    catalogId: string;
    changes?: string[];
  }>;
  
  // Computed fields
  popularityScore?: number;   // 0-100
  difficultyRating?: number;  // 1-5
  
  lastUpdated: Timestamp;
}
```

### 🎓 `degree-programs`
**Document ID**: Program code (e.g., `bs-computer-science`)
```typescript
{
  id: string;                // "bs-computer-science"
  code: string;              // "BSCS"
  name: string;              // "Bachelor of Science in Computer Science"
  description?: string;
  level: 'bachelor' | 'master';
  college: string;           // "College of Information Technology"
  totalUnits: number;        // 122
  
  // Course requirements
  courses: Array<{
    courseCode: string;      // "C779"
    type: 'core' | 'general-education' | 'elective';
    term?: number;           // Suggested term (1-12)
  }>;
  
  // Catalog tracking
  firstSeenCatalog: string;
  lastSeenCatalog: string;
  catalogHistory: Array<{
    catalogId: string;
    changes?: string[];
  }>;
  
  // Statistics (computed)
  stats?: {
    averageCompletionTime?: number;  // months
    popularCourseSequences?: string[][];
  };
  
  lastUpdated: Timestamp;
}
```

### 💬 `discord-servers`
**Document ID**: Discord server ID
```typescript
{
  id: string;               // Discord server ID
  name: string;             // "WGU Computer Science"
  description?: string;
  inviteUrl: string;        // "https://discord.gg/xyz"
  memberCount?: number;     // 1500
  
  channels?: Array<{
    id: string;             // Channel ID
    name: string;           // "c779-web-dev"
    type: 'course' | 'general' | 'study-group' | 'other';
    associatedCourses?: string[];  // ["C779"]
  }>;
  
  tags: string[];           // ["computer-science", "official"]
  verified: boolean;        // Manually verified by admins
  lastUpdated: Timestamp;
}
```

### 🗨️ `reddit-communities`
**Document ID**: Subreddit name (without r/)
```typescript
{
  id: string;               // "WGU_CompSci" 
  name: string;             // "WGU Computer Science"
  description?: string;
  url: string;              // "https://reddit.com/r/WGU_CompSci"
  subscriberCount?: number;  // 5000
  
  type: 'main' | 'program-specific' | 'course-specific';
  associatedPrograms?: string[];  // ["bs-computer-science"]
  associatedCourses?: string[];   // ["C779", "C780"]
  
  tags: string[];           // ["computer-science", "active"]
  active: boolean;          // Still active community
  lastUpdated: Timestamp;
}
```

### 🏫 `wgu-connect-groups`
**Document ID**: WGU Connect group ID
```typescript
{
  id: string;               // WGU Connect internal ID
  courseCode: string;       // "C779"
  name: string;             // "C779 - Web Development Foundations Study Group"
  description?: string;
  
  resources: Array<{
    id: string;
    title: string;
    type: 'document' | 'video' | 'link' | 'discussion';
    url: string;
    upvotes?: number;
  }>;
  
  memberCount?: number;     // 250
  lastActivity?: Timestamp;
  lastUpdated: Timestamp;
}
```

### 👥 `wgu-student-groups`
**Document ID**: Student group ID
```typescript
{
  id: string;               // "wgu-cybersecurity-club"
  name: string;             // "WGU Cybersecurity Club"
  description?: string;
  type: 'academic' | 'social' | 'professional' | 'diversity';
  
  contactEmail?: string;
  websiteUrl?: string;
  socialLinks?: Array<{
    platform: string;       // "linkedin", "discord", "facebook"
    url: string;
  }>;
  
  tags: string[];           // ["cybersecurity", "networking"]
  active: boolean;
  lastUpdated: Timestamp;
}
```

### 🔍 `community-resource-index`
**Document ID**: Composite key (e.g., `discord:server123`, `reddit:WGU_CompSci`)
```typescript
{
  id: string;               // Composite key
  type: 'discord' | 'reddit' | 'wgu-connect' | 'student-group';
  resourceId: string;       // ID in the source collection
  
  // Denormalized fields for search
  title: string;            // Display name
  description?: string;
  url?: string;
  
  // Associations
  courseCodes: string[];    // ["C779", "C780"]
  programIds: string[];     // ["bs-computer-science"]
  tags: string[];           // All relevant tags
  
  // Metadata for ranking
  popularity: number;       // 0-100 calculated score
  verified: boolean;
  active: boolean;
  lastUpdated: Timestamp;
}
```

### 🔗 `course-community-mappings`
**Document ID**: Course code
```typescript
{
  courseCode: string;       // "C779"
  
  communities: {
    primary: {
      type: 'discord' | 'reddit' | 'wgu-connect';
      id: string;
      confidence: number;    // 0-1
    };
    
    all: Array<{
      type: 'discord' | 'reddit' | 'wgu-connect' | 'student-group';
      id: string;
      relevance: 'direct' | 'program' | 'general';
      confidence: number;    // 0-1
    }>;
  };
  
  // Reddit-specific cached data
  topRedditPosts?: Array<{
    postId: string;
    title: string;
    url: string;
    score: number;
    commentCount: number;
    createdAt: Timestamp;
  }>;
  
  lastUpdated: Timestamp;
}
```

### 📦 `institution-catalogs`
**Document ID**: Catalog identifier (e.g., `catalog-2025-08`)
```typescript
{
  id: string;               // "catalog-2025-08"
  date: string;             // "2025-08"
  version: string;          // "1.0"
  
  metadata: {
    totalCourses: number;   // 450
    totalDegrees: number;   // 67
    lastUpdated: Timestamp;
    sourceUrl?: string;
  };
  
  rawData: any;             // Original parsed PDF data
}
```

### 🗄️ `cache`
**Document ID**: Cache key
```typescript
{
  data: any;                // Cached data
  expiresAt: Timestamp;     // Expiration time
  createdAt: Timestamp;
}
```

---

## Admin Database Collections

### 💡 `suggestions`
**Document ID**: Auto-generated ID
```typescript
{
  id: string;
  type: 'discord-server' | 'reddit-community' | 'course-update' | 'degree-program';
  operation: 'ADD' | 'UPDATE' | 'DELETE';
  status: 'pending' | 'approved' | 'rejected';
  
  // Original suggestion data
  data: any;                // Type-specific suggestion data
  
  // Review process
  submittedBy: {
    userId?: string;
    email?: string;
    source: 'extension' | 'manual' | 'automated';
  };
  submittedAt: Timestamp;
  
  reviewedBy?: {
    userId: string;
    email: string;
  };
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  
  // Validation
  validationErrors?: string[];
  confidence?: number;      // 0-1, automated confidence score
  
  // Version tracking
  version: number;          // Suggestion version
  previousVersionId?: string;  // If this updates a previous suggestion
}
```

### 📋 `change-history`
**Document ID**: Auto-generated ID
```typescript
{
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;       // Target collection name
  documentId: string;       // Target document ID
  
  // Change details
  changes: {
    before?: any;           // Previous data (for updates/deletes)
    after?: any;            // New data (for creates/updates)
    changedFields?: string[];  // List of changed field paths
  };
  
  // Metadata
  performedBy: {
    userId: string;
    email: string;
  };
  performedAt: Timestamp;
  source: 'admin-api' | 'suggestion-approval' | 'automated-sync';
  
  // Optional context
  suggestionId?: string;    // If from suggestion approval
  reason?: string;          // Why this change was made
}
```

### 🔄 `transformation-jobs`
**Document ID**: Job ID
```typescript
{
  id: string;
  type: 'catalog-extract' | 'community-mapping' | 'index-update';
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  input: {
    source: string;         // Collection name or external source
    documentIds?: string[];
    options?: Record<string, any>;
  };
  
  output?: {
    documentsProcessed: number;
    documentsCreated: number;
    documentsUpdated: number;
    errors?: Array<{
      documentId: string;
      error: string;
    }>;
  };
  
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  error?: string;
  
  // Progress tracking
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
}
```

---

## Firestore Security Rules

### Default Database Rules (`firebase/firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access for courses and community data
    match /{collection}/{document} {
      allow read: if collection in [
        'courses', 
        'degree-programs', 
        'discord-servers', 
        'reddit-communities', 
        'wgu-connect-groups', 
        'wgu-student-groups', 
        'community-resource-index', 
        'course-community-mappings'
      ];
      allow write: if false; // No direct writes to default database
    }
    
    // Cache collection - read only, managed by functions
    match /cache/{document} {
      allow read: if true;
      allow write: if false;
    }
    
    // Institution catalogs - read only for authorized users
    match /institution-catalogs/{document} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### Admin Database Rules (`firebase/firestore-admin.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Suggestions - authenticated users can read/create, admins can modify
    match /suggestions/{document} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Change history - read only for authenticated users
    match /change-history/{document} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write
    }
    
    // Transformation jobs - admin only
    match /transformation-jobs/{document} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Admin metadata collections
    match /{collection}/{document} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

---

## Indexes

### Default Database Indexes (`firebase/firestore.indexes.json`)
```json
{
  "indexes": [
    {
      "collectionGroup": "courses",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "level", "order": "ASCENDING"},
        {"fieldPath": "popularityScore", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "discord-servers", 
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "verified", "order": "ASCENDING"},
        {"fieldPath": "memberCount", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "reddit-communities",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "active", "order": "ASCENDING"},
        {"fieldPath": "subscriberCount", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "community-resource-index",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "type", "order": "ASCENDING"},
        {"fieldPath": "popularity", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "community-resource-index",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "courseCodes", "arrayConfig": "CONTAINS"},
        {"fieldPath": "popularity", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Admin Database Indexes (`firebase/firestore-admin.indexes.json`)
```json
{
  "indexes": [
    {
      "collectionGroup": "suggestions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "submittedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "suggestions",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "type", "order": "ASCENDING"},
        {"fieldPath": "submittedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "change-history",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "collection", "order": "ASCENDING"},
        {"fieldPath": "performedAt", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## Usage Patterns

### Efficient Queries
```typescript
// Get all Discord servers for a course
const servers = await db.collection('course-community-mappings')
  .doc(courseCode)
  .get()
  .then(doc => doc.data()?.communities.all.filter(c => c.type === 'discord'));

// Search communities by type and popularity
const results = await db.collection('community-resource-index')
  .where('type', '==', 'discord')
  .orderBy('popularity', 'desc')
  .limit(20)
  .get();
```

### Batch Operations
```typescript
// Update multiple documents atomically
const batch = db.batch();
documents.forEach(doc => {
  const ref = db.collection('courses').doc(doc.courseCode);
  batch.set(ref, doc, { merge: true });
});
await batch.commit();
```

---

*Last Updated: Auto-generated timestamp*  
*Schema Documentation: `/functions/FIRESTORE-SCHEMA.md`*