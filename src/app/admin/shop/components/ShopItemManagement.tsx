'use client';

import { useState, useMemo } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { createShopItem, updateShopItem, deleteShopItem } from '@/shared/actions/admin-actions';
import {
  ShopItemForm,
  ShopItemGrid,
  buildCategoryHierarchy,
  type StorageImage,
  type ShopCategory,
  type ShopItem,
  type ShopItemManagementProps,
} from '@/domains/admin/components/shop';

export default function ShopItemManagement({
  storageImages,
  shopItems: initialShopItems,
  categories,
}: ShopItemManagementProps) {
  const [shopItems, setShopItems] = useState<ShopItem[]>(initialShopItems);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<StorageImage | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [price, setPrice] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [localStorageImages, setLocalStorageImages] = useState<StorageImage[]>(storageImages);

  const hierarchicalCategories = useMemo(() => buildCategoryHierarchy(categories), [categories]);

  // 카테고리별 아이템 필터링
  const filteredItems = useMemo(() => {
    if (!activeCategory) return shopItems;
    return shopItems.filter((item) => item.category_id === activeCategory);
  }, [shopItems, activeCategory]);

  const handleImageUpload = async (file: File) => {
    try {
      setLoading(true);
      const supabase = getSupabaseBrowser();

      // 파일 이름 생성
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // 스토리지에 업로드
      const { error: uploadError } = await supabase.storage.from('profile-icons').upload(fileName, file);

      if (uploadError) throw uploadError;

      // 업로드된 파일의 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-icons').getPublicUrl(fileName);

      // 새 이미지를 로컬 상태에 추가
      const newImage = { url: publicUrl, name: file.name };
      setLocalStorageImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage);
      alert('이미지가 성공적으로 업로드되었습니다.');
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

    // 선택된 카테고리의 가격 가져오기 (또는 직접 입력한 가격)
    const itemPrice = price
      ? parseInt(price, 10)
      : (categories.find((c) => c.id === selectedCategory)?.price || 0);

    try {
      setLoading(true);

      const result = await createShopItem({
        name,
        description: description || undefined,
        image_url: selectedImage.url,
        price: itemPrice,
        category_id: selectedCategory,
      });

      if (!result.success) {
        throw new Error(result.error || '아이콘 등록에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      if (result.item) {
        setShopItems((prev) => [
          {
            ...result.item,
            description: result.item.description ?? '',
            created_at: result.item.created_at ?? '',
            is_active: result.item.is_active ?? true,
            is_default: result.item.is_default ?? false,
            category_id: result.item.category_id ?? 0,
          },
          ...prev,
        ]);
      }

      alert('아이콘이 등록되었습니다.');

      // 폼 초기화
      setSelectedImage(null);
      setName('');
      setDescription('');
      setSelectedCategory(null);
      setPrice('');
    } catch (error) {
      console.error('아이콘 등록 오류:', error);
      alert(error instanceof Error ? error.message : '아이콘 등록 중 오류가 발생했습니다.');
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

      const updates = {
        name,
        description: description || `${name} 아이콘입니다.`,
        image_url: selectedImage?.url || editingItem.image_url,
        price: price ? parseInt(price, 10) : editingItem.price,
        category_id: selectedCategory || editingItem.category_id || 0,
      };

      const result = await updateShopItem(editingItem.id, updates);

      if (!result.success) {
        throw new Error(result.error || '아이콘 수정에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setShopItems((prev) => prev.map((item) => (item.id === editingItem.id ? { ...item, ...updates } : item)));

      alert('아이콘이 수정되었습니다.');
      handleCancelEdit();
    } catch (error) {
      console.error('아이콘 수정 오류:', error);
      alert(error instanceof Error ? error.message : '아이콘 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 아이콘 삭제 함수
  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('정말 이 아이콘을 삭제하시겠습니까?')) return;

    try {
      setLoading(true);

      const result = await deleteShopItem(itemId);

      if (!result.success) {
        throw new Error(result.error || '아이콘 삭제에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setShopItems((prev) => prev.filter((item) => item.id !== itemId));

      alert('아이콘이 삭제되었습니다.');
    } catch (error) {
      console.error('아이콘 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '아이콘 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 아이템 추가/수정 폼 */}
      <ShopItemForm
        editingItem={editingItem}
        storageImages={localStorageImages}
        selectedImage={selectedImage}
        hierarchicalCategories={hierarchicalCategories}
        name={name}
        description={description}
        price={price}
        selectedCategory={selectedCategory}
        isLoading={loading}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onPriceChange={setPrice}
        onCategoryChange={setSelectedCategory}
        onSelectImage={setSelectedImage}
        onUploadImage={handleImageUpload}
        onSubmit={editingItem ? handleUpdateItem : handleSubmit}
        onCancelEdit={handleCancelEdit}
      />

      {/* 아이템 목록 */}
      <ShopItemGrid
        items={filteredItems}
        hierarchicalCategories={hierarchicalCategories}
        activeCategory={activeCategory}
        isLoading={loading}
        onCategoryChange={setActiveCategory}
        onEditItem={handleEditClick}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
}
