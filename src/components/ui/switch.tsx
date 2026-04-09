"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent outline-none transition-all duration-150",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        // size
        "data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8",
        // unchecked track: subtle white/10, brightens on hover
        "data-unchecked:bg-white/10 data-unchecked:hover:bg-white/20 data-unchecked:active:bg-white/25",
        // checked track: lime accent
        "data-checked:bg-[var(--fb-accent-lime)] data-checked:hover:brightness-110 data-checked:active:brightness-95",
        // focus ring
        "focus-visible:ring-2 focus-visible:ring-[var(--fb-accent-lime)]/60 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
        // disabled
        "data-disabled:cursor-not-allowed data-disabled:opacity-40",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full transition-all duration-150",
          // size
          "group-data-[size=default]/switch:size-[18px] group-data-[size=sm]/switch:size-3.5",
          // unchecked position + colour
          "group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0",
          "data-unchecked:bg-white/50 group-data-[size=default]/switch:data-unchecked:hover:bg-white/70",
          // checked position + colour
          "group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)]",
          "data-checked:bg-black/80",
          // subtle scale on press
          "group-active/switch:scale-90",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
