import { prisma } from './databaseService';
import { logger } from '../utils/logger';
import { JobStatus } from '@prisma/client';

export class JobService {
  async createJob(data: {
    filename: string;
    mimeType: string;
    gcsPath: string;
    s3Path?: string;
  }) {
    try {
      const job = await prisma.job.create({
        data,
      });
      logger.info('Job created', { jobId: job.id, filename: job.filename });
      return job;
    } catch (error) {
      logger.error('Error creating job', { error });
      throw new Error('Failed to create job');
    }
  }

  async updateJobStatus(jobId: string, status: JobStatus, summary?: string, error?: string) {
    try {
      const updateData: any = { status };
      if (summary) updateData.summary = summary;
      if (error) updateData.error = error;

      const job = await prisma.job.update({
        where: { id: jobId },
        data: updateData,
      });

      logger.info('Job status updated', { jobId, status });
      return job;
    } catch (error) {
      logger.error('Error updating job status', { jobId, error });
      throw new Error('Failed to update job status');
    }
  }

  async getJob(jobId: string) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });
      return job;
    } catch (error) {
      logger.error('Error retrieving job', { jobId, error });
      throw new Error('Failed to retrieve job');
    }
  }
}