(function () {
  "use strict";

  var UNKNOWN_LABEL = "Volto non identificato";

  /* ---------------------------------------------------------------
     1. Header: cambia stile una volta superato l'hero
     --------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  var hero = document.getElementById("hero");

  function onScroll() {
    if (!header || !hero) return;
    var threshold = hero.offsetHeight * 0.72;
    if (window.scrollY > threshold) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
     2. Costruzione dinamica della galleria a mosaico
     (colonne gestite via JS invece di CSS multi-column: alcuni
     browser mobile, in particolare Safari/WebKit, calcolano male
     le larghezze percentuali dentro un layout column-count e
     fanno sconfinare le immagini fuori dalla colonna)
     --------------------------------------------------------------- */
  var grid = document.getElementById("gallery-grid");
  var data = (typeof GALLERY_DATA !== "undefined" ? GALLERY_DATA : []);
  var figures = [];

  function spanClassFor(index) {
    if (index % 5 === 2) return "gallery__item--tall";
    if (index % 8 === 5) return "gallery__item--short";
    return "";
  }

  function heightUnitFor(index) {
    var cls = spanClassFor(index);
    if (cls === "gallery__item--tall") return 1.5;
    if (cls === "gallery__item--short") return 1.15;
    return 1.333;
  }

  data.forEach(function (item, index) {
    var hasCaption = !!item.caption;
    var caption = hasCaption ? item.caption : UNKNOWN_LABEL;

    var figure = document.createElement("figure");
    figure.className = "gallery__item " + spanClassFor(index);
    figure.setAttribute("tabindex", "0");
    figure.setAttribute("role", "button");
    figure.dataset.index = String(index);
    figure.setAttribute(
      "aria-label",
      "Foto " + item.id + (hasCaption ? ": " + caption : " — " + UNKNOWN_LABEL)
    );

    var frame = document.createElement("div");
    frame.className = "gallery__frame";

    var img = document.createElement("img");
    img.src = "images/gallery/" + item.id + ".webp";
    img.alt = hasCaption ? caption : "Ritratto n. " + item.id + " — " + UNKNOWN_LABEL;
    img.loading = "lazy";
    img.decoding = "async";
    frame.appendChild(img);

    var overlay = document.createElement("div");
    overlay.className = "gallery__overlay";

    var num = document.createElement("span");
    num.className = "gallery__num";
    num.textContent = "N. " + String(item.id).padStart(3, "0");

    var cap = document.createElement("span");
    cap.className = "gallery__cap" + (hasCaption ? "" : " gallery__cap--unknown");
    cap.textContent = caption;

    overlay.appendChild(num);
    overlay.appendChild(cap);
    frame.appendChild(overlay);
    figure.appendChild(frame);

    figure.addEventListener("click", function () {
      openLightbox(index);
    });
    figure.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(index);
      }
    });

    figures.push(figure);
  });

  var currentColumnCount = 0;

  function columnCountForViewport() {
    return window.innerWidth > 1024 ? 3 : 2;
  }

  function layoutGalleryColumns() {
    if (!grid) return;
    var count = columnCountForViewport();
    if (count === currentColumnCount) return;
    currentColumnCount = count;

    grid.innerHTML = "";
    var columns = [];
    for (var c = 0; c < count; c++) {
      var col = document.createElement("div");
      col.className = "gallery__column";
      grid.appendChild(col);
      columns.push({ el: col, height: 0 });
    }

    figures.forEach(function (figure, index) {
      var shortest = columns[0];
      for (var i = 1; i < columns.length; i++) {
        if (columns[i].height < shortest.height) shortest = columns[i];
      }
      shortest.el.appendChild(figure);
      shortest.height += heightUnitFor(index);
    });
  }

  layoutGalleryColumns();

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutGalleryColumns, 150);
  });

  /* ---------------------------------------------------------------
     3. Reveal all'ingresso in viewport
     --------------------------------------------------------------- */
  var items = document.querySelectorAll(".gallery__item");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.05 }
    );
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------------------------------------------------------
     4. Lightbox
     --------------------------------------------------------------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxNumber = document.getElementById("lightbox-number");
  var lightboxText = document.getElementById("lightbox-text");
  var btnClose = document.getElementById("lightbox-close");
  var btnPrev = document.getElementById("lightbox-prev");
  var btnNext = document.getElementById("lightbox-next");

  var currentIndex = 0;

  function renderLightbox(index) {
    var item = data[index];
    if (!item) return;
    var hasCaption = !!item.caption;

    lightboxImg.classList.remove("is-loaded");
    lightboxImg.onload = function () {
      lightboxImg.classList.add("is-loaded");
    };
    lightboxImg.src = "images/gallery/" + item.id + ".webp";
    lightboxImg.alt = hasCaption ? item.caption : "Ritratto n. " + item.id;

    lightboxNumber.textContent = "N. " + String(item.id).padStart(3, "0") + " / " + data.length;
    lightboxText.textContent = hasCaption ? item.caption : UNKNOWN_LABEL;
    lightboxText.classList.toggle("lightbox__text--unknown", !hasCaption);
  }

  function openLightbox(index) {
    currentIndex = index;
    renderLightbox(currentIndex);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + data.length) % data.length;
    renderLightbox(currentIndex);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % data.length;
    renderLightbox(currentIndex);
  }

  btnClose.addEventListener("click", closeLightbox);
  btnPrev.addEventListener("click", showPrev);
  btnNext.addEventListener("click", showNext);

  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();
  });

  /* swipe touch per mobile */
  var touchStartX = null;
  lightbox.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      if (dx > 0) showPrev(); else showNext();
    }
    touchStartX = null;
  }, { passive: true });

})();
