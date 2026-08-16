import type { ReactElement, ReactNode } from "react"
import { RiAddLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

export function FloatingActionButton({
  renderDialog,
}: {
  renderDialog: (trigger: ReactElement) => ReactNode
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1.75rem)] z-40 overflow-x-clip px-1.5">
      <div className="mx-auto flex w-full max-w-[480px] justify-center">
        {renderDialog(
          <Button
            aria-label="Add transaction"
            className="pointer-events-auto size-14 rounded-full bg-primary text-primary-foreground shadow-[0_0_0_6px_var(--background),0_10px_22px_rgba(15,23,42,0.16)] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-[7px] focus-visible:outline-ring active:scale-95 [&_svg]:size-5"
            size="icon"
          >
            <RiAddLine aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  )
}
