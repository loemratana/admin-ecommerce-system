import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

type SpinnerProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function Spinner({ size = "sm", className }: SpinnerProps) {
  return <Loader2 className={cn("animate-spin", sizeClasses[size], className)} aria-hidden="true" />;
}
