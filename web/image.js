
  // from https://github.com/processing/p5.js/blob/main/src/image/filters.js
function thresholdFilter(pixels, level) {
    if (level === undefined) {
      level = 0.5;
    }
    const thresh = Math.floor(level * 255);
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      let val;
      if (gray >= thresh) {
        val = 255;
      } else {
        val = 0;
      }
      pixels[i] = pixels[i + 1] = pixels[i + 2] = val;
    }
  }
  // from https://css-tricks.com/manipulating-pixels-using-canvas/
  function invertColors(pixels) {
    for (var i = 0; i < pixels.length; i+= 4) {
      pixels[i] = pixels[i] ^ 255; // Invert Red
      pixels[i+1] = pixels[i+1] ^ 255; // Invert Green
      pixels[i+2] = pixels[i+2] ^ 255; // Invert Blue
    }
  }

  // internal kernel stuff for the gaussian blur filter
  let blurRadius;
  let blurKernelSize;
  let blurKernel;
  let blurMult;

  // from https://github.com/processing/p5.js/blob/main/src/image/filters.js
  function buildBlurKernel(r) {
  let radius = (r * 3.5) | 0;
  radius = radius < 1 ? 1 : radius < 248 ? radius : 248;

  if (blurRadius !== radius) {
    blurRadius = radius;
    blurKernelSize = (1 + blurRadius) << 1;
    blurKernel = new Int32Array(blurKernelSize);
    blurMult = new Array(blurKernelSize);
    for (let l = 0; l < blurKernelSize; l++) {
      blurMult[l] = new Int32Array(256);
    }

    let bk, bki;
    let bm, bmi;

    for (let i = 1, radiusi = radius - 1; i < radius; i++) {
      blurKernel[radius + i] = blurKernel[radiusi] = bki = radiusi * radiusi;
      bm = blurMult[radius + i];
      bmi = blurMult[radiusi--];
      for (let j = 0; j < 256; j++) {
        bm[j] = bmi[j] = bki * j;
      }
    }
    bk = blurKernel[radius] = radius * radius;
    bm = blurMult[radius];

    for (let k = 0; k < 256; k++) {
      bm[k] = bk * k;
    }
  }
}

// from https://github.com/processing/p5.js/blob/main/src/image/filters.js
function blurARGB(pixels, canvas, radius) {
  const width = canvas.width;
  const height = canvas.height;
  const numPackedPixels = width * height;
  const argb = new Int32Array(numPackedPixels);
  for (let j = 0; j < numPackedPixels; j++) {
    argb[j] = getARGB(pixels, j);
  }
  let sum, cr, cg, cb, ca;
  let read, ri, ym, ymi, bk0;
  const a2 = new Int32Array(numPackedPixels);
  const r2 = new Int32Array(numPackedPixels);
  const g2 = new Int32Array(numPackedPixels);
  const b2 = new Int32Array(numPackedPixels);
  let yi = 0;
  buildBlurKernel(radius);
  let x, y, i;
  let bm;
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      cb = cg = cr = ca = sum = 0;
      read = x - blurRadius;
      if (read < 0) {
        bk0 = -read;
        read = 0;
      } else {
        if (read >= width) {
          break;
        }
        bk0 = 0;
      }
      for (i = bk0; i < blurKernelSize; i++) {
        if (read >= width) {
          break;
        }
        const c = argb[read + yi];
        bm = blurMult[i];
        ca += bm[(c & -16777216) >>> 24];
        cr += bm[(c & 16711680) >> 16];
        cg += bm[(c & 65280) >> 8];
        cb += bm[c & 255];
        sum += blurKernel[i];
        read++;
      }
      ri = yi + x;
      a2[ri] = ca / sum;
      r2[ri] = cr / sum;
      g2[ri] = cg / sum;
      b2[ri] = cb / sum;
    }
    yi += width;
  }
  yi = 0;
  ym = -blurRadius;
  ymi = ym * width;
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      cb = cg = cr = ca = sum = 0;
      if (ym < 0) {
        bk0 = ri = -ym;
        read = x;
      } else {
        if (ym >= height) {
          break;
        }
        bk0 = 0;
        ri = ym;
        read = x + ymi;
      }
      for (i = bk0; i < blurKernelSize; i++) {
        if (ri >= height) {
          break;
        }
        bm = blurMult[i];
        ca += bm[a2[read]];
        cr += bm[r2[read]];
        cg += bm[g2[read]];
        cb += bm[b2[read]];
        sum += blurKernel[i];
        ri++;
        read += width;
      }
      argb[x + yi] =
        ((ca / sum) << 24) |
        ((cr / sum) << 16) |
        ((cg / sum) << 8) |
        (cb / sum);
    }
    yi += width;
    ymi += width;
    ym++;
  }
  setPixels(pixels, argb);
}

function getARGB (data, i) {
  const offset = i * 4;
  return (
    ((data[offset + 3] << 24) & 0xff000000) |
    ((data[offset] << 16) & 0x00ff0000) |
    ((data[offset + 1] << 8) & 0x0000ff00) |
    (data[offset + 2] & 0x000000ff)
  );
};

function setPixels (pixels, data) {
  let offset = 0;
  for (let i = 0, al = pixels.length; i < al; i++) {
    offset = i * 4;
    pixels[offset + 0] = (data[i] & 0x00ff0000) >>> 16;
    pixels[offset + 1] = (data[i] & 0x0000ff00) >>> 8;
    pixels[offset + 2] = data[i] & 0x000000ff;
    pixels[offset + 3] = (data[i] & 0xff000000) >>> 24;
  }
};

  // from https://github.com/processing/p5.js/blob/main/src/image/filters.js
 function dilate(pixels, canvas) {
  let currIdx = 0;
  const maxIdx = pixels.length ? pixels.length / 4 : 0;
  const out = new Int32Array(maxIdx);
  let currRowIdx, maxRowIdx, colOrig, colOut, currLum;

  let idxRight, idxLeft, idxUp, idxDown;
  let colRight, colLeft, colUp, colDown;
  let lumRight, lumLeft, lumUp, lumDown;

  while (currIdx < maxIdx) {
    currRowIdx = currIdx;
    maxRowIdx = currIdx + canvas.width;
    while (currIdx < maxRowIdx) {
      colOrig = colOut = getARGB(pixels, currIdx);
      idxLeft = currIdx - 1;
      idxRight = currIdx + 1;
      idxUp = currIdx - canvas.width;
      idxDown = currIdx + canvas.width;

      if (idxLeft < currRowIdx) {
        idxLeft = currIdx;
      }
      if (idxRight >= maxRowIdx) {
        idxRight = currIdx;
      }
      if (idxUp < 0) {
        idxUp = 0;
      }
      if (idxDown >= maxIdx) {
        idxDown = currIdx;
      }
      colUp = getARGB(pixels, idxUp);
      colLeft = getARGB(pixels, idxLeft);
      colDown = getARGB(pixels, idxDown);
      colRight = getARGB(pixels, idxRight);

      //compute luminance
      currLum =
        77 * ((colOrig >> 16) & 0xff) +
        151 * ((colOrig >> 8) & 0xff) +
        28 * (colOrig & 0xff);
      lumLeft =
        77 * ((colLeft >> 16) & 0xff) +
        151 * ((colLeft >> 8) & 0xff) +
        28 * (colLeft & 0xff);
      lumRight =
        77 * ((colRight >> 16) & 0xff) +
        151 * ((colRight >> 8) & 0xff) +
        28 * (colRight & 0xff);
      lumUp =
        77 * ((colUp >> 16) & 0xff) +
        151 * ((colUp >> 8) & 0xff) +
        28 * (colUp & 0xff);
      lumDown =
        77 * ((colDown >> 16) & 0xff) +
        151 * ((colDown >> 8) & 0xff) +
        28 * (colDown & 0xff);

      if (lumLeft > currLum) {
        colOut = colLeft;
        currLum = lumLeft;
      }
      if (lumRight > currLum) {
        colOut = colRight;
        currLum = lumRight;
      }
      if (lumUp > currLum) {
        colOut = colUp;
        currLum = lumUp;
      }
      if (lumDown > currLum) {
        colOut = colDown;
        currLum = lumDown;
      }
      out[currIdx++] = colOut;
    }
  }
  setPixels(pixels, out);
};

// pixel match
const defaultOptions = {
  threshold: 0.1,         // matching threshold (0 to 1); smaller is more sensitive
  includeAA: false,       // whether to skip anti-aliasing detection
  alpha: 0.1,             // opacity of original image in diff output
  aaColor: [255, 255, 0], // color of anti-aliased pixels in diff output
  diffColor: [255, 0, 0], // color of different pixels in diff output
  diffColorAlt: null,     // whether to detect dark on light differences between img1 and img2 and set an alternative color to differentiate between the two
  diffMask: false         // draw the diff over a transparent background (a mask)
};

function pixelmatch(img1, img2, output, width, height, options) {

  if (!isPixelData(img1) || !isPixelData(img2) || (output && !isPixelData(output)))
      throw new Error('Image data: Uint8Array, Uint8ClampedArray or Buffer expected.');

  if (img1.length !== img2.length || (output && output.length !== img1.length))
      throw new Error('Image sizes do not match.');

  if (img1.length !== width * height * 4) throw new Error('Image data size does not match width/height.');

  options = Object.assign({}, defaultOptions, options);

  // check if images are identical
  const len = width * height;
  const a32 = new Uint32Array(img1.buffer, img1.byteOffset, len);
  const b32 = new Uint32Array(img2.buffer, img2.byteOffset, len);
  let identical = true;

  for (let i = 0; i < len; i++) {
      if (a32[i] !== b32[i]) { identical = false; break; }
  }
  if (identical) { // fast path if identical
      if (output && !options.diffMask) {
          for (let i = 0; i < len; i++) drawGrayPixel(img1, 4 * i, options.alpha, output);
      }
      return 0;
  }

  // maximum acceptable square distance between two colors;
  // 35215 is the maximum possible value for the YIQ difference metric
  const maxDelta = 35215 * options.threshold * options.threshold;
  let diff = 0;

  // compare each pixel of one image against the other one
  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {

          const pos = (y * width + x) * 4;

          // squared YUV distance between colors at this pixel position, negative if the img2 pixel is darker
          const delta = colorDelta(img1, img2, pos, pos);

          // the color difference is above the threshold
          if (Math.abs(delta) > maxDelta) {
              // check it's a real rendering difference or just anti-aliasing
              if (!options.includeAA && (antialiased(img1, x, y, width, height, img2) ||
                                         antialiased(img2, x, y, width, height, img1))) {
                  // one of the pixels is anti-aliasing; draw as yellow and do not count as difference
                  // note that we do not include such pixels in a mask
                  if (output && !options.diffMask) drawPixel(output, pos, ...options.aaColor);

              } else {
                  // found substantial difference not caused by anti-aliasing; draw it as such
                  if (output) {
                      drawPixel(output, pos, ...(delta < 0 && options.diffColorAlt || options.diffColor));
                  }
                  diff++;
              }

          } else if (output) {
              // pixels are similar; draw background as grayscale image blended with white
              if (!options.diffMask) drawGrayPixel(img1, pos, options.alpha, output);
          }
      }
  }

  // return the number of different pixels
  return diff;
}

function isPixelData(arr) {
  // work around instanceof Uint8Array not working properly in some Jest environments
  return ArrayBuffer.isView(arr) && arr.constructor.BYTES_PER_ELEMENT === 1;
}

// check if a pixel is likely a part of anti-aliasing;
// based on "Anti-aliased Pixel and Intensity Slope Detector" paper by V. Vysniauskas, 2009

function antialiased(img, x1, y1, width, height, img2) {
  const x0 = Math.max(x1 - 1, 0);
  const y0 = Math.max(y1 - 1, 0);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  const pos = (y1 * width + x1) * 4;
  let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0;
  let min = 0;
  let max = 0;
  let minX, minY, maxX, maxY;

  // go through 8 adjacent pixels
  for (let x = x0; x <= x2; x++) {
      for (let y = y0; y <= y2; y++) {
          if (x === x1 && y === y1) continue;

          // brightness delta between the center pixel and adjacent one
          const delta = colorDelta(img, img, pos, (y * width + x) * 4, true);

          // count the number of equal, darker and brighter adjacent pixels
          if (delta === 0) {
              zeroes++;
              // if found more than 2 equal siblings, it's definitely not anti-aliasing
              if (zeroes > 2) return false;

          // remember the darkest pixel
          } else if (delta < min) {
              min = delta;
              minX = x;
              minY = y;

          // remember the brightest pixel
          } else if (delta > max) {
              max = delta;
              maxX = x;
              maxY = y;
          }
      }
  }

  // if there are no both darker and brighter pixels among siblings, it's not anti-aliasing
  if (min === 0 || max === 0) return false;

  // if either the darkest or the brightest pixel has 3+ equal siblings in both images
  // (definitely not anti-aliased), this pixel is anti-aliased
  return (hasManySiblings(img, minX, minY, width, height) && hasManySiblings(img2, minX, minY, width, height)) ||
         (hasManySiblings(img, maxX, maxY, width, height) && hasManySiblings(img2, maxX, maxY, width, height));
}

// check if a pixel has 3+ adjacent pixels of the same color.
function hasManySiblings(img, x1, y1, width, height) {
  const x0 = Math.max(x1 - 1, 0);
  const y0 = Math.max(y1 - 1, 0);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);
  const pos = (y1 * width + x1) * 4;
  let zeroes = x1 === x0 || x1 === x2 || y1 === y0 || y1 === y2 ? 1 : 0;

  // go through 8 adjacent pixels
  for (let x = x0; x <= x2; x++) {
      for (let y = y0; y <= y2; y++) {
          if (x === x1 && y === y1) continue;

          const pos2 = (y * width + x) * 4;
          if (img[pos] === img[pos2] &&
              img[pos + 1] === img[pos2 + 1] &&
              img[pos + 2] === img[pos2 + 2] &&
              img[pos + 3] === img[pos2 + 3]) zeroes++;

          if (zeroes > 2) return true;
      }
  }

  return false;
}

// calculate color difference according to the paper "Measuring perceived color difference
// using YIQ NTSC transmission color space in mobile applications" by Y. Kotsarenko and F. Ramos

function colorDelta(img1, img2, k, m, yOnly) {
  let r1 = img1[k + 0];
  let g1 = img1[k + 1];
  let b1 = img1[k + 2];
  let a1 = img1[k + 3];

  let r2 = img2[m + 0];
  let g2 = img2[m + 1];
  let b2 = img2[m + 2];
  let a2 = img2[m + 3];

  if (a1 === a2 && r1 === r2 && g1 === g2 && b1 === b2) return 0;

  if (a1 < 255) {
      a1 /= 255;
      r1 = blend(r1, a1);
      g1 = blend(g1, a1);
      b1 = blend(b1, a1);
  }

  if (a2 < 255) {
      a2 /= 255;
      r2 = blend(r2, a2);
      g2 = blend(g2, a2);
      b2 = blend(b2, a2);
  }

  const y1 = rgb2y(r1, g1, b1);
  const y2 = rgb2y(r2, g2, b2);
  const y = y1 - y2;

  if (yOnly) return y; // brightness difference only

  const i = rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2);
  const q = rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2);

  const delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;

  // encode whether the pixel lightens or darkens in the sign
  return y1 > y2 ? -delta : delta;
}

function rgb2y(r, g, b) { return r * 0.29889531 + g * 0.58662247 + b * 0.11448223; }
function rgb2i(r, g, b) { return r * 0.59597799 - g * 0.27417610 - b * 0.32180189; }
function rgb2q(r, g, b) { return r * 0.21147017 - g * 0.52261711 + b * 0.31114694; }

// blend semi-transparent color with white
function blend(c, a) {
  return 255 + (c - 255) * a;
}

function drawPixel(output, pos, r, g, b) {
  output[pos + 0] = r;
  output[pos + 1] = g;
  output[pos + 2] = b;
  output[pos + 3] = 255;
}

function drawGrayPixel(img, i, alpha, output) {
  const r = img[i + 0];
  const g = img[i + 1];
  const b = img[i + 2];
  const val = blend(rgb2y(r, g, b), alpha * img[i + 3] / 255);
  drawPixel(output, i, val, val, val);
}