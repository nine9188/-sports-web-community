import { Fragment } from 'react';
import type { ShopCategory } from './types';

// 카테고리를 계층 구조로 변환하는 함수
export const buildCategoryHierarchy = (categories: ShopCategory[]): ShopCategory[] => {
  const categoryMap: Record<number, ShopCategory> = {};
  const rootCategories: ShopCategory[] = [];

  // 먼저 모든 카테고리를 맵에 추가
  categories.forEach((category) => {
    categoryMap[category.id] = { ...category, children: [] };
  });

  // 부모-자식 관계 설정
  categories.forEach((category) => {
    if (category.parent_id && categoryMap[category.parent_id]) {
      categoryMap[category.parent_id].children?.push(categoryMap[category.id]);
    } else if (!category.parent_id) {
      rootCategories.push(categoryMap[category.id]);
    }
  });

  return rootCategories;
};

// 카테고리 옵션 렌더링 함수
export const renderCategoryOptions = (categories: ShopCategory[], level = 0): React.ReactNode[] => {
  return categories.map((category) => (
    <Fragment key={category.id}>
      <option value={category.id}>
        {'　'.repeat(level)}
        {level > 0 ? '└ ' : ''}
        {category.name}
      </option>
      {category.children && renderCategoryOptions(category.children, level + 1)}
    </Fragment>
  ));
};
