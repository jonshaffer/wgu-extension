/**
 * WGU Student Groups Extractor
 *
 * Parses the Group Hubs directory page on cm.wgu.edu and extracts group cards
 * into a structured JSON shape.
 */

export interface WGUStudentGroup {
  id: string; // kebab-case slug from the display name
  groupUid: string; // data-lia-group-uid (e.g., "grouphub:cybersecurityclub")
  name: string;
  description?: string;
  url: string; // absolute URL
  imageUrl?: string; // absolute URL
  membershipType: 'open' | 'closed' | 'unknown';
  membershipCount?: number;
  topicCount?: number;
}

export interface WGUStudentGroupsExtraction {
  groups: WGUStudentGroup[];
  total: number;
  extractedAt: string;
  url: string;
}

function toAbsoluteUrl(url: string | null | undefined, origin = 'https://cm.wgu.edu'): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${origin}${url}`;
  return `${origin}/${url}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function parseCount(text: string | null | undefined): number | undefined {
  if (!text) return undefined;
  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(num) ? num : undefined;
}

function detectMembershipType(cardEl: Element): 'open' | 'closed' | 'unknown' {
  const typeEl = cardEl.querySelector('.lia-membership-type');
  if (!typeEl) return 'unknown';
  const classList = typeEl.getAttribute('class') || '';
  if (classList.includes('lia-membership-type-closed')) return 'closed';
  if (classList.includes('lia-membership-type-open')) return 'open';
  // Some closed cards include visible text 'Closed'
  const text = typeEl.textContent?.toLowerCase() || '';
  if (text.includes('closed')) return 'closed';
  if (text.includes('open')) return 'open';
  return 'unknown';
}

export function extractStudentGroupsFromDocument(doc: Document = document): WGUStudentGroupsExtraction {
  const cardNodes = Array.from(doc.querySelectorAll('.lia-group-hub-card.lia-card'));

  const groups: WGUStudentGroup[] = cardNodes.map((card) => {
    const groupUid = card.getAttribute('data-lia-group-uid') || '';
    const linkEl = card.querySelector('a.lia-link-navigation') as HTMLAnchorElement | null;
    const nameEl = card.querySelector('.lia-node-title');
    const descEl = card.querySelector('.lia-node-description');
    const imgEl = card.querySelector('img.lia-node-avatar') as HTMLImageElement | null;
    const memberEl = card.querySelector('.lia-membership-count');
    const topicEl = card.querySelector('.lia-node-topic-count');

    const name = nameEl?.textContent?.trim() || 'Unknown Group';
    const id = slugify(name);
    const url = toAbsoluteUrl(linkEl?.getAttribute('href')) || '';
    const imageUrl = toAbsoluteUrl(imgEl?.getAttribute('src'));
    const description = descEl?.textContent?.trim() || undefined;

    const membershipType = detectMembershipType(card);
    const membershipCount = parseCount(memberEl?.textContent || undefined);
    const topicCount = parseCount(topicEl?.textContent || undefined);

    return {
      id,
      groupUid,
      name,
      description,
      url,
      imageUrl,
      membershipType,
      membershipCount,
      topicCount,
    };
  });

  return {
    groups,
    total: groups.length,
    extractedAt: new Date().toISOString(),
    url: (doc.defaultView?.location?.href) || 'about:blank',
  };
}

export function isWGUStudentGroupsDirectoryPage(doc: Document = document): boolean {
  // Identify Lithium/Khoros Group Hubs grid component
  return !!(
    doc.querySelector('li\\:grouphubs-group-hubs-grid') ||
    doc.querySelector('.lia-component-grouphubs-widget-grid') ||
    doc.querySelector('.lia-groups-list .lia-cards')
  );
}

export function extractWGUStudentGroups(): WGUStudentGroupsExtraction | null {
  if (!isWGUStudentGroupsDirectoryPage(document)) return null;
  return extractStudentGroupsFromDocument(document);
}
