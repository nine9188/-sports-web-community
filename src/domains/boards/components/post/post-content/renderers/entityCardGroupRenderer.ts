import type { EntityCardGroupItem } from '@/shared/types/entityCardGroup';
import type { TipTapNode } from '../types';
import { renderPlayerCard } from './playerCardRenderer';
import { renderTeamCard } from './teamCardRenderer';

function renderEntityCardItem(item: EntityCardGroupItem): string {
  if (item.type === 'team') {
    return `<div class="entity-card-group-item">${renderTeamCard({
      teamId: item.id,
      teamData: item.data as unknown as Record<string, unknown>,
    })}</div>`;
  }

  return `<div class="entity-card-group-item">${renderPlayerCard({
    playerId: item.id,
    playerData: item.data as unknown as Record<string, unknown>,
  })}</div>`;
}

function renderEntityCardNode(node: TipTapNode): string {
  if (node.type === 'teamCard' && node.attrs) {
    return `<div class="entity-card-group-item">${renderTeamCard({
      teamId: node.attrs.teamId as string | number,
      teamData: node.attrs.teamData as Record<string, unknown>,
    })}</div>`;
  }

  if (node.type === 'playerCard' && node.attrs) {
    return `<div class="entity-card-group-item">${renderPlayerCard({
      playerId: node.attrs.playerId as string | number,
      playerData: node.attrs.playerData as Record<string, unknown>,
    })}</div>`;
  }

  return '';
}

function chunkHtml(items: string[], size: number): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function renderEntityCardGroup(data: {
  columns?: unknown;
  items?: unknown;
  content?: TipTapNode[];
}): string {
  const content = Array.isArray(data.content) ? data.content : [];
  const contentItems = content.map(renderEntityCardNode).filter(Boolean);
  const items = Array.isArray(data.items) ? data.items as EntityCardGroupItem[] : [];
  const legacyItems = items.map(renderEntityCardItem).filter(Boolean);
  const cardItems = contentItems.length > 0 ? contentItems : legacyItems;

  if (cardItems.length === 0) return '';

  const rowsHtml = chunkHtml(cardItems, 4)
    .map((row) => `<div class="entity-card-group-row">${row.join('')}</div>`)
    .join('');

  return `
    <div class="entity-card-group entity-card-group-cols-4" data-type="entity-card-group" data-columns="4">
      <div class="entity-card-group-track">
        ${rowsHtml}
      </div>
    </div>
  `;
}
