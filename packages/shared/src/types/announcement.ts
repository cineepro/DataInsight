// packages/shared/src/types/announcement.ts
export interface Announcement {
  $id: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  published_at?: string;
  created_at: string;
}