import { extname, basename } from 'path';
import * as fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
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

// resize thumbnail with detault height and width
export function resizeThumbnail(path: string, format: string) {
  return resize(path, format, HEIGHT_THUMBNAIL, WIDTH_THUMBNAIL);
}

// add a text in centre of image
export async function addTextToImage(imagePath: string, text: string) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0);

  context.font = '14px Arial';
  context.fillStyle = '#bbbbbb';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const x = canvas.width / 2;
  const y = canvas.height / 2;

  context.fillText(text, x, y);

  const buffer = canvas.toBuffer('image/png');
  return buffer;
}
