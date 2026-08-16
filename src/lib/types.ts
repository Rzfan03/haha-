export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
}

export interface Post {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  category_id: string | null;
  user_id: string | null;
  tags: string[] | null;
  like_count: number;
  created_at: string;
  categories?: { name: string; slug: string; emoji: string } | null;
  users?: Pick<User, "id" | "display_name" | "avatar_url"> | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  users?: Pick<User, "display_name" | "avatar_url" | "is_verified"> | null;
}

export interface User {
  id: string;
  email?: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  is_verified?: boolean;
  created_at: string;
}

export interface FollowStats {
  posts: number;
  followers: number;
  following: number;
}
