"use client";

import { useState } from "react";

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  size?: "md" | "lg";
}

export default function StarRating({ value = 0, onChange, size = "lg" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "lg" ? "text-4xl" : "text-2xl";

  return (
    <div className="flex gap-2" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            className={[
              sizeClass,
              "transition-transform hover:scale-110 focus:outline-none",
              filled ? "text-warning" : "text-gray-300",
            ].join(" ")}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
