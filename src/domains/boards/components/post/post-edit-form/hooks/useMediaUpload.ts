import { useCallback } from 'react';
import type { ChangeEvent, Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';

import { useAuth } from '@/shared/context/AuthContext';
import { uploadPostImageFile } from '../utils/uploadPostImageFile';
import { uploadPostVideoFile } from '../utils/uploadPostVideoFile';

const IMAGE_FILE_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i;

const SOCIAL_IMAGE_PAGE_HOSTS = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'instagram.com',
  'www.instagram.com',
]);

type UseMediaUploadParams = {
  editor: Editor | null;
  isImageUploading: boolean;
  isVideoUploading: boolean;
  imageFileInputRef: MutableRefObject<HTMLInputElement | null>;
  videoFileInputRef: MutableRefObject<HTMLInputElement | null>;
  imageInsertionPositionRef: MutableRefObject<number | null>;
  videoInsertionPositionRef: MutableRefObject<number | null>;
  moveCursorAfterSelectedNode: () => void;
  getCurrentInsertionPosition: () => number | null;
  closeLinkPopover: () => void;
  closeYoutubePopover: () => void;
  closeSocialPopover: () => void;
  closeMatchPopover: () => void;
  closeTeamPopover: () => void;
  closePlayerPopover: () => void;
  closeTablePopover: () => void;
  closePollPopover: () => void;
  ensureAdditionalExtensions: () => Promise<boolean>;
  handleAddImage: (src: string, alt?: string, position?: number | null) => void;
  handleAddVideo: (src: string, caption: string, position?: number | null) => Promise<void> | void;
  setIsImageUploading: Dispatch<SetStateAction<boolean>>;
  setIsVideoUploading: Dispatch<SetStateAction<boolean>>;
};

export function useMediaUpload({
  editor,
  isImageUploading,
  isVideoUploading,
  imageFileInputRef,
  videoFileInputRef,
  imageInsertionPositionRef,
  videoInsertionPositionRef,
  moveCursorAfterSelectedNode,
  getCurrentInsertionPosition,
  closeLinkPopover,
  closeYoutubePopover,
  closeSocialPopover,
  closeMatchPopover,
  closeTeamPopover,
  closePlayerPopover,
  closeTablePopover,
  closePollPopover,
  ensureAdditionalExtensions,
  handleAddImage,
  handleAddVideo,
  setIsImageUploading,
  setIsVideoUploading,
}: UseMediaUploadParams) {
  const { user } = useAuth();

  const closeEditorPopovers = useCallback(() => {
    closeLinkPopover();
    closeYoutubePopover();
    closeSocialPopover();
    closeMatchPopover();
    closeTeamPopover();
    closePlayerPopover();
    closeTablePopover();
    closePollPopover();
  }, [
    closeLinkPopover,
    closeMatchPopover,
    closePlayerPopover,
    closePollPopover,
    closeSocialPopover,
    closeTablePopover,
    closeTeamPopover,
    closeYoutubePopover,
  ]);

  const handleImageToolbarClick = useCallback((options?: { fromUrlPrompt?: boolean }) => {
    if (isImageUploading) return;

    moveCursorAfterSelectedNode();
    imageInsertionPositionRef.current = getCurrentInsertionPosition();
    closeEditorPopovers();

    if (options?.fromUrlPrompt) {
      const imageUrl = window.prompt('삽입할 이미지 URL을 입력하세요.');
      const trimmedImageUrl = imageUrl?.trim();

      if (!trimmedImageUrl) {
        imageInsertionPositionRef.current = null;
        return;
      }

      try {
        const parsedUrl = new URL(trimmedImageUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          toast.error('http 또는 https 이미지 URL만 삽입할 수 있습니다.');
          imageInsertionPositionRef.current = null;
          return;
        }

        if (SOCIAL_IMAGE_PAGE_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
          toast.error('X/인스타 링크는 이미지 파일 URL이 아닙니다. 소셜 버튼을 쓰거나 이미지를 저장해서 업로드해주세요.');
          imageInsertionPositionRef.current = null;
          return;
        }

        if (!IMAGE_FILE_EXTENSIONS.test(parsedUrl.pathname)) {
          toast.error('이미지 URL은 jpg, png, gif, webp 같은 직접 파일 주소만 삽입할 수 있습니다.');
          imageInsertionPositionRef.current = null;
          return;
        }
      } catch {
        toast.error('올바른 이미지 URL을 입력해주세요.');
        imageInsertionPositionRef.current = null;
        return;
      }

      handleAddImage(trimmedImageUrl, undefined, imageInsertionPositionRef.current);
      imageInsertionPositionRef.current = null;
      return;
    }

    imageFileInputRef.current?.click();
  }, [
    closeEditorPopovers,
    getCurrentInsertionPosition,
    handleAddImage,
    imageFileInputRef,
    imageInsertionPositionRef,
    isImageUploading,
    moveCursorAfterSelectedNode,
  ]);

  const handleImageFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (!file) return;
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    setIsImageUploading(true);

    try {
      const { publicUrl, altText } = await uploadPostImageFile(file, { userId: user?.id });
      handleAddImage(publicUrl, altText, imageInsertionPositionRef.current);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast.error(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      imageInsertionPositionRef.current = null;
      setIsImageUploading(false);
    }
  }, [editor, handleAddImage, imageInsertionPositionRef, setIsImageUploading, user?.id]);

  const handleVideoToolbarClick = useCallback(() => {
    if (isVideoUploading) return;

    moveCursorAfterSelectedNode();
    videoInsertionPositionRef.current = getCurrentInsertionPosition();
    closeEditorPopovers();
    void ensureAdditionalExtensions();
    videoFileInputRef.current?.click();
  }, [
    closeEditorPopovers,
    ensureAdditionalExtensions,
    getCurrentInsertionPosition,
    isVideoUploading,
    moveCursorAfterSelectedNode,
    videoFileInputRef,
    videoInsertionPositionRef,
  ]);

  const handleVideoFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (!file) return;
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    setIsVideoUploading(true);

    try {
      const [{ publicUrl, caption }] = await Promise.all([
        uploadPostVideoFile(file, { userId: user?.id }),
        ensureAdditionalExtensions(),
      ]);

      await handleAddVideo(publicUrl, caption, videoInsertionPositionRef.current);
    } catch (error) {
      console.error('동영상 업로드 오류:', error);
      toast.error(error instanceof Error ? error.message : '동영상 업로드에 실패했습니다.');
    } finally {
      videoInsertionPositionRef.current = null;
      setIsVideoUploading(false);
    }
  }, [
    editor,
    ensureAdditionalExtensions,
    handleAddVideo,
    setIsVideoUploading,
    user?.id,
    videoInsertionPositionRef,
  ]);

  return {
    handleImageToolbarClick,
    handleImageFileChange,
    handleVideoToolbarClick,
    handleVideoFileChange,
  };
}
