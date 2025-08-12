#!/usr/bin/env tsx

/**
 * Verify Discord invite URLs found in data/discord/raw/*.json
 * - Parses invite codes from common URL formats (discord.gg, discord.com/invite[s]/)
 * - Calls Discord public API to verify invite validity
 * - Warns on guild.id mismatch vs file id; fails on invalid/expired invites
 */

import fs from 'fs';
import path from 'path';

interface InviteCheck {
  file: string;
  inviteUrl: string;
  code: string;
  ok: boolean;
  status: number;
  guildId?: string;
  error?: string;
}

function extractInviteCode(url: string): string | null {
  try {
    const u = new URL(url);
    // Accept discord.gg/<code>
    if (u.hostname === 'discord.gg' && u.pathname.length > 1) {
      return u.pathname.slice(1).split('/')[0];
    }
    // Accept discord.com/invite/<code> or /invites/<code>
    if (u.hostname === 'discord.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && (parts[0] === 'invite' || parts[0] === 'invites')) {
        return parts[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function checkInvite(code: string): Promise<{ ok: boolean; status: number; data?: any; error?: string }>
{
  const endpoint = `https://discord.com/api/v9/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=true`;
  try {
    const res = await fetch(endpoint, {
      headers: {
        'User-Agent': 'WGU Extension Invite Validator/1.0',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

async function main() {
  const rawDir = path.join(process.cwd(), 'discord', 'raw');
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json'));

  console.log(`🔗 Checking invites in ${files.length} Discord raw files...`);

  const results: InviteCheck[] = [];
  for (const file of files) {
    const full = path.join(rawDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(full, 'utf-8'));
      if (typeof data.inviteUrl !== 'string' || data.inviteUrl.trim() === '') {
        continue; // no invite to check
      }
      const code = extractInviteCode(data.inviteUrl);
      if (!code) {
        results.push({ file, inviteUrl: data.inviteUrl, code: '', ok: false, status: 0, error: 'Unrecognized invite URL format' });
        continue;
      }

      // Basic polite rate limiting
      await new Promise(r => setTimeout(r, 200));

      const res = await checkInvite(code);
      const record: InviteCheck = {
        file,
        inviteUrl: data.inviteUrl,
        code,
        ok: res.ok,
        status: res.status
      };

      if (res.ok && res.data) {
        const guildId = res.data?.guild?.id as string | undefined;
        record.guildId = guildId;
        if (guildId && typeof data.id === 'string' && data.id !== guildId) {
          // Mismatch is a warning; sometimes invites point to a landing hub or redirect
          console.log(`⚠️  ${file}: invite guild (${guildId}) differs from file id (${data.id})`);
        }
      } else {
        record.error = res.error || 'Invalid or expired invite';
      }

      results.push(record);
    } catch (e) {
      console.log(`❌ ${file}: failed to parse JSON (${e instanceof Error ? e.message : 'Unknown error'})`);
    }
  }

  let failures = 0;
  for (const r of results) {
    if (r.ok) {
      console.log(`✅ ${r.file}: valid invite (${r.code})`);
    } else {
      failures++;
      console.log(`❌ ${r.file}: invalid invite (${r.inviteUrl}) - ${r.error || 'unknown error'} [status=${r.status}]`);
    }
  }

  console.log(`\n📊 Invite check summary: ${results.length} checked, ${failures} invalid`);
  if (failures > 0) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('❌ Invite check failed:', err);
    process.exit(1);
  });
}
