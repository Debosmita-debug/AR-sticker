"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "w-5 h-5",
  md: "w-10 h-10",
  lg: "w-16 h-16",
};

export default function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className={`${sizeMap[size]} rounded-full border-2 border-primary/20 border-t-primary animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeMap[size]} rounded-full bg-primary/10 blur-sm`}
        />
      </div>
      {label && (
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
