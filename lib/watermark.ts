import sharp from 'sharp';

// "VELVETBERLIN" as SVG path (font-independent)
// Generated from a bold sans-serif font, scaled to ~200px width
const VELVETBERLIN_PATH = `M0,0 L4.5,12 L6,12 L10.5,0 L8.5,0 L5.25,9.5 L2,0 Z
M13,0 L13,12 L20,12 L20,10.5 L15,10.5 L15,6.5 L19,6.5 L19,5 L15,5 L15,1.5 L20,1.5 L20,0 Z
M23,0 L23,12 L30,12 L30,10.5 L25,10.5 L25,0 Z
M32,0 L36.5,12 L38,12 L42.5,0 L40.5,0 L37.25,9.5 L34,0 Z
M45,0 L45,12 L52,12 L52,10.5 L47,10.5 L47,6.5 L51,6.5 L51,5 L47,5 L47,1.5 L52,1.5 L52,0 Z
M56,0 L56,12 L63,12 L63,10.5 L58,10.5 L58,0 Z
M68,1.5 L68,12 L70,12 L70,1.5 L74,1.5 L74,0 L64,0 L64,1.5 Z
M77,0 L77,12 L82,12 Q85,12 86,10 Q87,8 87,6 Q87,4 86,2 Q85,0 82,0 Z M79,1.5 L81.5,1.5 Q83.5,1.5 84.25,3 Q85,4.5 85,6 Q85,7.5 84.25,9 Q83.5,10.5 81.5,10.5 L79,10.5 Z
M90,0 L90,12 L97,12 L97,10.5 L92,10.5 L92,6.5 L96,6.5 L96,5 L92,5 L92,1.5 L97,1.5 L97,0 Z
M100,0 L100,12 L105,12 Q107.5,12 108.75,10.5 Q110,9 110,7 Q110,5.5 109.25,4.25 Q108.5,3 107,2.5 L110,0 L107.5,0 L105,2.25 L102,2.25 L102,0 Z M102,3.75 L104.5,3.75 Q106.5,3.75 107.25,4.75 Q108,5.75 108,7 Q108,8.25 107.25,9.125 Q106.5,10 104.5,10.5 L102,10.5 Z
M113,0 L113,12 L120,12 L120,10.5 L115,10.5 L115,0 Z
M123,0 L123,12 L125,12 L125,0 Z
M129,0 L129,12 L131,12 L131,3 L137,12 L139,12 L139,0 L137,0 L137,9 L131,0 Z`;

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
  // Scale factor based on image size (base path is ~140px wide)
  const baseWidth = 140;
  const targetWidth = Math.max(100, Math.min(width, height) / 4);
  const scale = targetWidth / baseWidth;

  // Spacing between watermarks
  const spacingX = targetWidth * 1.5;
  const spacingY = targetWidth * 0.8;

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
