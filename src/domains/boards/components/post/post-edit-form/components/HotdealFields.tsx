import { NativeSelect } from '@/shared/components/ui';

type SelectOption = {
  value: string;
  label: string;
};

type HotdealFieldsProps = {
  dealUrl: string;
  store: string;
  productName: string;
  price: string;
  originalPrice: string;
  shipping: string;
  storeOptions: SelectOption[];
  shippingOptions: SelectOption[];
  setDealUrl: (value: string) => void;
  setStore: (value: string) => void;
  setProductName: (value: string) => void;
  setPrice: (value: string) => void;
  setOriginalPrice: (value: string) => void;
  setShipping: (value: string) => void;
};

export function HotdealFields({
  dealUrl,
  store,
  productName,
  price,
  originalPrice,
  shipping,
  storeOptions,
  shippingOptions,
  setDealUrl,
  setStore,
  setProductName,
  setPrice,
  setOriginalPrice,
  setShipping,
}: HotdealFieldsProps) {
  return (
    <div className="space-y-4 border-t border-black/7 dark:border-white/10 pt-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">
          핫딜 정보
        </h3>
      </div>

      <div className="space-y-2">
        <label htmlFor="deal_url" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
          상품 링크 <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          id="deal_url"
          value={dealUrl}
          onChange={(e) => setDealUrl(e.target.value)}
          className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
          placeholder="https://www.coupang.com/..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="store" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
          쇼핑몰 <span className="text-red-500">*</span>
        </label>
        <NativeSelect
          value={store || ''}
          onValueChange={setStore}
          options={storeOptions}
          placeholder="선택하세요"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="product_name" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
          상품명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="product_name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full px-3 py-2 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
          placeholder="LG 통돌이 세탁기 19kg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="price" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
            판매가 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
              placeholder="11160"
              min="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-500">
              원
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="original_price" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
            정가 <span className="text-gray-400 text-xs">(선택)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="original_price"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-black/7 dark:border-white/10 rounded-md bg-white dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none text-base"
              placeholder="15000"
              min="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-500">
              원
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">할인율 표시용</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="shipping" className="block text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
          배송비 <span className="text-red-500">*</span>
        </label>
        <NativeSelect
          value={shipping || ''}
          onValueChange={setShipping}
          options={shippingOptions}
          placeholder="선택하세요"
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-[13px] text-blue-800 dark:text-blue-300">
          💡 <strong>팁</strong> 상품 링크를 입력하면 쇼핑몰이 자동으로 선택됩니다.
        </p>
      </div>
    </div>
  );
}
