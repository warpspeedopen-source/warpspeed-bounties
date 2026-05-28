export interface Email {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  isRead: boolean;
  category: 'primary' | 'promotions' | 'updates';
}
