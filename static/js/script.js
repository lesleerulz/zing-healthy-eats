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

    // Similarly for login if exists (hidden in some views)
    if (lottieLogin && lottieLogin.offsetParent !== null) {
      // Basic placeholder 
    }
  }

  // Initialize GSAP Kinetic Typography
  const kineticTexts = document.querySelectorAll('.kinetic-text');
  if (typeof gsap !== 'undefined' && kineticTexts.length > 0) {
    document.addEventListener('mousemove', (e) => {
      const xPos = (e.clientX / window.innerWidth - 0.5) * 20;
      const yPos = (e.clientY / window.innerHeight - 0.5) * 10;

      gsap.to(kineticTexts, {
        duration: 0.5,
        x: xPos,
        y: yPos,
        rotation: xPos * 0.5,
        ease: "power2.out"
      });
    });
  }
});

/********************************
* FORM FEEDBACK *
********************************/
const forms = document.querySelectorAll('form');
forms.forEach(form => {
  form.addEventListener('submit', function (e) {
    // Find submit button
    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      // Add loading class
      btn.classList.add('btn-loading');

      // Optional: If validation fails immediately or checking, remove class?
      // Since this is standard submit, we assume page reload follows.
    }
  });
});

/********************************
* BOOTSTRAP TOAST AUTO-LAUNCHER *
********************************/
const allToasts = [].slice.call(document.querySelectorAll(".toast"))
allToasts.map(function (toasts) {
  const toast = new bootstrap.Toast(toasts)
  toast.show()
})
