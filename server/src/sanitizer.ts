import striptags from "striptags";
import { decode } from "html-entities";

export function sanitize(raw: string | null | undefined): string {
  if (!raw) return "";
  return striptags(decode(raw));
}
