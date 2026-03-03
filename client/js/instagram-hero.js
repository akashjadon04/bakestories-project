/**
 * Instagram Hero JavaScript
 * generated: js/instagram-hero.js — Loads hero images from API
 */

// DOM Elements
const heroCarousel = document.getElementById('heroCarousel');
const heroDots = document.getElementById('heroDots');
const logoImg = document.getElementById('logoImg');

// State
let heroState = {
  images: [],
  currentSlide: 0,
  autoPlayInterval: null
};

// ============================================
// LOAD HERO IMAGES
// ============================================

async function loadHeroImages() {
  try {
    const response = await api.get('/instagram/hero-images');
    
    if (response.success && response.data.images.length > 0) {
      heroState.images = response.data.images;
      
      // Update logo if available
      if (response.data.logo && logoImg) {
        logoImg.src = response.data.logo.url;
      }
      
      // Render carousel
      renderCarousel();
      
      // Start autoplay
      startAutoPlay();
    }
  } catch (error) {
    console.error('Error loading hero images:', error);
    // Keep default placeholder
  }
}

// ============================================
// RENDER CAROUSEL
// ============================================

function renderCarousel() {
  if (!heroCarousel || !heroDots) return;
  
  // Only use first 5 images for hero
  const images = heroState.images.slice(0, 5);
  
  // Render slides
  heroCarousel.innerHTML = images.map((img, index) => `
    <div class="hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
      <img src="${img.url}" alt="${img.caption || 'The Bake Stories'}" loading="${index === 0 ? 'eager' : 'lazy'}">
      <div class="hero-overlay">
        <div class="hero-content">
          <h1 class="hero-title">Fresh Baked Happiness</h1>
          <p class="hero-subtitle">${img.caption || 'Handcrafted cakes, cupcakes & pastries made with love'}</p>
          <a href="products.html" class="btn btn-primary btn-lg">Order Now</a>
        </div>
      </div>
    </div>
  `).join('');
  
  // Render dots
  heroDots.innerHTML = images.map((_, index) => `
    <span class="hero-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
  `).join('');
  
  // Add dot click handlers
  heroDots.querySelectorAll('.hero-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.index);
      goToSlide(index);
    });
  });
}

// ============================================
// CAROUSEL NAVIGATION
// ============================================

function goToSlide(index) {
  const slides = heroCarousel.querySelectorAll('.hero-slide');
  const dots = heroDots.querySelectorAll('.hero-dot');
  
  if (slides.length === 0) return;
  
  // Remove active class from current
  slides[heroState.currentSlide].classList.remove('active');
  dots[heroState.currentSlide].classList.remove('active');
  
  // Update current index
  heroState.currentSlide = index;
  if (heroState.currentSlide >= slides.length) {
    heroState.currentSlide = 0;
  }
  
  // Add active class to new
  slides[heroState.currentSlide].classList.add('active');
  dots[heroState.currentSlide].classList.add('active');
}

function nextSlide() {
  goToSlide(heroState.currentSlide + 1);
}

function startAutoPlay() {
  if (heroState.autoPlayInterval) {
    clearInterval(heroState.autoPlayInterval);
  }
  
  heroState.autoPlayInterval = setInterval(nextSlide, 5000);
}

function stopAutoPlay() {
  if (heroState.autoPlayInterval) {
    clearInterval(heroState.autoPlayInterval);
    heroState.autoPlayInterval = null;
  }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  loadHeroImages();
  
  // Pause autoplay on hover
  if (heroCarousel) {
    heroCarousel.addEventListener('mouseenter', stopAutoPlay);
    heroCarousel.addEventListener('mouseleave', startAutoPlay);
  }
});
