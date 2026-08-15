import { Skeleton } from "@/components/ui/skeleton"

interface PageLoadingProps {
  label: string
  sections?: number
}

export function PageLoading({ label, sections = 3 }: PageLoadingProps) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="flex flex-col gap-5"
    >
      <Skeleton className="h-16 rounded-[1.5rem]" />
      {Array.from({ length: sections }, (_, index) => (
        <Skeleton
          className="h-36 rounded-[1.7rem]"
          key={`${label}-${index}`}
        />
      ))}
    </div>
  )
}
