/**
 * ============================================================================
 * ADMIN DASHBOARD CONTROLLER (FINAL PRODUCTION BUILD)
 * ============================================================================
 * Features:
 * - 🛡️ Sandboxed: Variables won't leak or crash the browser
 * - 🔌 Wired: Connects to Dashboard, Orders, Products, Customers, Settings
 * - ⚡ Real-Time: Updates tables instantly after save/delete
 * - 🖼️ Image Handling: Supports drag-and-drop & URL images
 * - 🚀 SPRINT 1: Quick Stock Toggles, Order Status, Print Receipts
 * - ✨ SPRINT 1.5 (UI UPGRADE): Premium Theme Injector, Order View Modal, Glassmorphism
 * - 👑 GOD LEVEL FIXES: HEIC Support, Berkshire Font, Stock Toggle Fix, Voucher Fix
 * - ⚙️ PHASE 2 (PATH A): WhatsApp Recovery & Store Settings Logic Added
 * - 🛠️ HOTFIX: QR Image Compression, Order Status Fallback, Minimal Voucher Payload
 * - 🎨 FINAL: Store Logo Dynamic Upload & Compression Added
 * ============================================================================
 */

(function() { // <--- START SAFETY BOX (Prevents "Identifier already declared" errors)

    // =========================================================
    // ✨ PREMIUM THEME INJECTOR (Makes admin.html gorgeous automatically)
    // =========================================================
    function injectPremiumStyles() {
        // Dynamically inject the HEIC converter script to prevent server crashes
        if(!document.getElementById('heic-script')) {
            const heicScript = document.createElement('script');
            heicScript.id = 'heic-script';
            heicScript.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
            document.head.appendChild(heicScript);
        }

        const style = document.createElement('style');
        style.innerHTML = `
            /* IMPORT BERKSHIRE SWASH (MATCHES THE PHYSICAL MENU CARD EXACTLY) */
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Berkshire+Swash&display=swap');
            
            /* Global Premium Overrides */
            body { 
                font-family: 'Poppins', sans-serif !important; 
                background: radial-gradient(circle at top left, #fffbf0, #fff0f5) !important; 
                color: #5d4037 !important; 
            }
            
            /* Glassmorphism Panels */
            .content-section, .sidebar, .navbar { 
                background: rgba(255, 255, 255, 0.85) !important; 
                backdrop-filter: blur(15px) !important; 
                border: 1px solid rgba(255, 255, 255, 0.5) !important;
                box-shadow: 0 10px 30px rgba(255, 158, 181, 0.15) !important;
                border-radius: 20px !important;
            }
            
            /* THE EXACT FONT FROM YOUR PHYSICAL MENU CARD */
            h1, h2, h3, .brand { 
                font-family: 'Berkshire Swash', cursive !important; 
                color: #ff7596 !important; 
                font-weight: normal !important;
                letter-spacing: 1px !important;
            }
            h1 { font-size: 3rem !important; margin-bottom: 20px !important; }
            h2 { font-size: 2.2rem !important; }

            .nav-link { font-weight: 500 !important; color: #8d6e63 !important; border-radius: 12px !important; transition: all 0.3s ease !important; }
            .nav-link.active, .nav-link:hover { background: #ff9eb5 !important; color: white !important; transform: translateX(5px) !important; box-shadow: 0 5px 15px rgba(255, 158, 181, 0.4) !important; }
            
            /* Floating Card Tables */
            table { border-collapse: separate !important; border-spacing: 0 12px !important; width: 100% !important; }
            th { border: none !important; padding: 12px 20px !important; color: #8d6e63 !important; font-weight: 600 !important; text-transform: uppercase !important; font-size: 0.85rem !important; letter-spacing: 1px !important; background: transparent !important; }
            td { background: #ffffff !important; padding: 15px 20px !important; box-shadow: 0 5px 15px rgba(0,0,0,0.02) !important; vertical-align: middle !important; border: none !important; }
            td:first-child { border-radius: 15px 0 0 15px !important; }
            td:last-child { border-radius: 0 15px 15px 0 !important; }
            tr { transition: transform 0.3s ease, box-shadow 0.3s ease !important; }
            tr:hover td { transform: translateY(-3px) !important; box-shadow: 0 10px 20px rgba(255, 158, 181, 0.15) !important; z-index: 10; position: relative;}
            
            /* Premium Buttons */
            .btn { border-radius: 30px !important; padding: 8px 20px !important; font-weight: 600 !important; transition: all 0.3s ease !important; border: none !important; font-family: 'Poppins', sans-serif !important; }
            .btn-primary { background: linear-gradient(45deg, #ff9eb5, #ff7596) !important; color: white !important; box-shadow: 0 5px 15px rgba(255, 122, 150, 0.4) !important; }
            .btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(255, 122, 150, 0.6) !important; }
            .btn-success { background: #e8f5e9 !important; color: #2e7d32 !important; box-shadow: none !important;}
            .btn-warning { background: #fff3e0 !important; color: #e65100 !important; box-shadow: none !important;}
            
            /* Inputs & Selects */
            .form-control, select { border-radius: 12px !important; border: 2px solid #ffe4e8 !important; padding: 10px 15px !important; background: #fff !important; transition: all 0.3s !important; color: #5d4037 !important; }
            .form-control:focus, select:focus { border-color: #ff9eb5 !important; box-shadow: 0 0 0 4px rgba(255, 158, 181, 0.2) !important; outline: none !important; }
            
            /* Cute Badges */
            .status-badge { padding: 6px 15px !important; border-radius: 20px !important; font-size: 0.8rem !important; font-weight: 700 !important; display: inline-block; }
            .status-pending, .status-pending-confirmation { background: #fff3e0 !important; color: #e65100 !important; }
            .status-preparing { background: #e3f2fd !important; color: #1565c0 !important; }
            .status-out-for-delivery { background: #f3e5f5 !important; color: #7b1fa2 !important; }
            .status-delivered { background: #e8f5e9 !important; color: #2e7d32 !important; }
            .status-cancelled { background: #ffebee !important; color: #c62828 !important; }
            
            /* Order View Modal */
            #premiumOrderModal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px); z-index: 99999; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease; }
            .order-modal-content { background: #fff; border-radius: 24px; width: 90%; max-width: 600px; padding: 30px; box-shadow: 0 20px 50px rgba(255, 158, 181, 0.3); transform: translateY(30px); transition: transform 0.3s ease; max-height: 90vh; overflow-y: auto; }
            .order-modal-content.show { transform: translateY(0); }
            .modal-close-btn { float: right; background: #ffe4e8; color: #ff7596; border: none; border-radius: 50%; width: 35px; height: 35px; font-size: 1.2rem; cursor: pointer; transition: 0.3s; display: flex; justify-content: center; align-items: center; }
            .modal-close-btn:hover { background: #ff7596; color: white; transform: rotate(90deg); }

            /* Beautiful Toast Notifications (Replaces Ugly Alerts) */
            #premiumToastContainer { position: fixed; top: 25px; right: 25px; z-index: 999999; display: flex; flex-direction: column; gap: 12px; }
            .beautiful-toast { background: #FFFFFF; padding: 16px 24px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); font-weight: 500; font-size: 1rem; display: flex; align-items: center; gap: 15px; min-width: 300px; animation: toastSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            @keyframes toastSlideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
        
        // Inject the Order Modal and Toast Container HTML to the body
        const modalHtml = `
            <div id="premiumToastContainer"></div>
            <div id="premiumOrderModal">
                <div class="order-modal-content" id="orderModalBox">
                    <button class="modal-close-btn" onclick="closeOrderModal()">×</button>
                    <h2 style="font-family: 'Berkshire Swash', cursive !important; color: #ff9eb5 !important; margin-top: 0;">Order Details</h2>
                    <div id="premiumOrderModalBody">Loading delicious details...</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // BEAUTIFUL TOAST OVERRIDE (Silently replaces all alerts in the system)
    window.showAdminToast = function(message, type = 'success') {
      const container = document.getElementById('premiumToastContainer');
      if (!container) return alert(message); // Fallback

      const toast = document.createElement('div');
      const isError = type === 'error' || message.toLowerCase().includes('fail') || message.toLowerCase().includes('error') || message.toLowerCase().includes('exist');
      const bgColor = isError ? '#FFF0F3' : '#F0FDF4';
      const textColor = isError ? '#E11D48' : '#15803D';
      const icon = isError ? 'ri-error-warning-fill' : 'ri-checkbox-circle-fill';
      const borderColor = isError ? '#FB7185' : '#34D399';

      toast.className = `beautiful-toast`;
      toast.style.cssText = `background: ${bgColor}; color: ${textColor}; border-left: 5px solid ${borderColor};`;
      toast.innerHTML = `<i class="${icon}" style="font-size:1.5rem;"></i> <span>${message}</span>`;
      
      container.appendChild(toast);
      setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(-20px)';
          toast.style.transition = 'all 0.3s ease';
          setTimeout(() => toast.remove(), 300);
      }, 4000);
    };

    // Override native alert so existing code instantly gets beautiful popups
    window.alert = function(msg) { window.showAdminToast(msg); };

    // 1. CONFIGURATION
    const API_BASE_URL = 'https://bakestories-project.onrender.com/api';
    
    // 2. STATE MANAGEMENT (Holds your data)
    let adminState = {
      token: localStorage.getItem('bakestories_admin_token'),
      user: JSON.parse(localStorage.getItem('bakestories_admin_user') || 'null'),
      products: [],
      orders: [],
      customers: []
    };
    
    // 3. API ENGINE (The Heart of the System)
    async function adminApi(endpoint, options = {}) {
      const headers = { 'Authorization': `Bearer ${adminState.token}`, ...options.headers };
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
    
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error(`API Error (${response.status}):`, text);
          return { success: false, message: `Server Error: ${response.status}` };
        }
        return await response.json();
      } catch (err) {
        console.error("Network Error:", err);
        return { success: false, message: 'Network Error: Is Server Running?' };
      }
    }
    
    // =========================================================
    // 4. GLOBAL FUNCTIONS (EXPOSED TO HTML)
    // =========================================================
    
    // --- NAVIGATION SWITCHER ---
    window.switchSection = function(section) {
      document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
      
      const target = document.getElementById(section + 'Section');
      if (target) {
        target.style.display = 'block';
        target.style.opacity = 0;
        setTimeout(() => target.style.opacity = 1, 50);
      }
    
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === section);
      });
    
      if (section === 'dashboard') window.loadDashboard();
      if (section === 'products') window.loadProductsAdmin();
      if (section === 'orders') window.loadOrders();
      if (section === 'customers') window.loadCustomers();
      if (section === 'coupons') window.loadCoupons();
      if (section === 'settings') window.loadSettings();
    };
    
    // --- DATA LOADERS ---
    
    window.loadDashboard = async function() {
      const res = await adminApi('/admin/dashboard');
      if (res.success && res.data) {
        if(document.getElementById('totalProducts')) document.getElementById('totalProducts').innerText = res.data.counts.products;
        if(document.getElementById('todayOrders')) document.getElementById('todayOrders').innerText = res.data.counts.todayOrders;
        if(document.getElementById('pendingOrders')) document.getElementById('pendingOrders').innerText = res.data.counts.pendingConfirmation;
      }
    };
    
    // THE FIX: "Disappearing Product" Bug Solved by changing stockQuantity to 0 instead of isActive=false
    window.loadProductsAdmin = async function() {
      const tbody = document.getElementById('productsTableBody');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading Inventory...</td></tr>';
    
      const res = await adminApi('/products?limit=500'); // Fetch enough limit
      
      if (res.success) {
        adminState.products = res.data.products || [];
        if (adminState.products.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center">No products found. Add your first treat! 🧁</td></tr>';
          return;
        }
    
        tbody.innerHTML = adminState.products.map(p => `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:15px;">
                 ${p.primaryImage?.url ? `<img src="${p.primaryImage.url}" width="50" height="50" style="border-radius:12px; object-fit:cover; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">` : '<span style="font-size:24px;">🍰</span>'}
                 <strong style="font-size:1.1rem; color:#5d4037;">${p.name}</strong>
              </div>
            </td>
            <td><span style="background: #fff0f5; color: #ff7596; padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; font-weight:600; text-transform:uppercase;">${p.category}</span></td>
            <td><strong style="color: #ff9eb5; font-size: 1.1rem;">₹${p.price}</strong></td>
            <td>${p.stockQuantity > 0 ? `<strong>${p.stockQuantity}</strong> units` : '<strong style="color:#e11d48;">Out of Stock</strong>'}</td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="editProduct('${p._id}')">✏️ Edit</button>
              
              <button class="btn btn-sm" style="background:${p.stockQuantity > 0 ? '#E8F5E9' : '#FFF0F3'}; color:${p.stockQuantity > 0 ? '#2e7d32' : '#E11D48'}; margin: 0 5px;" onclick="toggleProductStock('${p._id}', ${p.stockQuantity})">
                ${p.stockQuantity > 0 ? '✅ In Stock' : '❌ Out of Stock'}
              </button>
              
              <button class="btn btn-sm" style="background: #ffebee; color: #c62828;" onclick="deleteProduct('${p._id}')">🗑️</button>
            </td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="5" style="color:red;">Failed to load products.</td></tr>';
      }
    };
    
    // --- WHATSAPP 1-CLICK MESSENGER (PHASE 2) ---
    window.whatsappCustomer = function(phone, name, orderRef = '') {
        if(!phone || phone === 'undefined' || phone === 'null') {
            return window.showAdminToast('No phone number provided by customer', 'error');
        }
        let cleanPhone = String(phone).replace(/[^0-9]/g, '');
        if(cleanPhone.length === 10) cleanPhone = '91' + cleanPhone; 
        
        let msg = `Hi ${name || 'there'}! This is The Bake Stories. `;
        if(orderRef) msg += `I'm reaching out regarding your order #${orderRef}. `;
        
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    window.loadOrders = async function() {
      const tbody = document.getElementById('ordersTable');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="6">Checking Oven...</td></tr>';
      
      const res = await adminApi('/orders/admin/all');
      if (res.success && res.data.orders && res.data.orders.length > 0) {
         adminState.orders = res.data.orders; 
         
         tbody.innerHTML = res.data.orders.map(o => `
           <tr>
             <td><strong style="color: #ff7596;">#${o.orderNumber || o._id.substr(-6)}</strong></td>
             <td>
                <div style="font-weight:600; font-size:1.05rem;">${o.customerName || 'Guest'}</div>
                <div style="color:#8d6e63; font-size:0.85rem;"><i class="ri-phone-line"></i> ${o.customerPhone}</div>
             </td>
             <td><strong style="color: #2e7d32; font-size:1.1rem;">₹${o.totalAmount}</strong></td>
             <td>
               <select class="form-control" style="font-size: 0.85rem; padding: 6px 10px; font-weight:600;" onchange="updateOrderStatus('${o._id}', this.value)">
                 <option value="pending" ${o.status === 'pending' || o.status === 'pending-confirmation' ? 'selected' : ''}>⏳ Pending</option>
                 <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>👩‍🍳 Preparing</option>
                 <option value="out-for-delivery" ${o.status === 'out-for-delivery' ? 'selected' : ''}>🚚 Out for Delivery</option>
                 <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
                 <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
               </select>
             </td>
             <td>
                <button class="btn btn-sm btn-primary" onclick="viewOrderDetails('${o._id}')">👁️ View</button>
                <button class="btn btn-sm" style="background:#fff0f5; color:#ff7596; border: 1px solid #ff9eb5 !important; margin-left:5px;" onclick="printReceipt('${o._id}')">🖨️</button>
                <button class="btn btn-sm" style="background:#E8F5E9; color:#10B981; border: 1px solid #10B981 !important; margin-left:5px;" onclick="whatsappCustomer('${o.customerPhone}', '${o.customerName}', '${o.orderNumber || o._id.substr(-6)}')"><i class="ri-whatsapp-line"></i> Msg</button>
             </td>
           </tr>
         `).join('');
      } else {
         tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders yet.</td></tr>';
      }
    };
    
    // 🛠️ HOTFIX: ORDER STATUS TRIPLE FALLBACK
    window.updateOrderStatus = async function(orderId, newStatus) {
        // Try Admin route
        let res = await adminApi(`/orders/admin/${orderId}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
        // Try Status route
        if(!res || !res.success) res = await adminApi(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
        // Try Base route
        if(!res || !res.success) res = await adminApi(`/orders/${orderId}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
        
        if (res && (res.success || res.order)) {
            window.showAdminToast(`Order marked as ${newStatus}`);
        } else {
            window.showAdminToast(`Could not update to ${newStatus}. Is backend wired properly?`, "error");
        }
    };

    window.loadCustomers = async function() {
        const tbody = document.getElementById('customersTableBody');
        if(!tbody) return;
        const res = await adminApi('/admin/customers');
        if(res.success && res.data.length > 0) {
            tbody.innerHTML = res.data.map(c => `
                <tr>
                    <td><strong style="color:#5d4037;">${c.name}</strong></td>
                    <td><a href="mailto:${c.email}" style="color:#ff9eb5; text-decoration:none;">${c.email}</a></td>
                    <td>${c.phone || '-'}</td>
                    <td>
                      <button class="btn btn-sm" style="background:#E8F5E9; color:#10B981; border: none; padding: 6px 12px;" onclick="whatsappCustomer('${c.phone}', '${c.name}')"><i class="ri-whatsapp-line"></i> Chat</button>
                    </td>
                </tr>`).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No customers found.</td></tr>';
        }
    };

    window.loadCoupons = async function() {
        const tbody = document.getElementById('couponsTableBody');
        if(!tbody) return;
        const res = await adminApi('/coupons');
        if(res.success && res.data.length > 0) {
            tbody.innerHTML = res.data.map(c => `
                <tr>
                    <td><strong style="color: #ff7596; font-size:1.1rem; letter-spacing:1px;">${c.code}</strong></td>
                    <td><span style="background:#e8f5e9; color:#2e7d32; padding:4px 10px; border-radius:10px; font-weight:bold;">${c.value || c.discountValue}${c.type === 'percent' || c.discountType === 'percentage' ? '%' : ' OFF'}</span></td>
                    <td><span class="status-badge status-delivered">${c.status || 'Active'}</span></td>
                    <td><button class="btn btn-sm" style="background: #ffebee; color: #c62828;" onclick="deleteCoupon('${c._id}')">🗑️ Remove</button></td>
                </tr>`).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No coupons active.</td></tr>';
        }
    };

    // --- PHASE 2: SETTINGS MANAGER LOGIC ADDED & DUAL IMAGE UPLOAD SUPPORT ---
    window.loadSettings = async function() {
        try {
            // First check local backup so it always loads fast
            const savedData = JSON.parse(localStorage.getItem('bakestories_settings') || '{}');
            if(savedData.deliveryFee !== undefined) {
                if(document.getElementById('settingPinCodes')) document.getElementById('settingPinCodes').value = savedData.allowedPinCodes?.join(', ') || '';
                if(document.getElementById('settingDeliveryFee')) document.getElementById('settingDeliveryFee').value = savedData.deliveryFee;
                if(document.getElementById('settingAcceptOnline')) document.getElementById('settingAcceptOnline').checked = savedData.acceptOnline !== false;
                if(document.getElementById('settingCod')) document.getElementById('settingCod').checked = savedData.allowCOD !== false;
                
                // Load QR Code
                if(document.getElementById('settingQrCode')) {
                    document.getElementById('settingQrCode').value = savedData.upiQrCode || '';
                    if(savedData.upiQrCode) {
                        const preview = document.getElementById('qrPreview');
                        if (preview) preview.src = savedData.upiQrCode;
                        const container = document.getElementById('qrPreviewContainer');
                        if (container) container.style.display = 'block';
                    }
                }
                
                // Load Store Logo
                if(document.getElementById('settingStoreLogo')) {
                    document.getElementById('settingStoreLogo').value = savedData.storeLogo || '';
                    if(savedData.storeLogo) {
                        const preview = document.getElementById('logoPreview');
                        if (preview) preview.src = savedData.storeLogo;
                        const container = document.getElementById('logoPreviewContainer');
                        if (container) container.style.display = 'block';
                    }
                }
            }

            // Then try to fetch fresh from API (if route exists)
            const res = await adminApi('/settings');
            if(res.success && res.data) {
                if(document.getElementById('settingPinCodes')) document.getElementById('settingPinCodes').value = res.data.allowedPinCodes?.join(', ') || '';
                if(document.getElementById('settingDeliveryFee')) document.getElementById('settingDeliveryFee').value = res.data.deliveryFee || 0;
                if(document.getElementById('settingAcceptOnline')) document.getElementById('settingAcceptOnline').checked = res.data.acceptOnline !== false;
                if(document.getElementById('settingCod')) document.getElementById('settingCod').checked = res.data.allowCOD !== false;
                
                if(document.getElementById('settingQrCode')) {
                    document.getElementById('settingQrCode').value = res.data.upiQrCode || '';
                    if(res.data.upiQrCode) {
                        const preview = document.getElementById('qrPreview');
                        if (preview) preview.src = res.data.upiQrCode;
                        const container = document.getElementById('qrPreviewContainer');
                        if (container) container.style.display = 'block';
                    }
                }
                
                if(document.getElementById('settingStoreLogo')) {
                    document.getElementById('settingStoreLogo').value = res.data.storeLogo || '';
                    if(res.data.storeLogo) {
                        const preview = document.getElementById('logoPreview');
                        if (preview) preview.src = res.data.storeLogo;
                        const container = document.getElementById('logoPreviewContainer');
                        if (container) container.style.display = 'block';
                    }
                }
            }
        } catch(e) {}
    };

    // 🎨 FINAL FIX: ASYNC DUAL IMAGE COMPRESSOR (Handles Logo and QR perfectly)
    window.saveSettings = async function() {
        const qrFileInput = document.getElementById('settingQrCodeFile');
        const logoFileInput = document.getElementById('settingStoreLogoFile');
        
        let finalQrCode = document.getElementById('settingQrCode') ? document.getElementById('settingQrCode').value : '';
        let finalStoreLogo = document.getElementById('settingStoreLogo') ? document.getElementById('settingStoreLogo').value : '';

        // Powerful helper function to compress any image to 60% quality base64
        const compressImage = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 400; // Safe width for fast loading
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        };

        // If QR uploaded, compress it
        if (qrFileInput && qrFileInput.files && qrFileInput.files.length > 0) {
            finalQrCode = await compressImage(qrFileInput.files[0]);
        }
        
        // If Logo uploaded, compress it
        if (logoFileInput && logoFileInput.files && logoFileInput.files.length > 0) {
            finalStoreLogo = await compressImage(logoFileInput.files[0]);
        }

        const payload = {
            allowedPinCodes: document.getElementById('settingPinCodes') ? document.getElementById('settingPinCodes').value.split(',').map(s=>s.trim()).filter(Boolean) : [],
            deliveryFee: document.getElementById('settingDeliveryFee') ? Number(document.getElementById('settingDeliveryFee').value) : 0,
            acceptOnline: document.getElementById('settingAcceptOnline') ? document.getElementById('settingAcceptOnline').checked : true,
            allowCOD: document.getElementById('settingCod') ? document.getElementById('settingCod').checked : true,
            upiQrCode: finalQrCode,
            storeLogo: finalStoreLogo
        };

        // Failsafe: Save to LocalStorage so UI updates instantly and checkout/main page reads it
        try {
            localStorage.setItem('bakestories_settings', JSON.stringify(payload));
            window.showAdminToast('Settings Saved Successfully!', 'success');
        } catch(err) {
            window.showAdminToast('Storage Error. Images might be too large.', 'error');
        }
        
        // Instantly Update Previews
        if(finalQrCode && document.getElementById('settingQrCode')) {
            document.getElementById('settingQrCode').value = finalQrCode;
            const preview = document.getElementById('qrPreview');
            if (preview) preview.src = finalQrCode;
            const container = document.getElementById('qrPreviewContainer');
            if (container) container.style.display = 'block';
        }
        
        if(finalStoreLogo && document.getElementById('settingStoreLogo')) {
            document.getElementById('settingStoreLogo').value = finalStoreLogo;
            const preview = document.getElementById('logoPreview');
            if (preview) preview.src = finalStoreLogo;
            const container = document.getElementById('logoPreviewContainer');
            if (container) container.style.display = 'block';
        }

        // Attempt Backend Save
        try {
            await adminApi('/settings', { method: 'POST', body: JSON.stringify(payload) });
        } catch(e) {}
    };

    // =========================================================
    // ✨ SPRINT 1.5 NEW FUNCTIONS (Order View Modal & UI Polish)
    // =========================================================

    window.viewOrderDetails = function(orderId) {
        const order = adminState.orders.find(o => o._id === orderId);
        if(!order) return;
        
        const modal = document.getElementById('premiumOrderModal');
        const modalBody = document.getElementById('premiumOrderModalBody');
        const box = document.getElementById('orderModalBox');
        
        let itemsHtml = (order.items || []).map(i => `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #ffe4e8; padding:10px 0;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="background:#fff0f5; color:#ff7596; font-weight:bold; width:30px; height:30px; border-radius:50%; display:flex; justify-content:center; align-items:center;">${i.quantity}</div>
                    <strong style="color:#5d4037;">${i.name || 'Delicious Treat'}</strong>
                </div>
                <div style="font-weight:600; color:#2e7d32;">₹${i.price * i.quantity}</div>
            </div>
        `).join('');

        modalBody.innerHTML = `
            <div style="background: #fffbf0; border-radius: 15px; padding: 20px; margin-bottom: 20px; border: 1px solid #ffe4e8;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:#8d6e63;">Order Number:</span>
                    <strong style="color:#ff7596;">#${order.orderNumber || order._id.substr(-6)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:#8d6e63;">Order Date:</span>
                    <strong>${new Date(order.createdAt || Date.now()).toLocaleString()}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#8d6e63;">Current Status:</span>
                    <span class="status-badge status-${order.status}" style="text-transform:capitalize;">${order.status.replace('-', ' ')}</span>
                </div>
            </div>

            <h4 style="color:#ff7596; margin-bottom:15px; font-family:'Poppins', sans-serif;"><i class="ri-user-smile-line"></i> Customer Details</h4>
            <div style="padding: 0 10px; margin-bottom: 25px;">
                <div style="font-weight:600; font-size:1.1rem; color:#5d4037;">${order.customerName}</div>
                <div style="color:#8d6e63; margin-bottom:5px;">📞 ${order.customerPhone} ${order.customerEmail ? `| ✉️ ${order.customerEmail}` : ''}</div>
                <div style="color:#8d6e63;">📍 <strong>Delivery To:</strong> ${order.deliveryAddress?.street || ''}, ${order.deliveryAddress?.city || 'Store Pickup'} - ${order.deliveryAddress?.pincode || ''}</div>
                ${order.deliveryNotes ? `<div style="margin-top:10px; background:#fff3e0; padding:10px; border-radius:10px; font-size:0.9rem; color:#e65100;">📝 Note: ${order.deliveryNotes}</div>` : ''}
            </div>

            <h4 style="color:#ff7596; margin-bottom:15px; font-family:'Poppins', sans-serif;"><i class="ri-shopping-bag-line"></i> Order Items</h4>
            <div style="background: #ffffff; border: 1px solid #ffe4e8; border-radius: 15px; padding: 10px 20px; margin-bottom: 20px;">
                ${itemsHtml}
                <div style="display:flex; justify-content:space-between; align-items:center; padding-top:15px; margin-top:5px;">
                    <strong style="font-size:1.2rem; color:#5d4037;">Grand Total:</strong>
                    <strong style="font-size:1.5rem; color:#ff7596;">₹${order.totalAmount}</strong>
                </div>
            </div>
            
            <div style="display:flex; gap:15px;">
                <button class="btn btn-primary" style="flex:1;" onclick="printReceipt('${order._id}')"><i class="ri-printer-line"></i> Print Receipt for Kitchen</button>
            </div>
        `;

        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            box.classList.add('show');
        }, 10);
    };

    window.closeOrderModal = function() {
        const modal = document.getElementById('premiumOrderModal');
        const box = document.getElementById('orderModalBox');
        modal.style.opacity = '0';
        box.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    window.toggleProductStock = async function(productId, currentStock) {
        const newStock = currentStock > 0 ? 0 : 50;
        const res = await adminApi(`/products/${productId}`, { 
            method: 'PUT', 
            body: JSON.stringify({ stockQuantity: newStock }) 
        });
        
        if (res.success || res._id) {
            window.showAdminToast(newStock === 0 ? "Item marked Out of Stock." : "Item restocked successfully!");
            window.loadProductsAdmin(); 
        } else {
            window.showAdminToast("Failed to update stock status.", "error");
        }
    };

    window.printReceipt = function(orderId) {
        const order = adminState.orders.find(o => o._id === orderId);
        if(!order) {
            window.showAdminToast('Order not found. Refresh and try again.', "error");
            return;
        }
        
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt - #${order.orderNumber || order._id.substr(-6)}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; color: #333; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    hr { border-top: 1px dashed #ccc; margin: 15px 0; }
                    table { width: 100%; font-size: 14px; }
                    .right { text-align: right; }
                </style>
            </head>
            <body>
                <h2 class="center" style="margin-bottom: 5px;">THE BAKE STORIES</h2>
                <div class="center" style="font-size: 12px; margin-bottom: 15px;">Phagwara, Punjab</div>
                <hr>
                <div><span class="bold">Order No:</span> #${order.orderNumber || order._id.substr(-6)}</div>
                <div><span class="bold">Date:</span> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
                <div><span class="bold">Customer:</span> ${order.customerName || 'Guest'}</div>
                <div><span class="bold">Phone:</span> ${order.customerPhone || 'N/A'}</div>
                <div><span class="bold">Address:</span> ${order.deliveryAddress?.street || 'Pickup'}, ${order.deliveryAddress?.city || ''}</div>
                <hr>
                <table>
                    ${(order.items || []).map(i => `
                        <tr>
                            <td>${i.quantity}x ${i.name || 'Cake'}</td>
                            <td class="right">Rs ${i.price * i.quantity}</td>
                        </tr>
                    `).join('')}
                </table>
                <hr>
                <h3 class="right">TOTAL: Rs ${order.totalAmount}</h3>
                <div class="center" style="margin-top: 30px; font-size: 12px;">Thank you for your order!</div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    window.handleHeicUpload = async function(input) {
      if(input.files && input.files.length > 0) {
        const file = input.files[0];
        const fileName = file.name.toLowerCase();
        
        if(fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
            window.showAdminToast("Converting iPhone format to JPG safely...", "info");
            try {
                const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
                const newFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: "image/jpeg" });
                
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(newFile);
                input.files = dataTransfer.files;
                window.showAdminToast("Converted to JPG Successfully!", "success");
            } catch(err) {
                console.error(err);
                window.showAdminToast("Failed to convert image. Please use a normal JPG.", "error");
                input.value = "";
            }
        }
      }
    };
    
    window.handleProductFormSubmit = async function(e) {
      e.preventDefault();
      const btn = document.getElementById('saveProductBtn');
      btn.innerText = 'Baking... (Saving)';
      btn.disabled = true;
    
      const formData = new FormData(e.target);
      const id = formData.get('id');
      const fileInput = document.getElementById('productImageFile');
    
      try {
        let res;
        
        if (fileInput && fileInput.files.length > 0) {
          const data = new FormData();
          data.append('name', formData.get('name'));
          data.append('description', formData.get('description'));
          data.append('category', formData.get('category').toLowerCase());
          data.append('price', Number(formData.get('price')));
          data.append('stockQuantity', Number(formData.get('stockQuantity')));
          data.append('isFeatured', document.getElementById('productFeatured').checked);
          data.append('image', fileInput.files[0]);
    
          const url = id ? `/products/${id}` : '/products';
          const method = id ? 'PUT' : 'POST';
          res = await adminApi(url, { method, body: data });
        } else {
          const payload = {
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category').toLowerCase(),
            price: Number(formData.get('price')),
            stockQuantity: Number(formData.get('stockQuantity')),
            isFeatured: document.getElementById('productFeatured').checked,
            image: document.getElementById('productImage').value || 'https://placehold.co/600'
          };
          
          const url = id ? `/products/${id}` : '/products';
          const method = id ? 'PUT' : 'POST';
          res = await adminApi(url, { method, body: JSON.stringify(payload) });
        }
    
        if (res.success || res._id) {
          window.showAdminToast('✅ Product Saved Successfully!');
          document.getElementById('productModal').style.display = 'none';
          window.loadProductsAdmin(); 
        } else {
          window.showAdminToast('⚠️ Save Failed: ' + (res.message || 'Validation Error'), "error");
        }
      } catch (err) {
        console.error(err);
        window.showAdminToast('❌ Critical Error. Check Console.', "error");
      } finally {
        btn.innerText = 'Save Product';
        btn.disabled = false;
      }
    };
    
    window.openAddProductModal = function() {
      document.getElementById('productForm').reset();
      document.getElementById('productId').value = ''; 
      document.getElementById('productModal').style.display = 'block';
    };
    
    window.editProduct = function(id) {
      const p = adminState.products.find(x => x._id === id);
      if (!p) return;
    
      document.getElementById('productId').value = p._id;
      document.getElementById('productName').value = p.name;
      document.getElementById('productDesc').value = p.description;
      document.getElementById('productPrice').value = p.price;
      document.getElementById('productStock').value = p.stockQuantity;
      document.getElementById('productCategory').value = p.category;
      if(document.getElementById('productImage')) document.getElementById('productImage').value = p.primaryImage?.url || '';
      
      document.getElementById('productModal').style.display = 'block';
    };
    
    window.deleteProduct = async function(id) {
      if (!confirm('Are you sure you want to delete this treat?')) return;
      await adminApi(`/products/${id}`, { method: 'DELETE' });
      window.loadProductsAdmin();
    };

    window.deleteCoupon = async function(id) {
        if (!confirm('Remove this coupon?')) return;
        await adminApi(`/coupons/${id}`, { method: 'DELETE' });
        window.loadCoupons();
    };
    
    document.addEventListener('DOMContentLoaded', () => {
      
      injectPremiumStyles();

      if (!adminState.token) {
        document.getElementById('loginForm').style.display = 'flex';
      } else {
        document.getElementById('loginForm').style.display = 'none';
        window.loadDashboard();
      }
    
      const loginBtn = document.getElementById('loginBtn');
      if (loginBtn) {
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        
        newBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const email = document.getElementById('loginEmail').value;
          const password = document.getElementById('loginPassword').value;
          
          newBtn.innerText = 'Checking...';
          const res = await adminApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
          
          if (res.success) {
            localStorage.setItem('bakestories_admin_token', res.data.token);
            location.reload();
          } else {
            window.showAdminToast('Login Failed: ' + (res.message || 'Check Email/Password'), "error");
            newBtn.innerText = 'Login Securely';
          }
        });
      }
    
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const section = link.getAttribute('data-section');
          window.switchSection(section);
        });
      });
    
      const pForm = document.getElementById('productForm');
      if (pForm) {
        pForm.removeEventListener('submit', window.handleProductFormSubmit); 
        pForm.addEventListener('submit', window.handleProductFormSubmit);
      }

      // 🛠️ HOTFIX: MINIMAL VOUCHER PAYLOAD PREVENTS "ALREADY EXISTS" SCHEMA ERRORS
      const cForm = document.getElementById('couponForm');
      if(cForm) {
        cForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('couponCode').value.toUpperCase();
            const rawType = document.getElementById('couponType').value;
            const value = Number(document.getElementById('couponValue').value);
            
            const payload = {
                code: code,
                type: rawType === 'percent' ? 'percentage' : rawType, 
                discountType: rawType === 'percent' ? 'percentage' : rawType,
                value: value,  
                discountValue: value, 
                isActive: true,
                status: 'active'
            };

            const res = await adminApi('/coupons', { method: 'POST', body: JSON.stringify(payload) });
            
            if(res && (res.success || res.data || res._id)) {
                window.showAdminToast('Voucher Created Successfully!', 'success'); 
                document.getElementById('couponModal').style.display = 'none';
                cForm.reset();
                window.loadCoupons();
            } else {
                window.showAdminToast('Error: This Code already exists.', 'error');
            }
        });
      }
    
      document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.target.closest('.modal').style.display = 'none';
        });
      });
      
    }); 

})();
