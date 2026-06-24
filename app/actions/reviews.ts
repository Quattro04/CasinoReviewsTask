"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const reviewSchema = z.object({
  companyId: z.string().uuid({ error: "Invalid company." }),
  companySlug: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(3, { error: "Title must be at least 3 characters." }).max(120).trim(),
  body: z.string().min(10, { error: "Review must be at least 10 characters." }).max(2000).trim(),
});

type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

export async function postReview(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to write a review." };

  const parsed = reviewSchema.safeParse({
    companyId: formData.get("companyId"),
    companySlug: formData.get("companySlug"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { error } = await supabase.from("reviews").insert({
    company_id: parsed.data.companyId,
    user_id: user.id,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already reviewed this company." };
    return { error: error.message };
  }

  revalidatePath(`/companies/${parsed.data.companySlug}`);
  return undefined;
}
