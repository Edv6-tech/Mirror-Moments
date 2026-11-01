export interface Profile {
  id: string;
  display_name: string | null;
  default_body_path: string | null;
  delete_originals: boolean;
  created_at: string;
}

export interface Dress {
  id: string;
  user_id: string;
  name: string;
  original_path: string | null;
  lifted_path: string;
  garment_path: string;
  coverage: number;
  worn_detected: boolean;
  store_url: string | null;
  price_text: string | null;
  note: string | null;
  created_at: string;
}

export interface Look {
  id: string;
  user_id: string;
  dress_id: string | null;
  body_path: string;
  result_path: string | null;
  youcam_task_id: string;
  status: 'processing' | 'succeeded' | 'failed';
  error_code: string | null;
  is_favourite: boolean;
  created_at: string;
}

export interface UsageCounter {
  day: string;
  subject: string;
  count: number;
}
