export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isLocked?: boolean;
  lockTimeoutMinutes?: number;
}