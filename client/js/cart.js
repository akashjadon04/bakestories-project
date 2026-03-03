/**
 * Cart JavaScript
 * generated: js/cart.js — Shopping cart functionality
 */

// DOM Elements
const cartItems = document.getElementById('cartItems');
const cartContent = document.getElementById('cartContent');
const emptyCart = document.getElementById('emptyCart');
const subtotalEl = document.getElementById('subtotal');
const deliveryEl = document.getElementById('delivery');
const discountEl = document.getElementById('discount');
const discountRow = document.getElementById('discountRow');
const totalEl = document.getElementById('total');
const couponInput = document.getElementById('couponInput');
const applyCouponBtn = document.getElementById('applyCouponBtn');
const couponMessage = document.getElementById('couponMessage');

// Cart state
let cartState = {
  items: [],
  coupon: null,
  discount: 0
};

// ============================================
// RENDER CART
// ============================================

function renderCart() {
  cartState.items = cart.get();
  
  // Show empty cart or cart content
  if (cartState.items.length === 0) {
    if (emptyCart) emptyCart.style.display = 'block';
    if (cartContent) cartContent.style.display = 'none';
    return;
  }
  
  if (emptyCart) emptyCart.style.display = 'none';
  if (cartContent) cartContent.style.display = 'grid';
  
  // Render items
  if (cartItems) {
    cartItems.innerHTML = cartState.items.map((item, index) => `
      <div class="cart-item cart-item-enter" data-index="${index}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h3 class="cart-item-name">${item.name}</h3>
          ${item.variant ? `<p class="cart-item-variant">${item.variant.name}</p>` : ''}
          <p class="cart-item-price">${utils.formatCurrency(item.price)}</p>
          <div class="cart-item-actions">
            <div class="quantity-control">
              <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
              <input type="text" class="quantity-input" value="${item.quantity}" readonly>
              <button class="quantity-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
            </div>
            <button class="remove-btn" onclick="removeItem(${index})">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 16px; height: 16px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  updateSummary();
}

// ============================================
// UPDATE SUMMARY
// ============================================

function updateSummary() {
  const subtotal = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = subtotal >= 500 ? 0 : 50;
  const discount = cartState.discount || 0;
  const total = subtotal + delivery - discount;
  
  if (subtotalEl) subtotalEl.textContent = utils.formatCurrency(subtotal);
  if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'FREE' : utils.formatCurrency(delivery);
  if (discountEl) discountEl.textContent = '-' + utils.formatCurrency(discount);
  if (totalEl) totalEl.textContent = utils.formatCurrency(total);
  
  // Show/hide discount row
  if (discountRow) {
    discountRow.style.display = discount > 0 ? 'flex' : 'none';
  }
}

// ============================================
// UPDATE QUANTITY
// ============================================

function updateQuantity(index, quantity) {
  const item = cartState.items[index];
  if (!item) return;
  
  if (quantity <= 0) {
    removeItem(index);
    return;
  }
  
  cart.updateQuantity(item.productId, quantity, item.variant);
  renderCart();
}

// ============================================
// REMOVE ITEM
// ============================================

function removeItem(index) {
  const item = cartState.items[index];
  if (!item) return;
  
  // Add exit animation
  const itemEl = document.querySelector(`[data-index="${index}"]`);
  if (itemEl) {
    itemEl.classList.add('cart-item-exit');
    setTimeout(() => {
      cart.remove(item.productId, item.variant);
      renderCart();
      showToast('Item removed from cart', 'info');
    }, 300);
  } else {
    cart.remove(item.productId, item.variant);
    renderCart();
  }
}

// ============================================
// APPLY COUPON
// ============================================

async function applyCoupon() {
  const code = couponInput?.value.trim();
  
  if (!code) {
    couponMessage.textContent = 'Please enter a coupon code';
    couponMessage.style.color = 'var(--error)';
    return;
  }
  
  const subtotal = cartState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  try {
    const response = await api.post('/orders/validate-coupon', {
      code,
      cartTotal: subtotal
    });
    
    if (response.success) {
      cartState.coupon = response.data;
      cartState.discount = response.data.discount;
      
      couponMessage.textContent = `Coupon applied! You saved ${utils.formatCurrency(response.data.discount)}`;
      couponMessage.style.color = 'var(--success)';
      
      // Save coupon to localStorage for checkout
      localStorage.setItem('bakestories_coupon', JSON.stringify(response.data));
      
      updateSummary();
      showToast('Coupon applied successfully!', 'success');
    } else {
      couponMessage.textContent = response.message;
      couponMessage.style.color = 'var(--error)';
      cartState.coupon = null;
      cartState.discount = 0;
      localStorage.removeItem('bakestories_coupon');
      updateSummary();
    }
  } catch (error) {
    couponMessage.textContent = 'Failed to apply coupon';
    couponMessage.style.color = 'var(--error)';
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  
  // Apply coupon button
  if (applyCouponBtn) {
    applyCouponBtn.addEventListener('click', applyCoupon);
  }
  
  // Check for saved coupon
  const savedCoupon = localStorage.getItem('bakestories_coupon');
  if (savedCoupon && couponInput) {
    const coupon = JSON.parse(savedCoupon);
    couponInput.value = coupon.code;
    cartState.coupon = coupon;
    cartState.discount = coupon.discount;
    if (couponMessage) {
      couponMessage.textContent = `Coupon applied! You saved ${utils.formatCurrency(coupon.discount)}`;
      couponMessage.style.color = 'var(--success)';
    }
    updateSummary();
  }
});

// Make functions available globally
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
