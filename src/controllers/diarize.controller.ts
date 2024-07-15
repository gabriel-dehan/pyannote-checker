import { Get, JsonController, QueryParams } from 'routing-controllers';
import { VideoInput } from 'src/dtos/diarize/video';
import { DiarizeService } from 'src/services/diarize.service';
import { Service } from 'typedi';

@JsonController('/diarize')
@Service()
export class DiarizeController {
  constructor(private diarizeService: DiarizeService) {}

  @Get('/video')
  async video(@QueryParams() input: VideoInput) {
    if (await this.diarizeService.dataExistsForUrl({ url: input.url })) {
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
}
