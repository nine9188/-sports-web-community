import { useEffect, useMemo, useRef, useState } from 'react';
import type { Board } from '@/domains/boards/types/board';
import type { DealInfo } from '@/domains/boards/types/hotdeal';
import { detectStoreFromUrl, formatPrice, isHotdealBoard } from '@/domains/boards/utils/hotdeal';

type UsePostFormStateParams = {
  initialTitle: string;
  initialContent: string;
  externalCategoryId: string;
  boardId?: string;
  allBoardsFlat: Board[];
  isCreateMode: boolean;
  initialDealInfo: DealInfo | null;
};

export function usePostFormState({
  initialTitle,
  initialContent,
  externalCategoryId,
  boardId,
  allBoardsFlat,
  isCreateMode,
  initialDealInfo,
}: UsePostFormStateParams) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [categoryId, setCategoryIdInternal] = useState(externalCategoryId);

  const [dealUrl, setDealUrl] = useState(initialDealInfo?.deal_url || '');
  const [store, setStore] = useState(initialDealInfo?.store || '');
  const [productName, setProductName] = useState(initialDealInfo?.product_name || '');
  const [price, setPrice] = useState(initialDealInfo?.price ? String(initialDealInfo.price) : '');
  const [originalPrice, setOriginalPrice] = useState(initialDealInfo?.original_price ? String(initialDealInfo.original_price) : '');
  const [shipping, setShipping] = useState(initialDealInfo?.shipping || '');

  const formStateRef = useRef({ title, content, categoryId });
  const hotdealStateRef = useRef({ dealUrl: '', store: '', productName: '', price: '', originalPrice: '', shipping: '' });

  useEffect(() => {
    formStateRef.current = { title, content, categoryId };
  }, [title, content, categoryId]);

  useEffect(() => {
    hotdealStateRef.current = { dealUrl, store, productName, price, originalPrice, shipping };
  }, [dealUrl, store, productName, price, originalPrice, shipping]);

  useEffect(() => {
    if (dealUrl && dealUrl.trim()) {
      const detectedStore = detectStoreFromUrl(dealUrl);
      setStore(detectedStore);
    }
  }, [dealUrl]);

  const selectedBoard = useMemo(() => {
    const boardIdToFind = isCreateMode ? categoryId : (boardId || categoryId);
    return allBoardsFlat.find((board) => board.id === boardIdToFind);
  }, [allBoardsFlat, boardId, categoryId, isCreateMode]);

  const isHotdeal = useMemo(() => {
    if (!isCreateMode && initialDealInfo) {
      return true;
    }

    if (!selectedBoard?.slug) return false;
    return isHotdealBoard(selectedBoard.slug);
  }, [initialDealInfo, isCreateMode, selectedBoard]);

  useEffect(() => {
    if (isHotdeal && productName && store && price && shipping) {
      const priceNum = parseFloat(price);
      if (!Number.isNaN(priceNum)) {
        const formattedPrice = formatPrice(priceNum);
        const generatedTitle = `[${store}] ${productName} [${formattedPrice}][${shipping}]`;
        setTitle(generatedTitle);
      }
    }
  }, [isHotdeal, productName, store, price, shipping]);

  return {
    title,
    setTitle,
    content,
    setContent,
    categoryId,
    setCategoryIdInternal,
    dealUrl,
    setDealUrl,
    store,
    setStore,
    productName,
    setProductName,
    price,
    setPrice,
    originalPrice,
    setOriginalPrice,
    shipping,
    setShipping,
    isHotdeal,
    formStateRef,
    hotdealStateRef,
  };
}
