import { supabase } from "./supabase";
import type { Category } from "./types";

export async function getCategories(): Promise<Category[]> {
  try {
    const { data } = await supabase.from("categories").select("*").order("name");
    return (data as Category[]) ?? [];
  } catch {
    return [];
  }
}
