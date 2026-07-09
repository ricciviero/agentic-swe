# React Native (Expo) – Configurazioni di Riferimento

## axiosConfig.ts (template base)

```typescript
import axios from "axios";
import type { ApiError } from "@/types/api";

const apiClient = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1`,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  // es. aggiungere token da SecureStore
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: error.response?.data?.message ?? "Errore di rete",
      code: error.response?.data?.errorCode,
    };
    return Promise.reject(apiError);
  }
);

export default apiClient;
```

---

## Tipo ApiError

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
import apiClient from "@/services/apiClient";
import type { UserResponse, CreateUserRequest } from "@/types/domain";

export const getUsers = async (): Promise<UserResponse[]> => {
  const { data } = await apiClient.get<UserResponse[]>("/users");
  return data;
};

export const createUser = async (
  payload: CreateUserRequest
): Promise<UserResponse> => {
  const { data } = await apiClient.post<UserResponse>("/users", payload);
  return data;
};
```

---

## Store pattern (Zustand)

```typescript
// src/stores/useUserStore.ts
import { create } from "zustand";
import type { UserResponse } from "@/types/domain";

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

## Hook pattern

```typescript
// src/hooks/useUsers.ts
import { useState } from "react";
import { getUsers } from "@/services/users";
import type { UserResponse } from "@/types/domain";
import type { ApiError } from "@/types/api";

export const useUsers = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, fetchUsers };
};
```

---

## _layout.tsx con Tab Navigator (template)

```typescript
// src/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#007AFF" }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profilo",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## SecureStore (token storage)

```typescript
// src/lib/storage/tokenStorage.ts
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
```

---

## StyleSheet pattern

```typescript
import { StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE } from "@/constants";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "600",
    color: COLORS.text,
  },
});
```

---

## Constants (template base)

```typescript
// src/constants/index.ts
export const COLORS = {
  primary: "#007AFF",
  background: "#FFFFFF",
  text: "#1C1C1E",
  error: "#FF3B30",
  muted: "#8E8E93",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FONT_SIZE = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;
```
