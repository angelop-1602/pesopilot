import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  description?: string
  icon?: ReactNode
  tone?: "default" | "good" | "warn" | "danger"
  className?: string
}

export function StatCard({
  label,
  value,
  description,
  icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{label}</span>
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div
          className={cn(
            "font-mono text-xl font-semibold tracking-normal",
            tone === "good" && "text-primary",
            tone === "warn" && "text-muted-foreground",
            tone === "danger" && "text-destructive"
          )}
        >
          {value}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardContent>
    </Card>
  )
}
