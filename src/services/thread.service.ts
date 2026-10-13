import { PrismaClient, Thread, Message, Prisma } from '@prisma/client';
import { extractEmailAddresses } from '../utils/email.utils'; // Assuming this utility exists
import { cleanSubjectForThreading } from '../utils/string.utils'; // Assuming this utility exists

const prisma = new PrismaClient();

interface ThreadListOptions {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: 'inbox' | 'sent' | 'drafts' | 'archived' | 'deleted' | 'unread' | 'all';
  sort?: 'lastMessageAt:desc' | 'lastMessageAt:asc';
}

interface ThreadDetailOptions {
  userId: string;
  threadId: string;
  includeDeleted?: boolean;
  includeArchived?: boolean;
}

export class ThreadService {
  /**
   * Finds an existing thread for a message based on headers and subject, or creates a new one.
   * @param userId The ID of the user.
   * @param messageData The message data, including headers like messageId, inReplyToMessageId, references, and subject.
   * @returns The ID of the associated thread.
   */
  async findOrCreateThreadForMessage(
    userId: string,
    messageData: Pick<Message, 'messageId' | 'inReplyToMessageId' | 'references' | 'subject' | 'from' | 'to' | 'cc' | 'bcc' | 'isDraft'>
  ): Promise<string> {
    const { messageId, inReplyToMessageId, references, subject, from, to, cc, bcc, isDraft } = messageData;

    let threadId: string | null = null;

    // 1. Try to find by In-Reply-To or References headers
    if (inReplyToMessageId || (references && references.length > 0)) {
      const referencedMessageIds = [inReplyToMessageId, ...(references || [])].filter(Boolean) as string[];
      if (referencedMessageIds.length > 0) {
        const existingMessage = await prisma.message.findFirst({
          where: {
            userId,
            messageId: { in: referencedMessageIds },
          },
          select: { threadId: true },
        });
        if (existingMessage?.threadId) {
          threadId = existingMessage.threadId;
        }
      }
    }

    // 2. If not found by headers, try to find by cleaned subject and participants
    if (!threadId) {
      const cleanedSubject = cleanSubjectForThreading(subject);
      const allParticipants = Array.from(new Set([from, ...to, ...cc, ...bcc].map(email => email.toLowerCase())));

      const potentialThreads = await prisma.thread.findMany({
        where: {
          userId,
          subject: { contains: cleanedSubject, mode: 'insensitive' }, // Basic subject match
        },
        include: {
          messages: {
            select: {
              from: true,
              to: true,
              cc: true,
              bcc: true,
            },
            take: 5, // Check a few messages for participants
            orderBy: { sentAt: 'desc' },
          },
        },
        take: 10, // Limit potential threads to check
      });

      for (const thread of potentialThreads) {
        const threadParticipants = new Set<string>();
        thread.messages.forEach(msg => {
          threadParticipants.add(msg.from.toLowerCase());
          msg.to.forEach(p => threadParticipants.add(p.toLowerCase()));
          msg.cc.forEach(p => threadParticipants.add(p.toLowerCase()));
          msg.bcc.forEach(p => threadParticipants.add(p.toLowerCase()));
        });

        // Heuristic: If subjects are very similar and there's significant participant overlap
        const subjectMatch = thread.subject.toLowerCase().includes(cleanedSubject.toLowerCase()) || cleanedSubject.toLowerCase().includes(thread.subject.toLowerCase());
        const participantOverlap = allParticipants.some(p => threadParticipants.has(p));

        if (subjectMatch && participantOverlap) {
          threadId = thread.id;
          break;
        }
      }
    }

    // 3. If still no thread, create a new one
    if (!threadId) {
      const newThread = await prisma.thread.create({
        data: {
          userId,
          subject: subject, // Use original subject for new thread
          lastMessageAt: new Date(),
          isArchived: false,
          isDeleted: false,
        },
      });
      threadId = newThread.id;
    } else {
      // If an existing thread was found, update its lastMessageAt
      await this.updateThreadRecency(threadId);
    }

    return threadId;
  }

  /**
   * Updates the lastMessageAt timestamp of a thread.
   * @param threadId The ID of the thread.
   */
  async updateThreadRecency(threadId: string): Promise<void> {
    await prisma.thread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    });
  }

  /**
   * Lists email threads for a user with pagination, filtering, and search.
   * @param options Query options for listing threads.
   * @returns A paginated list of thread summaries.
   */
  async listThreads(options: ThreadListOptions) {
    const { userId, page = 1, pageSize = 20, search, filter, sort = 'lastMessageAt:desc' } = options;

    const skip = (page - 1) * pageSize;
    const orderBy: Prisma.ThreadOrderByWithRelationInput = {};
    if (sort === 'lastMessageAt:desc') {
      orderBy.lastMessageAt = 'desc';
    } else if (sort === 'lastMessageAt:asc') {
      orderBy.lastMessageAt = 'asc';
    }

    const where: Prisma.ThreadWhereInput = {
      userId,
      isDeleted: false, // Always exclude deleted threads from main list
    };

    // Apply filter
    if (filter === 'archived') {
      where.isArchived = true;
    } else if (filter === 'deleted') {
      where.isDeleted = true;
    } else if (filter === 'inbox') {
      where.isArchived = false;
      where.messages = {
        some: {
          isDraft: false,
          isDeleted: false,
          isArchived: false,
          // A message is in inbox if it's not sent by the user AND not a draft
          // This is a simplification; a more robust check would involve checking 'to'/'cc' against user's email
          // For now, we assume 'from' is the sender.
          NOT: { from: { contains: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || '___INVALID_EMAIL___' } },
        },
      };
    } else if (filter === 'sent') {
      where.isArchived = false;
      where.messages = {
        some: {
          isDraft: false,
          isDeleted: false,
          isArchived: false,
          from: { contains: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || '___INVALID_EMAIL___' },
        },
      };
    } else if (filter === 'drafts') {
      where.isArchived = false;
      where.messages = {
        some: {
          isDraft: true,
          isDeleted: false,
          isArchived: false,
        },
      };
    } else if (filter === 'unread') {
      where.isArchived = false;
      where.messages = {
        some: {
          isRead: false,
          isDraft: false,
          isDeleted: false,
          isArchived: false,
        },
      };
    } else if (filter === 'all') {
      // No specific filter for archived/deleted, but still exclude deleted by default
      where.isArchived = false;
    } else { // Default to inbox-like view (non-archived, non-deleted)
      where.isArchived = false;
    }

    // Apply search
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        {
          messages: {
            some: {
              body: { contains: search, mode: 'insensitive' },
              isDeleted: false, // Only search in non-deleted messages
              isArchived: false, // Only search in non-archived messages
            },
          },
        },
      ];
    }

    const threads = await prisma.thread.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        messages: {
          where: {
            isDeleted: false, // Exclude deleted messages from thread summary
            isArchived: false, // Exclude archived messages from thread summary
          },
          orderBy: { sentAt: 'desc' },
          take: 1, // Get the latest message for snippet and recency
          select: {
            body: true,
            sentAt: true,
            isRead: true,
            from: true,
            to: true,
            cc: true,
            bcc: true,
          },
        },
      },
    });

    const totalThreads = await prisma.thread.count({ where });

    const formattedThreads = await Promise.all(threads.map(async (thread) => {
      const latestMessage = thread.messages[0];
      const allMessagesInThread = await prisma.message.findMany({
        where: { threadId: thread.id, isDeleted: false, isArchived: false },
        select: { from: true, to: true, cc: true, bcc: true, isRead: true, isDraft: true },
      });

      const participantEmails = Array.from(new Set(
        allMessagesInThread.flatMap(msg => [
          msg.from,
          ...msg.to,
          ...msg.cc,
          ...msg.bcc,
        ]).map(email => email.toLowerCase())
      ));

      const unreadCount = allMessagesInThread.filter(msg => !msg.isRead && !msg.isDraft).length;
      const draftCount = allMessagesInThread.filter(msg => msg.isDraft).length;

      return {
        id: thread.id,
        subject: thread.subject,
        lastMessageAt: thread.lastMessageAt,
        isArchived: thread.isArchived,
        isDeleted: thread.isDeleted,
        latestMessageSnippet: latestMessage ? latestMessage.body.substring(0, 150) + (latestMessage.body.length > 150 ? '...' : '') : '',
        unreadCount,
        draftCount,
        participantEmails,
        messageCount: allMessagesInThread.length,
      };
    }));

    return {
      threads: formattedThreads,
      total: totalThreads,
      page,
      pageSize,
      totalPages: Math.ceil(totalThreads / pageSize),
    };
  }

  /**
   * Retrieves a single thread and its associated messages.
   * @param options Options for retrieving a thread.
   * @returns The thread object with its messages.
   */
  async getThreadById(options: ThreadDetailOptions) {
    const { userId, threadId, includeDeleted = false, includeArchived = false } = options;

    const thread = await prisma.thread.findUnique({
      where: { id: threadId, userId },
      include: {
        messages: {
          where: {
            ...(includeDeleted ? {} : { isDeleted: false }),
            ...(includeArchived ? {} : { isArchived: false }),
          },
          orderBy: { sentAt: 'asc' }, // Order messages chronologically within the thread
        },
      },
    });

    if (!thread) {
      return null;
    }

    const allParticipants = Array.from(new Set(
      thread.messages.flatMap(msg => [
        msg.from,
        ...msg.to,
        ...msg.cc,
        ...msg.bcc,
      ]).map(email => email.toLowerCase())
    ));

    const unreadCount = thread.messages.filter(msg => !msg.isRead && !msg.isDraft).length;
    const draftCount = thread.messages.filter(msg => msg.isDraft).length;

    return {
      ...thread,
      participantEmails: allParticipants,
      unreadCount,
      draftCount,
      messageCount: thread.messages.length,
    };
  }

  /**
   * Archives a thread and all its non-deleted messages.
   * @param userId The ID of the user.
   * @param threadId The ID of the thread to archive.
   */
  async archiveThread(userId: string, threadId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId, userId } });
    if (!thread) return null;

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { isArchived: true },
      }),
      prisma.message.updateMany({
        where: { threadId, userId, isDeleted: false }, // Only archive non-deleted messages
        data: { isArchived: true },
      }),
    ]);
    return prisma.thread.findUnique({ where: { id: threadId, userId } });
  }

  /**
   * Unarchives a thread and all its non-deleted messages.
   * @param userId The ID of the user.
   * @param threadId The ID of the thread to unarchive.
   */
  async unarchiveThread(userId: string, threadId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId, userId } });
    if (!thread) return null;

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { isArchived: false },
      }),
      prisma.message.updateMany({
        where: { threadId, userId, isDeleted: false }, // Only unarchive non-deleted messages
        data: { isArchived: false },
      }),
    ]);
    return prisma.thread.findUnique({ where: { id: threadId, userId } });
  }

  /**
   * Deletes a thread and all its messages.
   * @param userId The ID of the user.
   * @param threadId The ID of the thread to delete.
   */
  async deleteThread(userId: string, threadId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId, userId } });
    if (!thread) return null;

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { isDeleted: true },
      }),
      prisma.message.updateMany({
        where: { threadId, userId },
        data: { isDeleted: true },
      }),
    ]);
    return prisma.thread.findUnique({ where: { id: threadId, userId } });
  }

  /**
   * Undeletes a thread and all its messages.
   * @param userId The ID of the user.
   * @param threadId The ID of the thread to undelete.
   */
  async undeleteThread(userId: string, threadId: string): Promise<Thread | null> {
    const thread = await prisma.thread.findUnique({ where: { id: threadId, userId } });
    if (!thread) return null;

    await prisma.$transaction([
      prisma.thread.update({
        where: { id: threadId },
        data: { isDeleted: false },
      }),
      prisma.message.updateMany({
        where: { threadId, userId },
        data: { isDeleted: false },
      }),
    ]);
    return prisma.thread.findUnique({ where: { id: threadId, userId } });
  }
}
