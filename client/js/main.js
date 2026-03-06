/**
 * The Bake Stories - Main JavaScript
 * generated: js/main.js — Core functionality shared across pages
 * 👑 GOD LEVEL FIX: Dynamic Admin Logo Enforcer Added
 */

// ============================================
// CONFIGURATION
// ============================================

const API_BASE_URL = "https://bakestories-project.onrender.com/api";

// ============================================
// UTILITY FUNCTIONS
// ============================================

const utils = {
  // Format currency
  formatCurrency: (amount) => {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  },
  
  // Format date
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },
  
  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Generate unique ID
  generateId: () => {
    return Math.random().toString(36).substr(2, 9);
  },
  
  // Deep clone
  clone: (obj) => JSON.parse(JSON.stringify(obj)),
  
  // Get URL parameter
  getUrlParam: (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
};

// ============================================
// CART MANAGEMENT (localStorage)
// ============================================

const cart = {
  key: 'bakestories_cart',
  
  // Get cart items
  get: () => {
    try {
      const data = localStorage.getItem(cart.key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading cart:', e);
      return [];
    }
  },
  
  // Save cart items
  save: (items) => {
    try {
      localStorage.setItem(cart.key, JSON.stringify(items));
      cart.updateUI();
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  },
  
  // Add item to cart
  add: (product, quantity = 1, variant = null) => {
    const items = cart.get();
    const existingIndex = items.findIndex(item => 
      item.productId === product._id && 
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
    
    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        productId: product._id,
        name: product.name,
        price: variant?.price || product.price,
        image: product.primaryImage?.url || product.images?.[0]?.url || '',
        quantity,
        variant,
        addedAt: new Date().toISOString()
      });
    }
    
    cart.save(items);
    showToast('Added to cart!', 'success');
    
    // Trigger elastic animation on cart icon
    const cartBtn = document.querySelector('a[href="cart.html"]');
    if (cartBtn) {
      cartBtn.classList.add('elastic');
      setTimeout(() => cartBtn.classList.remove('elastic'), 800);
    }
  },
  
  // Update item quantity
  updateQuantity: (productId, quantity, variant = null) => {
    const items = cart.get();
    const index = items.findIndex(item => 
      item.productId === productId && 
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
    
    if (index >= 0) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }
      cart.save(items);
    }
  },
  
  // Remove item from cart
  remove: (productId, variant = null) => {
    const items = cart.get();
    const filtered = items.filter(item => 
      !(item.productId === productId && 
        JSON.stringify(item.variant) === JSON.stringify(variant))
    );
    cart.save(filtered);
  },
  
  // Clear cart
  clear: () => {
    localStorage.removeItem(cart.key);
    cart.updateUI();
  },
  
  // Get cart count
  getCount: () => {
    return cart.get().reduce((sum, item) => sum + item.quantity, 0);
  },
  
  // Get cart total
  getTotal: () => {
    return cart.get().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  // Update cart UI (badge)
  updateUI: () => {
    const count = cart.getCount();
    const badges = document.querySelectorAll('#cartBadge');
    
    badges.forEach(badge => {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
        badge.classList.add('bounce');
        setTimeout(() => badge.classList.remove('bounce'), 600);
      } else {
        badge.style.display = 'none';
      }
    });
  }
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };
  
  const titles = {
    success: 'Success!',
    error: 'Oops!',
    info: 'Info'
  };
  
  toast.innerHTML = `
    <div class="toast-icon ${type}">
      ${icons[type]}
    </div>
    <div class="toast-content">
      <div class="toast-title">${title || titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================
// MOBILE MENU
// ============================================

function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu when clicking a link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================

function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;
  
  let lastScroll = 0;
  
  window.addEventListener('scroll', utils.debounce(() => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, 10));
}

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================

function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  revealElements.forEach(el => revealObserver.observe(el));
}

// ============================================
// API HELPERS
// ============================================

const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return response.json();
  },
  
  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize cart UI
  cart.updateUI();
  
  // Initialize mobile menu
  initMobileMenu();
  
  // Initialize header scroll effect
  initHeaderScroll();
  
  // Initialize scroll reveal
  initScrollReveal();
  
  // Load footer contact info from API
  loadFooterInfo();
  
  // Bind add-to-cart buttons and animations
  bindAddToCartButtons();
  
  // Ensure toast container exists
  ensureToastContainer();
  
  // ⚡ GOD LEVEL FIX: GLOBAL DYNAMIC LOGO ENFORCER
  enforceDynamicLogo();
});

// Load footer info
async function loadFooterInfo() {
  try {
    const response = await api.get('/instagram/hero-images');
    if (response.success && response.data.logo) {
      const logoImgs = document.querySelectorAll('#logoImg');
      logoImgs.forEach(img => {
        img.src = response.data.logo.url;
      });
    }
  } catch (e) {
    // Silent fail - use default logo
  }
}

// Make utilities available globally
window.utils = utils;
window.cart = cart;
window.showToast = showToast;
window.api = api;
window.API_BASE_URL = API_BASE_URL;

/* ===========================================================
   ADDITIONS: Animation triggers, flying image, toast container,
   bind add-to-cart buttons. These are appended and keep all
   original code intact. Do NOT remove existing file content.
   =========================================================== */

/**
 * Ensure a toast container exists in the DOM (used by showToast)
 */
function ensureToastContainer() {
  if (!document.getElementById('toastContainer')) {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    // keep it near the end so z-index works and to avoid collision with other modals
    document.body.appendChild(container);
  }
}

/**
 * Get the cart target element to animate toward.
 * Prefer FAB (.fab) if present, otherwise prefer header cart icon a[href="cart.html"] or .icon-btn.cart
 */
function getCartTargetElement() {
  // order of preference
  let el = document.querySelector('.fab');
  if (el) return el;
  el = document.querySelector('a[href="cart.html"]');
  if (el) return el;
  el = document.querySelector('.icon-btn.cart');
  return el;
}

/**
 * Animate a cloned image flying to the cart
 * @param {HTMLImageElement} sourceImgEl - actual product image element
 * @param {Function} onComplete - callback after animation
 */
function animateImageToCart(sourceImgEl, onComplete = () => {}) {
  const target = getCartTargetElement();
  if (!sourceImgEl || !target) {
    onComplete();
    return;
  }

  const rect = sourceImgEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // create clone
  const clone = sourceImgEl.cloneNode(true);
  clone.classList.add('flying-img');
  document.body.appendChild(clone);

  // set initial position and size
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.opacity = '1';
  clone.style.transform = 'translate(0,0)';

  // force reflow to ensure CSS transition starts
  void clone.offsetWidth;

  // calculate translate values to target center
  const cloneCenterX = rect.left + rect.width / 2;
  const cloneCenterY = rect.top + rect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const translateX = targetCenterX - cloneCenterX;
  const translateY = targetCenterY - cloneCenterY;

  // animate
  clone.style.transition = 'transform 0.85s cubic-bezier(.2,.9,.2,1), opacity 0.85s';
  clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.28)`;
  clone.style.opacity = '0.01';

  // highlight cart target while animating
  target.classList.add('cart-bounce', 'cart-glow');

  // cleanup after animation
  setTimeout(() => {
    try {
      clone.remove();
    } catch (e) {}
    // keep a short glow then remove
    setTimeout(() => {
      target.classList.remove('cart-bounce');
      // leave cart-glow for slightly longer
      setTimeout(() => target.classList.remove('cart-glow'), 500);
    }, 200);
    onComplete();
  }, 900);
}

/**
 * Find product data using DOM attributes or fallback to API fetch
 * Buttons should include data-product-id, data-product-name, data-product-price, data-product-image
 * If not present and productId exists, attempt to fetch from API /products/:id
 */
async function resolveProductFromButton(btn) {
  // prefer explicit data attributes
  const pid = btn.getAttribute('data-product-id') || btn.dataset.productId;
  const name = btn.getAttribute('data-product-name') || btn.dataset.productName;
  const priceAttr = btn.getAttribute('data-product-price') || btn.dataset.productPrice;
  const img = btn.getAttribute('data-product-image') || btn.dataset.productImage;

  if (pid && name && priceAttr) {
    return {
      _id: pid,
      name,
      price: Number(priceAttr),
      primaryImage: { url: img },
      images: img ? [{ url: img }] : []
    };
  }

  // fallback: if we have an id, try API
  if (pid) {
    try {
      const res = await api.get(`/products/${pid}`);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.error('Failed to fetch product by id', pid, e);
    }
  }

  // cannot resolve product
  return null;
}

/**
 * Bind add-to-cart buttons to play flying animation, update cart and show toast
 * Buttons must have class .add-to-cart (existing). If you can, add data attributes to buttons:
 * data-product-id, data-product-name, data-product-price, data-product-image
 */
function bindAddToCartButtons() {
  // Safe-guard: only bind once
  if (bindAddToCartButtons._bound) return;
  bindAddToCartButtons._bound = true;

  const buttons = document.querySelectorAll('.add-to-cart');
  if (!buttons || buttons.length === 0) return;

  buttons.forEach(btn => {
    // Prevent duplicate handler
    if (btn._bound) return;
    btn._bound = true;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      // attempt to find product image in same product card
      let productImage = null;
      const card = btn.closest('.product-card') || btn.closest('.product-item') || document;
      if (card) {
        productImage = card.querySelector('img') || card.querySelector('.product-image img') || null;
      }

      // resolve product info
      const product = await resolveProductFromButton(btn);
      if (!product) {
        // cannot add without product details
        showToast('Unable to add product (missing data).', 'error');
        return;
      }

      // animate image to cart if image found
      if (productImage) {
        animateImageToCart(productImage, () => {
          // After animation completes add to cart and update UI
          cart.add(product, 1, null);
        });
      } else {
        // No image to animate: directly add to cart
        cart.add(product, 1, null);
      }
    });
  });
}

/**
 * Optional: observe DOM for newly added product cards (useful if products are rendered after async load)
 * This will re-bind add-to-cart buttons when new nodes are inserted.
 */
function observeProductContainer(containerSelector = '.products-grid') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        bindAddToCartButtons();
      }
    }
  });

  observer.observe(container, { childList: true, subtree: true });
}

// ⚡ PHASE 2: INSTANT LOGO SWAPPER
function enforceDynamicLogo() {
    try {
        const storeSettings = JSON.parse(localStorage.getItem('bakestories_settings') || '{}');
        if (storeSettings.storeLogo) {
            // Instantly replace all instances of the logo across the website
            const allLogos = document.querySelectorAll('img[src*="placehold.co"], #logoImg, .logo img, .footer-logo img');
            allLogos.forEach(img => {
                img.src = storeSettings.storeLogo;
                img.style.objectFit = 'contain';
                img.style.background = 'transparent';
            });
        }
    } catch(e) {}
}

// Make sure we bind again after async product loads (for pages that load products via JS)
setTimeout(() => {
  bindAddToCartButtons();
  observeProductContainer();
}, 600);

/* EOF - enhancements appended */