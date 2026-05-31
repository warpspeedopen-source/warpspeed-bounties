import { ThreadService } from "../services/threadService.js";

export class ThreadController {
  private threadService = ThreadService.getInstance();

  async getThreads(req: any, res: any) {
    const userId = req.user?.id || req.headers['x-user-id'] || 'usr_default';
    const { search, includeDrafts, provider } = req.query;

    try {
      const threads = await this.threadService.listThreads(userId, {
        search: search as string,
        includeDrafts: includeDrafts === 'true',
        provider: provider as 'gmail' | 'outlook' | 'imap'
      });

      return res.status(200).json({
        success: true,
        data: threads,
        count: threads.length
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve threads"
      });
    }
  }

  async getThreadById(req: any, res: any) {
    const userId = req.user?.id || req.headers['x-user-id'] || 'usr_default';
    const { id } = req.params;

    try {
      const thread = await this.threadService.getThreadDetails(userId, id);
      if (!thread) {
        return res.status(404).json({
          success: false,
          error: `Thread with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        data: thread
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to retrieve thread details"
      });
    }
  }

  async saveDraft(req: any, res: any) {
    const userId = req.user?.id || req.headers['x-user-id'] || 'usr_default';
    const { id: threadId } = req.params;
    const { body, sender, recipients, subject, draftId } = req.body;

    if (!body || !sender || !recipients) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: body, sender, or recipients"
      });
    }

    try {
      const draft = await this.threadService.createOrUpdateDraft(userId, threadId, {
        id: draftId,
        body,
        sender,
        recipients,
        subject: subject || ""
      });

      return res.status(201).json({
        success: true,
        data: draft,
        message: "Draft saved successfully"
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to save draft"
      });
    }
  }
}
