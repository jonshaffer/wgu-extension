#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import type { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { isDiscordCommunityFile } from '../types/raw-discord.ts';
import { checkInvitesInRawDir } from './lib/invites.ts';

interface ValidationResult {
  file: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function loadSchema(): any {
  const schemaPath = path.join(process.cwd(), 'discord', 'types', 'discord-community.schema.json');
  const schemaText = fs.readFileSync(schemaPath, 'utf-8');
  return JSON.parse(schemaText);
}

function validateWithSchema(data: any, validate: ValidateFunction): string[] {
  const ok = validate(data);
  if (ok) return [];
  return (validate.errors || []).map((e: ErrorObject) => `${e.instancePath || '/'} ${e.message}`.trim());
}

function validateDiscordRawFile(data: any, filename: string, validateSchema: ValidateFunction): ValidationResult {
  const result: ValidationResult = {
    file: filename,
    isValid: true,
    errors: [],
    warnings: []
  };

  // JSON Schema validation
  const schemaErrors = validateWithSchema(data, validateSchema);
  if (schemaErrors.length > 0) {
    result.errors.push(...schemaErrors);
    result.isValid = false;
  }

  // Type guard check as an additional safety net
  if (!isDiscordCommunityFile(data)) {
    result.errors.push('Does not satisfy DiscordCommunityFile type guard');
    result.isValid = false;
  }

  // Filename convention: use the top-level id
  if (typeof data.id === 'string') {
    const expected = `${data.id}.json`;
    if (filename !== expected) {
      result.warnings.push(`Filename should be ${expected} to match community id`);
    }
  }

  // Channel checks: communityId must match top-level id
  if (Array.isArray(data.channels) && typeof data.id === 'string') {
    const mismatches = data.channels.filter((ch: any) => ch.communityId !== data.id);
    if (mismatches.length > 0) {
      result.warnings.push(`${mismatches.length} channel(s) have communityId not matching top-level id ${data.id}`);
    }
  }

  return result;
}

async function validateAllDiscordRaw(): Promise<void> {
  const rawDir = path.join(process.cwd(), 'discord', 'raw');
  if (!fs.existsSync(rawDir)) {
    console.error(`❌ Raw directory not found: ${rawDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.warn('⚠️  No JSON files found in raw directory');
    return;
  }

  console.log(`🔵 Validating ${files.length} Discord raw files...`);

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = loadSchema();
  const validateSchema = ajv.compile(schema);

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const filePath = path.join(rawDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const res = validateDiscordRawFile(data, file, validateSchema);

      totalErrors += res.errors.length;
      totalWarnings += res.warnings.length;

      if (res.isValid && res.warnings.length === 0) {
        console.log(`✅ ${file}: Valid`);
      } else {
        console.log(`${res.isValid ? '⚠️' : '❌'} ${file}:`);
        for (const err of res.errors) console.log(`   ERROR: ${err}`);
        for (const warn of res.warnings) console.log(`   WARN: ${warn}`);
      }
    } catch (e) {
      console.log(`❌ ${file}: Failed to parse JSON`);
      console.log(`   ERROR: ${e instanceof Error ? e.message : 'Unknown error'}`);
      totalErrors++;
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Total warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log(`\n❌ Validation failed with ${totalErrors} errors`);
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`\n⚠️  Validation passed with ${totalWarnings} warnings`);
  } else {
    console.log(`\n✅ All files are valid!`);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const showHelp = process.argv.includes('--help') || process.argv.includes('-h');
  const checkInvites = process.argv.includes('--check-invites');
  if (showHelp) {
    console.log(`
🔵 Discord Raw Data Validator

Usage: tsx validate-raw.ts [--check-invites]
`);
    process.exit(0);
  }
  (async () => {
    await validateAllDiscordRaw();
    if (checkInvites) {
      const rawDir = path.join(process.cwd(), 'discord', 'raw');
      console.log('\n🔗 Verifying Discord invites...');
      const { failures, results } = await checkInvitesInRawDir(rawDir);
      for (const r of results) {
        if (!r.inviteUrl) continue; // skipped
        if (r.ok) console.log(`✅ ${r.file}: valid invite (${r.code})`);
        else console.log(`❌ ${r.file}: invalid invite (${r.inviteUrl}) - ${r.error || 'unknown error'} [status=${r.status}]`);
      }
      console.log(`\n📊 Invite check summary: ${results.length} checked, ${failures} invalid`);
      if (failures > 0) process.exit(1);
    }
  })().catch(err => {
    console.error('❌ Discord validation failed:', err);
    process.exit(1);
  });
}

export { validateAllDiscordRaw };
