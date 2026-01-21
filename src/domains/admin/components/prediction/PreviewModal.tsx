'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
} from '@/shared/components/ui/dialog';
import Spinner from '@/shared/components/Spinner';
import { InlineEmpty } from '@/shared/components/StateComponents';
import type { UpcomingMatch, PredictionApiData } from './types';
import { PredictionPreviewContent } from './PredictionPreviewContent';

interface PreviewModalProps {
  match: UpcomingMatch | null;
  data: PredictionApiData | null;
  isLoading: boolean;
  onClose: () => void;
}

export function PreviewModal({ match, data, isLoading, onClose }: PreviewModalProps) {
  if (!match) return null;

  return (
    <Dialog open={!!match} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {match.teams.home.name} vs {match.teams.away.name}
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-normal">
              ID: {match.id}
            </span>
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : data ? (
            <PredictionPreviewContent data={data} />
          ) : (
            <InlineEmpty message="데이터 없음" height="h-32" />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
