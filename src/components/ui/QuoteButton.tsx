"use client";

import Button from "@/components/ui/Button";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface QuoteButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

export default function QuoteButton({
  variant = "primary",
  size = "md",
  className,
  children,
}: QuoteButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("open-quote-popup"))}
    >
      {children}
    </Button>
  );
}
