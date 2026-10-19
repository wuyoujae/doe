"""JavaScript for the pptx2html slide viewer.

Provides slide navigation (prev/next/keyboard/click), viewport
scaling so each slide fills the available width, and page‑info
updates.
"""

VIEWER_JS = r"""
(function() {
  'use strict';

  var viewer = document.querySelector('.pptx-viewer');
  if (!viewer) return;

  var slides = viewer.querySelectorAll('.pptx-slide');
  var prevBtn = viewer.querySelector('.pptx-prev');
  var nextBtn = viewer.querySelector('.pptx-next');
  var pageInfo = viewer.querySelector('.pptx-page-info');
  var stage = viewer.querySelector('.pptx-stage');

  var current = 0;

  /* ---- scale slide to fit viewport -------------------------------- */
  function scaleSlide() {
    var active = slides[current];
    if (!active) return;

    var slideW = parseFloat(active.getAttribute('data-width')) || 960;
    var slideH = parseFloat(active.getAttribute('data-height')) || 540;

    /* available width = stage width minus padding */
    var availW = stage.clientWidth - 32;  /* 16pt padding on each side */
    var scale = availW / slideW;

    /* if height would overflow viewport, constrain by height */
    var maxH = window.innerHeight * 0.85;
    if ((slideH * scale) > maxH) {
      scale = maxH / slideH;
    }

    active.style.transform = 'scale(' + scale + ')';
    active.style.transformOrigin = 'top left';
    active.style.marginBottom = ((slideH * scale) - slideH) + 'px';
  }

  /* ---- navigate --------------------------------------------------- */
  function goTo(index) {
    if (index < 0 || index >= slides.length) return;
    slides[current].classList.remove('active');
    slides[index].classList.add('active');
    current = index;
    updateUI();
    scaleSlide();
  }

  function goPrev() { goTo(current - 1); }
  function goNext() { goTo(current + 1); }

  /* ---- update UI -------------------------------------------------- */
  function updateUI() {
    if (prevBtn) prevBtn.disabled = (current === 0);
    if (nextBtn) nextBtn.disabled = (current === slides.length - 1);
    if (pageInfo) pageInfo.textContent = (current + 1) + ' / ' + slides.length;
  }

  /* ---- bind events ------------------------------------------------ */
  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { goPrev(); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { goNext(); e.preventDefault(); }
  });

  /* click on slide to advance (optional) */
  // stage.addEventListener('click', function(e) {
  //   if (e.target === stage || e.target.classList.contains('pptx-slide')) goNext();
  // });

  /* rescale on resize */
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scaleSlide, 100);
  });

  /* ---- init ------------------------------------------------------- */
  updateUI();
  scaleSlide();
})();
"""
