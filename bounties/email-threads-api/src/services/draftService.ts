import prisma from '../config/database';
import { Draft, Prisma } from '@prisma/client';
import { CreateDraftRequest, UpdateDraftRequest, DraftResponse } from '../types';
import { threadService } from './threadService';

export class DraftService {
  /**
   * Create a new draft
   */
  async createDraft(
    userId: string,
    emailAccountId: string,
    data: CreateDraftRequest
  ): Promise<DraftResponse> {
    const draft = await prisma.draft.create({
      data: {
        userId,
        emailAccountId,
        threadId: data.threadId || null,
        from: '', // Will be set from email account
        to: data.to,
        cc: data.cc || [],
        bcc: data.bcc || [],
        subject: data.subject,
        body: data.body,
      },
    });

    // If linked to a thread, update thread recency
    if (data.threadId) {
      await threadService.updateThreadRecency(data.threadId, 'draft_created');
    }

    return this.formatDraftResponse(draft);
  }

  /**
   * Update an existing draft
   */
  async updateDraft(
    draftId: string,
    userId: string,
    data: UpdateDraftRequest
  ): Promise<DraftResponse | null> {
    const draft = await prisma.draft.findFirst({
      where: { id: draftId, userId, isDeleted: false },
    });

    if (!draft) return null;

    const updated = await prisma.draft.update({
      where: { id: draftId },
      data: {
        ...(data.to && { to: data.to }),
        ...(data.cc && { cc: data.cc }),
        ...(data.bcc && { bcc: data.bcc }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
      },
    });

    // Update thread recency if linked
    if (draft.threadId) {
      await threadService.updateThreadRecency(draft.threadId, 'draft_updated');
    }

    return this.formatDraftResponse(updated);
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string, userId: string): Promise<boolean> {
    const draft = await prisma.draft.findFirst({
      where: { id: draftId, userId, isDeleted: false },
    });

    if (!draft) return false;

    await prisma.draft.update({
      where: { id: draftId },
      data: { isDeleted: true },
    });

    // Update thread draft count if linked
    if (draft.threadId) {
      await prisma.thread.update({
        where: { id: draft.threadId },
        data: { draftCount: { decrement: 1 } },
      });
    }

    return true;
  }

  /**
   * Send a draft (mark as sent and create message)
   */
  async sendDraft(
    draftId: string,
    userId: string
  ): Promise<{ success: boolean; threadId?: string }> {
    const draft = await prisma.draft.findFirst({
      where: { id: draftId, userId, isDeleted: false },
    });

    if (!draft) return { success: false };

    // Create message from draft
    const message = await prisma.message.create({
      data: {
        threadId: draft.threadId || '', // Will need to create thread if no threadId
        userId,
        emailAccountId: draft.emailAccountId,
        from: draft.from,
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        subject: draft.subject || '(No Subject)',
        body: draft.body || '',
        provider: 'GMAIL', // Default, should be from email account
        sentAt: new Date(),
      },
    });

    // Mark draft as deleted
    await prisma.draft.update({
      where: { id: draftId },
      data: { isDeleted: true },
    });

    // Update thread recency
    if (draft.threadId) {
      await threadService.updateThreadRecency(draft.threadId, 'draft_sent');
    }

    return { success: true, threadId: draft.threadId || undefined };
  }

  /**
   * List drafts for a user
   */
  async listDrafts(
    userId: string,
    threadId?: string
  ): Promise<DraftResponse[]> {
    const where: Prisma.DraftWhereInput = {
      userId,
      isDeleted: false,
    };

    if (threadId) {
      where.threadId = threadId;
    }

    const drafts = await prisma.draft.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return drafts.map(this.formatDraftResponse);
  }

  private formatDraftResponse(draft: Draft): DraftResponse {
    return {
      id: draft.id,
      from: draft.from,
      to: draft.to,
      cc: draft.cc,
      bcc: draft.bcc,
      subject: draft.subject,
      body: draft.body,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  }
}

export const draftService = new DraftService();
