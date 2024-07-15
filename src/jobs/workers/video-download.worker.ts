import ytdl from '@distube/ytdl-core';
import Bull from 'bull';
import fs from 'fs';
import path from 'path';
import { extractYoutubeId } from 'src/utils/youtube';
import Container from 'typedi';

import { JobQueue } from '../job-queue';

export const videoDownloadWorker = async (job: Bull.Job<any>) => {
  const jobQueue = Container.get(JobQueue);
  const { url } = job.data;

  try {
    console.log(`[VideoDownloadWorker] Downloading video from: ${url}`);
    const tmpDir = path.join(process.cwd(), 'tmp/videos');
    const fileName = `${extractYoutubeId(url)}.mp4`;
    const filePath = path.join(tmpDir, fileName);

    const info = await ytdl.getBasicInfo(url);
    console.log(
      `[VideoDownloadWorker] Video found: ${info.videoDetails.title}`,
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      const writeStream = fs.createWriteStream(filePath);
      ytdl(url, { quality: '18' }).pipe(writeStream);

      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        ytdl(url).pipe(writeStream);

        writeStream.on('finish', resolve);
        writeStream.on('error', (error) => {
          fs.unlink(filePath, () => {}); // Clean up the incomplete file
          reject(error);
        });
      });

      console.log(
        `[VideoDownloadWorker] Video downloaded: ${info.videoDetails.title}, ${filePath}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await jobQueue.addCaptionsExtractionJob({ url });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await jobQueue.addAudioExtractionJob({ filePath });
  } catch (error) {
    console.error(
      `[VideoDownloadWorker] Error processing job ${job.id}:`,
      error,
    );
    throw error;
  }
};
