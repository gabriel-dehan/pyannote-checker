import ytdl from '@distube/ytdl-core';
import Bull from 'bull';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { extractYoutubeId } from 'src/utils/youtube';

export const captionsExtractionWorker = async (job: Bull.Job<any>) => {
  const defaultLang = 'en';
  const { url } = job.data;

  try {
    const format: string = 'ttml';
    const tmpDir = path.join(process.cwd(), 'tmp/captions');
    const fileName = `${extractYoutubeId(url)}.${format}`;
    const filePath = path.join(tmpDir, fileName);

    if (fs.existsSync(filePath)) {
      console.log(
        `[CaptionsExtractionWorker] File already exists: ${filePath}`,
      );
      return;
    }

    const info = await ytdl.getInfo(url);

    const tracks =
      info.player_response.captions?.playerCaptionsTracklistRenderer
        .captionTracks;

    if (tracks && tracks.length) {
      console.log(
        `[CaptionsExtractionWorker] Found captions for ${tracks.map(
          (t) => t.name.simpleText,
        )}`,
      );

      const track = tracks.find((t) => t.languageCode === defaultLang);
      if (track) {
        console.log(
          '[CaptionsExtractionWorker] Retrieving captions:',
          track.name.simpleText,
        );
        console.log('[CaptionsExtractionWorker] Track URL', track.baseUrl);

        https.get(
          `${track.baseUrl}&fmt=${format !== 'xml' ? format : ''}`,
          (response) => {
            response.pipe(fs.createWriteStream(filePath));
          },
        );
      } else {
        console.log(
          '[CaptionsExtractionWorker] Could not find captions for',
          defaultLang,
        );
      }
    } else {
      console.log(
        '[CaptionsExtractionWorker] No captions found for this video',
      );
    }

    console.log(`[CaptionsExtractionWorker] Captions extracted from: ${url}`);
  } catch (error) {
    console.error(
      `[CaptionsExtractionWorker] Error processing audio extraction job ${job.id}:`,
      error,
    );
    throw error;
  }
};
