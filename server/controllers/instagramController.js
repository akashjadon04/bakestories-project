/**
 * Instagram Controller
 * generated: controllers/instagramController.js — Serves hero images and logo
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchInstagramImages, getCachedImages } from '../utils/fetch_instagram_images.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_FILE = path.join(__dirname, '../data/instagram_images.json');

/**
 * Get hero images for frontend
 * GET /api/instagram/hero-images
 */
export const getHeroImages = async (req, res, next) => {
  try {
    // Try to get cached images
    let imagesData = await getCachedImages();
    
    // If no cached data or force refresh requested
    if (!imagesData || req.query.refresh === 'true') {
      // Check if we have IG token
      if (process.env.IG_ACCESS_TOKEN) {
        try {
          imagesData = await fetchInstagramImages();
        } catch (error) {
          console.error('Error fetching Instagram images:', error.message);
        }
      }
    }
    
    // If still no data, return placeholders
    if (!imagesData) {
      imagesData = {
        fetchedAt: new Date().toISOString(),
        source: 'placeholder',
        count: 6,
        images: [
          {
            id: 'placeholder_1',
            url: 'https://placehold.co/1200x800/ffc0cb/ffffff?text=The+Bake+Stories',
            caption: 'Delicious cakes and pastries',
            source: 'placeholder'
          },
          {
            id: 'placeholder_2',
            url: 'https://placehold.co/1200x800/ffb6c1/ffffff?text=Fresh+Baked',
            caption: 'Freshly baked daily',
            source: 'placeholder'
          },
          {
            id: 'placeholder_3',
            url: 'https://placehold.co/1200x800/ff69b4/ffffff?text=Custom+Cakes',
            caption: 'Custom cakes for all occasions',
            source: 'placeholder'
          }
        ],
        logo: {
          url: 'https://placehold.co/200x200/ffc0cb/ffffff?text=BS',
          source: 'placeholder'
        }
      };
    }
    
    res.json({
      success: true,
      data: {
        images: imagesData.images.slice(0, 12),
        logo: imagesData.logo,
        meta: {
          fetchedAt: imagesData.fetchedAt,
          source: imagesData.source,
          count: imagesData.images.length
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get logo only
 * GET /api/instagram/logo
 */
export const getLogo = async (req, res, next) => {
  try {
    const imagesData = await getCachedImages();
    
    if (imagesData && imagesData.logo) {
      return res.json({
        success: true,
        data: { logo: imagesData.logo }
      });
    }
    
    // Return placeholder logo
    res.json({
      success: true,
      data: {
        logo: {
          url: 'https://placehold.co/200x200/ffc0cb/ffffff?text=BS',
          source: 'placeholder'
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Instagram images (manual trigger)
 * POST /api/instagram/refresh
 */
export const refreshImages = async (req, res, next) => {
  try {
    // Only allow if IG token is configured
    if (!process.env.IG_ACCESS_TOKEN) {
      return res.status(400).json({
        success: false,
        message: 'Instagram API not configured. Set IG_ACCESS_TOKEN in .env',
        data: {
          instructions: [
            '1. Get an Instagram Basic Display API token from Facebook Developers',
            '2. Add IG_ACCESS_TOKEN to your .env file',
            '3. Run: npm run fetch-instagram'
          ]
        }
      });
    }
    
    const imagesData = await fetchInstagramImages();
    
    res.json({
      success: true,
      message: 'Images refreshed successfully',
      data: {
        source: imagesData.source,
        count: imagesData.count,
        fetchedAt: imagesData.fetchedAt
      }
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Get Instagram connection status
 * GET /api/instagram/status
 */
export const getStatus = async (req, res, next) => {
  try {
    const hasToken = !!process.env.IG_ACCESS_TOKEN;
    const imagesData = await getCachedImages();
    
    res.json({
      success: true,
      data: {
        configured: hasToken,
        hasImages: imagesData && imagesData.images.length > 0,
        imageCount: imagesData?.images.length || 0,
        lastFetched: imagesData?.fetchedAt || null,
        source: imagesData?.source || 'none'
      }
    });
    
  } catch (error) {
    next(error);
  }
};
