'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
} from '@/shared/components/ui/dialog';
import SuspensionManager from '@/domains/admin/components/SuspensionManager';
import type { SelectedAuthor } from './types';

interface SuspensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAuthor: SelectedAuthor | null;
  onUpdate: () => void;
}

export function SuspensionModal({
  isOpen,
  onClose,
  selectedAuthor,
  onUpdate,
}: SuspensionModalProps) {
  if (!selectedAuthor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>작성자 정지 관리</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody>
          <SuspensionManager
            userId={selectedAuthor.id}
            userNickname={selectedAuthor.nickname}
            currentSuspension={{
              is_suspended: false,
              suspended_until: null,
              suspended_reason: null,
            }}
            onUpdate={onUpdate}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
