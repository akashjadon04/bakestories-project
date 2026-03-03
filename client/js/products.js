/*/**
 * Products JavaScript
 * generated: js/products.js — Product listing and filtering
 * STATUS: FIXED (Full URL Fetch + Storage Bridge)
 */

// State
let productsState = {
  products: [],
  filtered: [],
  page: 1,
  limit: 12,
  category: 'all',
  sort: 'newest',
  loading: false,
  hasMore: true
};

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const featuredProducts = document.getElementById('featuredProducts');
const categoriesGrid = document.getElementById('categoriesGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const noProducts = document.getElementById('noProducts');

// ============================================
// PRODUCT CARD HTML
// ============================================

function createProductCard(product) {
  const discount = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;
  
  // Safe Image Handling
  const imageUrl = product.primaryImage?.url || product.images?.[0]?.url || 
    `https://placehold.co/400x400/ffc0cb/ffffff?text=${encodeURIComponent(product.name)}`;
  
  // Safe JSON for onclick
  const safeProduct = JSON.stringify(product).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

  // --- FIX 1: THE STORAGE BRIDGE ---
  // Save ID to localStorage immediately on click. 
  // This ensures the next page finds the ID even if the URL breaks.
  const linkAction = `onclick="window.localStorage.setItem('bake_current_id', '${product._id}')"`;
  
  return `
    <div class="product-card reveal">
      <div class="product-image">
        <a href="product.html?id=${product._id}" ${linkAction}>
          <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        </a>
        ${product.isFeatured ? '<span class="badge badge-featured">Featured</span>' : ''}
        ${discount > 0 ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
        <button class="wishlist-btn" onclick="toggleWishlist('${product._id}')" aria-label="Add to wishlist">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <a href="product.html?id=${product._id}" ${linkAction}>
          <h3 class="product-name">${product.name}</h3>
        </a>
        <div class="product-price-row">
          <span class="product-price">${utils.formatCurrency(product.price)}</span>
          ${product.comparePrice ? `<span class="product-compare-price">${utils.formatCurrency(product.comparePrice)}</span>` : ''}
        </div>
        <button class="add-to-cart" onclick='addToCart(${safeProduct})'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

// ============================================
// LOAD PRODUCTS
// ============================================

async function loadProducts(options = {}) {
  if (productsState.loading) return;
  
  productsState.loading = true;
  
  const { category = productsState.category, page = 1, append = false } = options;
  
  try {
    // --- FIX 2: DIRECT BACKEND URL ---
    // Use full URL to port 5000 to avoid "Failed to load" errors
    let endpoint = `http://localhost:5000/api/products?page=${page}&limit=${productsState.limit}`;
    
    if (category && category !== 'all') {
      endpoint += `&category=${category}`;
    }
    
    // Add sort
    const sortMap = {
      'newest': 'sort=createdAt&order=desc',
      'price-low': 'sort=price&order=asc',
      'price-high': 'sort=price&order=desc',
      'popular': 'sort=orderCount&order=desc'
    };
    endpoint += '&' + sortMap[productsState.sort];
    
    // --- FIX 3: NATIVE FETCH ---
    // Replaced 'api.get' with standard 'fetch' to ensure it works without external files
    const response = await fetch(endpoint).then(res => res.json());
    
    if (response.success) {
      const { products, pagination } = response.data;
      
      productsState.hasMore = pagination.page < pagination.pages;
      productsState.page = pagination.page;
      
      if (append) {
        productsState.products = [...productsState.products, ...products];
      } else {
        productsState.products = products;
      }
      
      renderProducts(append);
      
      // Show/hide load more button
      if (loadMoreBtn) {
        loadMoreBtn.style.display = productsState.hasMore ? 'inline-flex' : 'none';
      }
      
      // Show no products message
      if (noProducts) {
        noProducts.style.display = products.length === 0 ? 'block' : 'none';
      }
    }
  } catch (error) {
    console.error('Error loading products:', error);
    // Only show toast if function exists
    if(window.showToast) window.showToast('Failed to load products', 'error');
  } finally {
    productsState.loading = false;
  }
}

// ============================================
// RENDER PRODUCTS
// ============================================

function renderProducts(append = false) {
  const grid = productsGrid || featuredProducts;
  if (!grid) return;
  
  const html = productsState.products.map(createProductCard).join('');
  
  if (append) {
    grid.innerHTML += html;
  } else {
    grid.innerHTML = html;
  }
  
  // Re-initialize scroll reveal for new elements
  const newElements = grid.querySelectorAll('.reveal:not(.visible)');
  newElements.forEach(el => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(el);
  });
}

// ============================================
// LOAD FEATURED PRODUCTS
// ============================================

async function loadFeaturedProducts() {
  if (!featuredProducts) return;
  
  try {
    // FIX: Direct fetch
    const response = await fetch('http://localhost:5000/api/products/featured/list?limit=8').then(res => res.json());
    
    if (response.success) {
      productsState.products = response.data.products;
      renderProducts();
    }
  } catch (error) {
    console.error('Error loading featured products:', error);
    featuredProducts.innerHTML = '<p class="text-center">Failed to load products</p>';
  }
}

// ============================================
// LOAD CATEGORIES
// ============================================

async function loadCategories() {
  if (!categoriesGrid) return;
  
  try {
    // FIX: Direct fetch
    const response = await fetch('http://localhost:5000/api/products/categories/all').then(res => res.json());
    
    if (response.success) {
      const categories = response.data.categories;
      
      const categoryIcons = {
        'cakes': '🎂',
        'cupcakes': '🧁',
        'cookies': '🍪',
        'pastries': '🥐',
        'bread': '🍞',
        'brownies': '🍫',
        'custom': '✨',
        'seasonal': '🎄'
      };
      
      categoriesGrid.innerHTML = categories.map(cat => `
        <a href="products.html?category=${cat.id}" class="category-card hover-lift">
          <div class="category-icon">${categoryIcons[cat.id] || '🧁'}</div>
          <div class="category-name">${cat.name}</div>
          <div class="category-count">${cat.productCount} items</div>
        </a>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// ============================================
// ADD TO CART
// ============================================

function addToCart(product) {
  if(window.cart) window.cart.add(product, 1);
  else console.log('Cart system not loaded yet');
}

// ============================================
// TOGGLE WISHLIST
// ============================================

function toggleWishlist(productId) {
  if(window.showToast) window.showToast('Added to wishlist!', 'success');
}

// ============================================
// FILTER BUTTONS
// ============================================

function initFilterButtons() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Load products with filter
      const category = btn.dataset.category;
      productsState.category = category;
      productsState.page = 1;
      loadProducts({ category, page: 1 });
    });
  });
}

// ============================================
// SORT SELECT
// ============================================

function initSortSelect() {
  const sortSelect = document.getElementById('sortSelect');
  
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      productsState.sort = e.target.value;
      productsState.page = 1;
      loadProducts({ page: 1 });
    });
  }
}

// ============================================
// LOAD MORE
// ============================================

function initLoadMore() {
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadProducts({ 
        page: productsState.page + 1, 
        append: true 
      });
    });
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  
  // Utils Fallback if missing
  window.utils = window.utils || {
      formatCurrency: (p) => '₹' + p,
      getUrlParam: (n) => new URLSearchParams(window.location.search).get(n)
  };

  // Check if we're on the products page
  if (productsGrid) {
    // Get category from URL
    const urlCategory = utils.getUrlParam('category');
    if (urlCategory) {
      productsState.category = urlCategory;
      // Update page title
      const pageTitle = document.getElementById('pageTitle');
      const pageSubtitle = document.getElementById('pageSubtitle');
      if (pageTitle) pageTitle.textContent = urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1);
      if (pageSubtitle) pageSubtitle.textContent = `Browse our ${urlCategory} collection`;
    }
    
    loadProducts({ category: productsState.category });
    initFilterButtons();
    initSortSelect();
    initLoadMore();
  }
  
  // Load featured products on homepage
  if (featuredProducts) {
    loadFeaturedProducts();
  }
  
  // Load categories
  if (categoriesGrid) {
    loadCategories();
  }
});

// Make functions available globally
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;