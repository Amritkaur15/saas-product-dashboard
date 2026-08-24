import type { Role } from "./product";

export interface UserProfile {
  uid: string;
  email: string;
  role: Role;
  createdAt: string;
}
