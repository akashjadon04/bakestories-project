/**
 * Cloudinary Configuration (HARDENED PRODUCTION VERSION)
 * config/cloudinary.js
 *
 * Features:
 * - Safe configuration parsing
 * - Upload with timeout protection
 * - Temp file cleanup
 * - Resilient delete
 * - Optimized delivery URLs
 * - Health check helper
 */

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

/* =========================================================
   🔧 PARSE CLOUDINARY URL
   ========================================================= */

const parseCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  try {
    // cloudinary://api_key:api_secret@cloud_name
    const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);

    if (!match) return null;

    return {
      api_key: match[1],
      api_secret: match[2],
      cloud_name: match[3]
    };
  } catch (error) {
    console.error('❌ Error parsing CLOUDINARY_URL:', error.message);
    return null;
  }
};

/* =========================================================
   ⚙️ CONFIGURE CLOUDINARY
   ========================================================= */

const configureCloudinary = () => {
  const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);

  if (!parsed) {
    console.warn('⚠️ Cloudinary not configured. Set CLOUDINARY_URL in .env');
    return false;
  }

  cloudinary.config({
    cloud_name: parsed.cloud_name,
    api_key: parsed.api_key,
    api_secret: parsed.api_secret,
    secure: true
  });

  console.log('✅ Cloudinary configured:', parsed.cloud_name);
  return true;
};

const isConfigured = configureCloudinary();

/* =========================================================
   📤 UPLOAD IMAGE (LOCAL FILE)
   ========================================================= */

export const uploadImage = async (filePath, options = {}) => {
  if (!isConfigured) {
    return {
      success: false,
      error: 'Cloudinary not configured'
    };
  }

  try {
    const uploadOptions = {
      folder: 'thebakestories/products',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      timeout: 60000,
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Clean temp file safely
    if (filePath) {
      fs.unlink(filePath).catch(() => {});
    }

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error.message);

    // Attempt cleanup
    if (filePath) {
      fs.unlink(filePath).catch(() => {});
    }

    return {
      success: false,
      error: error.message
    };
  }
};

/* =========================================================
   🌐 UPLOAD FROM URL (Instagram support)
   ========================================================= */

export const uploadFromUrl = async (imageUrl, options = {}) => {
  if (!isConfigured) {
    return { success: false, error: 'Cloudinary not configured' };
  }

  try {
    const uploadOptions = {
      folder: 'thebakestories/instagram',
      resource_type: 'image',
      unique_filename: true,
      timeout: 60000,
      ...options
    };

    const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    };

  } catch (error) {
    console.error('❌ Cloudinary URL upload error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/* =========================================================
   🗑 DELETE IMAGE
   ========================================================= */

export const deleteImage = async (publicId) => {
  if (!publicId) {
    return { success: true, result: 'no_public_id' };
  }

  if (!isConfigured) {
    return { success: false, error: 'Cloudinary not configured' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    return {
      success: result.result === 'ok' || result.result === 'not found',
      result: result.result
    };

  } catch (error) {
    console.error('❌ Cloudinary delete error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/* =========================================================
   ⚡ OPTIMIZED DELIVERY URL
   ========================================================= */

export const getOptimizedUrl = (publicId, options = {}) => {
  if (!publicId) return null;

  const transformation = {
    width: options.width || 800,
    height: options.height || 600,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto',
    fetch_format: options.fetch_format || 'auto',
    ...options
  };

  return cloudinary.url(publicId, transformation);
};

/* =========================================================
   🩺 HEALTH CHECK (useful in production)
   ========================================================= */

export const cloudinaryHealthCheck = async () => {
  try {
    if (!isConfigured) {
      return { healthy: false, reason: 'not_configured' };
    }

    await cloudinary.api.ping();
    return { healthy: true };

  } catch (error) {
    return { healthy: false, reason: error.message };
  }
};

export { cloudinary, isConfigured };
export default cloudinary;
