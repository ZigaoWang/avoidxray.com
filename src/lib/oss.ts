import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const client = new S3Client({
  region: process.env.ALIYUN_OSS_REGION!,
  endpoint: `https://${process.env.ALIYUN_OSS_REGION}.aliyuncs.com`,
  credentials: {
    accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET!,
  },
})

const bucket = process.env.ALIYUN_OSS_BUCKET!

export async function uploadToOSS(buffer: Buffer, key: string): Promise<string> {
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
  }))
  return `https://${bucket}.${process.env.ALIYUN_OSS_REGION}.aliyuncs.com/${key}`
}

export async function deleteFromOSS(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }))
}

export async function listOSSObjects(prefix?: string): Promise<string[]> {
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }))

    if (response.Contents) {
      keys.push(...response.Contents.map(obj => obj.Key!).filter(Boolean))
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return keys
}
