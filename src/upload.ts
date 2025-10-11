import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { msg } from './response.js';
import imageType from 'image-type';

const blobConnectionString = process.env.IMAGE_STORAGE!;
const blobContainerName = process.env.IMAGE_CONTAINER_NAME || 'images';
const imageBaseUrl = process.env.IMAGE_BASE_URL;

async function uploadHandler(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
    if (!req.body) return msg(400, 'image not set');

    const contentType = req.headers.get("x-file-type");
    if (!contentType || !contentType.toLowerCase().startsWith('image/')) {
        return msg(400, 'invalid content type');
    }

    const buf = await req.arrayBuffer();
    if (buf.byteLength === 0) return msg(400, 'file is empty');
    if (buf.byteLength > 5 * 1024 * 1024) return msg(400, 'file too large');

    const buffer = Buffer.from(buf);
    const detected = await imageType(buffer);
    if (!detected || !['jpg', 'png', 'gif', 'webp'].includes(detected.ext)) {
        return msg(400, 'jpg, png, gif and webp images are supported');
    }

    const name = uuidv4();
    const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
    const containerClient = blobServiceClient.getContainerClient(blobContainerName);
    await containerClient.createIfNotExists({ access: 'blob' });
    const blockBlobClient = containerClient.getBlockBlobClient(name);
    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
            blobContentType: contentType
        }
    });

    const url = imageBaseUrl ? `${imageBaseUrl}/${name}` : blockBlobClient.url;
    return msg(200, url);
}

app.http('upload', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: uploadHandler
});
