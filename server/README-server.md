# The Bake Stories - Server Documentation

## Overview

The backend is built with **Node.js + Express** and **MongoDB (Mongoose)**. It provides RESTful APIs for the bakery e-commerce functionality.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Cloudinary
- **SMS/WhatsApp**: Twilio (optional)
- **Email**: SendGrid (optional)
- **Validation**: Joi

## Getting Started

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials. See `.env.example` for all options.

### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running
mongod
```

**Option B: MongoDB Atlas**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/thebakestories
```

### 4. Seed Data

```bash
npm run seed
```

This creates:
- Sample products (10 items)
- Admin user

### 5. Start Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/featured/list` | Get featured products |
| GET | `/api/products/category/:category` | Get by category |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/:id` | Update product (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |

### Orders (COD Flow)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/create` | Create new order |
| GET | `/api/orders/:id` | Get order details |
| GET | `/api/orders/track/:orderNumber` | Track order |
| POST | `/api/orders/:id/request-call` | Request bakery call |
| POST | `/api/orders/:id/cancel` | Cancel order |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/orders/admin/all` | List all orders |
| GET | `/api/orders/admin/pending-confirmation` | Pending orders |
| POST | `/api/orders/admin/:id/confirm` | Confirm order |
| PUT | `/api/orders/admin/:id/status` | Update order status |

### Instagram
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instagram/hero-images` | Get hero images |
| GET | `/api/instagram/logo` | Get logo |
| POST | `/api/instagram/refresh` | Refresh images |

## COD Order Flow

```
1. Customer places order (POST /api/orders/create)
   ↓
2. Order created with status: "pending-confirmation"
   ↓
3. SMS/Email sent to bakery (if configured)
   ↓
4. Customer sees success page with call instructions
   ↓
5. Bakery calls customer to confirm
   ↓
6. Admin confirms order (POST /api/orders/admin/:id/confirm)
   ↓
7. Order status changes to "confirmed"
   ↓
8. Order is prepared and delivered
   ↓
9. Customer pays cash on delivery
```

## Database Models

### User
- `name`, `email`, `phone`, `password`
- `isAdmin`: Boolean
- `addresses`: Array of addresses
- `preferences`: User preferences

### Product
- `name`, `description`, `category`, `price`
- `images`: Array of Cloudinary images
- `variants`: Size/flavor options
- `stockQuantity`, `inStock`
- `dietary`: veg/eggless/gluten-free flags
- `isCustomizable`: Boolean

### Order
- `orderNumber`: Unique identifier
- `customerName`, `customerPhone`, `customerEmail`
- `items`: Array of order items
- `deliveryAddress`, `deliveryDate`, `deliveryTime`
- `totalAmount`, `paymentMethod`
- `status`: pending-confirmation → confirmed → preparing → delivered
- `callConfirmation`: Track call status

### Coupon
- `code`, `discountType`, `discountValue`
- `minOrderAmount`, `usageLimit`
- `startDate`, `endDate`

## Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server
npm test           # Run tests
npm run seed       # Seed sample data
npm run fetch-instagram  # Fetch Instagram images
```

## Instagram Integration

### Getting an Instagram Access Token

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Add a test user (your Instagram account)
5. Generate access token

### Fetch Images

```bash
npm run fetch-instagram
```

This will:
1. Fetch images from Instagram API
2. Upload to Cloudinary
3. Save metadata to `data/instagram_images.json`

### Without Instagram Token

If you don't have an Instagram token:
1. Add images to `server/data/images_for_upload/`
2. Run `npm run fetch-instagram`
3. Images will be uploaded to Cloudinary

## Notifications

### Twilio (SMS/WhatsApp)

Set these environment variables:
```
TWILIO_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=your_twilio_phone
```

### SendGrid (Email)

Set these environment variables:
```
SENDGRID_API_KEY=your_api_key
EMAIL_FROM=orders@yourdomain.com
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [/* Validation errors */]
}
```

## Security

- Helmet.js for security headers
- Rate limiting on API endpoints
- JWT authentication
- Password hashing with bcrypt
- Input validation with Joi

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Deployment

### Environment Variables for Production

```
NODE_ENV=production
PORT=5000
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=strong_random_string
CLOUDINARY_URL=your_cloudinary_url
BAKERY_PHONE=your_phone_number
FRONTEND_URL=https://yourdomain.com
```

### Recommended Hosting

- **Server**: Heroku, Railway, or DigitalOcean
- **Database**: MongoDB Atlas
- **Images**: Cloudinary
- **Domain**: Custom domain with SSL

## Troubleshooting

### MongoDB Connection Error
```
Error: MongoDB Connection Failed
```
- Check if MongoDB is running
- Verify MONGO_URI in .env

### Cloudinary Upload Error
```
Cloudinary not configured
```
- Set CLOUDINARY_URL in .env
- Format: `cloudinary://api_key:api_secret@cloud_name`

### Instagram API Error
```
Error fetching media
```
- Check IG_ACCESS_TOKEN
- Token may have expired - regenerate it

## Support

For server-related issues, check:
1. Server logs
2. MongoDB connection
3. Environment variables
4. API response in browser dev tools
