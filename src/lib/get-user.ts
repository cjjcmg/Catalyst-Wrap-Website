import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME, type UserPayload } from "./auth";

export async function getUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
