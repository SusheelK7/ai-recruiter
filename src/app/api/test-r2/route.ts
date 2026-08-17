import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Helper function to initialize S3Client for Cloudflare R2
const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are missing in environment variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    forcePathStyle: true,
  });
};

export async function POST(request: Request) {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { success: false, error: 'R2_BUCKET_NAME is not configured in .env' },
        { status: 500 }
      );
    }

    const r2Client = getR2Client();

    let fileContent = `This is a test file uploaded to Cloudflare R2 on ${new Date().toISOString()}`;
    let filename = `test-${Date.now()}.txt`;

    // Try parsing optional custom JSON body if provided
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await request.json();
        if (body.content) fileContent = body.content;
        if (body.filename) filename = body.filename;
      }
    } catch {
      // Fall back to default test file values if body parsing fails/empty
    }

    const uploadParams = {
      Bucket: bucketName,
      Key: filename,
      Body: fileContent,
      ContentType: 'text/plain',
    };

    await r2Client.send(new PutObjectCommand(uploadParams));

    const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const fileUrl = `${endpoint}/${bucketName}/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'Test file uploaded successfully to R2!',
      key: filename,
      bucket: bucketName,
      url: fileUrl,
      sizeBytes: Buffer.byteLength(fileContent),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('R2 POST upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload test file to R2',
        name: error.name,
        code: error.Code || error.code,
        metadata: error.$metadata,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { success: false, error: 'R2_BUCKET_NAME is not configured in .env' },
        { status: 500 }
      );
    }

    const r2Client = getR2Client();

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const response = await r2Client.send(listCommand);

    const objects = (response.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      etag: item.ETag,
    }));

    return NextResponse.json({
      success: true,
      bucket: bucketName,
      objectCount: objects.length,
      objects: objects,
    });
  } catch (error: any) {
    console.error('R2 GET list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list objects from R2',
        name: error.name,
        code: error.Code || error.code,
        metadata: error.$metadata,
      },
      { status: 500 }
    );
  }
}
