import { QueryCache, QueryClient } from "@tanstack/react-query";

import { pushToast } from "./toast-bus";
import { mapApiErrorToToast } from "./error-toast";

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error) {
        const toast = mapApiErrorToToast(error);
        if (toast) {
          pushToast(toast);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });
}
