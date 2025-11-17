import * as React from "react"
import { cn } from "@/shared/utils/cn"

/**
 * Container - 재사용 가능한 컨테이너 컴포넌트
 *
 * 라이트모드: #FFFFFF 배경, 아주 연한 테두리 (5% 불투명도)
 * 다크모드: #1D1D1D 배경, 아주 연한 테두리 (5% 불투명도)
 */
const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border border-black/7 dark:border-0",
      "md:rounded-lg overflow-hidden",
      className
    )}
    {...props}
  />
))
Container.displayName = "Container"

/**
 * ContainerHeader - 컨테이너 헤더
 *
 * 라이트모드: #F5F5F5 배경
 * 다크모드: #262626 배경
 * 높이: 48px (균일)
 *
 * 주의: 헤더 자체는 호버 효과 없음. 내부 클릭 가능한 요소에만 호버 적용
 */
const ContainerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-[#F5F5F5] dark:bg-[#262626]",
      "h-12 px-4 flex items-center",
      "md:rounded-t-lg",
      className
    )}
    {...props}
  />
))
ContainerHeader.displayName = "ContainerHeader"

/**
 * ContainerTitle - 컨테이너 제목
 */
const ContainerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-sm font-bold",
      "text-gray-900 dark:text-[#F0F0F0]",
      className
    )}
    {...props}
  />
))
ContainerTitle.displayName = "ContainerTitle"

/**
 * ContainerContent - 컨테이너 내용
 */
const ContainerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-4 py-3 bg-white dark:bg-[#1D1D1D]", className)}
    {...props}
  />
))
ContainerContent.displayName = "ContainerContent"

/**
 * ContainerFooter - 컨테이너 푸터
 */
const ContainerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-4 py-3",
      "bg-[#F5F5F5] dark:bg-[#262626]",
      className
    )}
    {...props}
  />
))
ContainerFooter.displayName = "ContainerFooter"

export {
  Container,
  ContainerHeader,
  ContainerTitle,
  ContainerContent,
  ContainerFooter
}
