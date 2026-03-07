/*****************************
* SCRIPT LOADED SUCCESSFULLY *
*****************************/
console.log("Flask Shop Template script loaded.");

/*********************
* REMOVE RIGHT CLICK *
**********************/
document.addEventListener("contextmenu", function (event) {
  event.preventDefault();
});

/********************************
* INITIALIZATIONS *
********************************/
document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS (Scroll Reveals)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 50
    });
  }

  // Initialize Lottie Animations
  const lottieHome = document.getElementById('lottie-home');
  const lottieLogin = document.getElementById('lottie-login');
  const lottieCutscene = document.getElementById('lottie-cutscene');

  if (typeof lottie !== 'undefined') {
    if (lottieHome) {
      const homeAnim = lottie.loadAnimation({
        container: lottieHome,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: 'https://lottie.host/4b568600-0870-4357-8898-d560bb8752d5/C9l5Zl3rZ5.json' // Placeholder Home Icon
      });
      const homeLink = document.getElementById('nav-home-link');
      if (homeLink) {
        homeLink.addEventListener('mouseenter', () => homeAnim.goToAndPlay(0));
      }
    }

    if (lottieCutscene) {
      const cutsceneAnim = lottie.loadAnimation({
        container: lottieCutscene,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://lottie.host/0a99738b-82c5-4d30-8068-15082404e578/u30R9Y4P3E.json' // Example Halloween animation
      });
    }

    const lottieLoginLarge = document.getElementById('lottie-login-large');
    if (lottieLoginLarge) {
      lottie.loadAnimation({
        container: lottieLoginLarge,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://lottie.host/0a99738b-82c5-4d30-8068-15082404e578/u30R9Y4P3E.json'
      });
    }

    // Similarly for login if exists (hidden in some views)
    if (lottieLogin && lottieLogin.offsetParent !== null) {
      // Basic placeholder 
    }
  }

  /********************************
  * BOOTSTRAP TOAST AUTO-LAUNCHER *
  ********************************/
  const allToasts = [].slice.call(document.querySelectorAll(".toast"))
  allToasts.map(function (toasts) {
    const toast = new bootstrap.Toast(toasts)
    toast.show()
  })
});

/********************************
* GSAP SEESAW ANIMATIONS        *
* window.load ensures GSAP CDN  *
* script is fully ready         *
********************************/
window.addEventListener("load", function () {
  if (typeof gsap === 'undefined') return;

  // Rocks left→right 3 times then snaps back to normal
  function playSeesaw(el) {
    const tl = gsap.timeline();
    const angle = 4;    // degrees of tilt — visible seesaw without overlapping neighbours
    const speed = 0.2;  // seconds per half-swing

    tl.set(el, { rotation: 0 })
      // Swing 1
      .to(el, { duration: speed, rotation: -angle, ease: "power1.inOut" })
      .to(el, { duration: speed * 2, rotation: angle, ease: "power1.inOut" })
      // Swing 2
      .to(el, { duration: speed * 2, rotation: -angle, ease: "power1.inOut" })
      .to(el, { duration: speed * 2, rotation: angle, ease: "power1.inOut" })
      // Swing 3
      .to(el, { duration: speed * 2, rotation: -angle, ease: "power1.inOut" })
      // Settle
      .to(el, { duration: speed * 2, rotation: 0, ease: "elastic.out(1, 0.4)" });
  }

  // Hero title — plays on page load
  const heroTitle = document.querySelector('.display-5.kinetic-text');
  if (heroTitle) playSeesaw(heroTitle);

  // Top Products title — plays when scrolled into view
  const topProductsTitle = document.getElementById('top-products-title');
  if (topProductsTitle) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playSeesaw(topProductsTitle);
          observer.unobserve(topProductsTitle); // Only once
        }
      });
    }, { threshold: 0.4 });
    observer.observe(topProductsTitle);
  }
});

/********************************
* FORM FEEDBACK                 *
********************************/
const forms = document.querySelectorAll('form');
forms.forEach(form => {
  form.addEventListener('submit', function () {
    const btn = form.querySelector('[type="submit"]');
    if (btn) btn.classList.add('btn-loading');
  });
});
