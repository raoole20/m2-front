import { fetcher } from "./fetcher";

export type ConversationStatus = "open" | "pending" | "resolved";

export type Conversation = {
  id: string;
  title: string;
  status: ConversationStatus;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  createdAt: string;
};

export async function list(params?: { status?: ConversationStatus }) {
  const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
  return fetcher<Conversation[]>(`/conversations${query}`);
}

export async function get(id: string) {
  return fetcher<Conversation>(`/conversations/${id}`);
}

export async function messages(id: string) {
  return fetcher<ConversationMessage[]>(`/conversations/${id}/messages`);
}
