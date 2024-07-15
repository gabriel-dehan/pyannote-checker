import datasource from 'config/data-source';
import { useRepositories } from 'config/repositories-config';
import { useContainer } from 'routing-controllers';
import { Container } from 'typedi';

import { JobQueue } from './job-queue';
import { audioExtractionWorker } from './workers/audio-extraction.worker';
import { captionsExtractionWorker } from './workers/captions-extraction.worker';
import { diarizationWorker } from './workers/diarization.worker';
import { videoDownloadWorker } from './workers/video-download.worker';

async function startWorker() {
  await datasource.initialize();

  // DI from typedi
  const containerWithRepositories = useRepositories();
  useContainer(containerWithRepositories);
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
  jobQueue.processDiarizationJobs(diarizationWorker, workerOptions);
}

startWorker().catch(console.error);
