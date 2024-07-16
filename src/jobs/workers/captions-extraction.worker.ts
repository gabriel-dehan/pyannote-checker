import ytdl from '@distube/ytdl-core';
import Bull from 'bull';
import fs from 'fs';
import https from 'https';
import { Duration } from 'luxon';
import path from 'path';
import { extractYoutubeId } from 'src/utils/youtube';
import { xml2js } from 'xml-js';

// Needs a big cleanup, and maybe use fetch everywhere instead of https
export const captionsExtractionWorker = async (job: Bull.Job<any>) => {
  const defaultLang = 'en';
  const { url } = job.data;

  try {
    const format: string = 'xml';
    const tmpDir = path.join(process.cwd(), 'tmp/captions');
    const fileName = `${extractYoutubeId(url)}.json`;
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

        const captionsXML = await new Promise<string>((resolve, reject) => {
          https.get(
            `${track.baseUrl}&fmt=${format !== 'xml' ? format : ''}`,
            (response) => {
              let data = '';
              response.on('data', (chunk) => {
                data += chunk;
              });
              response.on('end', () => {
                resolve(data);
              });
              response.on('error', (error) => {
                reject(error);
              });
            },
          );
        });

        // @ts-expect-error xml2js is incorrectly typed
        const captions = xml2js(captionsXML, { compact: true }).transcript.text;
        const normalizedCaptions = normalizeCaptions(captions);

        fs.writeFileSync(filePath, JSON.stringify(normalizedCaptions, null, 2));
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

function normalizeCaptions(
  captions: any[],
): { start: number; end: number; text: string }[] {
  return captions.map((caption) => {
    const start = parseFloat(caption._attributes.start);
    const duration = parseFloat(caption._attributes.dur);

    if (isNaN(start) || isNaN(duration)) {
      console.error('Invalid start or duration:', caption._attributes);
      return { start: 0, end: 0, text: caption._text };
    }

    const startDuration = Duration.fromMillis(start * 1000);
    const durationDuration = Duration.fromMillis(duration * 1000);
    const endDuration = startDuration.plus(durationDuration);

    const text = caption._text.replace(/&#39;/g, "'");

    return {
      start: Number(startDuration.as('seconds').toFixed(3)),
      end: Number(endDuration.as('seconds').toFixed(3)),
      text,
    };
  });
}
