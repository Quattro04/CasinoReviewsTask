export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Company = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  description: string | null;
  category: string | null;
  created_by: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  company_id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  ip_hash: string | null;
  profiles?: Pick<Profile, "display_name">;
};

export type CompanyRating = {
  company_id: string;
  avg_rating: number;
  review_count: number;
  bayesian_rating: number;
};

export type CompanyWithRating = Company & {
  avg_rating: number | null;
  review_count: number;
  bayesian_rating: number | null;
};
