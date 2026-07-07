"use client"

import { useMemo, useState } from "react"
import { RiArrowDownSLine, RiSearchLine } from "@remixicon/react"

import { InstitutionLogo } from "@/components/accounts/institution-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  getInstitution,
  institutions,
  type InstitutionKey,
} from "@/lib/constants/institutions"
import { cn } from "@/lib/utils"

interface InstitutionComboboxProps {
  id?: string
  value?: InstitutionKey | string
  onValueChange: (value: InstitutionKey) => void
}

export function InstitutionCombobox({
  id,
  value,
  onValueChange,
}: InstitutionComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selected = getInstitution(value)
  const filteredInstitutions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return institutions
    }

    return institutions.filter((institution) =>
      [
        institution.name,
        institution.shortName,
        institution.logoText,
      ]
        .filter(Boolean)
        .some((item) => item!.toLowerCase().includes(normalizedQuery))
    )
  }, [query])

  const selectInstitution = (institutionKey: InstitutionKey) => {
    onValueChange(institutionKey)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-expanded={open}
            className="h-12 w-full justify-between rounded-[1.1rem] border-input bg-input/20 px-3 text-left shadow-none"
            id={id}
            role="combobox"
            variant="outline"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <InstitutionLogo
            color={selected.color}
            institutionKey={selected.key}
            logoAsset={selected.logoAsset}
            logoText={selected.logoText}
            size="sm"
            textColor={selected.textColor}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {selected.shortName ?? selected.name}
            </span>
          </span>
        </span>
        <RiArrowDownSLine data-icon="inline-end" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(calc(100vw-2rem),28rem)] gap-2 rounded-[1.25rem] p-2"
      >
        <div className="relative">
          <RiSearchLine
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="h-10 rounded-full pl-9"
            placeholder="Search institutions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="max-h-72 overflow-y-auto pr-1" role="listbox">
          {filteredInstitutions.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No institutions found.
            </p>
          ) : (
            filteredInstitutions.map((institution) => {
              const active = institution.key === selected.key

              return (
                <button
                  aria-selected={active}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted",
                    active && "bg-primary/10"
                  )}
                  key={institution.key}
                  role="option"
                  type="button"
                  onClick={() => selectInstitution(institution.key)}
                >
                  <InstitutionLogo
                    color={institution.color}
                    institutionKey={institution.key}
                    logoAsset={institution.logoAsset}
                    logoText={institution.logoText}
                    size="sm"
                    textColor={institution.textColor}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {institution.name}
                    </span>
                    {institution.shortName &&
                      institution.shortName !== institution.name && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {institution.shortName}
                        </span>
                      )}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
