type TipTapLikeNode = {
  type?: unknown;
  text?: unknown;
  description?: unknown;
  marks?: Array<{
    type?: unknown;
    attrs?: Record<string, unknown>;
  }>;
  content?: unknown;
};

export type InternalEntityLink = {
  key: string;
  type: 'team' | 'player' | 'match';
  id: number;
  href: string;
  label?: string;
};

const MAX_INTERNAL_ENTITY_LINKS = 24;

function parseInternalEntityHref(href: unknown): Omit<InternalEntityLink, 'key' | 'label'> | null {
  if (typeof href !== 'string' || !href.trim()) return null;

  let pathname = href.trim();

  try {
    pathname = new URL(pathname, 'https://internal.local').pathname;
  } catch {
    return null;
  }

  const match = pathname.match(/^\/livescore\/football\/(team|player|match)\/(\d+)(?:\/[^/?#]+)?\/?$/);
  if (!match) return null;

  const id = Number(match[2]);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    type: match[1] as 'team' | 'player' | 'match',
    id,
    href: pathname,
  };
}

function firstText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function collectHtmlAnchorLinks(html: string, links: InternalEntityLink[], seen: Set<string>) {
  const anchorRegex = /<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) && links.length < MAX_INTERNAL_ENTITY_LINKS) {
    const parsedLink = parseInternalEntityHref(decodeHtmlAttribute(match[2]));
    if (!parsedLink) continue;

    const key = `${parsedLink.type}-${parsedLink.id}`;
    if (seen.has(key)) continue;

    seen.add(key);
    links.push({
      ...parsedLink,
      key,
      label: stripHtml(match[3]),
    });
  }
}

function walkNode(node: unknown, links: InternalEntityLink[], seen: Set<string>) {
  if (!node || typeof node !== 'object' || links.length >= MAX_INTERNAL_ENTITY_LINKS) return;

  const current = node as TipTapLikeNode;

  if (typeof current.description === 'string') {
    collectHtmlAnchorLinks(current.description, links, seen);
  }

  if (typeof current.content === 'string') {
    collectHtmlAnchorLinks(current.content, links, seen);
  }

  if (current.type === 'text' && Array.isArray(current.marks)) {
    for (const mark of current.marks) {
      if (mark.type !== 'link') continue;

      const parsedLink = parseInternalEntityHref(mark.attrs?.href);
      if (!parsedLink) continue;

      const key = `${parsedLink.type}-${parsedLink.id}`;
      if (seen.has(key)) continue;

      seen.add(key);
      links.push({
        ...parsedLink,
        key,
        label: firstText(current.text),
      });
    }
  }

  if (Array.isArray(current.content)) {
    current.content.forEach((child) => walkNode(child, links, seen));
  }
}

export function extractInternalEntityLinksFromContent(content: unknown): InternalEntityLink[] {
  let parsedContent = content;

  if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return [];
    }
  }

  const links: InternalEntityLink[] = [];
  walkNode(parsedContent, links, new Set<string>());
  return links;
}
