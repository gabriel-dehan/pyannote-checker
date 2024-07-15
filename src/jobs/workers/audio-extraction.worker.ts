import Bull from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

export const audioExtractionWorker = async (job: Bull.Job<any>) => {
  const { filePath } = job.data;
  try {
    void new Promise((resolve, reject) => {
      // Bit ugly
      const audioPath = filePath
        .replace('.mp4', '.wav')
        .replace('videos/', 'audios/');

      if (fs.existsSync(audioPath)) {
        console.log(
          `[CaptionsExtractionWorker] File already exists: ${filePath}`,
        );
        return;
      }

      ffmpeg(filePath)
        .outputOptions('-acodec pcm_s16le') // Set audio codec to PCM 16-bit
        .outputOptions('-ac 1') // Set to mono channel
        .outputOptions('-ar 16000') // Set sample rate to 16kHz
        .outputOptions('-f wav') // Set format to wav
        .output(audioPath)
        .on('end', () => {
          console.log(
            `[AudioExtractionWorker] Audio extracted to: ${audioPath}`,
          );
          resolve(audioPath);
        })
        .on('error', (err: Error) => {
          console.error('[AudioExtractionWorker] Error extracting audio:', err);
          reject(new Error('Failed to extract audio'));
        })
        .run();
    });
  } catch (error) {
    console.error(
      `[AudioExtractionWorker] Error processing audio extraction job ${job.id}:`,
      error,
    );
    throw error;
  }
};
