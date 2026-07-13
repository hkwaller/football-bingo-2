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
        // unchecked track
        "data-[unchecked]:bg-line-strong data-[unchecked]:hover:brightness-105",
        // checked track: green
        "data-[checked]:bg-green data-[checked]:hover:brightness-110 data-[checked]:active:brightness-95",
        // focus ring
        "focus-visible:ring-2 focus-visible:ring-red/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
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
          "data-[unchecked]:bg-cream data-[unchecked]:hover:bg-white",
          // checked position + colour
          "data-[checked]:translate-x-[calc(100%-2px)]",
          "data-[checked]:bg-cream",
          // subtle scale on press
          "group-active/switch:scale-90",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
