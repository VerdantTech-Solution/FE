import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

// Simple context to share collapsed state with all sidebar subcomponents
const SidebarContext = React.createContext<{ collapsed: boolean }>({ collapsed: false })

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean
}

export function Sidebar({ className, children, collapsed = false, ...props }: SidebarProps) {
  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div
        className={cn(
          "flex h-full flex-col bg-white border-r border-gray-200 transition-[width] duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeader({ className, children, ...props }: SidebarHeaderProps) {
  const { collapsed } = React.useContext(SidebarContext)
  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center transition-all duration-300",
        collapsed ? "justify-center px-2" : "px-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarHeaderTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeaderTitle({ className, children, ...props }: SidebarHeaderTitleProps) {
  const { collapsed } = React.useContext(SidebarContext)
  return (
    <div
      className={cn("flex items-center gap-3", collapsed && "gap-0", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarHeaderTitleTextProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeaderTitleText({ className, children, ...props }: SidebarHeaderTitleTextProps) {
  const { collapsed } = React.useContext(SidebarContext)
  return (
    <div
      className={cn("flex flex-col transition-opacity duration-200", collapsed && "opacity-0 pointer-events-none w-0", className)}
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
  const { collapsed } = React.useContext(SidebarContext)
  return (
    <nav
      className={cn(
        "flex flex-1 flex-col gap-2 transition-all duration-300",
        collapsed ? "px-2" : "px-6",
        className
      )}
      {...props}
    >
      {children}
    </nav>
  )
}

interface SidebarNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: React.ReactNode
  collapsed?: boolean
}

export function SidebarNavItem({ 
  className, 
  children, 
  active = false, 
  icon, 
  collapsed = false,
  ...props 
}: SidebarNavItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 px-4 py-3 text-left transition-all duration-200 rounded-lg",
        active
          ? "bg-green-100 text-green-700 shadow-[inset_0_0_0_1px_rgba(74,222,128,0.5)]"
          : "text-gray-600 hover:bg-gray-100",
        className
      )}
      title={collapsed ? String(children) : undefined}
      {...props}
    >
      {icon && <span className="flex h-5 w-5 items-center justify-center">{icon}</span>}
      <span className={cn("font-medium", collapsed && "hidden")}>{children}</span>
    </Button>
  )
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarFooter({ className, children, ...props }: SidebarFooterProps) {
  const { collapsed } = React.useContext(SidebarContext)
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 py-4 transition-all duration-300",
        collapsed ? "justify-center px-2" : "px-6",
        className
      )}
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
  const { collapsed } = React.useContext(SidebarContext)
  return (
    <h2
      className={cn(
        "px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-200",
        collapsed && "opacity-0 pointer-events-none w-0",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}
