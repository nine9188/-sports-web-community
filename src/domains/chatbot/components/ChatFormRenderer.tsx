'use client';

import { useState, useMemo } from 'react';
import { FormConfig, FormField } from '../types';
import { cn } from '@/shared/utils/cn';
import { Check, Send, X } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import { Button, NativeSelect } from '@/shared/components/ui';
import { focusStyles, inputGrayBgStyles } from '@/shared/styles';

interface ChatFormRendererProps {
  formConfig: FormConfig;
  onSubmit: (formData: Record<string, any>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  messageSubmitted?: boolean; // 메시지 레벨의 제출 상태
  initialData?: Record<string, any>; // 저장된 폼 데이터
}

export function ChatFormRenderer({
  formConfig,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isSubmitted = false,
  messageSubmitted = false,
  initialData
}: ChatFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLocalSubmitted, setIsLocalSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isSubmitted || isLocalSubmitted) return;

    if (validateForm()) {
      setIsLocalSubmitted(true);
      setSubmitError(null);

      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
        setSubmitError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        setIsLocalSubmitted(false);
      }
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
        'w-full px-3 py-2 rounded-none',
        inputGrayBgStyles,
        focusStyles,
        error && '!border-red-500 dark:!border-red-400'
      )
    };

    return (
      <div key={field.name} className="space-y-1">
        <label
          htmlFor={field.name}
          className={cn(
            'block text-sm font-medium',
            error ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-[#F0F0F0]'
          )}
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'select' ? (
          <NativeSelect
            value={value || ''}
            onValueChange={(val) => handleInputChange(field.name, val)}
            disabled={isDisabled}
            options={field.options?.map(option => ({ value: option.value, label: option.label })) || []}
            placeholder="선택해주세요"
            triggerClassName={cn(
              'rounded-none',
              error && '!border-red-500 dark:!border-red-400'
            )}
            contentClassName="rounded-none"
          />
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
          <p className="text-sm text-red-600 dark:text-red-400 animate-in fade-in-0 slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  };

  const isCompleted = isSubmitted || isLocalSubmitted || messageSubmitted;

  return (
    <div className={cn(
      'p-4 rounded-none border shadow-sm',
      'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
      isCompleted
        ? 'border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] opacity-60'
        : isSubmitting
          ? 'border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]'
          : 'border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D]',
      isCompleted && 'pointer-events-none'
    )}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formConfig.fields.map(renderField)}

        {/* Submit Error Display */}
        {submitError && (
          <div className="p-3 rounded-none bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 animate-in fade-in-0 slide-in-from-top-1">
            <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          {onCancel && !isCompleted && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isCompleted}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </Button>
          )}

          <Button
            type="submit"
            variant={isCompleted ? 'secondary' : 'primary'}
            disabled={isSubmitting || isCompleted}
          >
            {isSubmitting ? (
              <>
                <Spinner size="xs" />
                <span className="ml-2">제출 중...</span>
              </>
            ) : isCompleted ? (
              <>
                <Check className="w-4 h-4" />
                <span className="ml-2">제출 완료</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="ml-2">{formConfig.submit_label}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}