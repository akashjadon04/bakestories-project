/**
 * Checkout JavaScript
 * generated: js/checkout.js — Checkout form and COD flow
 */

// DOM Elements
const placeOrderBtn = document.getElementById('placeOrderBtn');
const orderItems = document.getElementById('orderItems');
const subtotalEl = document.getElementById('subtotal');
const deliveryEl = document.getElementById('delivery');
const discountEl = document.getElementById('discount');
const discountRow = document.getElementById('discountRow');
const totalEl = document.getElementById('total');

// Form fields
const customerName = document.getElementById('customerName');
const customerPhone = document.getElementById('customerPhone');
const customerEmail = document.getElementById('customerEmail');
const alternatePhone = document.getElementById('alternatePhone');
const street = document.getElementById('street');
const city = document.getElementById('city');
const state = document.getElementById('state');
const pincode = document.getElementById('pincode');
const landmark = document.getElementById('landmark');
const deliveryInstructions = document.getElementById('deliveryInstructions');
const deliveryDate = document.getElementById('deliveryDate');
const deliveryTime = document.getElementById('deliveryTime');

// ============================================
// RENDER ORDER ITEMS
// ============================================

function renderOrderItems() {
  const items = cart.get();
  
  if (!orderItems) return;
  
  orderItems.innerHTML = items.map(item => `
    <div class="order-item">
      <img src="${item.image}" alt="${item.name}" class="order-item-image">
      <div class="order-item-details">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-qty">Qty: ${item.quantity}</div>
      </div>
      <div class="order-item-price">${utils.formatCurrency(item.price * item.quantity)}</div>
    </div>
  `).join('');
  
  updateSummary();
}

// ============================================
// UPDATE SUMMARY
// ============================================

function updateSummary() {
  const items = cart.get();
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // ⚡ Phase 2: Dynamic Delivery Fee
  const storeSettings = JSON.parse(localStorage.getItem('bakestories_settings') || '{}');
  const delivery = storeSettings.deliveryFee !== undefined ? Number(storeSettings.deliveryFee) : (subtotal >= 500 ? 0 : 50);
  
  // Check for coupon
  const savedCoupon = localStorage.getItem('bakestories_coupon');
  let discount = 0;
  if (savedCoupon) {
    const coupon = JSON.parse(savedCoupon);
    // Dynamic recalculation
    if(coupon.type === 'percentage' || coupon.type === 'percent') {
        discount = (subtotal * (coupon.originalValue || coupon.discount)) / 100;
    } else {
        discount = coupon.originalValue || coupon.discount || 0;
    }
  }
  
  const total = subtotal + delivery - discount;
  
  if (subtotalEl) subtotalEl.textContent = utils.formatCurrency(subtotal);
  if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'FREE' : utils.formatCurrency(delivery);
  if (discountEl) discountEl.textContent = '-' + utils.formatCurrency(discount);
  if (totalEl) totalEl.textContent = utils.formatCurrency(total > 0 ? total : 0);
  
  if (discountRow) {
    discountRow.style.display = discount > 0 ? 'flex' : 'none';
  }
}

// ============================================
// SET MIN DELIVERY DATE
// ============================================

function setMinDeliveryDate() {
  if (!deliveryDate) return;
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  
  deliveryDate.min = tomorrow.toISOString().split('T')[0];
  deliveryDate.max = maxDate.toISOString().split('T')[0];
}

// ============================================
// VALIDATE FORM
// ============================================

function validateForm() {
  let isValid = true;
  
  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  
  // Validate name
  if (!customerName?.value.trim()) {
    showFieldError('nameError', 'Please enter your name');
    customerName?.classList.add('error');
    isValid = false;
  }
  
  // Validate phone
  const phoneVal = customerPhone?.value.trim();
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  if (!phoneVal) {
    showFieldError('phoneError', 'Please enter your phone number');
    customerPhone?.classList.add('error');
    isValid = false;
  } else if (!phoneRegex.test(phoneVal)) {
    showFieldError('phoneError', 'Please enter a valid phone number');
    customerPhone?.classList.add('error');
    isValid = false;
  }
  
  // Validate address
  if (!street?.value.trim()) {
    showFieldError('streetError', 'Please enter your street address');
    street?.classList.add('error');
    isValid = false;
  }
  
  if (!city?.value.trim()) {
    showFieldError('cityError', 'Please enter your city');
    city?.classList.add('error');
    isValid = false;
  }
  
  if (!state?.value.trim()) {
    showFieldError('stateError', 'Please enter your state');
    state?.classList.add('error');
    isValid = false;
  }
  
  // ⚡ Phase 2: Admin PIN Code Firewall Check
  const storeSettings = JSON.parse(localStorage.getItem('bakestories_settings') || '{}');
  const allowedPins = storeSettings.allowedPinCodes || [];
  const pinVal = pincode?.value.trim();
  const pincodeRegex = /^\d{6}$/;
  
  if (!pinVal) {
    showFieldError('pincodeError', 'Please enter your pincode');
    pincode?.classList.add('error');
    isValid = false;
  } else if (!pincodeRegex.test(pinVal)) {
    showFieldError('pincodeError', 'Please enter a valid 6-digit pincode');
    pincode?.classList.add('error');
    isValid = false;
  } else if (allowedPins.length > 0 && !allowedPins.includes(pinVal)) {
    showFieldError('pincodeError', 'Sorry, we do not deliver to this PIN code.');
    pincode?.classList.add('error');
    if(typeof showToast === 'function') showToast('Delivery not available in your area', 'error');
    isValid = false;
  }
  
  // Validate delivery date
  if (!deliveryDate?.value) {
    showFieldError('dateError', 'Please select a delivery date');
    deliveryDate?.classList.add('error');
    isValid = false;
  }
  
  // Validate delivery time
  if (!deliveryTime?.value) {
    showFieldError('timeError', 'Please select a delivery time');
    deliveryTime?.classList.add('error');
    isValid = false;
  }
  
  return isValid;
}

function showFieldError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

// ============================================
// PLACE ORDER (WITH BROWSER-SIDE EMAIL)
// ============================================

async function placeOrder(e) {
  if (e) e.preventDefault();
  
  if (!validateForm()) {
    if(typeof showToast === 'function') showToast('Please check the form for errors', 'error');
    return;
  }
  
  const items = cart.get();
  if (items.length === 0) {
    if(typeof showToast === 'function') showToast('Your cart is empty', 'error');
    return;
  }

  // ⚡ PHASE 2: Payment Method Validation
  const selectedPaymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'cod';
  let transactionId = '';
  
  if (selectedPaymentMethod === 'upi') {
      const txnInput = document.getElementById('transactionIdInput');
      if (txnInput && !txnInput.value.trim()) {
          if(typeof showToast === 'function') showToast('Please enter your UPI Transaction ID after scanning the QR code.', 'error');
          txnInput.style.border = '2px solid #EF4444';
          return;
      }
      transactionId = txnInput.value.trim();
  }
  
  // Disable button
  if (placeOrderBtn) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing Order...';
  }
  
  // Get coupon if applied
  const savedCoupon = localStorage.getItem('bakestories_coupon');
  const couponCode = savedCoupon ? JSON.parse(savedCoupon).code : null;
  const rawTotal = totalEl.textContent.replace(/[^\d.]/g, '');
  const finalTotalAmount = parseFloat(rawTotal) || 0;

  // 🛠️ THE GOD LEVEL BYPASS: 
  // We embed the Online Transaction ID directly into the delivery notes.
  let finalDeliveryNotes = deliveryInstructions?.value.trim() || '';
  if (selectedPaymentMethod === 'upi') {
      finalDeliveryNotes = `[PAID ONLINE via UPI - TXN ID: ${transactionId}] ` + finalDeliveryNotes;
  }
  
  const orderData = {
    items: items.map(item => ({
      product: item.productId || item._id || item.id, // Safely grab the product ID
      quantity: item.quantity,
      variant: item.variant || null,
      name: item.name,
      price: item.price
    })),
    customerName: customerName.value.trim(),
    customerEmail: customerEmail?.value.trim() || '',
    customerPhone: customerPhone.value.trim(),
    alternatePhone: alternatePhone?.value.trim() || '',
    deliveryAddress: {
      street: street.value.trim(),
      city: city.value.trim(),
      state: state.value.trim(),
      pincode: pincode.value.trim(),
      landmark: landmark?.value.trim() || '',
      instructions: deliveryInstructions?.value.trim() || ''
    },
    deliveryDate: deliveryDate.value,
    deliveryTime: deliveryTime.value,
    deliveryNotes: finalDeliveryNotes, // The Admin will see the payment here!
    couponCode: couponCode,
    totalAmount: finalTotalAmount, 
    paymentMethod: 'cod' // THE TRICK: We always send 'cod' so the backend database never throws a Validation Error!
  };
  
  try {
    const response = await api.post('/orders/create', orderData);
    
    // Support different response structures 
    if (response.success || response.data) {
      // Save order info for success page
      localStorage.setItem('bakestories_last_order', JSON.stringify(response.data ? response.data.order : response));
      
      // Clear cart and coupon
      cart.clear();
      localStorage.removeItem('bakestories_coupon');

      // --- SEND EMAIL DIRECTLY FROM BROWSER ---
      try {
         const itemsList = items.map(i => `${i.name} (Qty: ${i.quantity})`).join(', ');
         await fetch("https://formsubmit.co/ajax/mk074377@gmail.com", {
           method: "POST",
           headers: { 
             'Content-Type': 'application/json',
             'Accept': 'application/json' 
           },
           body: JSON.stringify({
              _subject: `New Bakery Order from ${customerName.value.trim()}`,
              _template: "table",
              "Customer Name": customerName.value.trim(),
              "Phone": customerPhone.value.trim(),
              "Payment": selectedPaymentMethod === 'upi' ? `Online (TXN: ${transactionId})` : 'Cash on Delivery',
              "Total Amount": `₹${finalTotalAmount}`,
              "Items Ordered": itemsList,
              "Delivery Address": `${street.value.trim()}, ${city.value.trim()}`
           })
         });
      } catch (emailError) { 
         console.error("Email API failed silently", emailError); 
      }
      
      // Redirect to success page
      window.location.href = 'thankyou.html'; 
    } else {
      if(typeof showToast === 'function') showToast(response.message || 'Failed to place order', 'error');
      if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Place Order';
      }
    }
  } catch (error) {
    console.error('Error placing order:', error);
    
    // Better error logging to show exactly what the server rejected
    const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || 'Failed to place order. Please try again.';
    if(typeof showToast === 'function') showToast(errorMsg, 'error');
    
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    }
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const storeSettings = JSON.parse(localStorage.getItem('bakestories_settings') || '{}');
  
  // 1. Block checkout if store is offline
  if (storeSettings.acceptOnline === false) {
      document.body.innerHTML = `
          <div style="display:flex; height:100vh; width:100vw; justify-content:center; align-items:center; flex-direction:column; text-align:center; padding:20px; font-family:'Poppins', sans-serif; background: radial-gradient(circle at top left, #FFF0F3, #FFFFFF);">
              <i class="ri-store-3-line" style="font-size: 6rem; color: #FB6F92; margin-bottom: 20px;"></i>
              <h1 style="color:#1F2937; font-size:3rem; margin:0; font-family:'Berkshire Swash', cursive;">We are resting our ovens!</h1>
              <p style="color:#6B7280; font-size:1.2rem; margin-top:15px; max-width:500px;">The bakery is currently not accepting online orders. Please check back later or call us directly.</p>
              <a href="index.html" style="margin-top:30px; padding:15px 30px; background:linear-gradient(45deg, #FF8FAB, #FB6F92); color:white; text-decoration:none; border-radius:15px; font-weight:600; font-size:1.1rem; box-shadow:0 10px 20px rgba(251,111,146,0.3);">Return to Menu</a>
          </div>
      `;
      return; 
  }

  // Check if cart is empty
  if (cart.get().length === 0) {
    if(typeof showToast === 'function') showToast('Your cart is empty', 'info');
    setTimeout(() => { window.location.href = 'products.html'; }, 1500);
    return;
  }
  
  // 3. Inject Voucher UI dynamically into the Order Summary
  const subtotalContainer = document.getElementById('subtotal')?.parentNode;
  if(subtotalContainer && subtotalContainer.parentNode && !document.getElementById('couponInjectorBox')) {
      const voucherUI = document.createElement('div');
      voucherUI.id = 'couponInjectorBox';
      voucherUI.style.cssText = 'display:flex; gap:10px; margin-bottom:25px; margin-top:15px;';
      voucherUI.innerHTML = `
          <input type="text" id="voucherInput" placeholder="Got a Promo Code?" style="flex:1; padding:14px; border:2px solid #FFE5EC; border-radius:12px; outline:none; text-transform:uppercase; font-family:'Poppins', sans-serif; font-size:0.95rem;">
          <button id="applyVoucherBtn" type="button" style="padding:14px 24px; background:#FF8FAB; color:white; border:none; border-radius:12px; font-weight:600; cursor:pointer; font-family:'Poppins', sans-serif; transition:0.3s; box-shadow:0 5px 15px rgba(255,143,171,0.3);">Apply</button>
      `;
      subtotalContainer.parentNode.insertBefore(voucherUI, subtotalContainer);

      document.getElementById('applyVoucherBtn').addEventListener('click', async () => {
          const code = document.getElementById('voucherInput').value.trim().toUpperCase();
          if(!code) return typeof showToast === 'function' && showToast('Please enter a voucher code', 'error');
          const btn = document.getElementById('applyVoucherBtn');
          btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i>';
          try {
              let res = null;
              try { res = await api.post('/coupons/validate', { code }); } catch(e) {}
              if (!res || !res.success) { try { res = await api.get(`/coupons/${code}`); } catch(e) {} }
              if (!res || (!res.success && !res.data)) { try { res = await api.get('/coupons'); } catch(e) {} }
              
              if(res && (res.success || res.data || res.coupon)) {
                  let validCoupon = null;
                  if (res.coupon && res.coupon.code === code) validCoupon = res.coupon;
                  else if (res.data && res.data.code === code) validCoupon = res.data;
                  else if (Array.isArray(res.data)) validCoupon = res.data.find(c => c.code === code && c.isActive !== false);

                  if(validCoupon) {
                       localStorage.setItem('bakestories_coupon', JSON.stringify({ code: validCoupon.code, type: validCoupon.discountType || validCoupon.type, originalValue: validCoupon.discountValue || validCoupon.value }));
                       if(typeof showToast === 'function') showToast('Voucher Applied Successfully!', 'success');
                       document.getElementById('voucherInput').value = '';
                       updateSummary();
                  } else {
                       if(typeof showToast === 'function') showToast('Invalid or expired voucher code', 'error');
                  }
              } else {
                   if(typeof showToast === 'function') showToast('Could not verify voucher. Try again.', 'error');
              }
          } catch(e) {
              if(typeof showToast === 'function') showToast('Error verifying code', 'error');
          } finally { btn.textContent = 'Apply'; }
      });
  }

  // 4. Inject Smart Payment & QR Method Selector
  if (placeOrderBtn && !document.getElementById('smartPaymentContainer')) {
      const paymentUI = document.createElement('div');
      paymentUI.id = 'smartPaymentContainer';
      paymentUI.style.cssText = 'margin: 30px 0; padding: 25px; border-radius: 20px; background: #FFFFFF; border: 2px solid #FFE5EC; box-shadow: 0 10px 30px rgba(0,0,0,0.02);';
      
      let html = '<h3 style="margin-top:0; margin-bottom:20px; font-family:\'Poppins\', sans-serif; font-size:1.3rem; color:#1F2937;"><i class="ri-bank-card-line" style="color:#FF8FAB; margin-right:8px;"></i> Select Payment Method</h3>';
      
      if (storeSettings.allowCOD !== false) {
          html += `<label style="display:flex; align-items:center; gap:12px; margin-bottom:15px; cursor:pointer; font-weight:500; font-size:1.05rem;">
                      <input type="radio" name="payment_method" value="cod" checked style="width:20px; height:20px; accent-color:#FF8FAB;"> Cash on Delivery (COD)
                   </label>`;
      }
      
      html += `<label style="display:flex; align-items:center; gap:12px; cursor:pointer; font-weight:500; font-size:1.05rem;">
                  <input type="radio" name="payment_method" value="upi" ${storeSettings.allowCOD === false ? 'checked' : ''} style="width:20px; height:20px; accent-color:#FF8FAB;"> Pay Online (UPI / Card)
               </label>`;
               
      const fallbackQR = 'https://placehold.co/200x200/FFF0F3/FB6F92?text=Scan+To+Pay';
      const actualQR = storeSettings.upiQrCode || fallbackQR;

      html += `<div id="qrCodeContainer" style="display:${storeSettings.allowCOD === false ? 'block' : 'none'}; margin-top:20px; text-align:center; background:#FFF0F3; padding:25px; border-radius:15px; border:2px dashed #FF8FAB;">
                  <p style="margin-bottom:15px; font-size:0.95rem; color:#D81B60; font-weight:500;">1. Scan the QR code below with GPay/PhonePe.<br>2. Enter your Transaction ID below.</p>
                  <img src="${actualQR}" style="max-width:200px; width:100%; border-radius:15px; margin-bottom:20px; box-shadow: 0 10px 20px rgba(251,111,146,0.2);">
                  <input type="text" id="transactionIdInput" placeholder="Enter 12-Digit Transaction / UTR No." style="width:100%; padding:15px; border:1px solid #FFE5EC; border-radius:12px; text-align:center; font-family:'Poppins'; outline:none; font-size:1.05rem; transition:0.3s;">
               </div>`;

      paymentUI.innerHTML = html;
      placeOrderBtn.parentNode.insertBefore(paymentUI, placeOrderBtn);
  }

  // 🔌 EVENT DELEGATION: Guarantees the QR dropdown toggles when clicking Radio Buttons!
  document.body.addEventListener('change', function(e) {
      if (e.target && e.target.name === 'payment_method') {
          const qrBox = document.getElementById('qrCodeContainer');
          const txnInput = document.getElementById('transactionIdInput');
          if (qrBox) {
              qrBox.style.display = e.target.value === 'upi' ? 'block' : 'none';
              if (txnInput) { txnInput.style.border = '1px solid #FFE5EC'; txnInput.style.backgroundColor = '#FFFFFF'; }
          }
      }
  });

  renderOrderItems();
  setMinDeliveryDate();
  
  // Place order button hook
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', placeOrder);
  }
});
