import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnyExtension } from '@tiptap/core';

function loadAdditionalEditorExtensions() {
  return Promise.all([
    import('@/shared/components/editor/tiptap/YoutubeExtension').then((mod) => mod.YoutubeExtension),
    import('@/shared/components/editor/tiptap/VideoExtension').then((mod) => mod.Video),
    import('@/shared/components/editor/tiptap/MatchCardExtension').then((mod) => mod.MatchCardExtension),
    import('@/shared/components/editor/tiptap/extensions/social-embeds'),
    import('@/shared/components/editor/tiptap/EntityCardGroupExtension').then((mod) => mod.EntityCardGroupExtension),
    import('@/shared/components/editor/tiptap/TeamCardExtension').then((mod) => mod.TeamCardExtension),
    import('@/shared/components/editor/tiptap/PlayerCardExtension').then((mod) => mod.PlayerCardExtension),
    import('@tiptap/extension-table').then((mod) => mod.default),
    import('@tiptap/extension-table-row').then((mod) => mod.default),
    import('@tiptap/extension-table-cell').then((mod) => mod.default),
    import('@tiptap/extension-table-header').then((mod) => mod.default),
  ]).catch((error) => {
    console.error('에디터 확장 preload 실패:', error);
    return null;
  });
}

export function useAdditionalEditorExtensions(baseExtensions: AnyExtension[]) {
  const [additionalExtensions, setAdditionalExtensions] = useState<AnyExtension[]>([]);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);
  const loadingExtensionsRef = useRef<Promise<boolean> | null>(null);

  const applyAdditionalExtensions = useCallback((result: Awaited<ReturnType<typeof loadAdditionalEditorExtensions>>) => {
    if (!result) {
      setExtensionsLoaded(true);
      return false;
    }

    const [
      YoutubeExtension,
      VideoExtension,
      MatchCardExt,
      SocialEmbedsModule,
      EntityCardGroupExt,
      TeamCardExt,
      PlayerCardExt,
      TableExtension,
      TableRow,
      TableCell,
      TableHeader,
    ] = result;

    setAdditionalExtensions([
      YoutubeExtension,
      VideoExtension,
      MatchCardExt,
      SocialEmbedsModule.SocialEmbedExtension,
      SocialEmbedsModule.AutoSocialEmbedExtension.configure({ enabled: true }),
      EntityCardGroupExt,
      TeamCardExt,
      PlayerCardExt,
      TableExtension.configure({
        resizable: false,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ]);

    setExtensionsLoaded(true);
    return true;
  }, []);

  useEffect(() => {
    if (extensionsLoaded) return;

    const load = async () => {
      try {
        const result = await loadAdditionalEditorExtensions();
        applyAdditionalExtensions(result);
      } catch (error) {
        console.error('추가 에디터 확장 로딩 실패:', error);
        setExtensionsLoaded(true);
      }
    };

    void load();
  }, [applyAdditionalExtensions, extensionsLoaded]);

  const ensureAdditionalExtensions = useCallback(async () => {
    if (extensionsLoaded) return true;
    if (loadingExtensionsRef.current) return loadingExtensionsRef.current;

    loadingExtensionsRef.current = loadAdditionalEditorExtensions()
      .then(applyAdditionalExtensions)
      .catch((error) => {
        console.error('추가 에디터 확장 로드 실패:', error);
        setExtensionsLoaded(true);
        return false;
      })
      .finally(() => {
        loadingExtensionsRef.current = null;
      });

    return loadingExtensionsRef.current;
  }, [applyAdditionalExtensions, extensionsLoaded]);

  const loadedExtensions = useMemo(() => [
    ...baseExtensions,
    ...additionalExtensions,
  ], [baseExtensions, additionalExtensions]);

  return {
    loadedExtensions,
    extensionsLoaded,
    ensureAdditionalExtensions,
  };
}
