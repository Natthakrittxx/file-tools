"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TargetSizeInputProps {
  value: number;
  unit: "KB" | "MB";
  originalSizeBytes: number;
  minBytes: number;
  onValueChange: (bytes: number) => void;
  onUnitChange: (unit: "KB" | "MB") => void;
  onNumericChange: (num: number) => void;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TargetSizeInput({
  value,
  unit,
  originalSizeBytes,
  minBytes,
  onValueChange,
  onUnitChange,
  onNumericChange,
  disabled,
}: TargetSizeInputProps) {
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    if (isNaN(num) || num <= 0) {
      onNumericChange(0);
      return;
    }
    onNumericChange(num);
    const bytes = unit === "KB" ? Math.round(num * 1024) : Math.round(num * 1024 * 1024);
    onValueChange(bytes);
  };

  const handleUnitChange = (newUnit: "KB" | "MB") => {
    onUnitChange(newUnit);
    const bytes = newUnit === "KB" ? Math.round(value * 1024) : Math.round(value * 1024 * 1024);
    onValueChange(bytes);
  };

  const targetBytes = unit === "KB" ? Math.round(value * 1024) : Math.round(value * 1024 * 1024);
  const isTooSmall = value > 0 && targetBytes < minBytes;
  const isTooLarge = value > 0 && targetBytes >= originalSizeBytes;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Target File Size</label>
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          step="any"
          value={value || ""}
          onChange={handleNumericChange}
          placeholder="Enter target size"
          disabled={disabled}
          className="flex-1"
        />
        <Select value={unit} onValueChange={handleUnitChange} disabled={disabled}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="KB">KB</SelectItem>
            <SelectItem value="MB">MB</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Original size: {formatBytes(originalSizeBytes)} — Min: {formatBytes(minBytes)}
      </p>
      {isTooSmall && (
        <p className="text-xs text-destructive">
          Target size must be at least {formatBytes(minBytes)}
        </p>
      )}
      {isTooLarge && (
        <p className="text-xs text-destructive">
          Target size must be smaller than the original ({formatBytes(originalSizeBytes)})
        </p>
      )}
    </div>
  );
}
