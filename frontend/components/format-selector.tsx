"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FileFormat } from "@/types";

interface FormatSelectorProps {
  targets: FileFormat[];
  value: FileFormat | null;
  onChange: (format: FileFormat) => void;
  disabled?: boolean;
}

export function FormatSelector({
  targets,
  value,
  onChange,
  disabled,
}: FormatSelectorProps) {
  if (targets.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select a file first" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={value || undefined}
      onValueChange={(v) => onChange(v as FileFormat)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select target format" />
      </SelectTrigger>
      <SelectContent>
        {targets.map((format) => (
          <SelectItem key={format} value={format}>
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
