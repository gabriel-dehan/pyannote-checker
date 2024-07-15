import { VideoRepository } from 'config/repositories-config';
import fs from 'fs/promises';
import path from 'path';
import {
  Body,
  Get,
  JsonController,
  Post,
  QueryParams,
} from 'routing-controllers';
import { VideoInput } from 'src/dtos/diarize/video';
import { DiarizeService } from 'src/services/diarize.service';
import { getS3KeyForUrl, getSignedAudioUrlFromS3 } from 'src/utils/s3';
import { extractYoutubeId } from 'src/utils/youtube';
import { Inject, Service } from 'typedi';

@JsonController('/diarize')
@Service()
export class DiarizeController {
  constructor(
    private diarizeService: DiarizeService,
    @Inject('VideoRepository') private videoRepository: VideoRepository,
  ) {}

  // Main page
  @Get('/video')
  async video(@QueryParams() input: VideoInput) {
    if (!(await this.diarizeService.dataExistsForUrl({ url: input.url }))) {
      const key = getS3KeyForUrl(input.url);
      const audioUrl = await getSignedAudioUrlFromS3(key);
      console.log(audioUrl);
      return { message: 'Data already exists' };
    }
    try {
      const { jobId } = await this.diarizeService.downloadVideo({
        url: input.url,
      });
      return { message: 'Video download queued', jobId };
    } catch (error) {
      console.error('Error queueing job:', error);
      throw new Error('Failed to queue job');
    }
  }

  // Handle webhooks from Pyannote
  @Post('/webhook')
  async webhook(@Body() body: any) {
    console.log('[DiarizeController] Webhook:', JSON.stringify(body, null, 2));

    try {
      const video = await this.videoRepository.findOne({
        where: {
          lastDiarizationJobId: body.jobId,
        },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      const url = video.url;

      if (!url) {
        throw new Error('URL not found in webhook payload');
      }

      const tmpDir = path.join(process.cwd(), 'tmp/diarizations');
      const fileName = `${extractYoutubeId(url)}.json`;
      const filePath = path.join(tmpDir, fileName);

      await fs.writeFile(filePath, JSON.stringify(body.output, null, 2));

      console.log(
        `[DiarizeController] Diarization output written to ${filePath}`,
      );

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('[DiarizeController] Error processing webhook:', error);
      throw new Error('Failed to process webhook');
    }
  }
}
