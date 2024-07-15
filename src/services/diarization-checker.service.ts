import { Inject, Service } from 'typedi';
import { VideoInput } from 'src/dtos/diarization-checker/download-video';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Service()
export class DiarizationCheckerService {
  constructor() {}

  async downloadVideo(input: VideoInput) {
    return `Hello ${input.url}!`;
  }
}
