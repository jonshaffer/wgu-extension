#!/usr/bin/env tsx
/**
 * Test Data Seeding Script
 * 
 * Seeds Firestore emulator with comprehensive test data for all collections.
 * Supports different data sets: minimal (CI), standard (dev), and full (testing).
 * 
 * Usage:
 *   npm run seed:test-data           # Standard dataset
 *   npm run seed:test-data minimal   # Minimal for CI
 *   npm run seed:test-data full      # Full dataset
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '../src/lib/data-model';

// Initialize Firebase Admin
const app = initializeApp({
  projectId: process.env.GCLOUD_PROJECT || 'demo-test',
});

const defaultDb = getFirestore();
const adminDb = getFirestore('admin');

// Data set type from command line
const datasetType = process.argv[2] || 'standard';

interface TestDataset {
  courses: any[];
  discordServers: any[];
  redditCommunities: any[];
  degreePrograms: any[];
  studentGroups: any[];
  wguConnectGroups: any[];
}

// Minimal dataset for CI/CD
const minimalDataset: TestDataset = {
  courses: [
    {
      courseCode: "C172",
      name: "Network and Security - Foundations",
      description: "Introduction to networking and security concepts",
      units: 3,
      level: "undergraduate",
      type: "general",
      prerequisites: [],
      firstSeenCatalog: "2024-01",
      lastSeenCatalog: "2024-01",
      catalogHistory: [],
      communities: {
        discord: [{ serverId: "123456789012345678", channelIds: ["987654321098765432"] }],
        reddit: [{ subredditId: "WGU", relevance: "general" }],
        wguConnect: { groupId: "net-sec-foundations" }
      },
      popularityScore: 85,
      difficultyRating: 3.5,
      lastUpdated: new Date()
    },
    {
      courseCode: "C175",
      name: "Data Management - Foundations",
      description: "Database concepts and SQL",
      units: 3,
      level: "undergraduate",
      type: "general",
      prerequisites: [],
      firstSeenCatalog: "2024-01",
      lastSeenCatalog: "2024-01",
      catalogHistory: [],
      communities: {
        discord: [{ serverId: "123456789012345678", channelIds: ["987654321098765433"] }],
        reddit: [{ subredditId: "WGU", relevance: "general" }]
      },
      popularityScore: 80,
      difficultyRating: 3.0,
      lastUpdated: new Date()
    }
  ],
  discordServers: [
    {
      id: "123456789012345678",
      name: "WGU Computer Science",
      description: "Official WGU CS Discord",
      inviteUrl: "https://discord.gg/wgucs",
      memberCount: 2500,
      channels: [
        { id: "987654321098765432", name: "c172-network-security", type: "course", associatedCourses: ["C172"] },
        { id: "987654321098765433", name: "c175-data-management", type: "course", associatedCourses: ["C175"] },
        { id: "987654321098765434", name: "general", type: "general" }
      ],
      tags: ["computer-science", "official"],
      verified: true,
      lastUpdated: new Date()
    }
  ],
  redditCommunities: [
    {
      id: "WGU",
      name: "Western Governors University",
      description: "Main WGU subreddit",
      url: "https://reddit.com/r/WGU",
      subscriberCount: 50000,
      type: "main",
      associatedPrograms: ["bs-computer-science", "bs-information-technology"],
      associatedCourses: ["C172", "C175"],
      tags: ["general", "official"],
      active: true,
      lastUpdated: new Date()
    }
  ],
  degreePrograms: [
    {
      id: "bs-computer-science",
      code: "BSCS",
      name: "Bachelor of Science, Computer Science",
      description: "WGU's computer science program",
      level: "bachelor",
      college: "College of Information Technology",
      totalUnits: 122,
      courses: [
        { courseCode: "C172", type: "core", term: 1 },
        { courseCode: "C175", type: "core", term: 1 }
      ],
      firstSeenCatalog: "2024-01",
      lastSeenCatalog: "2024-01",
      catalogHistory: [],
      communities: {
        discord: [{ serverId: "123456789012345678" }],
        reddit: [{ subredditId: "WGU_CompSci" }]
      },
      stats: {
        averageCompletionTime: 24,
        popularCourseSequences: ["C172-C175"]
      },
      lastUpdated: new Date()
    }
  ],
  studentGroups: [],
  wguConnectGroups: [
    {
      id: "net-sec-foundations",
      groupId: "net-sec-foundations",
      name: "Network and Security Foundations Study Group",
      courseCode: "C172",
      description: "Study group for C172",
      memberCount: 150,
      postCount: 500,
      lastActivity: new Date(),
      resources: [
        {
          id: "res-1",
          title: "Study Guide",
          type: "document",
          url: "https://example.com/guide",
          author: "TestUser",
          timestamp: new Date(),
          upvotes: 25
        }
      ]
    }
  ]
};

// Standard dataset for development
const standardDataset: TestDataset = {
  ...minimalDataset,
  courses: [
    ...minimalDataset.courses,
    {
      courseCode: "C867",
      name: "Scripting and Programming - Applications",
      description: "C++ programming course",
      units: 4,
      level: "undergraduate",
      type: "major",
      prerequisites: ["C172"],
      firstSeenCatalog: "2024-01",
      lastSeenCatalog: "2024-01",
      catalogHistory: [],
      communities: {
        discord: [{ serverId: "234567890123456789", channelIds: ["345678901234567890"] }],
        reddit: [{ subredditId: "WGU_CompSci", relevance: "direct" }]
      },
      popularityScore: 75,
      difficultyRating: 4.0,
      lastUpdated: new Date()
    },
    {
      courseCode: "C182",
      name: "Introduction to IT",
      description: "IT fundamentals",
      units: 4,
      level: "undergraduate",
      type: "general",
      prerequisites: [],
      firstSeenCatalog: "2024-01",
      lastSeenCatalog: "2024-01",
      catalogHistory: [],
      communities: {
        discord: [{ serverId: "123456789012345678", channelIds: ["987654321098765435"] }],
        reddit: [{ subredditId: "WGU", relevance: "general" }]
      },
      popularityScore: 90,
      difficultyRating: 2.5,
      lastUpdated: new Date()
    }
  ],
  discordServers: [
    ...minimalDataset.discordServers,
    {
      id: "234567890123456789",
      name: "WGU Programming",
      description: "Programming courses discussion",
      inviteUrl: "https://discord.gg/wguprog",
      memberCount: 1200,
      channels: [
        { id: "345678901234567890", name: "c867-cpp", type: "course", associatedCourses: ["C867"] },
        { id: "345678901234567891", name: "java-courses", type: "study-group" }
      ],
      tags: ["programming", "community"],
      verified: false,
      lastUpdated: new Date()
    }
  ],
  redditCommunities: [
    ...minimalDataset.redditCommunities,
    {
      id: "WGU_CompSci",
      name: "WGU Computer Science",
      description: "Computer Science program discussion",
      url: "https://reddit.com/r/WGU_CompSci",
      subscriberCount: 15000,
      type: "program-specific",
      associatedPrograms: ["bs-computer-science"],
      associatedCourses: ["C867", "C172", "C175"],
      tags: ["computer-science", "bs-cs"],
      active: true,
      lastUpdated: new Date()
    }
  ],
  studentGroups: [
    {
      id: "wgu-cs-linkedin",
      studentGroupId: "wgu-cs-linkedin",
      name: "WGU Computer Science LinkedIn Group",
      description: "Professional networking for WGU CS students",
      category: "professional",
      memberCount: 5000,
      platform: "linkedin",
      joinUrl: "https://linkedin.com/groups/wgucs",
      courseMappings: ["C172", "C175", "C867"],
      icon: "https://example.com/icon.png",
      isOfficial: false,
      socialLinks: [
        { platform: "linkedin", url: "https://linkedin.com/groups/wgucs" }
      ],
      lastChecked: new Date()
    }
  ],
  wguConnectGroups: [
    ...minimalDataset.wguConnectGroups,
    {
      id: "cpp-programming",
      groupId: "cpp-programming", 
      name: "C++ Programming Study Group",
      courseCode: "C867",
      description: "Study group for C867",
      memberCount: 200,
      postCount: 800,
      lastActivity: new Date(),
      resources: []
    }
  ]
};

// Full dataset for comprehensive testing
const fullDataset: TestDataset = {
  courses: [
    ...standardDataset.courses,
    // Add more courses for full testing
    {
      courseCode: "C779",
      name: "Web Development Foundations",
      description: "HTML, CSS, and JavaScript basics",
      units: 3,
      level: "undergraduate",
      type: "major",
      prerequisites: ["C172"],
      firstSeenCatalog: "2024-01",
      lastSeenCatalog: "2024-01",
      catalogHistory: [],
      communities: {
        discord: [{ serverId: "345678901234567890", channelIds: ["456789012345678901"] }],
        reddit: [{ subredditId: "webdev", relevance: "general" }]
      },
      popularityScore: 70,
      difficultyRating: 3.0,
      lastUpdated: new Date()
    },
    {
      courseCode: "D194",
      name: "IT Leadership Foundations",
      description: "Leadership in IT organizations",
      units: 3,
      level: "graduate",
      type: "major",
      prerequisites: [],
      firstSeenCatalog: "2024-01",
      lastSeenCatalog: "2024-01",
      catalogHistory: [],
      communities: {
        discord: [],
        reddit: [{ subredditId: "WGU_MBA_IT", relevance: "direct" }]
      },
      popularityScore: 65,
      difficultyRating: 3.5,
      lastUpdated: new Date()
    }
  ],
  discordServers: [
    ...standardDataset.discordServers,
    {
      id: "345678901234567890",
      name: "WGU Web Development",
      description: "Web dev courses and projects",
      inviteUrl: "https://discord.gg/wguwebdev",
      memberCount: 800,
      channels: [
        { id: "456789012345678901", name: "c779-web-foundations", type: "course", associatedCourses: ["C779"] },
        { id: "456789012345678902", name: "portfolio-showcase", type: "other" }
      ],
      tags: ["web-development", "frontend"],
      verified: false,
      lastUpdated: new Date()
    }
  ],
  redditCommunities: [
    ...standardDataset.redditCommunities,
    {
      id: "WGU_MBA_IT",
      name: "WGU MBA IT Management",
      description: "MBA IT Management program",
      url: "https://reddit.com/r/WGU_MBA_IT",
      subscriberCount: 3000,
      type: "program-specific",
      associatedPrograms: ["mba-it-management"],
      associatedCourses: ["D194"],
      tags: ["mba", "it-management", "graduate"],
      active: true,
      lastUpdated: new Date()
    },
    {
      id: "webdev",
      name: "Web Development",
      description: "General web development community",
      url: "https://reddit.com/r/webdev",
      subscriberCount: 2000000,
      type: "general",
      associatedPrograms: [],
      associatedCourses: ["C779"],
      tags: ["web-development", "programming", "external"],
      active: true,
      lastUpdated: new Date()
    }
  ],
  degreePrograms: [
    ...standardDataset.degreePrograms,
    {
      id: "mba-it-management",
      code: "MBAITM",
      name: "Master of Business Administration, IT Management",
      description: "MBA with IT Management emphasis",
      level: "master",
      college: "College of Business",
      totalUnits: 72,
      courses: [
        { courseCode: "D194", type: "core", term: 1 }
      ],
      firstSeenCatalog: "2024-01",
      lastSeenCatalog: "2024-01",
      catalogHistory: [],
      communities: {
        discord: [],
        reddit: [{ subredditId: "WGU_MBA_IT" }]
      },
      stats: {
        averageCompletionTime: 18,
        popularCourseSequences: []
      },
      lastUpdated: new Date()
    }
  ],
  studentGroups: [
    ...standardDataset.studentGroups,
    {
      id: "wgu-slack-workspace",
      studentGroupId: "wgu-slack-workspace",
      name: "WGU Unofficial Slack",
      description: "Unofficial Slack workspace for all WGU students",
      category: "general",
      memberCount: 10000,
      platform: "slack",
      joinUrl: "https://wguunofficial.slack.com",
      courseMappings: [],
      icon: "https://example.com/slack-icon.png",
      isOfficial: false,
      socialLinks: [
        { platform: "slack", url: "https://wguunofficial.slack.com" },
        { platform: "website", url: "https://wguslack.com" }
      ],
      lastChecked: new Date()
    }
  ],
  wguConnectGroups: [
    ...standardDataset.wguConnectGroups,
    {
      id: "web-dev-study",
      groupId: "web-dev-study",
      name: "Web Development Study Group",
      courseCode: "C779",
      description: "Study group for web development",
      memberCount: 120,
      postCount: 400,
      lastActivity: new Date(),
      resources: [
        {
          id: "res-web-1",
          title: "HTML/CSS Cheat Sheet",
          type: "document",
          url: "https://example.com/cheatsheet",
          author: "WebMaster",
          timestamp: new Date(),
          upvotes: 50
        }
      ]
    }
  ]
};

// Select dataset based on command line argument
const datasets: Record<string, TestDataset> = {
  minimal: minimalDataset,
  standard: standardDataset,
  full: fullDataset
};

const selectedDataset = datasets[datasetType] || standardDataset;

async function clearCollections() {
  console.log('🧹 Clearing existing data...');
  
  const collections = [
    { db: defaultDb, name: COLLECTIONS.COURSES },
    { db: defaultDb, name: COLLECTIONS.DISCORD_SERVERS },
    { db: defaultDb, name: COLLECTIONS.REDDIT_COMMUNITIES },
    { db: defaultDb, name: COLLECTIONS.DEGREE_PROGRAMS },
    { db: defaultDb, name: COLLECTIONS.WGU_STUDENT_GROUPS },
    { db: defaultDb, name: COLLECTIONS.WGU_CONNECT_GROUPS },
    { db: adminDb, name: 'change-history' },
    { db: adminDb, name: 'suggestions' }
  ];

  for (const { db, name } of collections) {
    const snapshot = await db.collection(name).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`  ✓ Cleared ${name} (${snapshot.size} documents)`);
  }
}

async function seedCollection(db: FirebaseFirestore.Firestore, collection: string, data: any[], idField: string = 'id') {
  if (data.length === 0) {
    console.log(`  ⚠️  No data for ${collection}`);
    return;
  }

  const batch = db.batch();
  let count = 0;

  for (const item of data) {
    const id = item[idField] || item.id;
    const docRef = db.collection(collection).doc(id);
    batch.set(docRef, item);
    count++;
  }

  await batch.commit();
  console.log(`  ✅ Seeded ${collection} with ${count} documents`);
}

async function seedData() {
  console.log(`\n🌱 Seeding ${datasetType} dataset...\n`);

  // Seed default database collections
  await seedCollection(defaultDb, COLLECTIONS.COURSES, selectedDataset.courses, 'courseCode');
  await seedCollection(defaultDb, COLLECTIONS.DISCORD_SERVERS, selectedDataset.discordServers);
  await seedCollection(defaultDb, COLLECTIONS.REDDIT_COMMUNITIES, selectedDataset.redditCommunities);
  await seedCollection(defaultDb, COLLECTIONS.DEGREE_PROGRAMS, selectedDataset.degreePrograms);
  await seedCollection(defaultDb, COLLECTIONS.WGU_STUDENT_GROUPS, selectedDataset.studentGroups, 'studentGroupId');
  await seedCollection(defaultDb, COLLECTIONS.WGU_CONNECT_GROUPS, selectedDataset.wguConnectGroups, 'groupId');

  // Create course-community mappings
  console.log('\n📎 Creating course-community mappings...');
  const mappings = new Map<string, any>();

  // Build mappings from courses
  for (const course of selectedDataset.courses) {
    mappings.set(course.courseCode, {
      courseCode: course.courseCode,
      courseName: course.name,
      discord: course.communities?.discord?.map((d: any) => d.serverId) || [],
      reddit: course.communities?.reddit?.map((r: any) => r.subredditId) || [],
      wguConnect: course.communities?.wguConnect?.groupId || null,
      studentGroups: []
    });
  }

  // Add student group mappings
  for (const group of selectedDataset.studentGroups) {
    for (const courseCode of group.courseMappings || []) {
      const mapping = mappings.get(courseCode);
      if (mapping) {
        mapping.studentGroups.push(group.id);
      }
    }
  }

  // Save mappings
  const mappingBatch = defaultDb.batch();
  for (const [courseCode, mapping] of mappings) {
    const docRef = defaultDb.collection('course-community-mappings').doc(courseCode);
    mappingBatch.set(docRef, mapping);
  }
  await mappingBatch.commit();
  console.log(`  ✅ Created ${mappings.size} course-community mappings`);

  console.log('\n✨ Seeding complete!\n');
}

async function validateSeedingSuccess() {
  console.log('\n🔍 Validating seeding success...');
  
  const validations = [
    { collection: COLLECTIONS.COURSES, expected: selectedDataset.courses.length },
    { collection: COLLECTIONS.DISCORD_SERVERS, expected: selectedDataset.discordServers.length },
    { collection: COLLECTIONS.REDDIT_COMMUNITIES, expected: selectedDataset.redditCommunities.length },
    { collection: COLLECTIONS.DEGREE_PROGRAMS, expected: selectedDataset.degreePrograms.length },
    { collection: COLLECTIONS.WGU_STUDENT_GROUPS, expected: selectedDataset.studentGroups.length },
    { collection: COLLECTIONS.WGU_CONNECT_GROUPS, expected: selectedDataset.wguConnectGroups.length }
  ];

  for (const { collection, expected } of validations) {
    const snapshot = await defaultDb.collection(collection).get();
    const actual = snapshot.size;
    
    if (actual !== expected) {
      throw new Error(`Validation failed for ${collection}: expected ${expected}, got ${actual}`);
    }
    console.log(`  ✅ ${collection}: ${actual} documents`);
  }

  // Validate course-community mappings
  const mappingsSnapshot = await defaultDb.collection('course-community-mappings').get();
  const expectedMappings = selectedDataset.courses.length;
  if (mappingsSnapshot.size !== expectedMappings) {
    throw new Error(`Mapping validation failed: expected ${expectedMappings}, got ${mappingsSnapshot.size}`);
  }
  console.log(`  ✅ course-community-mappings: ${mappingsSnapshot.size} documents`);
}

async function main() {
  try {
    console.log(`🚀 Starting data seeding for ${datasetType} dataset...`);
    console.log(`📍 Environment: ${process.env.FIRESTORE_EMULATOR_HOST || 'production'}`);
    
    // Test initial connectivity
    console.log('🔗 Testing Firestore connectivity...');
    await defaultDb.collection('_connectivity_test').add({ timestamp: new Date() });
    console.log('✅ Firestore connection successful');

    await clearCollections();
    await seedData();
    await validateSeedingSuccess();
    
    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`  Dataset: ${datasetType}`);
    console.log(`  Courses: ${selectedDataset.courses.length}`);
    console.log(`  Discord Servers: ${selectedDataset.discordServers.length}`);
    console.log(`  Reddit Communities: ${selectedDataset.redditCommunities.length}`);
    console.log(`  Degree Programs: ${selectedDataset.degreePrograms.length}`);
    console.log(`  Student Groups: ${selectedDataset.studentGroups.length}`);
    console.log(`  WGU Connect Groups: ${selectedDataset.wguConnectGroups.length}`);
    console.log('\n🎉 Seeding completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:');
    console.error(error);
    console.error('\n🐛 Environment debug:');
    console.error(`  FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    console.error(`  Working directory: ${process.cwd()}`);
    console.error(`  Node.js version: ${process.version}`);
    console.error(`  Dataset type: ${datasetType}`);
    process.exit(1);
  }
}

// Check if running in emulator
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('❌ FIRESTORE_EMULATOR_HOST not set. This script should only run against the emulator.');
  console.error('   Set: export FIRESTORE_EMULATOR_HOST=localhost:8181');
  process.exit(1);
}

main();