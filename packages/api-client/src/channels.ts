import type { Channel, ChannelType } from "@m2/types";

import { fetcher } from "./fetcher";

// TODO(channels-dto): align this enum with m2-back's `ChannelStatus` once it
// exists. The backend Prisma schema currently exposes only `isActive: boolean`
// (see m2-back/prisma/schema.prisma `model Channel`); the V2 mobile UI needs a
// richer status surface (LIVE / PAUSED / ERROR), so we expose `ChannelStatus`
// here and expect the API layer to derive it server-side.
export type ChannelStatus =
  | "connected"
  | "paused"
  | "disconnected"
  | "error";

// TODO(channels-dto): m2-back also requires `provider: ChannelProvider`
// (META | EVOLUTION) and `credentials: Json`. Those fields are not yet
// surfaced through @m2/types; once the DTO contract stabilises, fold them in.
export type ChannelCreateInput = {
  type: ChannelType;
  name: string;
  accountIdentifier?: string;
};

export type ChannelUpdateInput = Partial<{
  name: Channel["name"];
  status: ChannelStatus;
  isActive: Channel["isActive"];
}>;

export type ChannelConnectInput = {
  /** Provider-specific credential payload (see m2-back ChannelProvider). */
  credentials: Record<string, unknown>;
};

export async function list() {
  return fetcher<Channel[]>("/channels");
}

export async function get(id: string) {
  return fetcher<Channel>(`/channels/${id}`);
}

export async function create(payload: ChannelCreateInput) {
  return fetcher<Channel>("/channels", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function update(id: string, payload: ChannelUpdateInput) {
  return fetcher<Channel>(`/channels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function del(id: string) {
  return fetcher<void>(`/channels/${id}`, {
    method: "DELETE",
  });
}

export async function connect(id: string, payload: ChannelConnectInput) {
  return fetcher<Channel>(`/channels/${id}/connect`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
