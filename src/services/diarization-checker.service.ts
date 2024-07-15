import { VideoInput } from 'src/dtos/diarization-checker/download-video';
import { JobQueue } from 'src/jobs/queue';
import { Service } from 'typedi';

@Service()
export class DiarizationCheckerService {
  constructor(private jobQueue: JobQueue) {}

  async downloadVideo(input: VideoInput) {
    const jobId = await this.jobQueue.addVideoDownloadJob({
      url: input.url,
    });

    return { jobId };
  }
}
