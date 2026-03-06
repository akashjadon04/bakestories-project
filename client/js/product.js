/**
 * ============================================================================
 * THE BAKE STORIES — PREMIUM PRODUCT ENGINE
 * Version: 2.3 (Pink Theme + 4 New Features + Fixes)
 * ============================================================================
 * Features Preserved:
 * - 🤖 AI Description & Nutrition Generation
 * - 🔍 Image Zoom & Lightbox Gallery
 * - 🛒 "Fly-to-Cart" Physics Animation
 * - 💬 Dynamic Review System
 * - ⏳ Deal Countdown Timer
 * - 📱 Native Social Sharing
 * * NEW FEATURES:
 * 1. ⚠️ Low Stock Scarcity Logic
 * 2. 🚚 Estimated Delivery Calculator
 * 3. 📲 WhatsApp Quick Share
 * 4. 🔙 Sticky "Back to Menu" Navigation
 */

'use strict';

// ==========================================
// 1. GLOBAL CONFIG & STATE
// ==========================================
const AppConfig = {
    apiBase: "https://bakestories-project.onrender.com/api"
    currencySym: '₹',
    animationSpeed: 300,
    colors: {
        primary: '#FFB7C5', // Baby Pink
        textDark: '#5d4037'
    },
    placeholders: {
        image: 'https://placehold.co/600x600/FFB7C5/ffffff?text=Fresh+Bake',
        user: 'https://placehold.co/100x100/e0e0e0/ffffff?text=User'
    }
};

const State = {
    product: null,
    currentImageIndex: 0,
    qty: 1,
    isZooming: false,
    wishlisted: false,
    relatedProducts: []
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Utils (Safe Fallback)
    if (typeof initUtils === 'function') {
        initUtils();
    } else {
        window.utils = window.utils || {};
        window.utils.getUrlParam = (name) => new URLSearchParams(window.location.search).get(name);
        window.utils.formatCurrency = (amount) => `${AppConfig.currencySym}${Number(amount).toFixed(2)}`;
    }
    
    // 2. GET PRODUCT ID
    const urlParams = new URLSearchParams(window.location.search);
    const productId = 
        urlParams.get('id') ||                        
        window.location.hash.substring(1) ||          
        window.localStorage.getItem('bake_current_id'); 

    if (!productId) {
        console.error("ID Detection Failed. URL:", window.location.href);
        renderErrorState("We couldn't find the Product ID.");
        return;
    }

    try {
        toggleLoader(true);
        await fetchProductData(productId);
        
        // NEW FEATURE 4: Floating Back Button
        initStickyNav();
        
    } catch (error) {
        console.error("Critical Init Error:", error);
        renderErrorState("The oven seems to be broken. (Server Connection Failed)");
    }
});

// ==========================================
// 3. API LAYER
// ==========================================
async function fetchProductData(id) {
    try {
        const response = await fetch(`${AppConfig.apiBase}/products/${id}`);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data = await response.json();

        if (data.success && data.data.product) {
            State.product = data.data.product;
            
            initPageRender();
            
            fetchRelatedProducts(State.product.category, State.product._id);
            addToRecentlyViewed(State.product);

        } else {
            throw new Error(data.message || "Product not found");
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        renderErrorState(err.message || "Failed to load product details.");
    } finally {
        toggleLoader(false);
    }
}

async function fetchRelatedProducts(category, currentId) {
    try {
        const response = await fetch(`${AppConfig.apiBase}/products?category=${category}&limit=5`);
        const data = await response.json();
        
        if (data.success) {
            State.relatedProducts = data.data.products.filter(p => p._id !== currentId);
            renderRelatedSection();
        }
    } catch (e) {
        console.warn("Related fetch failed silently:", e);
    }
}

// ==========================================
// 4. RENDER LOGIC (THE VISUALS)
// ==========================================

function initPageRender() {
    const p = State.product;
    if (!p) return;

    // A. Meta Data
    document.title = `${p.name} | The Bake Stories`;
    safeSetText('bc-current', p.name);
    safeSetText('p-category', p.category || 'Specialty');
    safeSetText('p-name', p.name);
    
    // B. Render Components
    renderPriceLogic(p);
    renderDescription(p);
    renderGallery(p);
    renderNutrition(p);
    renderReviews(p);
    
    // NEW FEATURE 2: Render Delivery Estimate
    renderDeliveryEstimate();
    
    // NEW FEATURE 3: Render Social Share
    renderSocialShare(p);

    // C. FIX: Manual Reveal
    const contentArea = document.getElementById('productContentArea');
    if(contentArea) {
        contentArea.style.opacity = '0';
        contentArea.style.display = 'grid'; 
        setTimeout(() => {
            contentArea.style.transition = 'opacity 0.8s ease';
            contentArea.style.opacity = '1';
        }, 100);
    }
    
    const tabs = document.getElementById('tabsSection');
    if(tabs) {
        tabs.style.opacity = '0';
        tabs.style.display = 'block';
        setTimeout(() => {
            tabs.style.transition = 'opacity 0.8s ease';
            tabs.style.opacity = '1';
        }, 300);
    }
}

function renderPriceLogic(p) {
    const priceEl = document.getElementById('p-price');
    if (priceEl) priceEl.innerText = formatMoney(p.price);

    const comparePrice = p.comparePrice || Math.round(p.price * 1.2);
    const container = document.querySelector('.price-box');
    if (!container) return;
    
    let compareEl = container.querySelector('.compare-price');
    if (!compareEl) {
        compareEl = document.createElement('span');
        compareEl.className = 'compare-price';
        container.appendChild(compareEl);
    }
    compareEl.innerText = formatMoney(comparePrice);

    const discount = Math.round(((comparePrice - p.price) / comparePrice) * 100);
    let badge = container.querySelector('.discount-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'discount-badge';
        container.appendChild(badge);
    }
    badge.innerText = `SAVE ${discount}%`;

    if (discount > 15) startDealTimer();
    
    const stock = p.stockQuantity || Math.floor(Math.random() * 20); 
    if (stock > 0 && stock < 10) {
        let stockBadge = document.getElementById('low-stock-badge');
        if (!stockBadge) {
            stockBadge = document.createElement('div');
            stockBadge.id = 'low-stock-badge';
            stockBadge.style.cssText = `
                margin-top: 10px; color: #d32f2f; background: #ffebee; 
                padding: 5px 12px; border-radius: 20px; display: inline-flex; 
                align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600;
                animation: pulse 2s infinite;
            `;
            stockBadge.innerHTML = `<i class="ri-fire-line"></i> Only ${stock} left! Selling fast.`;
            container.parentElement.insertBefore(stockBadge, container.nextSibling);
        }
    }
}

function renderDeliveryEstimate() {
    const container = document.querySelector('.product-meta-row');
    if (!container) return;
    
    const date = new Date();
    date.setDate(date.getDate() + 2); 
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    const dateString = date.toLocaleDateString('en-US', options);
    
    const deliveryEl = document.createElement('div');
    deliveryEl.style.cssText = "margin-top: 15px; color: #555; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;";
    deliveryEl.innerHTML = `<i class="ri-truck-line" style="color: ${AppConfig.colors.primary}; font-size: 1.2rem;"></i> Order now to receive by <strong>${dateString}</strong>`;
    
    container.after(deliveryEl);
}

function renderSocialShare(p) {
    const actionsRow = document.querySelector('.actions-row');
    if (!actionsRow) return;
    
    const shareBtn = document.createElement('button');
    shareBtn.className = 'wishlist-btn-lg'; 
    shareBtn.style.marginLeft = '10px';
    shareBtn.style.color = '#25D366'; 
    shareBtn.style.borderColor = '#25D366';
    shareBtn.innerHTML = '<i class="ri-whatsapp-line"></i>';
    shareBtn.title = "Share on WhatsApp";
    
    shareBtn.onclick = () => {
        const text = `Check out this amazing ${p.name} at The Bake Stories! ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };
    
    actionsRow.appendChild(shareBtn);
}

function initStickyNav() {
    const backBtn = document.createElement('a');
    backBtn.href = "products.html";
    backBtn.innerHTML = '<i class="ri-arrow-left-line"></i> Menu';
    backBtn.style.cssText = `
        position: fixed; bottom: 30px; left: 30px; 
        background: white; padding: 10px 20px; border-radius: 30px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1); text-decoration: none;
        color: ${AppConfig.colors.textDark}; font-weight: 600; z-index: 999;
        display: flex; align-items: center; gap: 8px; transform: translateY(100px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(backBtn);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backBtn.style.transform = 'translateY(0)';
        } else {
            backBtn.style.transform = 'translateY(100px)';
        }
    });
}

function renderDescription(p) {
    const descEl = document.getElementById('p-description');
    const fullDescEl = document.getElementById('full-description-content');
    let shortDesc = p.description;
    let fullDesc = p.description;

    if (!shortDesc || shortDesc.length < 30) {
        const aiData = generateAiContent(p.name, p.category, p.price);
        shortDesc = aiData.short;
        fullDesc = aiData.long;
    }

    if (descEl) descEl.innerHTML = `<p>${shortDesc}</p>`;
    if (fullDescEl) fullDescEl.innerHTML = fullDesc;
}

function generateAiContent(name, category, price) {
    const adjectives = ['Velvety', 'Decadent', 'Artisan', 'Hand-crafted', 'Heavenly', 'Gourmet', 'Signature'];
    const textures = ['melt-in-your-mouth', 'perfectly crumbly', 'rich and moist', 'delightfully fluffy'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const tex = textures[Math.floor(Math.random() * textures.length)];
    
    return {
        short: `Experience the magic of our ${adj} ${name}. ${category === 'cakes' ? 'Baked to perfection' : 'Crafted with passion'}, offering a ${tex} texture.`,
        long: `
            <p class="lead"><strong>The ${name} isn't just a dessert; it's an experience.</strong></p>
            <p>Our master bakers begin each morning by selecting the finest, locally sourced ingredients. For this specific ${category}, we blend premium flour with farm-fresh dairy to create a base that is both ${tex} and robust in flavor.</p>
            <ul style="margin-top:20px; color:#666;">
                <li>✅ 100% Eggless Options Available</li>
                <li>✅ Baked Fresh on Order</li>
                <li>✅ Premium Packaging Included</li>
            </ul>
        `
    };
}

function renderNutrition(p) {
    const baseCal = p.category === 'cakes' ? 350 : p.category === 'cookies' ? 180 : 250;
    const variance = Math.floor(Math.random() * 50);
    const calories = baseCal + variance;
    
    const tab = document.querySelector('#tab-ingredients .tab-pane');
    if (tab) {
        const nutritionHTML = `
            <div style="margin-top: 2rem; border-top: 1px dashed #ddd; padding-top: 1rem;">
                <h4 style="margin-bottom:10px;">Approximate Nutrition (Per Serving)</h4>
                <div style="display:flex; gap:20px; text-align:center;">
                    <div style="background:#FFF0F5; padding:10px; border-radius:10px; flex:1;">
                        <div style="font-weight:700; color:#5d4037;">${calories}</div>
                        <div style="font-size:0.8rem; color:#888;">Calories</div>
                    </div>
                    <div style="background:#FFF0F5; padding:10px; border-radius:10px; flex:1;">
                        <div style="font-weight:700; color:#5d4037;">${Math.floor(calories/20)}g</div>
                        <div style="font-size:0.8rem; color:#888;">Fat</div>
                    </div>
                    <div style="background:#FFF0F5; padding:10px; border-radius:10px; flex:1;">
                        <div style="font-weight:700; color:#5d4037;">${Math.floor(calories/10)}g</div>
                        <div style="font-size:0.8rem; color:#888;">Carbs</div>
                    </div>
                </div>
                <p style="font-size:0.7rem; color:#999; margin-top:5px;">*Values are approximate estimates.</p>
            </div>
        `;
        tab.innerHTML += nutritionHTML;
    }
}

function renderGallery(p) {
    const mainImg = document.getElementById('mainImage');
    const thumbContainer = document.getElementById('thumbnailContainer');
    let primaryUrl = p.primaryImage?.url || (p.images && p.images[0] ? p.images[0].url : null) || AppConfig.placeholders.image;
    let allImages = p.images && p.images.length > 0 ? p.images : [{ url: primaryUrl }];

    if (mainImg) {
        mainImg.src = primaryUrl;
        setupZoom(mainImg);
        mainImg.onclick = () => openLightbox(mainImg.src);
    }

    if (thumbContainer) {
        if (allImages.length > 1) {
            thumbContainer.innerHTML = allImages.map((img, idx) => `
                <div class="thumb ${idx === 0 ? 'active' : ''}" onclick="switchMainImage(this, '${img.url}')">
                    <img src="${img.url}" alt="View ${idx + 1}">
                </div>
            `).join('');
            thumbContainer.style.display = 'flex';
        } else {
            thumbContainer.style.display = 'none';
        }
    }
}

function setupZoom(imgElement) {
    const container = imgElement.parentElement;
    if (!container) return;
    container.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = container.getBoundingClientRect();
        const x = (e.clientX - left) / width * 100;
        const y = (e.clientY - top) / height * 100;
        imgElement.style.transformOrigin = `${x}% ${y}%`;
        imgElement.style.transform = 'scale(1.5)';
    });
    container.addEventListener('mouseleave', () => {
        imgElement.style.transform = 'scale(1)';
        setTimeout(() => { imgElement.style.transformOrigin = 'center center'; }, 300);
    });
}

function switchMainImage(thumb, url) {
    const mainImg = document.getElementById('mainImage');
    if (!mainImg) return;
    mainImg.style.opacity = '0.5';
    setTimeout(() => {
        mainImg.src = url;
        mainImg.style.opacity = '1';
    }, 200);
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}

function openLightbox(src) {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; justify-content: center; align-items: center; cursor: zoom-out; animation: fadeIn 0.3s;`;
    modal.innerHTML = `<img src="${src}" style="max-width:90%; max-height:90%; border-radius:10px; box-shadow: 0 0 50px rgba(0,0,0,0.5);">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

// ==========================================
// 6. ACTIONS (THE UNIVERSAL STORAGE OVERRIDE)
// ==========================================
const addToCartBtn = document.getElementById('addToCartBtn');
const qtyInput = document.getElementById('qtyInput');

window.updateQty = (change) => {
    let newVal = State.qty + change;
    if (newVal < 1) newVal = 1;
    if (newVal > 20) {
        if(typeof showToast === 'function') showToast("Maximum 20 items per order.", "warning");
        newVal = 20;
    }
    State.qty = newVal;
    if (qtyInput) qtyInput.value = State.qty;
};

if (addToCartBtn) {
    // 1. Destroy duplicate ghost listeners to prevent double-toast bugs
    const cleanBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(cleanBtn, addToCartBtn);
    
    cleanBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        const product = State.product;
        if (!product) return;
        
        const qty = parseInt(State.qty) || 1;
        const pId = String(product._id || product.id || Date.now());
        
        // Setup secure Image URL
        const imageStr = (product.primaryImage && product.primaryImage.url) 
            ? product.primaryImage.url 
            : ((product.images && product.images.length > 0) ? product.images[0].url : AppConfig.placeholders.image);

        // 2. Build bulletproof cart item that won't crash Cart.js
        const cartItem = {
            productId: pId,
            name: String(product.name),
            price: Number(product.price) || 0,
            image: imageStr,
            quantity: qty,
            variant: null,
            addedAt: new Date().toISOString()
        };
        
        // 3. BLAST ITEM INTO ALL POSSIBLE TEMPLATE KEYS
        // This guarantees the cart page finds it regardless of version!
        const targetKeys = ['bakestories_cart', 'cart', 'bake_cart', 'cartItems'];
        let updatedCount = 0;

        targetKeys.forEach(key => {
            try {
                let tempCart = [];
                const rawData = localStorage.getItem(key);
                if (rawData) {
                    try { tempCart = JSON.parse(rawData); } catch(err) {}
                }
                if (!Array.isArray(tempCart)) tempCart = [];
                
                const existing = tempCart.find(i => String(i.productId) === pId);
                if (existing) {
                    existing.quantity += qty;
                } else {
                    tempCart.push(cartItem);
                }
                
                localStorage.setItem(key, JSON.stringify(tempCart));
                updatedCount = tempCart.reduce((sum, item) => sum + item.quantity, 0);
            } catch (error) { console.error("Storage write error on key:", key); }
        });

        // 4. Force Update Visual Badges on Product Page
        const badges = document.querySelectorAll('#cart-badge, #cartBadge, .ri-shopping-bag-line + span');
        badges.forEach(b => {
            b.innerText = updatedCount;
            b.style.display = 'flex';
        });

        // 5. Trigger Physics Animation
        animateFlyToCart(e.clientX, e.clientY);

        // 6. Update Button UI
        const originalText = cleanBtn.innerHTML;
        cleanBtn.innerHTML = `<i class="ri-check-line"></i> Added!`;
        cleanBtn.style.background = '#98FB98'; 
        
        if(typeof showToast === 'function') {
            showToast(`Added ${qty} ${product.name} to your box! 🎁`, "success");
        } else {
            alert(`${qty} ${product.name} added to cart!`);
        }
        
        setTimeout(() => {
            cleanBtn.innerHTML = originalText;
            cleanBtn.style.background = '';
        }, 2000);
    });
}

function animateFlyToCart(startX, startY) {
    const cartIcon = document.querySelector('.ri-shopping-bag-line');
    if (!cartIcon) return;
    
    const cartRect = cartIcon.getBoundingClientRect();
    const endX = cartRect.left + 10;
    const endY = cartRect.top + 10;
    
    const ball = document.createElement('div');
    ball.style.cssText = `position: fixed; top: ${startY}px; left: ${startX}px; width: 25px; height: 25px; background: ${AppConfig.colors.primary}; border-radius: 50%; z-index: 9999; pointer-events: none; box-shadow: 0 5px 15px rgba(255,183,197,0.5);`;
    document.body.appendChild(ball);
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            ball.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            ball.style.top = `${endY}px`;
            ball.style.left = `${endX}px`;
            ball.style.transform = 'scale(0.2)';
            ball.style.opacity = '0.5';
        });
    });
    
    setTimeout(() => { ball.remove(); }, 800);
}

// 7. REVIEW SYSTEM
function renderReviews(p) {
    const tab = document.querySelector('#tab-reviews .tab-pane');
    if (!tab) return;
    let reviewsHtml = '';
    
    if (p.reviews && p.reviews.length > 0) {
        reviewsHtml = p.reviews.map(r => createReviewCard(r.name, r.rating, r.comment, r.date)).join('');
    } else {
        const mockReviews = [
            { name: "Aditi S.", rating: 5, text: "Absolutely delicious! Melting pink perfection." },
            { name: "Rahul M.", rating: 4, text: "Great taste, delivered fresh." },
            { name: "Priya K.", rating: 5, text: "Best bakery in town! Love the theme." }
        ];
        reviewsHtml = `<p style="color:#888; margin-bottom:1rem; font-style:italic;">Recent customer feedback:</p>` + 
                      mockReviews.map(r => createReviewCard(r.name, r.rating, r.text, "2 days ago")).join('');
    }

    tab.innerHTML = `
        <div class="reviews-container" style="display:grid; gap:1.5rem;">${reviewsHtml}</div>
        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #FFB7C5;">
            <h4>Write a Review</h4>
            <textarea placeholder="How was it?" style="width:100%; padding:10px; border:2px solid #FFB7C5; border-radius:10px; margin:10px 0; outline:none;"></textarea>
            <button class="add-to-cart-btn" style="width:auto; padding:0.5rem 2rem; font-size:1rem; background: ${AppConfig.colors.primary}; color:white;" onclick="showToast('Login required to review', 'error')">Submit Review</button>
        </div>
    `;
}

function createReviewCard(name, rating, text, date) {
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    return `
        <div class="review-card" style="background:#FFF0F5; padding:15px; border-radius:15px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <strong>${name}</strong>
                <span style="color:#FFB7C5; letter-spacing:2px;">${stars}</span>
            </div>
            <p style="color:#555; font-size:0.95rem;">"${text}"</p>
        </div>
    `;
}

// 8. UTILITIES & HELPERS
function initUtils() {
    window.utils = window.utils || {};
    window.utils.getUrlParam = (name) => new URLSearchParams(window.location.search).get(name);
    window.utils.formatCurrency = (amount) => `${AppConfig.currencySym}${Number(amount).toFixed(2)}`;
}

function formatMoney(amount) {
    return window.utils.formatCurrency ? window.utils.formatCurrency(amount) : `${AppConfig.currencySym}${Number(amount).toFixed(2)}`;
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function toggleLoader(show) {
    const loader = document.getElementById('page-loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function renderErrorState(msg) {
    toggleLoader(false);
    const errEl = document.getElementById('error-state');
    if (errEl) {
        errEl.style.display = 'block';
        const msgEl = errEl.querySelector('p');
        if (msgEl) msgEl.innerText = msg;
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    const color = type === 'success' ? '#98FB98' : '#FFB7B2';
    toast.style.cssText = `background: white; color: #333; padding: 12px 24px; margin-top: 10px; border-radius: 50px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border-left: 5px solid ${color}; display: flex; align-items: center; gap: 10px; animation: slideInRight 0.3s ease; opacity: 0; transform: translateX(50px); font-family: 'Poppins', sans-serif; font-size: 0.9rem;`;
    
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    const icon = type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill';
    toast.innerHTML = `<i class="${icon}" style="color:${color}; font-size:1.2rem;"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 99999;';
    document.body.appendChild(div);
    return div;
}

function startDealTimer() {
    const box = document.querySelector('.price-box');
    if (!box || document.getElementById('deal-timer')) return;
    const timer = document.createElement('div');
    timer.id = 'deal-timer';
    timer.style.cssText = 'color: #d32f2f; font-size: 0.8rem; font-weight: 600; margin-left: 10px; display: flex; align-items: center; gap: 5px;';
    timer.innerHTML = `<i class="ri-time-line"></i> Offer ends in <span id="time-val">04:59:59</span>`;
    box.appendChild(timer);
    let duration = 5 * 60 * 60;
    setInterval(() => {
        duration--;
        const h = Math.floor(duration / 3600);
        const m = Math.floor((duration % 3600) / 60);
        const s = duration % 60;
        const timeVal = document.getElementById('time-val');
        if(timeVal) timeVal.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
}

function addToRecentlyViewed(p) {
    try {
        let history = JSON.parse(localStorage.getItem('bake_history') || '[]');
        history = history.filter(item => item._id !== p._id);
        history.unshift({ _id: p._id, name: p.name, image: p.primaryImage?.url, price: p.price });
        if(history.length > 5) history.pop();
        localStorage.setItem('bake_history', JSON.stringify(history));
    } catch(e) {}
}

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    const headers = document.querySelectorAll('.tab-link');
    headers.forEach(h => { if(h.innerText.toLowerCase().includes(tabName)) h.classList.add('active'); });
    
    document.querySelectorAll('.tab-content').forEach(c => {
        c.style.opacity = '0';
        c.style.display = 'none';
        c.classList.remove('reveal'); 
    });
    
    const target = document.getElementById(`tab-${tabName}`);
    if(target) {
        target.style.display = 'block';
        setTimeout(() => {
            target.style.transition = 'opacity 0.4s ease';
            target.style.opacity = '1';
        }, 50);
    }
};

window.switchMainImage = switchMainImage;

function renderRelatedSection() {
    const relatedGrid = document.getElementById('relatedGrid');
    const relatedSection = document.getElementById('relatedSection');
    if(!relatedGrid || !relatedSection) return;
    
    if(State.relatedProducts.length > 0) {
        relatedSection.style.display = 'block';
        relatedGrid.innerHTML = State.relatedProducts.map(p => {
             const imgUrl = p.primaryImage?.url || AppConfig.placeholders.image;
             const clickAction = `onclick="window.localStorage.setItem('bake_current_id', '${p._id}'); window.location.href='product.html?id=${p._id}'; return false;"`;
             
             return `
              <a href="product.html?id=${p._id}" ${clickAction} class="mini-card">
                <img src="${imgUrl}" alt="${p.name}">
                <h4>${p.name}</h4>
                <div class="price">${formatMoney(p.price)}</div>
              </a>
            `;
        }).join('');
    } else {
        relatedSection.style.display = 'none';
    }
}
