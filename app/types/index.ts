export interface Contact {
  id: number;
  name: string;
  email: string;
  mobile_no: string | null;
  message: string;
  created_at: string;
}

export interface Blog {
  id: number;
  title: string;
  slug: string;
  content: string;
  subtitle: string | null;
  category: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  page_key: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// export interface InstaPost {
//   id: number;
//   post_url: string;
//   sort_order: number;
//   created_at: string;
// }

export interface tedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface DashboardStats {
  total_contacts: number;
  total_blogs: number;
  total_faqs: number;
  weekly_contacts: number;
  daily_contacts: DailyCount[];
  recent_contacts: Contact[];
  recent_blogs: BlogListItem[];
  recent_faqs: FAQ[];
}

export interface Recipe {
  id: number;
  title: string;
  youtube_url: string;
  duration: string | null;
  category: string | null;
  difficulty: string | null;
  serves: string | null;
  cook_time: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: number;
  email: string;
  role?: "superadmin" | "admin";
  // null means every section, an admin from before per section access existed
  permissions?: string[] | null;
  created_at: string;
  updated_at: string;
}
