declare module 'fluent-ffmpeg' {
  import { Stream } from 'stream';

  interface FfmpegCommand {
    input(input: string | Stream): FfmpegCommand;
    outputOptions(options: string | string[]): FfmpegCommand;
    output(output: string | Stream): FfmpegCommand;
    on(event: 'end', callback: () => void): FfmpegCommand;
    on(event: 'error', callback: (err: Error) => void): FfmpegCommand;
    run(): void;
  }

  function ffmpeg(input?: string | Stream): FfmpegCommand;

  export = ffmpeg;
}
