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

export function renderEntityCardGroup(data: {
  columns?: unknown;
  items?: unknown;
  content?: TipTapNode[];
}): string {
  const content = Array.isArray(data.content) ? data.content : [];
  const contentHtml = content.map(renderEntityCardNode).join('');
  const items = Array.isArray(data.items) ? data.items as EntityCardGroupItem[] : [];
  const itemsHtml = items.map(renderEntityCardItem).join('');
  const cardsHtml = contentHtml || itemsHtml;

  if (!cardsHtml) return '';

  return `
    <div class="entity-card-group entity-card-group-cols-4" data-type="entity-card-group" data-columns="4">
      <div class="entity-card-group-track">
        ${cardsHtml}
      </div>
    </div>
  `;
}
