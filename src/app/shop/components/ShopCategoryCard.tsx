import Link from 'next/link';
import Image from 'next/image';

interface ShopCategory {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface ShopCategoryCardProps {
  category: ShopCategory;
}

export default function ShopCategoryCard({ category }: ShopCategoryCardProps) {
  return (
    <Link 
      href={`/shop/${category.slug}`}
      className="block group"
    >
      <div className="border rounded-lg overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        <div className="h-48 bg-gray-100 relative">
          {category.image_url ? (
            <Image 
              src={category.image_url} 
              alt={category.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <span className="text-gray-400">이미지 준비 중</span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h2 className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
            {category.name}
          </h2>
          <p className="text-gray-600 mt-2">{category.description || `${category.name} 아이템을 구매해보세요.`}</p>
          <div className="mt-4 text-right">
            <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md group-hover:bg-blue-700 transition-colors">
              구경하기
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 