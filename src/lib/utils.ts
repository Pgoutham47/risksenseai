import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Band } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBandClass(band: Band): string {
  return `band-${band.toLowerCase()}`;
}

export function getBorderBandClass(band: Band): string {
  return `border-band-${band.toLowerCase()}`;
}

export function formatCurrency(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

export function getBandColor(band: Band): string {
  const colors: Record<Band, string> = {
    CLEAR: 'hsl(152, 60%, 36%)',
    CAUTION: 'hsl(38, 92%, 50%)',
    WARNING: 'hsl(25, 95%, 53%)',
    RESTRICTED: 'hsl(0, 72%, 51%)',
    BLOCKED: 'hsl(0, 62%, 38%)',
  };
  return colors[band];
}
