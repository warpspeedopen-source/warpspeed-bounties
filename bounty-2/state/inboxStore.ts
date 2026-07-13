import { makeAutoObservable, computed } from 'mobx';
import { Account, Category, Email, NavigationRoute } from '../types';

const MOCK_ACCOUNTS: Account[] = [
  { id: '1', email: 'alice@example.com', displayName: 'Alice Chen' },
  { id: '2', email: 'bob@work.com', displayName: 'Bob Martinez' },
];

const MOCK_EMAILS: Email[] = Array.from({ length: 30 }, (_, i) => ({
  id: `email-${i}`,
  from: {
    name: `Sender ${i}`,
    email: `sender${i}@example.com`,
  },
  subject: `Email subject ${i} — Lorem ipsum dolor sit amet`,
  preview: `This is a preview of email number ${i}. It goes up to two lines at most.`,
  body: `Full body of email ${i}.`,
  category: (['primary', 'promotions', 'updates'] as Category)[i % 3],
  isUnread: i < 8,
  isStarred: i % 5 === 0,
  hasAttachment: i % 4 === 0,
  timestamp: Date.now() - i * 86_400_000,
}));

export class InboxStore {
  accounts: Account[] = MOCK_ACCOUNTS;
  selectedAccountId: string = MOCK_ACCOUNTS[0].id;
  activeRoute: NavigationRoute = 'classic';
  selectedCategory: Category = 'primary';
  emails: Email[] = MOCK_EMAILS;
  searchQuery: string = '';
  isSearchVisible: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get selectedAccount(): Account {
    return this.accounts.find((a) => a.id === this.selectedAccountId)!
  }

  get filteredEmails(): Email[] {
    let list = this.emails.filter((e) => e.category === this.selectedCategory);
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q) ||
          e.from.name.toLowerCase().includes(q),
      );
    }
    return list;
  }

  setAccount = (id: string) => {
    this.selectedAccountId = id;
  };

  setRoute = (route: NavigationRoute) => {
    this.activeRoute = route;
  };

  setCategory = (cat: Category) => {
    this.selectedCategory = cat;
  };

  toggleStar = (id: string) => {
    const email = this.emails.find((e) => e.id === id);
    if (email) email.isStarred = !email.isStarred;
  };

  markRead = (id: string) => {
    const email = this.emails.find((e) => e.id === id);
    if (email) email.isUnread = false;
  };

  setSearchQuery = (q: string) => {
    this.searchQuery = q;
  };

  toggleSearch = () => {
    this.isSearchVisible = !this.isSearchVisible;
    if (!this.isSearchVisible) this.searchQuery = '';
  };

  simulateLoad = () => {
    this.isLoading = true;
    this.error = null;
    setTimeout(() => {
      this.isLoading = false;
    }, 800);
  };
}

export const inboxStore = new InboxStore();
