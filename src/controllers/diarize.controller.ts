import { VideoRepository } from 'config/repositories-config';
import fs from 'fs/promises';
import { Context } from 'koa';
import path from 'path';
import {
  Body,
  Controller,
  Ctx,
  Get,
  Post,
  QueryParams,
} from 'routing-controllers';
import { VideoInput } from 'src/dtos/diarize/video';
import { DiarizeService } from 'src/services/diarize.service';
import { extractYoutubeId } from 'src/utils/youtube';
import { Inject, Service } from 'typedi';

@Controller('/diarize')
@Service()
export class DiarizeController {
  constructor(
    private diarizeService: DiarizeService,
    @Inject('VideoRepository') private videoRepository: VideoRepository,
  ) {}

  // Main page
  @Get('/video')
  async video(@QueryParams() input: VideoInput, @Ctx() ctx: Context) {
    let isProcessing = true;
    let data:
      | {
          name: string;
          url: string;
          videoId: string | null;
          captions: string;
          diarization: string;
        }
      | undefined;

    // If the data doesn't exist, queue a job to download the video
    if (!(await this.diarizeService.dataExistsForUrl({ url: input.url }))) {
      try {
        await this.diarizeService.downloadVideo({
          url: input.url,
        });

        isProcessing = true;
        data = {
          name: '',
          url: input.url,
          videoId: null,
          captions: '',
          diarization: '',
        };
      } catch (error) {
        console.error('Error queueing job:', error);
        throw new Error('Failed to queue job');
      }
    } else {
      data = await this.diarizeService.getDataForUrl({
        url: input.url,
      });
    }

    await ctx.render('diarize/video', {
      url: input.url,
      isProcessing,
      data,
      title: `Diarize ${data?.name}`,
    });

    return ctx.body;
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
