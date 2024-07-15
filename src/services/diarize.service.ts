import fs from 'fs';
import path from 'path';
import { VideoInput } from 'src/dtos/diarize/video';
import { JobQueue } from 'src/jobs/job-queue';
import { extractYoutubeId } from 'src/utils/youtube';
import { Service } from 'typedi';

@Service()
export class DiarizeService {
  constructor(private jobQueue: JobQueue) {}

  // TODO: Also check if sound has been extracted, as well as captions and diarization
  async dataExistsForUrl(input: VideoInput) {
    const tmpDir = path.join(process.cwd(), 'tmp/videos');
    const videoFileName = `${extractYoutubeId(input.url)}.mp4`;
    const videoPath = path.join(tmpDir, videoFileName);

    return fs.existsSync(videoPath);
  }

  async downloadVideo(input: VideoInput) {
    const jobId = await this.jobQueue.addVideoDownloadJob({
      url: input.url,
    });

    return { jobId };
  }
}
