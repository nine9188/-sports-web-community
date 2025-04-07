import Image from 'next/image';

interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  is_default: boolean;
  is_active: boolean;
}

interface ItemCardProps {
  item: ShopItem;
  isOwned: boolean;
  canAfford: boolean;
  onPurchase: () => void;
}

export default function ItemCard({ item, isOwned, canAfford, onPurchase }: ItemCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 flex justify-center">
        <div className="w-10 h-10 relative">
          <Image 
            src={item.image_url} 
            alt={item.name}
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      </div>
      
      <div className="p-3 border-t">
        <h3 className="text-sm font-medium">{item.name}</h3>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-xs">
            {item.is_default ? '기본' : `${item.price} P`}
          </span>
          
          {isOwned ? (
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">보유 중</span>
          ) : (
            <button
              onClick={onPurchase}
              className={`px-2 py-0.5 text-xs rounded ${
                !canAfford && !item.is_default
                  ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={!canAfford || item.is_default}
            >
              {item.is_default ? '기본' : !canAfford ? '포인트 부족' : '구매'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 