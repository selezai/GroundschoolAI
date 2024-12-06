import { GridFSBucket, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { Readable } from 'stream';

let bucket: GridFSBucket;

// Initialize GridFS bucket
const initBucket = () => {
  if (!bucket) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'study-materials'
    });
  }
  return bucket;
};

export async function uploadToStorage(
  fileBuffer: Buffer,
  originalName: string
): Promise<string> {
  const bucket = initBucket();
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(originalName, {
      contentType: getContentType(originalName.split('.').pop()),
    });

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream)
      .on('error', (error) => {
        console.error('Error uploading to GridFS:', error);
        reject(new Error('Failed to upload file'));
      })
      .on('finish', () => {
        resolve(uploadStream.id.toString());
      });
  });
}

export async function getFileStream(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string;
}> {
  const bucket = initBucket();
  
  try {
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
    if (!files.length) {
      throw new Error('File not found');
    }

    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    return {
      stream: downloadStream,
      contentType: files[0].contentType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error getting file stream:', error);
    throw new Error('Failed to get file');
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  const bucket = initBucket();
  
  try {
    await bucket.delete(new ObjectId(fileId));
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

function getContentType(extension: string | undefined): string {
  if (!extension) {
    return 'application/octet-stream';
  }

  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}
