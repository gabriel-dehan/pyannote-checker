import Bull from 'bull';
import https from 'https';
import { getS3KeyForUrl, getSignedAudioUrlFromS3 } from 'src/utils/s3';

export const diarizationWorker = async (job: Bull.Job<any>) => {
  const apiUrl = 'https://api.pyannote.ai/v1/diarize';
  const apiKey = process.env.PYANNOTE_API_KEY;
  const { url } = job.data;

  try {
    const key = getS3KeyForUrl(url);
    try {
      const audioUrl = await getSignedAudioUrlFromS3(key);

      const postData = JSON.stringify({
        url: audioUrl,
        webhook: process.env.WEBHOOK_BASE_URL
          ? `${process.env.WEBHOOK_BASE_URL}/api/diarize/webhook`
          : '',
      });

      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length,
        },
      };

      const req = https.request(apiUrl, options, (res) => {
        res.on('end', (data: any) => {
          console.log(
            '[DiarizationWorker] Pyannote API Response:',
            JSON.parse(data),
          );
        });
        res.on('error', (error: any) => {
          console.error('[DiarizationWorker] Pyannote API Error:', error);
        });
      });

      req.write(postData);
      req.end();

      console.log(`[DiarizationWorker] Diarization request sent for: ${url}`);
    } catch (error) {
      console.error(
        `[DiarizationWorker] Error getting signed audio URL from S3:`,
        error,
      );
      throw error;
    }
  } catch (error) {
    console.error(
      `[DiarizationWorker] Error processing audio extraction job ${job.id}:`,
      error,
    );
    throw error;
  }
};
