import ytdl from '@distube/ytdl-core';
import { useRepositories } from 'config/repositories-config';
import fs from 'fs';
import path from 'path';
import { useContainer } from 'routing-controllers';
import { Container } from 'typedi';

import { JobQueue } from '../jobs/queue';

// DI from typedi
const containerWithRepositories = useRepositories();
useContainer(containerWithRepositories);

async function startWorker() {
  const jobQueue = Container.get(JobQueue);

  jobQueue.processVideoDownloadJobs(async (job) => {
    const { url } = job.data;
    try {
      const tmpDir = path.join(process.cwd(), 'tmp/videos');
      const fileName = `${extractYoutubeId(url)}.mp4`;
      const filePath = path.join(tmpDir, fileName);

      const info = await ytdl.getBasicInfo(url);
      console.log(info);

      const writeStream = fs.createWriteStream(filePath);
      ytdl(url).pipe(writeStream);

      await new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(filePath);
        ytdl(url).pipe(writeStream);

        writeStream.on('finish', resolve);
        writeStream.on('error', (error) => {
          fs.unlink(filePath, () => {}); // Clean up the incomplete file
          reject(error);
        });
      });

      console.log(`Video downloaded: ${info.videoDetails.title}, ${filePath}`);
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  });
}

function extractYoutubeId(url: string): string | null {
  const regex =
    // eslint-disable-next-line no-useless-escape
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

startWorker().catch(console.error);
