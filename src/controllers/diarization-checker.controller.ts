import { Get, JsonController, QueryParams } from 'routing-controllers';
import { VideoInput } from 'src/dtos/diarization-checker/download-video';
import { DiarizationCheckerService } from 'src/services/diarization-checker.service';
import { Service } from 'typedi';

@JsonController('/diarization-checker')
@Service()
export class DiarizationCheckerController {
  constructor(private diarizationCheckerService: DiarizationCheckerService) {}

  @Get('/download-video')
  // async downloadVideo(@Body() input: VideoInput) {
  async downloadVideo(@QueryParams() input: VideoInput) {
    return await this.diarizationCheckerService.downloadVideo(input);
  }
}
