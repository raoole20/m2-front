"use client";

import { auth, createBrowserTokenStore, setTokenStore } from "@m2/api-client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuthStore } from "../store/useAuthStore";

const browserTokenStore = createBrowserTokenStore();
setTokenStore(browserTokenStore);

export function useAuth() {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ["me"],
    queryFn: auth.me,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
    if (query.error) {
      setUser(null);
    }
  }, [query.data, query.error, setUser]);

  return {
    ...query,
    user,
    tokenStore: browserTokenStore,
  };
}
