(function(){
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  function setHeaderOnScroll(){
    const header = document.querySelector(".site-header");
    if(!header) return;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    header.classList.toggle("scrolled", y > 8);
  }

  function getHeaderOffset(){
    const header = document.querySelector(".site-header");
    if(!header) return 0;
    return header.getBoundingClientRect().height + 14;
  }

  function smoothScrollToEl(el){
    if(!el) return;
    const offset = getHeaderOffset();
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.pageYOffset - offset;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  }

  function handleAnchorClicks(){
    document.addEventListener("click", (e)=>{
      const a = e.target?.closest?.("a[href^='#']");
      if(!a) return;
      const href = a.getAttribute("href");
      if(!href || href === "#") return;
      
      const hash = href.slice(1);
      const target = document.getElementById(hash);
      if(!target) return;
      e.preventDefault();
      window.history.pushState({}, "", href);
      smoothScrollToEl(target);
    });
  }

  function handleInitialHashScroll(){
    if(!window.location.hash) return;
    const hash = window.location.hash.slice(1);
    if(!hash) return;
    const target = document.getElementById(hash);
    if(target){
      window.setTimeout(()=> smoothScrollToEl(target), 60);
    }
  }

  function initReveal(){
    const nodes = Array.from(document.querySelectorAll(".reveal"));
    if(!nodes.length) return;
    if(prefersReducedMotion){
      nodes.forEach(n=>n.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver((entries)=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -14% 0px", threshold: 0.01 });

    nodes.forEach(n=>io.observe(n));
  }

  function initHorizontalScroller(){
    const row = document.querySelector(".projects-row");
    if(!row) return;

    const prev = document.querySelector("[data-scroller='prev']");
    const next = document.querySelector("[data-scroller='next']");
    let autoPlayTimer = null;

    function scrollByAmount(amount){
      row.scrollBy({ left: amount, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }

    prev?.addEventListener("click", ()=>{
      scrollByAmount(-row.clientWidth * 0.9);
      resetAutoPlay();
    });
    
    next?.addEventListener("click", ()=>{
      scrollByAmount(row.clientWidth * 0.9);
      resetAutoPlay();
    });

    // --- Drag-to-scroll logic ---
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let dragMoved = false;

    row.addEventListener("pointerdown", (e)=>{
      if(e.pointerType === "mouse" && e.button !== 0) return;
      isDown = true;
      dragMoved = false;
      row.classList.add("dragging");
      startX = e.clientX;
      startScrollLeft = row.scrollLeft;
      stopAutoPlay();
      try{ row.setPointerCapture(e.pointerId); }catch(_){}
    });

    row.addEventListener("pointermove", (e)=>{
      if(!isDown) return;
      const dx = e.clientX - startX;
      if(Math.abs(dx) > 6) dragMoved = true;
      row.scrollLeft = startScrollLeft - dx;
    });

    function endDrag(e){
      if(!isDown) return;
      isDown = false;
      row.classList.remove("dragging");
      try{ row.releasePointerCapture(e.pointerId); }catch(_){}
      startAutoPlay();
    }
    
    row.addEventListener("pointerup", endDrag);
    row.addEventListener("pointercancel", endDrag);
    
    row.addEventListener("click", (e)=>{
      if(dragMoved) e.preventDefault();
    }, true);

    // --- Safe Auto-Play Feature ---
    function startAutoPlay() {
      if (prefersReducedMotion || autoPlayTimer) return;
      autoPlayTimer = setInterval(() => {
        // If reached near the end of scrolling, wrap back smoothly to start
        const maxScroll = row.scrollWidth - row.clientWidth;
        if (row.scrollLeft >= maxScroll - 10) {
          row.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Scroll forward by one card width roughly
          scrollByAmount(320); 
        }
      }, 4000); // Transitions every 4 seconds
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    // Pause autoplay on mouse hover to let users read details peacefully
    row.addEventListener("mouseenter", stopAutoPlay);
    row.addEventListener("mouseleave", startAutoPlay);

    // Start auto-scrolling on load
    startAutoPlay();
  }

  // Boot
  setHeaderOnScroll();
  window.addEventListener("scroll", setHeaderOnScroll, { passive: true });
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      handleAnchorClicks();
      handleInitialHashScroll();
      initReveal();
      initHorizontalScroller();
    });
  } else {
    handleAnchorClicks();
    handleInitialHashScroll();
    initReveal();
    initHorizontalScroller();
  }
})();