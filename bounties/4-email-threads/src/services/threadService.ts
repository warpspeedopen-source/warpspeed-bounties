import { EmailMessage, EmailThread } from "../types/index.js";

export class ThreadService {
  private static instance: ThreadService;
  private messagesStore: EmailMessage[] = [];

  static getInstance(): ThreadService {
    if (!ThreadService.instance) {
      ThreadService.instance = new ThreadService();
    }
    return ThreadService.instance;
  }

  // Pre-seed mock store for unit testing
  seedMessages(messages: EmailMessage[]) {
    this.messagesStore = [...messages];
  }

  async listThreads(userId: string, options: { 
    search?: string; 
    includeDrafts?: boolean;
    provider?: 'gmail' | 'outlook' | 'imap';
  } = {}): Promise<EmailThread[]> {
    // 1. Filter out deleted or archived messages (unless requested) and filter by userId
    let messages = this.messagesStore.filter(m => 
      m.userId === userId && 
      !m.isDeleted && 
      !m.isArchived
    );

    // Filter by provider if specified
    if (options.provider) {
      messages = messages.filter(m => m.provider === options.provider);
    }

    // 2. Group by threadId
    const threadGroups = new Map<string, EmailMessage[]>();
    messages.forEach(m => {
      if (!threadGroups.has(m.threadId)) {
        threadGroups.set(m.threadId, []);
      }
      threadGroups.get(m.threadId)!.push(m);
    });

    const threads: EmailThread[] = [];

    // 3. Construct thread metadata
    threadGroups.forEach((msgs, threadId) => {
      // Sort messages in thread by timestamp ascending
      const sortedMsgs = [...msgs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const hasDrafts = sortedMsgs.some(m => m.isDraft);
      if (!options.includeDrafts && hasDrafts && sortedMsgs.length === 1) {
        // If thread has ONLY drafts and includeDrafts is false, skip thread
        return;
      }

      // Filter out search queries if search term is active
      if (options.search) {
        const query = options.search.toLowerCase();
        const matches = sortedMsgs.some(m => 
          m.subject.toLowerCase().includes(query) || 
          m.body.toLowerCase().includes(query) || 
          m.sender.toLowerCase().includes(query)
        );
        if (!matches) return;
      }

      const firstMsg = sortedMsgs[0];
      const lastMsg = sortedMsgs[sortedMsgs.length - 1];

      threads.push({
        id: threadId,
        subject: firstMsg.subject || "No Subject",
        messages: sortedMsgs,
        lastMessageAt: lastMsg.timestamp,
        messageCount: sortedMsgs.length,
        userId: userId,
        hasDrafts: hasDrafts
      });
    });

    // 4. Sort threads by recency (last message timestamp descending)
    return threads.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  async getThreadDetails(userId: string, threadId: string): Promise<EmailThread | null> {
    const messages = this.messagesStore.filter(m => 
      m.userId === userId && 
      m.threadId === threadId && 
      !m.isDeleted
    );

    if (messages.length === 0) return null;

    const sortedMsgs = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const hasDrafts = sortedMsgs.some(m => m.isDraft);

    return {
      id: threadId,
      subject: sortedMsgs[0].subject || "No Subject",
      messages: sortedMsgs,
      lastMessageAt: sortedMsgs[sortedMsgs.length - 1].timestamp,
      messageCount: sortedMsgs.length,
      userId: userId,
      hasDrafts: hasDrafts
    };
  }

  async createOrUpdateDraft(userId: string, threadId: string, draftData: { 
    id?: string;
    body: string; 
    sender: string; 
    recipients: string[]; 
    subject: string;
  }): Promise<EmailMessage> {
    // If draft already exists in thread, update it
    const existingIndex = this.messagesStore.findIndex(m => 
      m.userId === userId && 
      m.threadId === threadId && 
      m.isDraft && 
      (draftData.id ? m.id === draftData.id : true)
    );

    if (existingIndex !== -1) {
      const updatedDraft = {
        ...this.messagesStore[existingIndex],
        body: draftData.body,
        recipients: draftData.recipients,
        subject: draftData.subject,
        timestamp: new Date() // update timestamp to refresh thread recency
      };
      this.messagesStore[existingIndex] = updatedDraft;
      return updatedDraft;
    }

    // Create new draft
    const newDraft: EmailMessage = {
      id: draftData.id || `msg_draft_${Date.now()}`,
      threadId: threadId,
      sender: draftData.sender,
      recipients: draftData.recipients,
      subject: draftData.subject,
      body: draftData.body,
      timestamp: new Date(),
      isDraft: true,
      isArchived: false,
      isDeleted: false,
      userId: userId,
      provider: 'gmail'
    };

    this.messagesStore.push(newDraft);
    return newDraft;
  }
}
