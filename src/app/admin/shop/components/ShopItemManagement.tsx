'use client';

import { useState, useRef, useMemo, Fragment } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { Card, TabList, type TabItem } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/button';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { ShopCategory as BaseShopCategory } from '@/domains/shop/types';

interface Team {
  id: number;
  name: string;
  logo: string | null;
}

interface League {
  id: number;
  name: string;
  logo: string | null;
}

interface StorageImage {
  name: string;
  url: string;
}

// 글로벌 타입을 확장하여 필요한 필드 추가
interface ShopCategory extends BaseShopCategory {
  parent_id: number | null;
  children?: ShopCategory[];
  price?: number;
}

interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  is_default: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  category_id: number | null;
}

interface ShopItemManagementProps {
  teams: Team[];
  leagues: League[];
  storageImages: StorageImage[];
  shopItems: ShopItem[];
  categories: ShopCategory[];
}

// 카테고리를 계층 구조로 변환하는 함수
const buildCategoryHierarchy = (categories: ShopCategory[]) => {
  const categoryMap: Record<number, ShopCategory> = {};
  const rootCategories: ShopCategory[] = [];

  // 먼저 모든 카테고리를 맵에 추가
  categories.forEach(category => {
    categoryMap[category.id] = { ...category, children: [] };
  });

  // 부모-자식 관계 설정
  categories.forEach(category => {
    if (category.parent_id && categoryMap[category.parent_id]) {
      categoryMap[category.parent_id].children?.push(categoryMap[category.id]);
    } else if (!category.parent_id) {
      rootCategories.push(categoryMap[category.id]);
    }
  });

  return rootCategories;
};

// 카테고리 옵션 렌더링 함수
const renderCategoryOptions = (categories: ShopCategory[], level = 0) => {
  return categories.map(category => (
    <Fragment key={category.id}>
      <option value={category.id}>
        {'　'.repeat(level)}{level > 0 ? '└ ' : ''}{category.name}
      </option>
      {category.children && renderCategoryOptions(category.children, level + 1)}
    </Fragment>
  ));
};

export default function ShopItemManagement({ teams, leagues, storageImages, shopItems: initialShopItems, categories }: ShopItemManagementProps) {
  const [shopItems, setShopItems] = useState<ShopItem[]>(initialShopItems);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState<'teams' | 'leagues' | 'storage'>('teams');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [price, setPrice] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  const hierarchicalCategories = useMemo(() => buildCategoryHierarchy(categories), [categories]);

  // 카테고리별 아이템 필터링
  const filteredItems = useMemo(() => {
    if (!activeCategory) return shopItems;
    return shopItems.filter(item => item.category_id === activeCategory);
  }, [shopItems, activeCategory]);

  const handleImageUpload = async (file: File) => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();

      // 파일 이름 생성
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // 스토리지에 업로드
      const { error: uploadError } = await supabase.storage
        .from('profile-icons')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 업로드된 파일의 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profile-icons')
        .getPublicUrl(fileName);

      setSelectedImage({ url: publicUrl, name: file.name });
      alert('이미지가 성공적으로 업로드되었습니다.');
      
      // 페이지 새로고침 (로그인 검증 없이)
      window.location.href = window.location.href;

    } catch (error: unknown) {
      console.error('이미지 업로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert('이미지 업로드 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      alert('이미지를 선택해주세요.');
      return;
    }

    if (!name.trim()) {
      alert('아이콘 이름을 입력해주세요.');
      return;
    }

    if (!selectedCategory) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    // 선택된 카테고리의 가격 가져오기
    const categoryPrice = categories.find(c => c.id === selectedCategory)?.price || 0;

    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();

      const newItem = {
        name,
        description: description || `${name} 아이콘입니다.`,
        image_url: selectedImage.url,
        price: categoryPrice,
        is_default: false,
        is_active: true,
        category_id: selectedCategory,
      };

      const { data, error } = await supabase
        .from('shop_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      // 로컬 상태 업데이트
      setShopItems(prev => [
        ...prev,
        {
          ...data,
          description: data.description ?? '',
          created_at: data.created_at ?? '',
          is_active: data.is_active ?? true,
          is_default: data.is_default ?? false,
          category_id: data.category_id ?? 0,
        }
      ]);

      alert('아이콘이 등록되었습니다.');
      
      // 폼 초기화
      setSelectedImage(null);
      setName('');
      setDescription('');
      setSelectedCategory(null);

    } catch (error) {
      console.error('아이콘 등록 오류:', error);
      alert('아이콘 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 수정 모달 토글
  const handleEditClick = (item: ShopItem) => {
    setEditingItem(item);
    setName(item.name);
    setSelectedImage({ url: item.image_url, name: item.name });
    setSelectedCategory(item.category_id || null);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setSelectedImage(null);
    setSelectedCategory(null);
  };

  // 아이템 수정
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();

      const updates = {
        name,
        description: description || `${name} 아이콘입니다.`,
        image_url: selectedImage?.url || editingItem.image_url,
        price: editingItem.price,
        category_id: selectedCategory || editingItem.category_id || 0,
      };

      const { error } = await supabase
        .from('shop_items')
        .update(updates)
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) throw error;

      // 로컬 상태 업데이트
      setShopItems(prev => 
        prev.map(item => 
          item.id === editingItem.id ? { ...item, ...updates } : item
        )
      );

      alert('아이콘이 수정되었습니다.');
      handleCancelEdit();

    } catch (error) {
      console.error('아이콘 수정 오류:', error);
      alert('아이콘 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 아이콘 삭제 함수
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('정말 이 아이콘을 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();

      const { error } = await supabase
        .from('shop_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setShopItems(prev => prev.filter(item => item.id !== itemId));

      alert('아이콘이 삭제되었습니다.');

    } catch (error) {
      console.error('아이콘 삭제 오류:', error);
      alert('아이콘 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 탭 데이터 생성
  const categoryTabs: TabItem[] = [
    { id: 'all', label: '전체' },
    ...hierarchicalCategories.map(category => ({
      id: category.id.toString(),
      label: category.name
    }))
  ];

  // 탭 변경 핸들러
  const handleCategoryChange = (tabId: string) => {
    if (tabId === 'all') {
      setActiveCategory(null);
    } else {
      setActiveCategory(parseInt(tabId));
    }
  };

  // 현재 활성 탭 ID 결정
  const activeCategoryTab = activeCategory ? activeCategory.toString() : 'all';

  return (
    <div className="space-y-6">
      {/* 아이템 추가 폼 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">새 아이콘 추가</h2>
        <form onSubmit={editingItem ? handleUpdateItem : handleSubmit} className="space-y-4">
          {/* 이미지 소스 선택 */}
          <div className="flex space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="teams"
                checked={imageSource === 'teams'}
                onChange={() => {
                  setImageSource('teams');
                  setSelectedImage(null);
                }}
                className="mr-2"
              />
              팀 로고
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="leagues"
                checked={imageSource === 'leagues'}
                onChange={() => {
                  setImageSource('leagues');
                  setSelectedImage(null);
                }}
                className="mr-2"
              />
              리그 로고
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="storage"
                checked={imageSource === 'storage'}
                onChange={() => {
                  setImageSource('storage');
                  setSelectedImage(null);
                }}
                className="mr-2"
              />
              저장된 이미지
            </label>
          </div>

          {/* 팀 로고 선택 */}
          {imageSource === 'teams' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {teams.filter(team => team.logo).map((team) => (
                <div
                  key={team.id}
                  className={`relative cursor-pointer border rounded-lg p-2 hover:border-blue-500 transition-colors
                    ${selectedImage?.url === team.logo ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => team.logo && setSelectedImage({ url: team.logo, name: team.name })}
                >
                  <div className="aspect-square relative mb-2">
                    <Image
                      src={team.logo!}
                      alt={team.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <p className="text-xs text-center truncate">{team.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* 리그 로고 선택 */}
          {imageSource === 'leagues' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {leagues.filter(league => league.logo).map((league) => (
                <div
                  key={league.id}
                  className={`relative cursor-pointer border rounded-lg p-2 hover:border-blue-500 transition-colors
                    ${selectedImage?.url === league.logo ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => league.logo && setSelectedImage({ url: league.logo, name: league.name })}
                >
                  <div className="aspect-square relative mb-2">
                    <Image
                      src={league.logo!}
                      alt={league.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <p className="text-xs text-center truncate">{league.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* 스토리지 이미지 선택 */}
          {imageSource === 'storage' && (
            <div className="space-y-4">
              {/* 새 이미지 업로드 */}
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? '업로드 중...' : '새 이미지 업로드'}
                </Button>
              </div>

              {/* 저장된 이미지 목록 */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">저장된 이미지 목록</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {storageImages.map((image) => (
                    <div
                      key={image.name}
                      className={`relative cursor-pointer border rounded-lg p-2 hover:border-blue-500 transition-colors
                        ${selectedImage?.url === image.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="aspect-square relative mb-2">
                        <Image
                          src={image.url}
                          alt={image.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <p className="text-xs text-center truncate">{image.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">카테고리</label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">카테고리 선택</option>
                {renderCategoryOptions(hierarchicalCategories)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">아이콘 이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="아이콘 이름 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">가격 (포인트)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                placeholder="가격 입력"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="아이콘 설명 입력"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading}
            >
              {loading ? '처리 중...' : (editingItem ? '수정하기' : '등록하기')}
            </Button>
            {editingItem && (
              <Button 
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* 아이템 목록 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">등록된 아이콘 목록</h2>
        
        {/* 카테고리 탭 */}
        <TabList
          tabs={categoryTabs}
          activeTab={activeCategoryTab}
          onTabChange={handleCategoryChange}
          variant="minimal"
        />

        {/* 필터링된 아이템 목록 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-2 group relative">
              <div className="aspect-square relative mb-2">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* 액션 버튼들 */}
                <div className="absolute top-0 right-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-1 bg-blue-500 text-white rounded-bl-lg"
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 bg-red-500 text-white"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-center font-medium truncate">{item.name}</p>
              <p className="text-xs text-center text-gray-500">{item.price} 포인트</p>
              <p className="text-xs text-center text-gray-400">
                {categories.find(c => c.id === item.category_id)?.name || '미분류'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 