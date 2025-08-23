import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  return (
    <div
      className={cn("flex h-full w-64 flex-col bg-white border-r border-gray-200", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeader({ className, children, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn("flex h-16 shrink-0 items-center px-6", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarHeaderTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeaderTitle({ className, children, ...props }: SidebarHeaderTitleProps) {
  return (
    <div
      className={cn("flex items-center gap-3", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarHeaderTitleTextProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeaderTitleText({ className, children, ...props }: SidebarHeaderTitleTextProps) {
  return (
    <div
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarHeaderTitleMainProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function SidebarHeaderTitleMain({ className, children, ...props }: SidebarHeaderTitleMainProps) {
  return (
    <h1
      className={cn("text-xl font-bold text-gray-900", className)}
      {...props}
    >
      {children}
    </h1>
  )
}

interface SidebarHeaderTitleSubProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function SidebarHeaderTitleSub({ className, children, ...props }: SidebarHeaderTitleSubProps) {
  return (
    <p
      className={cn("text-sm text-gray-500", className)}
      {...props}
    >
      {children}
    </p>
  )
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {}

export function SidebarNav({ className, children, ...props }: SidebarNavProps) {
  return (
    <nav
      className={cn("flex flex-1 flex-col gap-2 px-6", className)}
      {...props}
    >
      {children}
    </nav>
  )
}

interface SidebarNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: React.ReactNode
}

export function SidebarNavItem({ 
  className, 
  children, 
  active = false, 
  icon, 
  ...props 
}: SidebarNavItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 px-4 py-3 text-left transition-colors",
        active 
          ? "bg-green-100 text-green-700 border border-green-200" 
          : "text-gray-600 hover:bg-gray-100",
        className
      )}
      {...props}
    >
      {icon && <span className="flex h-5 w-5 items-center justify-center">{icon}</span>}
      <span className="font-medium">{children}</span>
    </Button>
  )
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarFooter({ className, children, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn("flex shrink-0 items-center gap-2 px-6 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarSection({ className, children, ...props }: SidebarSectionProps) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarSectionTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function SidebarSectionTitle({ className, children, ...props }: SidebarSectionTitleProps) {
  return (
    <h2
      className={cn("px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider", className)}
      {...props}
    >
      {children}
    </h2>
  )
}
