"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(2, { error: "Company name must be at least 2 characters." }).max(100).trim(),
  domain: z.string().trim().optional(),
  description: z.string().max(500).trim().optional(),
  category: z.string().trim().optional(),
});

type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function addCompany(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to add a company." };

  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    domain: formData.get("domain") || undefined,
    description: formData.get("description") || undefined,
    category: formData.get("category") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const slug = slugify(parsed.data.name);

  const { data, error } = await supabase
    .from("companies")
    .insert({
      slug,
      name: parsed.data.name,
      domain: parsed.data.domain || null,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      created_by: user.id,
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "A company with this name already exists." };
    return { error: error.message };
  }

  redirect(`/companies/${data.slug}`);
}
