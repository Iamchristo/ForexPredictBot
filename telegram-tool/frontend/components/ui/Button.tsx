"use client";

import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const variantClasses = {
    primary: "bg-accent hover:bg-blue-600 text-white",
    secondary: "bg-surface border border-border hover:bg-[#1a2030] text-gray-200",
    danger: "bg-danger hover:bg-red-600 text-white",
  };

  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
