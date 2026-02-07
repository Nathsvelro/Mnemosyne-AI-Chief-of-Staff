import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export interface AuthResult {
  userId: string;
  email: string | undefined;
}

/**
 * Validates the JWT token from the Authorization header and returns user info.
 * Returns null if authentication fails.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    console.error("Authentication failed:", error?.message);
    return null;
  }

  return {
    userId: data.user.id,
    email: data.user.email,
  };
}

/**
 * Returns an unauthorized response with CORS headers.
 */
export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Unauthorized. Please sign in to access this resource." }),
    { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

/**
 * Input validation helpers
 */
export function validateString(value: unknown, fieldName: string, maxLength: number = 10000): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
  return value;
}

export function validateUUID(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be a string`);
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`${fieldName} is not a valid UUID`);
  }
  return value;
}

export function validateNumber(value: unknown, fieldName: string, min?: number, max?: number): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`${fieldName} must be a number`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new Error(`${fieldName} must be at most ${max}`);
  }
  return value;
}

export function validateArray<T>(value: unknown, fieldName: string, maxLength: number = 100): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} items`);
  }
  return value as T[];
}

/**
 * Sanitize a string for use in ilike queries to prevent SQL injection
 */
export function sanitizeForLike(value: string): string {
  // Escape special characters used in LIKE patterns
  return value.replace(/[%_\\]/g, "\\$&");
}
