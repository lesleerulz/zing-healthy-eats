/* ──────────────────────────────────────────────────────
   Central API client for the Zing Healthy Eats API.
   Handles JWT token attachment and base URL configuration.
   ────────────────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Get the static image URL from the Flask backend.
 */
export function staticUrl(path: string): string {
  return `${API_BASE}/static/${path}`;
}

/**
 * Get a product image URL.
 */
export function productImageUrl(filename: string): string {
  return staticUrl(`images/products/${filename}`);
}

/**
 * Get a carousel image URL.
 */
export function carouselImageUrl(filename: string): string {
  return staticUrl(`images/carousel/${filename}`);
}

/**
 * Get a profile picture URL.
 */
export function profileImageUrl(filename: string): string {
  return staticUrl(`images/profile_pictures/${filename}`);
}

/**
 * Get a team member image URL.
 */
export function teamImageUrl(filename: string): string {
  return staticUrl(`images/about/team/${filename}`);
}

/**
 * Get the about hero image URL.
 */
export function aboutHeroUrl(filename: string): string {
  return staticUrl(`images/about/${filename}`);
}

/**
 * Get the stored JWT token.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("zing_token");
}

/**
 * Store the JWT token.
 */
export function setToken(token: string): void {
  localStorage.setItem("zing_token", token);
}

/**
 * Remove the stored JWT token.
 */
export function removeToken(): void {
  localStorage.removeItem("zing_token");
}

/**
 * Core fetch wrapper that auto-attaches JWT token and handles errors.
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `Request failed (${response.status})`
    );
  }

  return response.json();
}

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
