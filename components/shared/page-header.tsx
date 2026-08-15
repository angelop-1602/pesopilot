import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-normal">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-xs/relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  )
}
