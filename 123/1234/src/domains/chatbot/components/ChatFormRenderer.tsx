'use client';

import { useState } from 'react';
import { FormConfig, FormField } from '../types';
import { cn } from '@/shared/utils/cn';
import { Check, Send, X } from 'lucide-react';

interface ChatFormRendererProps {
  formConfig: FormConfig;
  onSubmit: (formData: Record<string, any>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  messageSubmitted?: boolean; // 메시지 레벨의 제출 상태
}

export function ChatFormRenderer({ 
  formConfig, 
  onSubmit, 
  onCancel,
  isSubmitting = false,
  isSubmitted = false,
  messageSubmitted = false 
}: ChatFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocalSubmitted, setIsLocalSubmitted] = useState(false);

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    formConfig.fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name].toString().trim() === '')) {
        newErrors[field.name] = `${field.label}은(는) 필수 입력 항목입니다.`;
      }
      
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = '올바른 이메일 주소를 입력해주세요.';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isSubmitted || isLocalSubmitted) return;
    
    if (validateForm()) {
      setIsLocalSubmitted(true);
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    const isDisabled = isSubmitting || isSubmitted || isLocalSubmitted;
    const commonProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      disabled: isDisabled,
      className: cn(
        'w-full px-3 py-2 border rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        error 
          ? 'border-red-300 bg-red-50' 
          : (isSubmitted || isLocalSubmitted)
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-white hover:border-gray-400',
        isDisabled && 'opacity-75 cursor-not-allowed'
      )
    };

    return (
      <div key={field.name} className="space-y-1">
        <label 
          htmlFor={field.name}
          className={cn(
            'block text-sm font-medium',
            error ? 'text-red-700' : (isSubmitted || isLocalSubmitted) ? 'text-green-700' : 'text-gray-700'
          )}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'select' ? (
          <select
            {...commonProps}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          >
            <option value="">선택해주세요</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            {...commonProps}
            rows={3}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          />
        ) : (
          <input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          />
        )}
        
        {error && (
          <p className="text-sm text-red-600 animate-in fade-in-0 slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  };

  if (isSubmitted || isLocalSubmitted || messageSubmitted) {
    return (
      <div className={cn(
        'p-4 rounded-lg border border-green-200 bg-green-50',
        'animate-in fade-in-0 zoom-in-95 duration-300'
      )}>
        <div className="flex items-center space-x-2 text-green-800 mb-2">
          <Check className="w-5 h-5" />
          <h4 className="font-medium">제출 완료</h4>
        </div>
        <p className="text-sm text-green-700">
          신고가 접수되었습니다. 검토 후 적절한 조치를 취하겠습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border shadow-sm',
      'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
      (isSubmitted || isLocalSubmitted) 
        ? 'border-green-200 bg-green-50' 
        : isSubmitting 
          ? 'border-blue-200 bg-blue-50' 
          : 'border-gray-200 bg-white',
      (isSubmitting || isLocalSubmitted) && 'pointer-events-none'
    )}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formConfig.fields.map(renderField)}
        
        <div className="flex justify-end space-x-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting || isLocalSubmitted}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                'border border-gray-300 text-gray-700 bg-white',
                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                (isSubmitting || isLocalSubmitted) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || isLocalSubmitted}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-blue-600 text-white border border-blue-600',
              'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center space-x-2'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>제출 중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{formConfig.submit_label}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}