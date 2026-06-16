export const DEFAULT_DUE_TIME = "23:59";

export function currentDate(): string {
  // 暂保持现状：toISOString().slice(0, 10)
  return new Date().toISOString().slice(0, 10);
}
