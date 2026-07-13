import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-sans text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-turf focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-dark active:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-flare aria-invalid:ring-2 aria-invalid:ring-flare/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#52ef8f] to-turf-deep text-[#06120b] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_-8px_rgba(60,233,126,0.55)] hover:-translate-y-px hover:brightness-105 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_26px_-8px_rgba(60,233,126,0.65)] active:brightness-95",
        outline:
          "border-line-strong bg-transparent text-chalk hover:bg-pitch-light aria-expanded:bg-pitch-light",
        secondary:
          "border-line-strong bg-pitch-light text-chalk shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-px hover:bg-pitch-lighter aria-expanded:bg-pitch-lighter",
        ghost:
          "text-chalk-dim hover:bg-pitch-light hover:text-chalk aria-expanded:bg-pitch-light aria-expanded:text-chalk",
        destructive:
          "bg-flare/10 text-flare hover:bg-flare/20 focus-visible:ring-flare/50",
        link: "text-turf underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-5",
        xs: "h-6 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-3.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-7 text-base",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
