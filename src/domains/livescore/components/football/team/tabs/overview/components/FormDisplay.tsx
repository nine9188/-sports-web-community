'use client';

interface FormDisplayProps {
  form: string;
  maxLength?: number;
  reverse?: boolean;
}

export default function FormDisplay({ form, maxLength = 5, reverse = false }: FormDisplayProps) {
  // 최대 표시할 경기 수만큼만 잘라서 사용 (기본값 5)
  const displayForm = form.slice(-maxLength);
  
  // 포맷에 따라 split 결과를 처리. reverse=true일 때만 뒤집기 적용
  const formArray = displayForm.split('');
  const formItems = reverse ? formArray.reverse() : formArray;
  
  return (
    <div className="flex gap-1">
      {formItems.map((result: string, index: number) => {
        let bgColor = '';
        let textColor = '';
        
        switch (result) {
          case 'W':
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            break;
          case 'D':
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            break;
          case 'L':
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            break;
          default:
            bgColor = 'bg-gray-200';
            textColor = 'text-gray-700';
        }
        
        return (
          <div
            key={index}
            className={`${bgColor} ${textColor} w-6 h-6 flex items-center justify-center text-xs font-medium rounded`}
            title={result === 'W' ? '승리' : result === 'D' ? '무승부' : '패배'}
          >
            {result}
          </div>
        );
      })}
    </div>
  );
} 