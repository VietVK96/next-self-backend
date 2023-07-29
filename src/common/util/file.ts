import { extname, basename } from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
const RESERVED_CHARACTERS_PATTERN =
  /[<>:"/\\|?*]|[\x00-\x1F]|[\x7F\xA0\xAD]|[#\[\]@!$&'()+,;=]|[{}^\~`]/g;

const HEIGHT_THUMBNAIL = 200;
const WIDTH_THUMBNAIL = 200;

// $container->get('app.utils.file')->sanitize($file->getOriginalFilename());
export function sanitizeFilename(filename: string, replacement = '-'): string {
  filename = filename.replace(RESERVED_CHARACTERS_PATTERN, replacement);
  filename = filename.replace(/^-+/, '').replace(/-+$/, '');

  const extension = extname(filename);
  const basenameWithoutExtension = basename(filename, extension);

  const sanitizedBasename = basenameWithoutExtension.substring(
    0,
    255 - (extension ? extension.length + 1 : 0),
  );
  const sanitizedFilename =
    sanitizedBasename + (extension ? `.${extension}` : '');

  return sanitizedFilename;
}

// resize image with format width and height
export function resize(path, format, width, height) {
  const readStream = fs.createReadStream(path);
  let transform = sharp();
  if (format) {
    transform = transform.toFormat(format);
  }
  if (width || height) {
    transform = transform.resize(width, height);
  }
  return readStream.pipe(transform);
}
interface ImageData {
  base64Data: string;
  width: number;
  height: number;
}
export async function resizeAndConvertToBase64(
  imagePath: string,
  width: number,
  height: number,
): Promise<ImageData> {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const resizedImageBuffer = await image
      .resize(width, height, { fit: 'contain', position: 'center' })
      .toBuffer();

    const base64Data = resizedImageBuffer.toString('base64');
    const { width: resizedWidth, height: resizedHeight } = metadata;

    return { base64Data, width: resizedWidth, height: resizedHeight };
  } catch (error) {
    console.error('Error resizing and converting image:', error);
    throw error;
  }
}

// resize thumbnail with detault height and width
export function resizeThumbnail(path: string, format: string) {
  return resize(path, format, HEIGHT_THUMBNAIL, WIDTH_THUMBNAIL);
}
