// Types for the Classic Inbox View

export type InboxCategory = 'inbox' | 'sent' | 'drafts' | 'all_mail';

export type MailLabel = 'primary' | 'promotions' | 'updates';

export interface Email {
  id: string;
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  subject: string;
  preview: string;
  timestamp: Date;
  isOpened: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  category: MailLabel;
  labels: string[];
}

export interface InboxState {
  activeCategory: InboxCategory;
  activeLabel: MailLabel;
  emails: Email[];
  searchQuery: string;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

export interface NavButton {
  id: string;
  label: string;
  icon: string;
  route: string;
  isActive: boolean;
}

export const NAV_BUTTONS: NavButton[] = [
  { id: 'flow', label: 'Flow', icon: 'flow', route: '/flow', isActive: false },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/dashboard', isActive: false },
  { id: 'classic', label: 'Classic', icon: 'classic', route: '/inbox', isActive: true },
  { id: 'compose', label: 'Compose', icon: 'compose', route: '/compose', isActive: false },
];

export const CATEGORY_ICONS: Record<InboxCategory, string> = {
  inbox: 'inbox',
  sent: 'sent',
  drafts: 'drafts',
  all_mail: 'all_mail',
};

export const LABEL_ICONS: Record<MailLabel, string> = {
  primary: 'primary',
  promotions: 'promotions',
  updates: 'updates',
};
