import * as React from "react";
import { cn } from "@/lib/utils";

interface CustomAvatarProps {
  src: string;
  alt: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, alt, fallback, size = "md", className }: CustomAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  
  // Determine size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full border border-gray-200",
      sizeClasses[size],
      className
    )}>
      {!imageError ? (
        <img 
          src={src} 
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium uppercase">
          {fallback}
        </div>
      )}
    </div>
  );
}
