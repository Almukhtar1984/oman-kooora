import sharp from "sharp";
import Tesseract from "tesseract.js";
import fs from 'fs/promises'; // Use the promises API of fs

/**
 * Checks if the extracted text from an ID card image includes the entered number
 * @param {string} absolutePath - The absolute path to the image file to be processed.
 * @param {string} value - The value to check for in the extracted text.
 * @returns {boolean} - True if the extracted text includes the specified value, false otherwise.
 */
export const isIdentical = async (image, value) => {
  // Disable sharp cache
  sharp.cache(false);
  console.log("value,",value)
  // Read the image file as a buffer
  const sharpImg = sharp(image);
  const { orientation, width, height } = await sharpImg.metadata();

  let rotatedImg;

  if (orientation && orientation !== 1) {
    console.log("=========1=======")
    // Rotate based on orientation metadata
    const orientationAngle = { 1: 0, 2: 0, 3: 180, 4: 180, 5: 90, 6: 90, 7: 270, 8: 270 };
    rotatedImg = await sharpImg.rotate(orientationAngle[orientation]).toBuffer();

    let res = await Tesseract.recognize(rotatedImg, 'eng');
    console.log("------zabi-----")
    console.log(res)
    console.log("------------------")
    if (!res.data.text.includes(value)) {
      // Retry with 0-degree rotation if not identified
      rotatedImg = await sharpImg.rotate(0).toBuffer();
      res = await Tesseract.recognize(rotatedImg, 'eng');
      return res.data.text.includes(value);
    }

    return true;
  } else if (width > height) {
    // Some images may not have orientation metadata
    console.log(" ==========2============")
    rotatedImg = await sharpImg.toBuffer();
  } else {
    console.log("===========3=============")
    // Rotate -90 degrees if width is not greater than height
    rotatedImg = await sharpImg.rotate(-90).toBuffer();
  }

  // Recognize text using Tesseract
  const res = await Tesseract.recognize(rotatedImg, 'eng');
  // Check if the recognized text include   s the specified value
 
  const isIdentical = res.data.text.includes(value);

  
  if (!isIdentical && (!orientation || orientation === 1)) {
    console.log("==========================")
    // Retry with 90-degree rotation if not identified
    let retryRotatedImg = await sharpImg.rotate(90).toBuffer();
    let retryResult = await Tesseract.recognize(retryRotatedImg, 'eng');

    if (!retryResult.data.text.includes(value)) {
      // Retry with 180-degree rotation if not identified
      retryRotatedImg = await sharpImg.rotate(180).toBuffer();
      retryResult = await Tesseract.recognize(retryRotatedImg, 'eng');
      console.log(retryResult.data.text)
      return retryResult.data.text.includes(value);
    }

    return true;
  }
  console.log("result isIdentical",isIdentical)
  if (!isIdentical) {
    // Retry with 180-degree rotation if not identified
    const retryRotatedImg = await sharpImg.rotate(180).toBuffer();
    const retryResult = await Tesseract.recognize(retryRotatedImg, 'eng');
    return retryResult.data.text.includes(value);
  }
  return isIdentical;
};
