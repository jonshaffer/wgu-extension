#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { isRedditCommunity } from '../types/index.js';

interface RedditCommunity {
  subreddit: string;
  name: string;
  description: string;
  hierarchy: {
    level: string;
  };
  isActive: boolean;
  tags: string[];
  relevantCourses: string[];
  memberCount?: number;
  lastUpdated?: string;
  verified?: boolean;
}

interface RedditApiResponse {
  data: {
    subscribers: number;
    public_description: string;
    display_name: string;
    created_utc: number;
    over18: boolean;
    quarantine: boolean;
  };
}

interface ValidationResult {
  file: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  redditData?: RedditApiResponse['data'];
  updated?: boolean;
}

const VALID_HIERARCHY_LEVELS = ['university', 'college', 'program', 'community'];

const COMMON_TAGS = [
  'general', 'university', 'business', 'management', 'accounting', 'IT', 
  'information technology', 'computer science', 'cybersecurity', 'education',
  'teaching', 'data analytics', 'development', 'programming', 'community',
  'acceleration', 'study tips', 'military', 'veterans', 'cloud', 
  'systems administration', 'master\'s', 'MBA'
];

async function fetchRedditData(subredditName: string): Promise<RedditApiResponse['data'] | null> {
  try {
    const response = await fetch(`https://www.reddit.com/r/${subredditName}/about.json`, {
      headers: {
        'User-Agent': 'WGU Extension Data Validator 1.0'
      }
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json() as RedditApiResponse;
    return json.data;
  } catch (error) {
    console.error(`Failed to fetch data for r/${subredditName}:`, error);
    return null;
  }
}

function formatMemberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

async function validateRedditCommunityWithAPI(data: any, filename: string, checkReddit = false, updateData = false): Promise<ValidationResult> {
  const result = validateRedditCommunity(data, filename);
  
  if (checkReddit && data.subreddit) {
    console.log(`   🔍 Checking Reddit API for r/${data.subreddit}...`);
    
    // Add small delay to be respectful to Reddit's API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const redditData = await fetchRedditData(data.subreddit);
    
    if (redditData) {
      result.redditData = redditData;
      
      // Check if subreddit is quarantined or over 18
      if (redditData.quarantine) {
        result.warnings.push('Subreddit is quarantined');
      }
      
      if (redditData.over18) {
        result.warnings.push('Subreddit is marked as 18+/NSFW');
      }
      
      // Check if display name matches our expected name
      if (redditData.display_name !== data.subreddit) {
        result.warnings.push(`Reddit display name "${redditData.display_name}" differs from our subreddit name "${data.subreddit}"`);
      }
      
      // Check Reddit description
      if (redditData.public_description) {
        const redditDesc = redditData.public_description.trim();
        if (redditDesc && redditDesc !== data.description) {
          if (updateData) {
            result.updated = true;
            result.warnings.push(`Updated description: "${redditDesc}"`);
            data.description = redditDesc;
          } else {
            result.warnings.push(`Reddit description: "${redditDesc}"`);
            if (data.description && data.description !== redditDesc) {
              result.warnings.push(`Local description differs from Reddit`);
            }
          }
        }
      }
      
      // Update member count if requested
      if (updateData) {
        if (!data.memberCount || data.memberCount !== redditData.subscribers) {
          result.updated = true;
          data.memberCount = redditData.subscribers;
          data.lastUpdated = new Date().toISOString();
          data.verified = true;
          result.warnings.push(`Updated member count: ${formatMemberCount(redditData.subscribers)}`);
        }
        
        // Always update these fields when updating
        if (!data.lastUpdated || !data.verified) {
          result.updated = true;
          data.lastUpdated = new Date().toISOString();
          data.verified = true;
        }
      } else {
        // Just report the current member count
        result.warnings.push(`Reddit member count: ${formatMemberCount(redditData.subscribers)}`);
        
        if (data.memberCount && Math.abs(data.memberCount - redditData.subscribers) > 100) {
          result.warnings.push(`Local member count (${formatMemberCount(data.memberCount)}) differs significantly from Reddit (${formatMemberCount(redditData.subscribers)})`);
        }
      }
      
    } else {
      result.errors.push(`Unable to fetch data from Reddit API - subreddit may not exist or be private`);
      result.isValid = false;
      
      if (updateData) {
        data.verified = false;
        data.lastUpdated = new Date().toISOString();
        result.updated = true;
      }
    }
  }
  
  return result;
}

function validateRedditCommunity(data: any, filename: string): ValidationResult {
  const result: ValidationResult = {
    file: filename,
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check required fields
  const requiredFields = ['subreddit', 'name', 'description', 'hierarchy', 'isActive', 'tags', 'relevantCourses'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      result.errors.push(`Missing required field: ${field}`);
      result.isValid = false;
    }
  }

  // Validate subreddit field
  if (data.subreddit) {
    if (typeof data.subreddit !== 'string') {
      result.errors.push('subreddit must be a string');
      result.isValid = false;
    } else if (data.subreddit.trim().length === 0) {
      result.errors.push('subreddit cannot be empty');
      result.isValid = false;
    }
  }

  // Validate name field
  if (data.name) {
    if (typeof data.name !== 'string') {
      result.errors.push('name must be a string');
      result.isValid = false;
    } else {
      if (!data.name.startsWith('r/')) {
        result.errors.push('name must start with "r/"');
        result.isValid = false;
      }
      if (data.subreddit && data.name !== `r/${data.subreddit}`) {
        result.errors.push(`name "${data.name}" should match subreddit "r/${data.subreddit}"`);
        result.isValid = false;
      }
    }
  }

  // Validate description field
  if (data.description) {
    if (typeof data.description !== 'string') {
      result.errors.push('description must be a string');
      result.isValid = false;
    } else if (data.description.trim().length === 0) {
      result.errors.push('description cannot be empty');
      result.isValid = false;
    } else if (data.description.length > 200) {
      result.warnings.push('description is quite long (>200 chars)');
    }
  }

  // Validate hierarchy field
  if (data.hierarchy) {
    if (typeof data.hierarchy !== 'object' || data.hierarchy === null) {
      result.errors.push('hierarchy must be an object');
      result.isValid = false;
    } else {
      if (!('level' in data.hierarchy)) {
        result.errors.push('hierarchy must have a level field');
        result.isValid = false;
      } else if (!VALID_HIERARCHY_LEVELS.includes(data.hierarchy.level)) {
        result.errors.push(`hierarchy.level must be one of: ${VALID_HIERARCHY_LEVELS.join(', ')}`);
        result.isValid = false;
      }
    }
  }

  // Validate isActive field
  if ('isActive' in data && typeof data.isActive !== 'boolean') {
    result.errors.push('isActive must be a boolean');
    result.isValid = false;
  }

  // Validate tags field
  if (data.tags) {
    if (!Array.isArray(data.tags)) {
      result.errors.push('tags must be an array');
      result.isValid = false;
    } else {
      for (let i = 0; i < data.tags.length; i++) {
        if (typeof data.tags[i] !== 'string') {
          result.errors.push(`tags[${i}] must be a string`);
          result.isValid = false;
        }
      }
      
      // Check for duplicate tags
      const uniqueTags = [...new Set(data.tags)];
      if (uniqueTags.length !== data.tags.length) {
        result.warnings.push('tags contains duplicates');
      }

      // Check if tags are empty
      if (data.tags.length === 0) {
        result.warnings.push('tags array is empty - consider adding relevant tags');
      }
    }
  }

  // Validate relevantCourses field
  if (data.relevantCourses) {
    if (!Array.isArray(data.relevantCourses)) {
      result.errors.push('relevantCourses must be an array');
      result.isValid = false;
    } else {
      for (let i = 0; i < data.relevantCourses.length; i++) {
        if (typeof data.relevantCourses[i] !== 'string') {
          result.errors.push(`relevantCourses[${i}] must be a string`);
          result.isValid = false;
        } else {
          // Basic course code validation (should be like C950, D123, etc.)
          const courseCode = data.relevantCourses[i];
          if (!/^[A-Z]\d{3,4}$/i.test(courseCode)) {
            result.warnings.push(`relevantCourses[${i}] "${courseCode}" doesn't match typical course code pattern (e.g., C950, D123)`);
          }
        }
      }
    }
  }

  // Filename validation
  const expectedFilename = `${data.subreddit}.json`;
  if (filename !== expectedFilename) {
    result.warnings.push(`filename "${filename}" should probably be "${expectedFilename}" to match subreddit name`);
  }

  return result;
}

async function validateAllRawFiles(options: { checkReddit?: boolean; updateData?: boolean } = {}): Promise<void> {
  const { checkReddit = false, updateData = false } = options;
  const rawDir = path.join(process.cwd(), 'data', 'reddit', 'raw');
  
  if (!fs.existsSync(rawDir)) {
    console.error(`❌ Raw directory not found: ${rawDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(rawDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.warn('⚠️  No JSON files found in raw directory');
    return;
  }

  console.log(`🔍 Validating ${files.length} Reddit community files...`);
  if (checkReddit) {
    console.log('🌐 Reddit API checking enabled');
  }
  if (updateData) {
    console.log('📝 Data updates enabled');
  }
  console.log();

  const results: ValidationResult[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalUpdated = 0;

  for (const file of files) {
    const filePath = path.join(rawDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const result = await validateRedditCommunityWithAPI(data, file, checkReddit, updateData);
      
      // Write updated data back to file if changes were made
      if (result.updated && updateData) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
        totalUpdated++;
      }
      results.push(result);

      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;

      // Print results for this file
      if (result.isValid && result.warnings.length === 0) {
        console.log(`✅ ${file}: Valid`);
      } else {
        console.log(`${result.isValid ? '⚠️' : '❌'} ${file}:`);
        
        for (const error of result.errors) {
          console.log(`   ERROR: ${error}`);
        }
        
        for (const warning of result.warnings) {
          console.log(`   WARN: ${warning}`);
        }
      }

    } catch (error) {
      console.log(`❌ ${file}: Failed to parse JSON`);
      console.log(`   ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      totalErrors++;
    }
  }

  // Summary
  console.log(`\n📊 Validation Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Valid files: ${results.filter(r => r.isValid).length}`);
  console.log(`   Files with errors: ${results.filter(r => !r.isValid).length}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Total warnings: ${totalWarnings}`);
  if (updateData) {
    console.log(`   Files updated: ${totalUpdated}`);
  }

  if (totalErrors > 0) {
    console.log(`\n❌ Validation failed with ${totalErrors} errors`);
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`\n⚠️  Validation passed with ${totalWarnings} warnings`);
  } else {
    console.log(`\n✅ All files are valid!`);
  }
}

// CLI usage - run if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const args = process.argv.slice(2);
  const checkReddit = args.includes('--check-reddit') || args.includes('--reddit');
  const updateData = args.includes('--update') || args.includes('-u');
  const validateOnly = args.includes('--validate-only');
  const showHelp = args.includes('--help') || args.includes('-h');
  
  if (showHelp) {
    console.log(`
🔍 Reddit Raw Data Validator

Usage: tsx validate_raw.ts [options]

Options:
  --validate-only            Schema validation only (no API calls, for CI)
  --check-reddit, --reddit   Check subreddits against Reddit API
  --update, -u               Update member counts from Reddit API
  --help, -h                 Show this help message

Examples:
  tsx validate_raw.ts                    # Basic validation only
  tsx validate_raw.ts --validate-only   # Schema validation only (for CI)
  tsx validate_raw.ts --reddit          # Validate + check Reddit API
  tsx validate_raw.ts --reddit --update # Validate + update from Reddit API
`);
    process.exit(0);
  }
  
  validateAllRawFiles({ 
    checkReddit: validateOnly ? false : checkReddit, 
    updateData: validateOnly ? false : updateData 
  }).catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { validateRedditCommunity, validateAllRawFiles };