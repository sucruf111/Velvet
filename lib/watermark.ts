import sharp from 'sharp';

// "VELVETBERLIN" as SVG path (font-independent)
// V E L V E T B E R L I N
const VELVETBERLIN_PATH = `
M0,0 L5,12 L7,12 L12,0 L10,0 L6,10 L2,0 Z
M15,0 L15,12 L23,12 L23,10.5 L17,10.5 L17,6.75 L22,6.75 L22,5.25 L17,5.25 L17,1.5 L23,1.5 L23,0 Z
M26,0 L26,12 L34,12 L34,10.5 L28,10.5 L28,0 Z
M37,0 L42,12 L44,12 L49,0 L47,0 L43,10 L39,0 Z
M52,0 L52,12 L60,12 L60,10.5 L54,10.5 L54,6.75 L59,6.75 L59,5.25 L54,5.25 L54,1.5 L60,1.5 L60,0 Z
M65,0 L65,1.5 L69,1.5 L69,12 L71,12 L71,1.5 L75,1.5 L75,0 Z
M78,0 L78,12 L83,12 Q86,12 87,10.5 Q88,9 88,7.5 Q88,6 87,5.25 Q86,4.5 85,4.5 Q86,4.5 87,3.75 Q88,3 88,1.5 Q88,0 85,0 Z M80,1.5 L83,1.5 Q85,1.5 85.5,2.25 Q86,3 86,3.75 Q86,4.5 85.5,5 Q85,5.5 83,5.5 L80,5.5 Z M80,7 L83,7 Q85,7 85.5,7.75 Q86,8.5 86,9.25 Q86,10 85.5,10.25 Q85,10.5 83,10.5 L80,10.5 Z
M91,0 L91,12 L99,12 L99,10.5 L93,10.5 L93,6.75 L98,6.75 L98,5.25 L93,5.25 L93,1.5 L99,1.5 L99,0 Z
M102,0 L102,12 L107,12 Q110,12 111,10.5 Q112,9 112,7 Q112,5 111,4 Q110,3 108,2.5 L112,0 L109.5,0 L106,2.25 L104,2.25 L104,0 Z M104,3.75 L106.5,3.75 Q108.5,3.75 109.25,4.75 Q110,5.75 110,7 Q110,8.25 109.25,9.25 Q108.5,10.25 106.5,10.5 L104,10.5 Z
M115,0 L115,12 L123,12 L123,10.5 L117,10.5 L117,0 Z
M126,0 L126,12 L128,12 L128,0 Z
M131,0 L131,12 L133,12 L133,3 L140,12 L142,12 L142,0 L140,0 L140,9 L133,0 Z
`;

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
 * Generates an SVG with diagonal "VELVETBERLIN" pattern using paths (no fonts needed)
 * @param width - Image width
 * @param height - Image height
 * @returns SVG string
 */
function generateWatermarkSvg(width: number, height: number): string {
  // Scale factor based on image size (base path is ~142px wide)
  const baseWidth = 142;
  const targetWidth = Math.max(120, Math.min(width, height) / 3);
  const scale = targetWidth / baseWidth;

  // Spacing between watermarks (increased for fewer watermarks)
  const spacingX = targetWidth * 2.5;
  const spacingY = targetWidth * 1.5;

  let pathElements = '';

  // Create diagonal pattern covering the entire image
  for (let y = -height; y < height * 2; y += spacingY) {
    for (let x = -width; x < width * 2; x += spacingX) {
      // Shadow (black, offset)
      pathElements += `
        <g transform="translate(${x + 3}, ${y + 3}) rotate(-30) scale(${scale})">
          <path d="${VELVETBERLIN_PATH}" fill="black" fill-opacity="0.5"/>
        </g>`;
      // Main text (white)
      pathElements += `
        <g transform="translate(${x}, ${y}) rotate(-30) scale(${scale})">
          <path d="${VELVETBERLIN_PATH}" fill="white" fill-opacity="0.6"/>
        </g>`;
    }
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${pathElements}</svg>`;
}
