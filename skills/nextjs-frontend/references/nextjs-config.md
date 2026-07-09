# Next.js - Reference Configurations

## axiosConfig.ts (base template)

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  // Example: add auth token
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: error.response?.data?.message ?? "Network error",
      code: error.response?.data?.errorCode,
    };
    return Promise.reject(apiError);
  }
);

export default apiClient;
```

---

## ApiError Type

```typescript
// src/types/api/index.ts
export type ApiError = {
  status: number;
  message: string;
  code?: string;
};
```

---

## Service pattern

```typescript
// src/services/users/index.ts
import apiClient from "@/services/axiosConfig";
import type { UserResponse, CreateUserRequest } from "@/types/users";

export const getUsers = async (): Promise<UserResponse[]> => {
  const { data } = await apiClient.get<UserResponse[]>("/users");
  return data;
};

export const createUser = async (payload: CreateUserRequest): Promise<UserResponse> => {
  const { data } = await apiClient.post<UserResponse>("/users", payload);
  return data;
};
```

---

## Store pattern (Zustand)

```typescript
// src/stores/useUserStore.ts
import { create } from "zustand";
import type { UserResponse } from "@/types/users";

type UserStore = {
  users: UserResponse[];
  loading: boolean;
  error: string | null;
  setUsers: (users: UserResponse[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  error: null,
  setUsers: (users) => set({ users }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

---

## generateMetadata (template)

```typescript
// app/dashboard/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | MyApp",
  description: "Dashboard page description",
  openGraph: {
    title: "Dashboard | MyApp",
    description: "Open Graph description",
  },
};
```

---

## error.tsx (template)

```typescript
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong.</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## middleware.ts (template auth)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

## next.config.js (base)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "your-cdn.example.com",
      },
    ],
  },
};

module.exports = nextConfig;
```
