export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Birthday = {
  id: string;
  user_id: string;
  person_name: string;
  date: string; // Format: YYYY-MM-DD
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type Event = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  date: string; // Format: YYYY-MM-DD
  time?: string; // Format: HH:mm
  location?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  reference_id: string; // ID of the birthday or event
  reference_type: 'birthday' | 'event';
  notification_type: 'week_before' | 'day_before';
  is_read: boolean;
  created_at: string;
}; 