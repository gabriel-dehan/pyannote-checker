import {
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';

import { extractYoutubeId } from './youtube';

export function getS3KeyForUrl(url: string) {
  const fileName = `${extractYoutubeId(url)}.wav`;

  return `audios/${fileName}`;
}

export async function getSignedAudioUrlFromS3(key: string, expiresIn = 3600) {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('[S3] Error generating signed URL:', error);
    throw error;
  }
}

// Maybe make it more generic and an S3 Client or Service for future use
export async function uploadToS3(audioPath: string): Promise<void> {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });

  const fileContent = await fs.promises.readFile(audioPath);
  const fileName = audioPath.split('/').pop();
  const s3Key = `audios/${fileName}`;

  let params: PutObjectCommandInput = {
    Bucket: process.env.AWS_BUCKET,
    Key: s3Key,
  };

  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: s3Key }),
    );
    console.log(`[AudioExtractionWorker] File already exists in S3: ${s3Key}`);
    return;
  } catch (err) {
    // If NotFound error, proceed with upload
    if (!(err instanceof NotFound)) {
      throw err;
    }
  }

  params = {
    ...params,
    Body: fileContent,
    ContentType: 'audio/wav',
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(
      `[AudioExtractionWorker] Successfully uploaded ${fileName} to S3`,
    );
  } catch (err) {
    console.error('[AudioExtractionWorker] Error uploading to S3:', err);
    throw err;
  }
}
