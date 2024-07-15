import Bull from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { uploadToS3 } from 'src/utils/s3';

export const audioExtractionWorker = async (job: Bull.Job<any>) => {
  const { filePath } = job.data;
  try {
    const audioPath = filePath
      .replace('.mp4', '.wav')
      .replace('videos/', 'audios/');

    if (fs.existsSync(audioPath)) {
      console.log(
        `[CaptionsExtractionWorker] File already exists: ${filePath}`,
      );

      await uploadToS3(audioPath);
      console.log(`[AudioExtractionWorker] Audio uploaded to S3: ${audioPath}`);
      return audioPath;
    }

    // If the file doesn't exist, proceed with audio extraction
    await extractAudio(filePath, audioPath);
    await uploadToS3(audioPath);
    console.log(`[AudioExtractionWorker] Audio uploaded to S3: ${audioPath}`);
    return audioPath;
  } catch (error) {
    console.error(
      `[AudioExtractionWorker] Error processing audio extraction job ${job.id}:`,
      error,
    );
    throw error;
  }
};

function extractAudio(filePath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions('-acodec pcm_s16le')
      .outputOptions('-ac 1')
      .outputOptions('-ar 16000')
      .outputOptions('-f wav')
      .output(audioPath)
      .on('end', () => {
        console.log(`[AudioExtractionWorker] Audio extracted to: ${audioPath}`);
        resolve();
      })
      .on('error', (err: Error) => {
        console.error('[AudioExtractionWorker] Error extracting audio:', err);
        reject(new Error('Failed to extract audio'));
      })
      .run();
  });
}
