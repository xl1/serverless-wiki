import { Context, HttpRequest } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { MessageResponse, msg } from './response';
import imageType from 'image-type';

const blobConnectionString = process.env.IMAGE_STORAGE!;
const blobContainerName = process.env.IMAGE_CONTAINER_NAME || 'images';
const imageBaseUrl = process.env.IMAGE_BASE_URL;

export default async function (context: Context, req: HttpRequest): Promise<MessageResponse> {
    if (!req.body || !req.body.length) return msg(400, 'image not set');
    if (req.body.length > 5 * 1024 * 1024) return msg(400, 'file too large');

    const contentType = req.headers["x-file-type"];
    if (!contentType || !contentType.startsWith('image/')) {
        return msg(400, 'invalid content type');
    }

    const buffer = Buffer.from(req.body);
    const detected = imageType(buffer);
    if (!detected || !['jpg', 'png', 'gif', 'webp'].includes(detected.ext)) {
        return msg(400, 'jpg, png, gif and webp images are supported');
    }

    const name = uuidv4();
    const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
    const containerClient = blobServiceClient.getContainerClient(blobContainerName);
    await containerClient.createIfNotExists({ access: 'blob' });
    const blockBlobClient = containerClient.getBlockBlobClient(name);
    await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
            blobContentType: contentType
        }
    });

    const url = imageBaseUrl ? `${imageBaseUrl}/{name}` : blockBlobClient.url;
    return msg(200, url);
}
