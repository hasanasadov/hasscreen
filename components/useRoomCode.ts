"use client";
export function generateRoomCode(): string {
  const arr = new Uint32Array(8);
  crypto.getRandomValues(arr);
  const digits = Array.from(arr).map((n) => (n % 10).toString());
  if (digits[0] === "0") digits[0] = String((arr[0] % 9) + 1);
  return digits.join("");
}


