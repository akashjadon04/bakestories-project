/**
 * Sample Data Seeder
 * generated: utils/seed_sample_data.js — Seeds initial products and admin user
 * 
 * Usage: node utils/seed_sample_data.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { createAdminUser } from '../controllers/authController.js';

// Sample products data
const sampleProducts = [
  {
    name: 'Classic Chocolate Cake',
    description: 'Rich, moist chocolate cake layered with creamy chocolate ganache. Perfect for any celebration! Made with premium Belgian chocolate and fresh dairy cream.',
    shortDescription: 'Rich chocolate cake with ganache layers',
    category: 'cakes',
    price: 899,
    comparePrice: 999,
    inStock: true,
    stockQuantity: 20,
    tags: ['chocolate', 'best-seller', 'birthday'],
    isFeatured: true,
    images: [],
    details: {
      weight: '1kg',
      servings: 'Serves 8-10',
      ingredients: ['Flour', 'Sugar', 'Belgian Chocolate', 'Eggs', 'Butter', 'Cream'],
      allergens: ['gluten', 'dairy', 'eggs'],
      storageInstructions: 'Keep refrigerated. Consume within 3 days.',
      shelfLife: '3 days'
    },
    dietary: {
      isVegetarian: true,
      isEggless: false,
      isGlutenFree: false
    },
    isCustomizable: true,
    customizationOptions: [
      { name: 'Message on cake', type: 'text', maxLength: 30, required: false, price: 0 }
    ]
  },
  {
    name: 'Strawberry Cream Cupcakes (Pack of 6)',
    description: 'Fluffy vanilla cupcakes topped with fresh strawberry buttercream and real strawberry pieces.',
    shortDescription: 'Vanilla cupcakes with strawberry frosting',
    category: 'cupcakes',
    price: 449,
    inStock: true,
    stockQuantity: 30,
    tags: ['strawberry', 'cupcakes', 'pink'],
    isFeatured: true,
    images: [],
    details: {
      weight: '300g',
      servings: '6 pieces',
      ingredients: ['Flour', 'Sugar', 'Butter', 'Eggs', 'Strawberries', 'Cream'],
      allergens: ['gluten', 'dairy', 'eggs'],
      storageInstructions: 'Keep refrigerated.',
      shelfLife: '2 days'
    },
    dietary: {
      isVegetarian: true,
      isEggless: false
    }
  },
  {
    name: 'Eggless Vanilla Sponge Cake',
    description: 'Light and fluffy eggless vanilla sponge cake, perfect for those with egg allergies. Can be customized with any frosting.',
    shortDescription: 'Light eggless vanilla cake',
    category: 'cakes',
    price: 799,
    inStock: true,
    stockQuantity: 15,
    tags: ['eggless', 'vanilla', 'customizable'],
    isFeatured: false,
    images: [],
    details: {
      weight: '1kg',
      servings: 'Serves 8-10',
      ingredients: ['Flour', 'Sugar', 'Yogurt', 'Oil', 'Vanilla Extract'],
      allergens: ['gluten', 'dairy'],
      storageInstructions: 'Keep in cool place.',
      shelfLife: '3 days'
    },
    dietary: {
      isVegetarian: true,
      isEggless: true
    },
    isCustomizable: true,
    customizationOptions: [
      { name: 'Frosting flavor', type: 'select', options: ['Buttercream', 'Chocolate', 'Strawberry'], required: true, price: 0 },
      { name: 'Message on cake', type: 'text', maxLength: 25, required: false, price: 0 }
    ]
  },
  {
    name: 'Chocolate Chip Cookies (Pack of 12)',
    description: 'Crispy on the edges, chewy in the center cookies loaded with premium chocolate chips.',
    shortDescription: 'Classic chocolate chip cookies',
    category: 'cookies',
    price: 349,
    comparePrice: 399,
    inStock: true,
    stockQuantity: 50,
    tags: ['cookies', 'chocolate', 'snack'],
    isFeatured: true,
    images: [],
    details: {
      weight: '250g',
      servings: '12 cookies',
      ingredients: ['Flour', 'Butter', 'Sugar', 'Chocolate Chips', 'Eggs', 'Vanilla'],
      allergens: ['gluten', 'dairy', 'eggs'],
      storageInstructions: 'Store in airtight container.',
      shelfLife: '7 days'
    },
    dietary: {
      isVegetarian: true
    }
  },
  {
    name: 'Red Velvet Cake',
    description: 'Classic red velvet cake with cream cheese frosting. A perfect balance of cocoa and buttermilk flavors.',
    shortDescription: 'Classic red velvet with cream cheese',
    category: 'cakes',
    price: 999,
    inStock: true,
    stockQuantity: 12,
    tags: ['red-velvet', 'cream-cheese', 'popular'],
    isFeatured: true,
    images: [],
    details: {
      weight: '1kg',
      servings: 'Serves 8-10',
      ingredients: ['Flour', 'Sugar', 'Buttermilk', 'Cocoa', 'Cream Cheese', 'Butter'],
      allergens: ['gluten', 'dairy', 'eggs'],
      storageInstructions: 'Keep refrigerated.',
      shelfLife: '3 days'
    },
    dietary: {
      isVegetarian: true
    }
  },
  {
    name: 'Butter Croissants (Pack of 4)',
    description: 'Flaky, buttery croissants made with French technique. Perfect for breakfast or tea time.',
    shortDescription: 'Flaky French-style croissants',
    category: 'pastries',
    price: 299,
    inStock: true,
    stockQuantity: 25,
    tags: ['croissant', 'breakfast', 'french'],
    isFeatured: false,
    images: [],
    details: {
      weight: '200g',
      servings: '4 pieces',
      ingredients: ['Flour', 'Butter', 'Yeast', 'Sugar', 'Salt'],
      allergens: ['gluten', 'dairy'],
      storageInstructions: 'Best consumed fresh. Can be reheated.',
      shelfLife: '1 day'
    },
    dietary: {
      isVegetarian: true
    }
  },
  {
    name: 'Fudgy Brownies (Pack of 6)',
    description: 'Dense, fudgy chocolate brownies with a crackly top. Made with real dark chocolate.',
    shortDescription: 'Dense fudgy chocolate brownies',
    category: 'brownies',
    price: 399,
    inStock: true,
    stockQuantity: 20,
    tags: ['brownies', 'chocolate', 'fudge'],
    isFeatured: true,
    images: [],
    details: {
      weight: '300g',
      servings: '6 pieces',
      ingredients: ['Dark Chocolate', 'Butter', 'Sugar', 'Eggs', 'Flour', 'Cocoa'],
      allergens: ['gluten', 'dairy', 'eggs'],
      storageInstructions: 'Store in cool place.',
      shelfLife: '5 days'
    },
    dietary: {
      isVegetarian: true
    }
  },
  {
    name: 'Custom Photo Cake',
    description: 'Personalized cake with your edible photo print. Choose any flavor base and we will add your special memory on top!',
    shortDescription: 'Personalized cake with edible photo',
    category: 'custom',
    price: 1299,
    inStock: true,
    stockQuantity: 10,
    tags: ['custom', 'photo', 'personalized'],
    isFeatured: true,
    images: [],
    details: {
      weight: '1kg',
      servings: 'Serves 8-10',
      ingredients: ['Flour', 'Sugar', 'Butter', 'Eggs', 'Edible Ink', 'Fondant'],
      allergens: ['gluten', 'dairy', 'eggs'],
      storageInstructions: 'Keep refrigerated.',
      shelfLife: '2 days'
    },
    dietary: {
      isVegetarian: true
    },
    isCustomizable: true,
    customizationOptions: [
      { name: 'Photo upload', type: 'file', required: true, price: 0 },
      { name: 'Message', type: 'text', maxLength: 50, required: false, price: 0 },
      { name: 'Flavor', type: 'select', options: ['Vanilla', 'Chocolate', 'Strawberry'], required: true, price: 0 }
    ]
  },
  {
    name: 'Fresh Fruit Tart',
    description: 'Buttery tart shell filled with vanilla custard and topped with seasonal fresh fruits.',
    shortDescription: 'Custard tart with fresh fruits',
    category: 'pastries',
    price: 549,
    inStock: true,
    stockQuantity: 8,
    tags: ['fruit', 'tart', 'fresh'],
    isFeatured: false,
    images: [],
    details: {
      weight: '400g',
      servings: 'Serves 4-6',
      ingredients: ['Flour', 'Butter', 'Custard', 'Seasonal Fruits', 'Sugar'],
      allergens: ['gluten', 'dairy', 'eggs'],
      storageInstructions: 'Keep refrigerated. Consume same day.',
      shelfLife: '1 day'
    },
    dietary: {
      isVegetarian: true
    }
  },
  {
    name: 'Whole Wheat Bread',
    description: 'Healthy whole wheat bread made with natural ingredients. No preservatives added.',
    shortDescription: 'Healthy whole wheat bread',
    category: 'bread',
    price: 149,
    inStock: true,
    stockQuantity: 40,
    tags: ['bread', 'healthy', 'whole-wheat'],
    isFeatured: false,
    images: [],
    details: {
      weight: '400g',
      servings: '1 loaf',
      ingredients: ['Whole Wheat Flour', 'Water', 'Yeast', 'Salt', 'Honey'],
      allergens: ['gluten'],
      storageInstructions: 'Store in cool, dry place.',
      shelfLife: '3 days'
    },
    dietary: {
      isVegetarian: true,
      isVegan: true
    }
  }
];

// Seed products
const seedProducts = async () => {
  try {
    console.log('🌱 Seeding products...\n');
    
    // Clear existing products (optional - comment out to keep existing)
    // await Product.deleteMany({});
    
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} products already exist. Skipping product seed.`);
      console.log('   To reseed, delete existing products first.\n');
      return;
    }
    
    // Add placeholder images to products
    const productsWithImages = sampleProducts.map((product, index) => ({
      ...product,
      images: [{
        url: `https://placehold.co/600x600/ffc0cb/ffffff?text=${encodeURIComponent(product.name)}`,
        public_id: null,
        alt: product.name,
        isPrimary: true
      }]
    }));
    
    await Product.insertMany(productsWithImages);
    console.log(`✅ ${productsWithImages.length} products seeded successfully!\n`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
  }
};

// Seed admin user
const seedAdmin = async () => {
  try {
    console.log('👤 Creating admin user...\n');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@thebakestories.example';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    await createAdminUser(adminEmail, adminPassword, 'Admin');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

// Main seed function
const seed = async () => {
  try {
    console.log('\n🧁 The Bake Stories - Database Seeder\n');
    console.log('=====================================\n');
    
    // Connect to database
    await connectDB();
    
    // Seed data
    await seedProducts();
    await seedAdmin();
    
    console.log('✅ Seeding completed!\n');
    
    // Close connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

export default seed;
