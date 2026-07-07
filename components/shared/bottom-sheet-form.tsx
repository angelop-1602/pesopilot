"use client"

import type { ReactElement, ReactNode } from "react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface BottomSheetFormProps {
  children: ReactNode
  description?: ReactNode
  open: boolean
  title: ReactNode
  trigger?: ReactElement
  className?: string
  onOpenChange: (open: boolean) => void
}

export function BottomSheetForm({
  children,
  description,
  open,
  title,
  trigger,
  className,
  onOpenChange,
}: BottomSheetFormProps) {
  return (
    <Drawer
      open={open}
      showSwipeHandle
      swipeDirection="down"
      onOpenChange={onOpenChange}
    >
      {trigger && <DrawerTrigger render={trigger} />}
      <DrawerContent
        className={cn(
          "mx-auto w-[min(calc(100vw-1rem),30rem)] rounded-t-[2rem] border-white/80 bg-background shadow-[0_-24px_80px_rgba(15,23,42,0.18)]",
          className
        )}
      >
        <DrawerHeader className="items-start px-5 pb-2 pt-3 text-left">
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description && (
            <DrawerDescription className="max-w-sm text-left text-xs">
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
