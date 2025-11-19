import * as React from "react"
import { cn } from "@/shared/utils/cn"

/**
 * Tabs - 탭 컨테이너
 *
 * 탭 버튼들을 감싸는 컨테이너
 */
const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
))
Tabs.displayName = "Tabs"

/**
 * TabButton - 탭 버튼
 *
 * 활성/비활성 상태에 따라 스타일이 자동으로 적용됩니다.
 *
 * variant 종류:
 * - underline: 하단 테두리로 활성 표시 (여백 있음)
 * - default: 배경색으로 활성 표시 (여백 있음, rounded)
 * - fill: 공간을 꽉 채우는 탭 (여백 없음, flex-1)
 */
interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  variant?: 'default' | 'underline' | 'fill'
}

const TabButton = React.forwardRef<
  HTMLButtonElement,
  TabButtonProps
>(({ className, active = false, variant = 'default', ...props }, ref) => {
  const underlineClasses = cn(
    "text-sm flex-shrink-0",
    active
      ? "text-gray-900 dark:text-[#F0F0F0] border-b-2 border-gray-900 dark:border-[#F0F0F0] pb-1"
      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] pb-1"
  );

  const fillClasses = cn(
    "flex-1 text-xs py-2 px-1",
    active
      ? "bg-white dark:bg-[#1D1D1D] border-b-2 border-slate-800 dark:border-white text-gray-900 dark:text-[#F0F0F0]"
      : "bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]"
  );

  const defaultClasses = cn(
    "text-sm flex-shrink-0",
    active
      ? "bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] px-3 py-1.5 rounded"
      : "bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-3 py-1.5 rounded"
  );

  return (
    <button
      ref={ref}
      className={cn(
        "font-medium transition-colors whitespace-nowrap",
        variant === 'underline' ? underlineClasses : variant === 'fill' ? fillClasses : defaultClasses,
        className
      )}
      {...props}
    />
  );
})
TabButton.displayName = "TabButton"

export {
  Tabs,
  TabButton
}
