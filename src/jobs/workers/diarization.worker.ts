import Bull from 'bull';
import https from 'https';
import { Video } from 'src/entities/video.entity';
import { getS3KeyForUrl, getSignedAudioUrlFromS3 } from 'src/utils/s3';
import Container from 'typedi';
import { Repository } from 'typeorm';

export const diarizationWorker = async (job: Bull.Job<any>) => {
  const videoRepository: Repository<Video> = Container.get('VideoRepository');

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
        console.log(`[DiarizationWorker] Status Code: ${res.statusCode}`);
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', async () => {
          const data = JSON.parse(responseData);
          console.log('[DiarizationWorker] Pyannote API Response:', data);

          // Create or update video by url
          const video = await videoRepository.findOne({ where: { url } });
          if (video) {
            video.lastDiarizationJobId = data.jobId;

            await videoRepository.save(video);
          } else {
            const newVideo = new Video({
              name: url, // temp do a ytdl get info
              url,
              lastDiarizationJobId: data.jobId,
            });

            await videoRepository.save(newVideo);
          }
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
