'use client';

import { useEffect } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { POPULAR_STORES, SHIPPING_OPTIONS } from '../../types/hotdeal';
import { detectStoreFromUrl } from '../../utils/hotdeal';

interface HotdealFormFieldsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors?: Record<string, any>;
}

/**
 * 핫딜 글쓰기 폼 확장 필드
 * 링크, 쇼핑몰, 상품명, 가격, 배송비 입력 필드
 */
export function HotdealFormFields({
  register,
  watch,
  setValue,
  errors,
}: HotdealFormFieldsProps) {
  const dealUrl = watch('deal_url');

  // URL 입력 시 쇼핑몰 자동 감지
  useEffect(() => {
    if (dealUrl && dealUrl.trim()) {
      const detectedStore = detectStoreFromUrl(dealUrl);
      setValue('store', detectedStore);
    }
  }, [dealUrl, setValue]);

  return (
    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          핫딜 정보
        </h3>
      </div>

      {/* 상품 링크 */}
      <div>
        <label
          htmlFor="deal_url"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          상품 링크 <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          id="deal_url"
          {...register('deal_url', {
            required: '상품 링크를 입력해주세요',
            pattern: {
              value: /^https?:\/\/.+/,
              message: '올바른 URL 형식이 아닙니다',
            },
          })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          placeholder="https://www.coupang.com/..."
        />
        {errors?.deal_url && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.deal_url.message}
          </p>
        )}
      </div>

      {/* 쇼핑몰 */}
      <div>
        <label
          htmlFor="store"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          쇼핑몰 <span className="text-red-500">*</span>
        </label>
        <select
          id="store"
          {...register('store', { required: '쇼핑몰을 선택해주세요' })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        >
          <option value="">선택하세요</option>
          {POPULAR_STORES.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>
        {errors?.store && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.store.message}
          </p>
        )}
      </div>

      {/* 상품명 */}
      <div>
        <label
          htmlFor="product_name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          상품명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="product_name"
          {...register('product_name', { required: '상품명을 입력해주세요' })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          placeholder="LG 통돌이 세탁기 19kg"
        />
        {errors?.product_name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.product_name.message}
          </p>
        )}
      </div>

      {/* 가격 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            판매가 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="price"
              {...register('price', {
                required: '가격을 입력해주세요',
                min: { value: 0, message: '가격은 0원 이상이어야 합니다' },
              })}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="11160"
              min="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              원
            </span>
          </div>
          {errors?.price && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.price.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="original_price"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            정가 <span className="text-gray-400 text-xs">(선택)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="original_price"
              {...register('original_price')}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="15000"
              min="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              원
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            할인율 표시용
          </p>
        </div>
      </div>

      {/* 배송비 */}
      <div>
        <label
          htmlFor="shipping"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          배송비 <span className="text-red-500">*</span>
        </label>
        <select
          id="shipping"
          {...register('shipping', { required: '배송비를 선택해주세요' })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        >
          <option value="">선택하세요</option>
          {SHIPPING_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors?.shipping && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.shipping.message}
          </p>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>팁:</strong> 상품 링크를 입력하면 쇼핑몰이 자동으로 선택됩니다.
        </p>
      </div>
    </div>
  );
}
