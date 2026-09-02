export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any } | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const list: string[] = [];
  for (const item of inputs) {
    if (!item) continue;
    if (typeof item === "string") {
      list.push(item);
    } else if (Array.isArray(item)) {
      list.push(cn(...item));
    } else if (typeof item === "object") {
      for (const [key, val] of Object.entries(item)) {
        if (val) list.push(key);
      }
    }
  }
  return list.filter(Boolean).join(" ");
}

export default cn;
