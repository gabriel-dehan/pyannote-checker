import Bull from 'bull';
import { Service } from 'typedi';

@Service()
export class JobQueue {
  private videoDownloadQueue: Bull.Queue;
  private audioExtractionQueue: Bull.Queue;
  private captionsExtractionQueue: Bull.Queue;
  private diarizationQueue: Bull.Queue;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.videoDownloadQueue = new Bull('video-download', {
      redis: redisUrl,
    });
    this.audioExtractionQueue = new Bull('audio-extraction', {
      redis: redisUrl,
    });
    this.captionsExtractionQueue = new Bull('captions-extraction', {
      redis: redisUrl,
    });
    this.diarizationQueue = new Bull('diarization', {
      redis: redisUrl,
    });

    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    [
      this.videoDownloadQueue,
      this.audioExtractionQueue,
      this.captionsExtractionQueue,
      this.diarizationQueue,
    ].forEach((queue) => {
      queue.on('error', (error) => {
        console.error(`Bull queue error in ${queue.name}:`, error);
      });
    });
  }

  // Video Download Queue
  async addVideoDownloadJob(data: { url: string }) {
    const job = await this.videoDownloadQueue.add(data);
    return job.id.toString();
  }

  processVideoDownloadJobs(
    processor: (job: Bull.Job) => Promise<void>,
    workerOptions: { concurrency?: number },
  ) {
    void this.videoDownloadQueue.process(
      workerOptions?.concurrency || 1,
      processor,
    );
  }

  // Captions Extraction Queue
  async addCaptionsExtractionJob(data: { url: string }) {
    const job = await this.captionsExtractionQueue.add(data);
    return job.id.toString();
  }

  processCaptionsExtractionJobs(
    processor: (job: Bull.Job) => Promise<void>,
    workerOptions: { concurrency?: number },
  ) {
    void this.captionsExtractionQueue.process(
      workerOptions?.concurrency || 1,
      processor,
    );
  }

  // Audio Extraction Queue
  async addAudioExtractionJob(data: { filePath: string }) {
    const job = await this.audioExtractionQueue.add(data);
    return job.id.toString();
  }

  processAudioExtractionJobs(
    processor: (job: Bull.Job) => Promise<void>,
    workerOptions: { concurrency?: number },
  ) {
    void this.audioExtractionQueue.process(
      workerOptions?.concurrency || 1,
      processor,
    );
  }

  // Diarization Queue
  async addDiarizationJob(data: { url: string }) {
    const job = await this.diarizationQueue.add(data);
    return job.id.toString();
  }

  processDiarizationJobs(
    processor: (job: Bull.Job) => Promise<void>,
    workerOptions: { concurrency?: number },
  ) {
    void this.diarizationQueue.process(
      workerOptions?.concurrency || 1,
      processor,
    );
  }
}
