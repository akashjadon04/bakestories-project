/**
 * Instagram Image Fetcher
 * generated: utils/fetch_instagram_images.js — Fetches images from Instagram API
 * 
 * SECURITY NOTICE:
 * - This script uses the official Instagram Basic Display API
 * - NEVER scrape Instagram HTML - it's against their Terms of Service
 * - Requires IG_ACCESS_TOKEN environment variable
 * 
 * Flow:
 * 1. Check for IG_ACCESS_TOKEN
 * 2. If present: Fetch from Instagram API → Upload to Cloudinary → Save metadata
 * 3. If not present: Check /server/data/images_for_upload/ → Upload to Cloudinary
 * 4. If no images: Generate placeholders and log instructions
 */

import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadFromUrl, uploadImage, cloudinary } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DATA_DIR = path.join(__dirname, '../data');
const IMAGES_DIR = path.join(DATA_DIR, 'images_for_upload');
const OUTPUT_FILE = path.join(DATA_DIR, 'instagram_images.json');
const IG_API_BASE = 'https://graph.instagram.com';

// Ensure directories exist
fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(IMAGES_DIR);

/**
 * Fetch user profile from Instagram API
 */
const fetchUserProfile = async (accessToken) => {
  try {
    const response = await fetch(
      `${IG_API_BASE}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    return null;
  }
};

/**
 * Fetch media from Instagram API
 */
const fetchMedia = async (accessToken, limit = 12) => {
  try {
    const response = await fetch(
      `${IG_API_BASE}/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=${limit}&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching media:', error.message);
    return [];
  }
};

/**
 * Fetch profile picture (requires additional permissions)
 * Note: Basic Display API doesn't provide profile picture directly
 * We'll use a placeholder or first media image as logo
 */
const fetchProfilePicture = async (username) => {
  // Instagram Basic Display API doesn't expose profile picture
  // Return null - we'll use a generated logo or first image
  return null;
};

/**
 * Upload image from Instagram to Cloudinary
 */
const uploadInstagramImage = async (mediaItem, folder = 'instagram') => {
  try {
    // Use media_url for images, thumbnail_url for videos
    const imageUrl = mediaItem.media_type === 'VIDEO' 
      ? mediaItem.thumbnail_url 
      : mediaItem.media_url;
    
    if (!imageUrl) {
      throw new Error('No image URL available');
    }
    
    const result = await uploadFromUrl(imageUrl, {
      folder: `thebakestories/${folder}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
    
    if (result.success) {
      return {
        id: mediaItem.id,
        url: result.url,
        public_id: result.public_id,
        caption: mediaItem.caption || '',
        permalink: mediaItem.permalink,
        timestamp: mediaItem.timestamp,
        media_type: mediaItem.media_type
      };
    }
    
    throw new Error(result.error || 'Upload failed');
  } catch (error) {
    console.error(`Error uploading image ${mediaItem.id}:`, error.message);
    return null;
  }
};

/**
 * Upload local images to Cloudinary
 */
const uploadLocalImages = async () => {
  const images = [];
  
  try {
    const files = await fs.readdir(IMAGES_DIR);
    const imageFiles = files.filter(f => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
    );
    
    if (imageFiles.length === 0) {
      console.log('No images found in images_for_upload folder');
      return [];
    }
    
    console.log(`Found ${imageFiles.length} local images to upload`);
    
    for (const file of imageFiles) {
      const filePath = path.join(IMAGES_DIR, file);
      const result = await uploadImage(filePath, {
        folder: 'thebakestories/local',
        use_filename: true
      });
      
      if (result.success) {
        images.push({
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: result.url,
          public_id: result.public_id,
          caption: '',
          source: 'local'
        });
        console.log(`✅ Uploaded: ${file}`);
      } else {
        console.error(`❌ Failed to upload: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error uploading local images:', error.message);
  }
  
  return images;
};

/**
 * Generate placeholder images metadata
 */
const generatePlaceholders = () => {
  const placeholders = [];
  const categories = ['cakes', 'cupcakes', 'cookies', 'pastries'];
  
  for (let i = 1; i <= 6; i++) {
    const category = categories[i % categories.length];
    placeholders.push({
      id: `placeholder_${i}`,
      url: `https://placehold.co/800x800/ffc0cb/ffffff?text=The+Bake+Stories`,
      public_id: null,
      caption: `Delicious ${category} from The Bake Stories`,
      source: 'placeholder',
      category
    });
  }
  
  return placeholders;
};

/**
 * Generate logo placeholder
 */
const generateLogoPlaceholder = () => {
  return {
    url: 'https://placehold.co/200x200/ffc0cb/ffffff?text=BS',
    public_id: null,
    source: 'placeholder'
  };
};

/**
 * Save images metadata to JSON file
 */
const saveMetadata = async (images, logo) => {
  const metadata = {
    fetchedAt: new Date().toISOString(),
    source: images.length > 0 && images[0].source === 'instagram' ? 'instagram_api' : 
            images.length > 0 && images[0].source === 'local' ? 'local_upload' : 'placeholder',
    count: images.length,
    images,
    logo
  };
  
  await fs.writeJson(OUTPUT_FILE, metadata, { spaces: 2 });
  console.log(`✅ Metadata saved to ${OUTPUT_FILE}`);
  return metadata;
};

/**
 * Main fetch function
 */
export const fetchInstagramImages = async () => {
  console.log('\n🧁 The Bake Stories - Instagram Image Fetcher\n');
  
  const accessToken = process.env.IG_ACCESS_TOKEN;
  
  // CASE 1: Instagram API Token Available
  if (accessToken) {
    console.log('✅ IG_ACCESS_TOKEN found. Fetching from Instagram API...\n');
    
    // Fetch user profile
    const profile = await fetchUserProfile(accessToken);
    if (profile) {
      console.log(`📱 Instagram User: @${profile.username}`);
      console.log(`📊 Media Count: ${profile.media_count}\n`);
    }
    
    // Fetch media
    const media = await fetchMedia(accessToken, 12);
    console.log(`📸 Fetched ${media.length} media items\n`);
    
    if (media.length > 0) {
      // Upload images to Cloudinary
      console.log('☁️  Uploading to Cloudinary...\n');
      const uploadedImages = [];
      
      for (const item of media) {
        // Skip videos without thumbnails
        if (item.media_type === 'VIDEO' && !item.thumbnail_url) {
          continue;
        }
        
        const uploaded = await uploadInstagramImage(item);
        if (uploaded) {
          uploadedImages.push(uploaded);
          console.log(`✅ Uploaded: ${uploaded.public_id}`);
        }
      }
      
      // Use first image as logo if available
      const logo = uploadedImages.length > 0 ? {
        url: uploadedImages[0].url,
        public_id: uploadedImages[0].public_id,
        source: 'instagram'
      } : generateLogoPlaceholder();
      
      // Save metadata
      const metadata = await saveMetadata(uploadedImages, logo);
      
      console.log(`\n✅ SUCCESS: Fetched ${uploadedImages.length} images from Instagram`);
      return metadata;
    }
  }
  
  // CASE 2: Check for local images
  console.log('⚠️  No IG_ACCESS_TOKEN or API fetch failed.');
  console.log('📁 Checking for local images...\n');
  
  const localImages = await uploadLocalImages();
  
  if (localImages.length > 0) {
    const logo = {
      url: localImages[0].url,
      public_id: localImages[0].public_id,
      source: 'local'
    };
    
    const metadata = await saveMetadata(localImages, logo);
    console.log(`\n✅ SUCCESS: Uploaded ${localImages.length} local images`);
    return metadata;
  }
  
  // CASE 3: Generate placeholders
  console.log('⚠️  No local images found.');
  console.log('🎨 Generating placeholder images...\n');
  
  const placeholders = generatePlaceholders();
  const logo = generateLogoPlaceholder();
  
  const metadata = await saveMetadata(placeholders, logo);
  
  console.log('\n⚠️  PLACEHOLDERS GENERATED');
  console.log('   To use real images, either:');
  console.log('   1. Set IG_ACCESS_TOKEN in .env (recommended)');
  console.log('   2. Add images to /server/data/images_for_upload/\n');
  
  return metadata;
};

/**
 * Get cached images metadata
 */
export const getCachedImages = async () => {
  try {
    if (await fs.pathExists(OUTPUT_FILE)) {
      return await fs.readJson(OUTPUT_FILE);
    }
  } catch (error) {
    console.error('Error reading cached images:', error.message);
  }
  return null;
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchInstagramImages()
    .then(metadata => {
      console.log('\n📋 Summary:');
      console.log(`   Source: ${metadata.source}`);
      console.log(`   Images: ${metadata.count}`);
      console.log(`   Logo: ${metadata.logo ? '✅' : '❌'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

export default fetchInstagramImages;
