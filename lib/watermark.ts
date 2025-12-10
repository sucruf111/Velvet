import sharp from 'sharp';

/**
 * Applies a diagonal "VELVETBERLIN" watermark across the image
 * @param imageBuffer - The original image buffer
 * @returns The watermarked image buffer
 */
export async function applyWatermark(imageBuffer: Buffer<ArrayBufferLike>): Promise<Buffer<ArrayBufferLike>> {
  try {
    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const { width = 800, height = 600, format } = metadata;

    // Create SVG watermark pattern
    const watermarkSvg = generateWatermarkSvg(width, height);

    // Apply watermark and preserve format
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{
        input: Buffer.from(watermarkSvg),
        blend: 'over',
      }])
      .toFormat(format || 'jpeg', { quality: 90 })
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('Watermark error:', error);
    // Return original buffer if watermarking fails
    return imageBuffer;
  }
}

/**
 * Generates an SVG with diagonal "VELVETBERLIN" text pattern
 * @param width - Image width
 * @param height - Image height
 * @returns SVG string
 */
function generateWatermarkSvg(width: number, height: number): string {
  // Calculate font size proportional to image (min 16px, scales with smaller dimension)
  const fontSize = Math.max(16, Math.min(width, height) / 25);
  // Space between watermark text repetitions
  const spacing = fontSize * 8;

  let textElements = '';

  // Create diagonal pattern covering the entire image
  // Start before 0,0 and extend past width,height to cover corners after rotation
  for (let y = -height; y < height * 2; y += spacing) {
    for (let x = -width; x < width * 2; x += spacing) {
      textElements += `
        <text
          x="${x}"
          y="${y}"
          transform="rotate(-30, ${x}, ${y})"
          fill="white"
          fill-opacity="0.5"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          style="text-shadow: 1px 1px 3px rgba(0,0,0,0.7);"
        >VELVETBERLIN</text>`;
    }
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${textElements}</svg>`;
}
