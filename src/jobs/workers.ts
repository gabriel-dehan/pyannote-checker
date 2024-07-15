import { useRepositories } from 'config/repositories-config';
import { useContainer } from 'routing-controllers';
import { Container } from 'typedi';

import { JobQueue } from './job-queue';
import { audioExtractionWorker } from './workers/audio-extraction.worker';
import { captionsExtractionWorker } from './workers/captions-extraction.worker';
import { videoDownloadWorker } from './workers/video-download.worker';

// DI from typedi
const containerWithRepositories = useRepositories();
useContainer(containerWithRepositories);

async function startWorker() {
  const jobQueue = Container.get(JobQueue);

  const workerOptions = {
    concurrency: 3, // Process up to 3 jobs concurrently
  };

  jobQueue.processVideoDownloadJobs(videoDownloadWorker, workerOptions);
  jobQueue.processCaptionsExtractionJobs(
    captionsExtractionWorker,
    workerOptions,
  );
  jobQueue.processAudioExtractionJobs(audioExtractionWorker, workerOptions);
}

startWorker().catch(console.error);
