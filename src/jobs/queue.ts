import Bull from 'bull';
import { Service } from 'typedi';

@Service()
export class JobQueue {
  private videoDownloadQueue: Bull.Queue;

  constructor() {
    this.videoDownloadQueue = new Bull('video-download', {
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    });
  }

  async addVideoDownloadJob(data: { url: string }) {
    return this.videoDownloadQueue.add(data);
  }

  processVideoDownloadJobs(processor: (job: Bull.Job) => Promise<void>) {
    void this.videoDownloadQueue.process(processor);
  }
}
