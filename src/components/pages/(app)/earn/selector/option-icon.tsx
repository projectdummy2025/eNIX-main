"use client";

import Image from "next/image";
import { useState } from "react";

export type SelectorOption = {
  key: string;
  label: string;
  hint?: string;
  iconUrl?: string;
};

export type SelectorProps = {
  label: string;
  value: string;
  options: SelectorOption[];
  onSelect: (key: string) => void;
  variant?: "chip" | "pill";
  emptyLabel?: string;
  loading?: boolean;
  locked?: boolean;
};

export function OptionIcon({
  option,
  size,
}: {
  option: SelectorOption;
  size: number;
}) {
  const [error, setError] = useState(false);

  if (option.iconUrl && !error) {
    return (
      <span
        className="relative overflow-hidden rounded-full bg-surface-muted"
        style={{ width: size, height: size }}
      >
        <Image
          src={option.iconUrl}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-contain"
          unoptimized
          onError={() => setError(true)}
        />
      </span>
    );
  }

  return (
    <span
      className="animate-pulse rounded-full bg-surface-muted"
      style={{ width: size, height: size }}
    />
  );
}
