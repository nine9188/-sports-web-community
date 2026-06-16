import BoardSelector from '@/domains/boards/components/createnavigation/BoardSelector';
import type { Board } from '@/domains/boards/types/board';
import { HotdealFields } from './HotdealFields';

type PostBasicFieldsProps = {
  isCreateMode: boolean;
  isHotdeal: boolean;
  allBoardsFlat: Board[];
  categoryId: string;
  boardId?: string;
  title: string;
  dealUrl: string;
  store: string;
  productName: string;
  price: string;
  originalPrice: string;
  shipping: string;
  storeOptions: { value: string; label: string }[];
  shippingOptions: { value: string; label: string }[];
  onCategoryChange: (id: string) => void;
  setTitle: (value: string) => void;
  setDealUrl: (value: string) => void;
  setStore: (value: string) => void;
  setProductName: (value: string) => void;
  setPrice: (value: string) => void;
  setOriginalPrice: (value: string) => void;
  setShipping: (value: string) => void;
};

export function PostBasicFields({
  isCreateMode,
  isHotdeal,
  allBoardsFlat,
  categoryId,
  boardId,
  title,
  dealUrl,
  store,
  productName,
  price,
  originalPrice,
  shipping,
  storeOptions,
  shippingOptions,
  onCategoryChange,
  setTitle,
  setDealUrl,
  setStore,
  setProductName,
  setPrice,
  setOriginalPrice,
  setShipping,
}: PostBasicFieldsProps) {
  return (
    <>
      {isCreateMode && (
        <div className="space-y-2">
          <label htmlFor="categoryId" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
            게시판 선택 <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <BoardSelector
            boards={allBoardsFlat}
            selectedId={categoryId}
            onSelect={onCategoryChange}
            currentBoardId={boardId}
          />
        </div>
      )}

      {!isHotdeal && (
        <div className="space-y-2">
          <label htmlFor="title" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">제목</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
            placeholder="제목을 입력하세요"
            maxLength={100}
            required
          />
        </div>
      )}

      {isHotdeal && (
        <HotdealFields
          dealUrl={dealUrl}
          store={store}
          productName={productName}
          price={price}
          originalPrice={originalPrice}
          shipping={shipping}
          storeOptions={storeOptions}
          shippingOptions={shippingOptions}
          setDealUrl={setDealUrl}
          setStore={setStore}
          setProductName={setProductName}
          setPrice={setPrice}
          setOriginalPrice={setOriginalPrice}
          setShipping={setShipping}
        />
      )}
    </>
  );
}
