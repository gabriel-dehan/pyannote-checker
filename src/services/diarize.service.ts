import { VideoRepository } from 'config/repositories-config';
import fs from 'fs';
import path from 'path';
import { VideoInput } from 'src/dtos/diarize/video';
import { JobQueue } from 'src/jobs/job-queue';
import { extractYoutubeId } from 'src/utils/youtube';
import { Inject, Service } from 'typedi';

@Service()
export class DiarizeService {
  constructor(
    private jobQueue: JobQueue,
    @Inject('VideoRepository') private videoRepository: VideoRepository,
  ) {}

  // TODO: Also check if sound has been extracted, as well as captions and diarization
  async dataExistsForUrl(input: VideoInput) {
    const tmpDir = path.join(process.cwd(), 'tmp/videos');
    const videoFileName = `${extractYoutubeId(input.url)}.mp4`;
    const videoPath = path.join(tmpDir, videoFileName);

    return fs.existsSync(videoPath);
  }

  async getDataForUrl(input: VideoInput) {
    const video = await this.videoRepository.findOne({
      where: {
        url: input.url,
      },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    const fileBaseName = extractYoutubeId(input.url);
    const tmpDir = path.join(process.cwd(), 'tmp/');
    const captionsPath = path.join(tmpDir, 'captions', `${fileBaseName}.ttml`);
    const diarizationPath = path.join(
      tmpDir,
      'diarizations',
      `${fileBaseName}.json`,
    );

    if (!fs.existsSync(captionsPath) || !fs.existsSync(diarizationPath)) {
      throw new Error(`Data not found for ${input.url}`);
    }

    // Yeah yeah the data should be stored in the DB and not read from the disk but I wanted to try a DB less approach at first, for fun, so most of the data is stored in the disk
    return {
      name: video.name,
      videoId: extractYoutubeId(input.url),
      captions: fs.readFileSync(captionsPath, 'utf8'),
      diarization: fs.readFileSync(diarizationPath, 'utf8'),
    };
  }

  async downloadVideo(input: VideoInput) {
    const jobId = await this.jobQueue.addVideoDownloadJob({
      url: input.url,
    });

    return { jobId };
  }
}
