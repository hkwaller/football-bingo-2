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
        // unchecked track: recessed surface, brightens on hover
        "data-[unchecked]:bg-pitch-lighter data-[unchecked]:hover:bg-line-strong data-[unchecked]:active:bg-line-strong",
        // checked track: turf accent
        "data-[checked]:bg-turf data-[checked]:shadow-glow-turf data-[checked]:hover:brightness-105 data-[checked]:active:brightness-95",
        // focus ring
        "focus-visible:ring-2 focus-visible:ring-turf/60 focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-dark",
        // disabled
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
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
          "data-[unchecked]:translate-x-0",
          "data-[unchecked]:bg-chalk-dim data-[unchecked]:hover:bg-chalk",
          // checked position + colour
          "data-[checked]:translate-x-[calc(100%-2px)]",
          "data-[checked]:bg-[#06120b]",
          // subtle scale on press
          "group-active/switch:scale-90",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
