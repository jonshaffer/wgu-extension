import fs from 'fs';
import path from 'path';

export interface InviteCheckResult {
  file: string;
  inviteUrl: string;
  code: string;
  ok: boolean;
  status: number;
  guildId?: string;
  error?: string;
}

export function extractInviteCode(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'discord.gg' && u.pathname.length > 1) {
      return u.pathname.slice(1).split('/')[0];
    }
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

export async function checkInvite(code: string): Promise<{ ok: boolean; status: number; data?: any; error?: string }>
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

export async function checkInvitesInRawDir(rawDir: string, { rateMs = 200 }: { rateMs?: number } = {}) {
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json'));
  const results: InviteCheckResult[] = [];

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

      if (rateMs > 0) await new Promise(r => setTimeout(r, rateMs));

      const res = await checkInvite(code);
      const record: InviteCheckResult = {
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
          record.error = `invite guild (${guildId}) differs from file id (${data.id})`;
        }
      } else {
        record.error = res.error || 'Invalid or expired invite';
      }

      results.push(record);
    } catch (e) {
      results.push({ file, inviteUrl: '', code: '', ok: false, status: 0, error: e instanceof Error ? e.message : 'JSON parse error' });
    }
  }

  const failures = results.filter(r => !r.ok).length;
  return { filesChecked: files.length, failures, results };
}
