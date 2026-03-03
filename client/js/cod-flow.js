/**
 * COD Flow JavaScript
 * generated: js/cod-flow.js — Order success and call-to-confirm flow
 */

// DOM Elements
const orderNumberEl = document.getElementById('orderNumber');
const trackOrderNumberEl = document.getElementById('trackOrderNumber');
const bakeryPhoneEl = document.getElementById('bakeryPhone');
const bakeryPhoneLink = document.getElementById('bakeryPhoneLink');
const orderSummary = document.getElementById('orderSummary');
const requestCallBtn = document.getElementById('requestCallBtn');
const confettiContainer = document.getElementById('confettiContainer');

// ============================================
// CREATE CONFETTI
// ============================================

function createConfetti() {
  if (!confettiContainer) return;
  
  const colors = ['#ffc0cb', '#ff7aa2', '#ffb6c1', '#fff5f8'];
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confettiContainer.appendChild(confetti);
  }
  
  // Remove confetti after animation
  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 5000);
}

// ============================================
// LOAD ORDER DETAILS
// ============================================

function loadOrderDetails() {
  const orderData = localStorage.getItem('bakestories_last_order');
  
  if (!orderData) {
    // Redirect to home if no order data
    window.location.href = 'index.html';
    return;
  }
  
  const order = JSON.parse(orderData);
  
  // Display order number
  if (orderNumberEl) orderNumberEl.textContent = order.orderNumber;
  if (trackOrderNumberEl) trackOrderNumberEl.textContent = order.orderNumber;
  
  // Load bakery phone from settings
  loadBakeryPhone();
  
  // Render order summary
  renderOrderSummary(order);
  
  // Create confetti
  createConfetti();
}

// ============================================
// LOAD BAKERY PHONE
// ============================================

async function loadBakeryPhone() {
  try {
    const response = await api.get('/admin/settings');
    if (response.success && response.data.settings.bakery.phone) {
      const phone = response.data.settings.bakery.phone;
      if (bakeryPhoneEl) bakeryPhoneEl.textContent = phone;
      if (bakeryPhoneLink) bakeryPhoneLink.href = `tel:${phone}`;
    }
  } catch (e) {
    // Use default
  }
}

// ============================================
// RENDER ORDER SUMMARY
// ============================================

function renderOrderSummary(order) {
  if (!orderSummary) return;
  
  // This is a simplified summary - in production, you'd have the full order details
  orderSummary.innerHTML = `
    <div class="detail-row">
      <span>Order Status</span>
      <span style="color: var(--warning);">Awaiting Confirmation</span>
    </div>
    <div class="detail-row">
      <span>Payment Method</span>
      <span>Cash on Delivery</span>
    </div>
    <div class="detail-row">
      <span>Delivery Date</span>
      <span>${order.deliveryDate || 'TBD'}</span>
    </div>
    <div class="detail-row">
      <span>Total Amount</span>
      <span>${utils.formatCurrency(order.totalAmount)}</span>
    </div>
  `;
}

// ============================================
// REQUEST CALL
// ============================================

async function requestCall() {
  const orderData = localStorage.getItem('bakestories_last_order');
  if (!orderData) return;
  
  const order = JSON.parse(orderData);
  
  if (requestCallBtn) {
    requestCallBtn.disabled = true;
    requestCallBtn.textContent = 'Requesting...';
  }
  
  try {
    const response = await api.post('/webhook/call-request', {
      orderId: order.id,
      phone: order.customerPhone,
      urgent: true
    });
    
    if (response.success) {
      showToast('Call request sent! We will call you within 30 minutes.', 'success');
      if (requestCallBtn) {
        requestCallBtn.textContent = 'Call Requested';
        requestCallBtn.classList.add('btn-primary');
        requestCallBtn.classList.remove('btn-secondary');
      }
    } else {
      showToast(response.message || 'Failed to request call', 'error');
      if (requestCallBtn) {
        requestCallBtn.disabled = false;
        requestCallBtn.textContent = 'Request Call Now';
      }
    }
  } catch (error) {
    console.error('Error requesting call:', error);
    showToast('Failed to request call. Please call us directly.', 'error');
    if (requestCallBtn) {
      requestCallBtn.disabled = false;
      requestCallBtn.textContent = 'Request Call Now';
    }
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadOrderDetails();
  
  if (requestCallBtn) {
    requestCallBtn.addEventListener('click', requestCall);
  }
});

// Make available globally
window.requestCall = requestCall;
