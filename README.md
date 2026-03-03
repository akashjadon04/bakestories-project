# 🧁 The Bake Stories

A full-stack bakery e-commerce website with Cash on Delivery (COD) payment flow, Instagram integration, and a beautiful baby pink theme.

![The Bake Stories](https://placehold.co/800x400/ffc0cb/ffffff?text=The+Bake+Stories)

## ✨ Features

- **Beautiful Design**: Mobile-first, baby pink theme with cute micro-animations
- **Product Catalog**: Browse cakes, cupcakes, cookies, pastries, and more
- **Shopping Cart**: Persistent cart with localStorage
- **COD Checkout**: Cash on Delivery with call-to-confirm flow
- **Order Tracking**: Track orders by order number and phone
- **Admin Dashboard**: Manage orders, products, and customers
- **Instagram Integration**: Auto-fetch images for hero carousel (optional)
- **Responsive**: Works perfectly on mobile, tablet, and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Cloudinary account (for image storage)

### Installation

1. **Extract the zip file:**
   ```bash
   unzip bakestories-project.zip
   cd bakestories-project
   ```

2. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Seed sample data:**
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

6. **Open the client:**
   Open `client/index.html` in your browser or use a local server like Live Server.

### Default Admin Credentials

After seeding, you can log in to the admin panel at `client/admin.html`:

- **Email**: admin@thebakestories.example
- **Password**: admin123

> ⚠️ **Important**: Change the admin password after first login!

## 📁 Project Structure

```
bakestories-project/
├── client/                 # Frontend (vanilla HTML/CSS/JS)
│   ├── index.html         # Homepage
│   ├── products.html      # Product listing
│   ├── cart.html          # Shopping cart
│   ├── checkout.html      # Checkout with COD
│   ├── order-success.html # Order confirmation
│   ├── admin.html         # Admin dashboard
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── assets/            # Images, manifest
│
├── server/                # Backend (Node.js + Express)
│   ├── server.js          # Main server entry
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   └── data/              # Data files
│
├── README.md              # This file
├── README-server.md       # Server documentation
└── generation_report.txt  # Generation report
```

## 🎨 Customization

### Change Theme Color

Edit the CSS variables in `client/css/main.css`:

```css
:root {
  --brand-pink: #ffc0cb;    /* Primary color */
  --accent: #ff7aa2;         /* Secondary color */
  --muted: #fff5f8;          /* Background color */
  --text: #3a3a3a;           /* Text color */
}
```

### Add Products

Use the admin dashboard or directly add to MongoDB:

```bash
cd server
npm run seed  # Re-seeds sample products
```

## 🔧 Environment Variables

See `.env.example` for all available options. Key variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | ✅ Yes |
| `JWT_SECRET` | Secret for JWT tokens | ✅ Yes |
| `CLOUDINARY_URL` | Cloudinary API URL | ✅ Yes |
| `IG_ACCESS_TOKEN` | Instagram API token | ❌ Optional |
| `BAKERY_PHONE` | Your bakery phone number | ✅ Yes |
| `TWILIO_SID` | Twilio account SID | ❌ Optional |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | ❌ Optional |
| `SENDGRID_API_KEY` | SendGrid API key | ❌ Optional |

## 📱 PWA Support

The website includes a Progressive Web App manifest. Users can:
- Install the app on their home screen
- Use offline (cart data persists)
- Receive push notifications (when implemented)

## 🧪 Testing

Run the test suite:

```bash
cd server
npm test
```

## 📞 Support

For support, contact us at:
- Email: support@thebakestories.example
- Phone: +91 xxxxxxxxxx

## 📄 License

MIT License - feel free to use this project for your own bakery!

---

Made with 🧁 and 💕 by The Bake Stories Team
