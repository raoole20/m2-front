import { fetcher } from "./fetcher";

export type Contact = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

export async function list() {
  return fetcher<Contact[]>("/contacts");
}

export async function get(id: string) {
  return fetcher<Contact>(`/contacts/${id}`);
}
