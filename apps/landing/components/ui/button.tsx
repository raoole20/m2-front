import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-oklch(0.708 0 0) disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-oklch(0.556 0 0)",
  {
    variants: {
      variant: {
        default:
          "bg-oklch(0.205 0 0) text-oklch(0.985 0 0) shadow hover:bg-oklch(0.205 0 0)/90 dark:bg-oklch(0.922 0 0) dark:text-oklch(0.205 0 0) dark:hover:bg-oklch(0.922 0 0)/90",
        destructive:
          "bg-oklch(0.577 0.245 27.325) text-destructive-foreground shadow-sm hover:bg-oklch(0.577 0.245 27.325)/90 dark:bg-oklch(0.704 0.191 22.216) dark:hover:bg-oklch(0.704 0.191 22.216)/90",
        outline:
          "border border-oklch(0.922 0 0) bg-oklch(1 0 0) shadow-sm hover:bg-oklch(0.97 0 0) hover:text-oklch(0.205 0 0) dark:border-oklch(1 0 0 / 15%) dark:bg-oklch(0.145 0 0) dark:hover:bg-oklch(0.269 0 0) dark:hover:text-oklch(0.985 0 0)",
        secondary:
          "bg-oklch(0.97 0 0) text-oklch(0.205 0 0) shadow-sm hover:bg-oklch(0.97 0 0)/80 dark:bg-oklch(0.269 0 0) dark:text-oklch(0.985 0 0) dark:hover:bg-oklch(0.269 0 0)/80",
        ghost: "hover:bg-oklch(0.97 0 0) hover:text-oklch(0.205 0 0) dark:hover:bg-oklch(0.269 0 0) dark:hover:text-oklch(0.985 0 0)",
        link: "text-oklch(0.205 0 0) underline-offset-4 hover:underline dark:text-oklch(0.922 0 0)",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
