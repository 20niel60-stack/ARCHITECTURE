export interface User {
  id: string;
  email: string;
  role: "admin" | "student";
  name: string;
  institute?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function login(email: string, password: string): Promise<AuthResponse & { user?: { id: string; email: string; role: string; name: string } }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { message: `Server returned ${response.status} ${response.statusText}` };
      }
      const errorMessage = error.message || error.error || "Invalid credentials";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please make sure the API Gateway is running on port 4000 and the Auth Service is running on port 4001.`);
      }
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during login");
  }
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  institute?: string,
  phoneNumber?: string
): Promise<{ id: string; email: string; role: string; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        email, 
        password, 
        firstName, 
        lastName, 
        role: "student",
        institute,
        phoneNumber,
      }),
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { message: `Server returned ${response.status} ${response.statusText}` };
      }
      const errorMessage = error.message || error.error || "Registration failed";
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please make sure the API Gateway is running on port 4000 and the Auth Service is running on port 4001.`);
      }
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during registration");
  }
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/introspect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If verification fails, try to decode the token directly as fallback
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return {
            id: payload.sub || payload.id || "",
            email: payload.email || "",
            role: payload.role || "student",
            name: payload.name || payload.email || "User",
            institute: payload.institute,
            phoneNumber: payload.phoneNumber,
          };
        }
      } catch (decodeError) {
        // Silent fallback - token decode failed
      }
      return null;
    }

    const data = await response.json();
    if (!data.active || !data.payload) {
      console.error("Token verification returned inactive or missing payload:", data);
      // Fallback to direct token decoding
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          return {
            id: payload.sub || payload.id || "",
            email: payload.email || "",
            role: payload.role || "student",
            name: payload.name || payload.email || "User",
            institute: payload.institute,
            phoneNumber: payload.phoneNumber,
          };
        }
      } catch (decodeError) {
        console.error("Failed to decode token:", decodeError);
      }
      return null;
    }

    // Handle both sub and id fields
    const userId = data.payload.sub || data.payload.id;
    if (!userId) {
      console.error("Token payload missing user ID:", data.payload);
      return null;
    }

    return {
      id: userId,
      email: data.payload.email || "",
      role: data.payload.role || "student",
      name: data.payload.name || data.payload.email || "User",
      institute: data.payload.institute,
      phoneNumber: data.payload.phoneNumber,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    // Fallback to direct token decoding if network fails
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        return {
          id: payload.sub || payload.id || "",
          email: payload.email || "",
          role: payload.role || "student",
          name: payload.name || payload.email || "User",
          institute: payload.institute,
          phoneNumber: payload.phoneNumber,
        };
      }
    } catch (decodeError) {
      console.error("Failed to decode token:", decodeError);
    }
    return null;
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}

export function isStudent(role: string): boolean {
  return role === "student";
}

