export type Category = 'primary' | 'promotions' | 'updates';

export type NavigationRoute = 'flow' | 'dashboard' | 'classic' | 'compose';

export interface Account {
  id: string;
  email: string;
  displayName: string;
  avatarUri?: string;
}

export interface Email {
  id: string;
  from: { name: string; email: string; avatarUri?: string };
  subject: string;
  preview: string;
  body: string;
  category: Category;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  timestamp: number; // unix ms
}

export interface InboxState {
  accounts: Account[];
  selectedAccountId: string;
  activeRoute: NavigationRoute;
  selectedCategory: Category;
  emails: Email[];
  searchQuery: string;
  isSearchVisible: boolean;
  isLoading: boolean;
  error: string | null;
}
