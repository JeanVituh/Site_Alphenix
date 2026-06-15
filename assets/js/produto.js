/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              ALPHENIX — produto.js                          ║
 * ║  Script da página de detalhes do produto (produto.html)    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Lê o parâmetro ?id=N da URL, localiza o produto em PRODUCTS
 * e monta toda a página dinamicamente.
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     FIND PRODUCT FROM URL
     ══════════════════════════════════════════════════════ */
  var params    = new URLSearchParams(window.location.search);
  var productId = parseInt(params.get('id'), 10);
  var product   = null;

  if (!isNaN(productId)) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === productId) { product = PRODUCTS[i]; break; }
    }
  }

  /* ══════════════════════════════════════════════════════
     GALLERY STATE
     ══════════════════════════════════════════════════════ */
  var galleryImages  = [];
  var currentImgIdx  = 0;
  var touchStartX    = 0;

  /* ══════════════════════════════════════════════════════
     UTILITY
     ══════════════════════════════════════════════════════ */
  function escapeHTML(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function $(id) { return document.getElementById(id); }

  /* ══════════════════════════════════════════════════════
     WHATSAPP HELPERS
     ══════════════════════════════════════════════════════ */
  function getWaURL(msg) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  function getProductWaURL(p) {
    var weight = p.weight ? ' (' + p.weight + ')' : '';
    var price  = 'R$ ' + p.price.toFixed(2).replace('.', ',');
    return getWaURL([
      'Olá! Tenho interesse no produto:',
      '',
      '*' + p.name + ' — ' + p.brand + weight + '*',
      'Preço: *' + price + '*',
      '',
      'Poderia me passar mais informações? 🙏',
    ].join('\n'));
  }

  function getGeneralWaURL() {
    return getWaURL('Olá! Quero saber mais sobre os produtos Alphenix. 🔥');
  }

  /* ══════════════════════════════════════════════════════
     LOADER
     ══════════════════════════════════════════════════════ */
  function initLoader() {
    var done = false;
    function hide() {
      if (done) return;
      done = true;
      setTimeout(function () {
        var l = $('loader');
        if (!l) return;
        l.classList.add('loader--hiding');
        document.body.classList.add('loaded');
        setTimeout(function () { l.style.display = 'none'; }, 750);
      }, 1900);
    }
    if (document.readyState === 'complete') { hide(); }
    else { window.addEventListener('load', hide); setTimeout(hide, 4500); }
  }

  /* ══════════════════════════════════════════════════════
     HEADER — scroll behaviour
     ══════════════════════════════════════════════════════ */
  function initHeader() {
    var hdr = $('header');
    if (!hdr) return;
    function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 60); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ══════════════════════════════════════════════════════
     MOBILE MENU
     ══════════════════════════════════════════════════════ */
  function initMobileMenu() {
    var burger = $('hamburger');
    var menu   = $('mobileMenu');
    var hdr    = document.getElementById('header');
    if (!burger || !menu) return;

    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('active');
      burger.classList.toggle('active', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('menu-open', open);
    });

    menu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta').forEach(function (el) {
      el.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (e) {
      if (menu.classList.contains('active') && !hdr.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('active')) closeMenu();
    });

    function closeMenu() {
      menu.classList.remove('active');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
    }
  }

  /* ══════════════════════════════════════════════════════
     SCROLL REVEAL
     ══════════════════════════════════════════════════════ */
  function observeReveal() {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) { obs.observe(el); });
  }

  /* ══════════════════════════════════════════════════════
     WHATSAPP LINKS
     ══════════════════════════════════════════════════════ */
  function initWhatsAppLinks() {
    var url = getGeneralWaURL();
    ['ctaBannerBtn', 'footerWA', 'footerContactWA'].forEach(function (id) {
      var el = $(id);
      if (el) el.href = url;
    });
  }

  /* ══════════════════════════════════════════════════════
     FOOTER CATEGORIES
     ══════════════════════════════════════════════════════ */
  function initFooterCategories() {
    var el = $('footerCategories');
    if (!el) return;
    el.innerHTML = CATEGORIES
      .filter(function (c) { return c.id !== 'all'; })
      .map(function (cat) {
        return '<li><a href="index.html?categoria=' + cat.id + '#produtos">' +
               escapeHTML(cat.label) + '</a></li>';
      }).join('');
  }

  /* ══════════════════════════════════════════════════════
     PAGE META
     ══════════════════════════════════════════════════════ */
  function updateMeta() {
    document.title = product.name + ' — ' + product.brand + ' | Alphenix';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', product.description);
  }

  /* ══════════════════════════════════════════════════════
     GALLERY
     ══════════════════════════════════════════════════════ */
  function initGallery() {
    galleryImages = (product.images && product.images.length > 0)
      ? product.images
      : (product.image ? [product.image] : []);

    if (!galleryImages.length) {
      showGalleryPlaceholder();
      return;
    }

    setMainImage(0);
    buildThumbs();
    updateArrows();
  }

  function setMainImage(idx) {
    currentImgIdx = idx;
    var mainImg  = $('pdpMainImg');
    var placeholder = $('pdpPlaceholder');
    if (!mainImg) return;

    mainImg.style.opacity = '0';
    mainImg.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    mainImg.onload = function () {
      mainImg.style.opacity = '1';
    };
    mainImg.onerror = function () {
      mainImg.style.display = 'none';
      showGalleryPlaceholder();
    };
    mainImg.src = galleryImages[idx];
    mainImg.alt = product.name;

    /* Update active thumb */
    var thumbs = document.querySelectorAll('.pdp-thumb');
    thumbs.forEach(function (t, i) {
      t.classList.toggle('active', i === idx);
      t.setAttribute('aria-current', i === idx ? 'true' : 'false');
    });

    updateArrows();
  }

  function showGalleryPlaceholder() {
    var mainImg     = $('pdpMainImg');
    var placeholder = $('pdpPlaceholder');
    var placeholderText = $('pdpPlaceholderText');
    if (mainImg) mainImg.style.display = 'none';
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.style.background = product.brandColor + '18';
    }
    if (placeholderText) {
      placeholderText.textContent = product.brandInitials;
      placeholderText.style.color = product.brandColor;
    }
  }

  function buildThumbs() {
    var container = $('pdpThumbs');
    if (!container || galleryImages.length <= 1) {
      if (container) container.style.display = 'none';
      return;
    }
    container.innerHTML = galleryImages.map(function (src, i) {
      return [
        '<button class="pdp-thumb' + (i === 0 ? ' active' : '') + '"',
        '  role="listitem"',
        '  aria-label="Ver imagem ' + (i + 1) + '"',
        '  aria-current="' + (i === 0) + '"',
        '  data-idx="' + i + '">',
        '  <img src="' + escapeHTML(src) + '" alt="' + escapeHTML(product.name) + ' — imagem ' + (i + 1) + '" loading="lazy">',
        '</button>',
      ].join('');
    }).join('');

    container.querySelectorAll('.pdp-thumb').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMainImage(parseInt(btn.dataset.idx, 10));
      });
    });
  }

  function updateArrows() {
    var prev = $('galleryPrev');
    var next = $('galleryNext');
    var multi = galleryImages.length > 1;
    if (!prev || !next) return;
    if (!multi) {
      prev.classList.add('pdp-arrow--hidden');
      next.classList.add('pdp-arrow--hidden');
      return;
    }
    prev.classList.toggle('pdp-arrow--hidden', currentImgIdx === 0);
    next.classList.toggle('pdp-arrow--hidden', currentImgIdx === galleryImages.length - 1);
  }

  function initGalleryNav() {
    var prev  = $('galleryPrev');
    var next  = $('galleryNext');
    var stage = $('pdpStage');

    if (prev) prev.addEventListener('click', function () {
      if (currentImgIdx > 0) setMainImage(currentImgIdx - 1);
    });
    if (next) next.addEventListener('click', function () {
      if (currentImgIdx < galleryImages.length - 1) setMainImage(currentImgIdx + 1);
    });

    /* Keyboard navigation */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft'  && currentImgIdx > 0)                           setMainImage(currentImgIdx - 1);
      if (e.key === 'ArrowRight' && currentImgIdx < galleryImages.length - 1)    setMainImage(currentImgIdx + 1);
    });

    /* Touch swipe */
    if (stage) {
      stage.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          if (diff > 0 && currentImgIdx < galleryImages.length - 1) setMainImage(currentImgIdx + 1);
          if (diff < 0 && currentImgIdx > 0)                        setMainImage(currentImgIdx - 1);
        }
      }, { passive: true });
    }
  }

  /* ══════════════════════════════════════════════════════
     PRODUCT INFO
     ══════════════════════════════════════════════════════ */
  function renderInfo() {
    /* Breadcrumb */
    var catInfo = null;
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === product.category) { catInfo = CATEGORIES[i]; break; }
    }
    if (catInfo) {
      $('breadcrumbCategory').innerHTML =
        '<a href="index.html?categoria=' + catInfo.id + '#produtos">' + escapeHTML(catInfo.label) + '</a>';
    }
    $('breadcrumbName').textContent = product.name;

    /* Brand + weight */
    $('pdpBrand').textContent = product.brand;
    if (product.weight) {
      var weightEl = $('pdpWeight');
      weightEl.textContent = product.weight;
      weightEl.style.display = 'inline-flex';
    }

    /* Badge */
    if (product.badge) {
      var badgeEl = $('pdpBadge');
      badgeEl.textContent = product.badge;
      badgeEl.style.display = 'inline-flex';
    }

    /* Name */
    $('pdpName').textContent = product.name;

    /* Category tag */
    if (catInfo) {
      $('pdpCategoryTag').textContent = catInfo.label;
    }

    /* Price */
    $('pdpPrice').textContent = product.price.toFixed(2).replace('.', ',');

    /* Description */
    $('pdpDescription').textContent = product.description;

    /* WhatsApp CTA */
    var waBtn = $('pdpWA');
    if (waBtn) waBtn.href = getProductWaURL(product);
  }

  /* ══════════════════════════════════════════════════════
     BENEFITS
     ══════════════════════════════════════════════════════ */
  function renderBenefits() {
    var el = $('pdpBenefits');
    if (!el || !product.benefits || !product.benefits.length) return;
    el.innerHTML = product.benefits.map(function (b) {
      return [
        '<li class="pdp-benefit-item">',
        '  <span class="pdp-benefit-item__icon" aria-hidden="true">',
        '    <i class="fa-solid fa-check"></i>',
        '  </span>',
        '  <span>' + escapeHTML(b) + '</span>',
        '</li>',
      ].join('');
    }).join('');
  }

  /* ══════════════════════════════════════════════════════
     INGREDIENTS
     ══════════════════════════════════════════════════════ */
  function renderIngredients() {
    var el = $('pdpIngredients');
    if (!el) return;
    var text = (product.ingredients) ? product.ingredients : 'Informações de ingredientes não disponíveis.';
    el.innerHTML = '<p>' + escapeHTML(text) + '</p>';
  }

  /* ══════════════════════════════════════════════════════
     HOW TO USE
     ══════════════════════════════════════════════════════ */
  function renderHowToUse() {
    var el = $('pdpHowToUse');
    if (!el || !product.howToUse || !product.howToUse.length) return;
    el.innerHTML = product.howToUse.map(function (step, i) {
      return [
        '<li class="pdp-step">',
        '  <div class="pdp-step__num" aria-hidden="true">' + (i + 1) + '</div>',
        '  <p class="pdp-step__text">' + escapeHTML(step) + '</p>',
        '</li>',
      ].join('');
    }).join('');
  }

  /* ══════════════════════════════════════════════════════
     NUTRITION TABLE
     ══════════════════════════════════════════════════════ */

  /* Maps product.nutrition field keys → display labels */
  var NUTRITION_LABELS = {
    calorias:     'Calorias',
    proteinas:    'Proteínas',
    carboidratos: 'Carboidratos Totais',
    gorduras:     'Gorduras Totais',
    sodio:        'Sódio',
    creatina:     'Creatina Monohidratada',
    cafeina:      'Cafeína Anidra',
    betaAlanina:  'Beta-Alanina',
    citrulina:    'Citrulina Malato',
  };

  /* Preferred display order */
  var NUTRITION_ORDER = [
    'calorias', 'proteinas', 'carboidratos', 'gorduras',
    'sodio', 'creatina', 'cafeina', 'betaAlanina', 'citrulina',
  ];

  function renderNutrition() {
    var section = $('nutricao');
    var navLink = $('navNutrition');

    if (!product.nutrition) {
      if (section) section.style.display = 'none';
      if (navLink) navLink.style.display = 'none';
      return;
    }

    if (section) section.style.display = '';
    var n = product.nutrition;

    /* Build table rows in defined order */
    var rows = NUTRITION_ORDER.filter(function (key) {
      return key !== 'porcao' && n[key] !== undefined && n[key] !== null;
    }).map(function (key) {
      var isCalories = key === 'calorias';
      return [
        '<tr class="' + (isCalories ? 'nt-row--calories' : '') + '">',
        '  <td>' + escapeHTML(NUTRITION_LABELS[key] || key) + '</td>',
        '  <td>' + escapeHTML(n[key]) + '</td>',
        '</tr>',
      ].join('');
    }).join('');

    var html = [
      '<div class="nutrition-card">',

      '  <div class="nutrition-card__header">',
      '    <p class="nutrition-card__title">INFORMAÇÃO NUTRICIONAL</p>',
      '    <p class="nutrition-card__serving">Porção: ' + escapeHTML(n.porcao || '—') + '</p>',
      '  </div>',

      '  <table class="nutrition-table" aria-label="Tabela nutricional">',
      '    <thead>',
      '      <tr><th colspan="2">Quantidade por porção</th></tr>',
      '    </thead>',
      '    <tbody>',
      rows,
      '    </tbody>',
      '  </table>',

      '  <p class="nutrition-card__disclaimer">',
      '    * Valores diários de referência com base em uma dieta de 2.000 kcal.',
      '    Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.',
      '  </p>',

      '</div>',
    ].join('');

    var container = $('pdpNutrition');
    if (container) container.innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════
     RELATED PRODUCTS
     ══════════════════════════════════════════════════════ */
  function buildCardHTML(p) {
    var badgeHTML = p.badge
      ? '<span class="product-card__badge">' + escapeHTML(p.badge) + '</span>' : '';
    var weightHTML = p.weight
      ? '<span class="product-card__weight">' + escapeHTML(p.weight) + '</span>' : '';
    var placeholderHTML = [
      '<div class="product-card__placeholder" style="display:none">',
      '  <div class="product-card__placeholder-inner"',
      '       style="background:' + p.brandColor + '18;border:2px solid ' + p.brandColor + '40">',
      '    <span style="color:' + p.brandColor + '">' + escapeHTML(p.brandInitials) + '</span>',
      '  </div>',
      '</div>',
    ].join('');

    return [
      '<article class="product-card reveal" data-id="' + p.id + '">',
      '  <div class="product-card__image-wrap">',
      '    ' + badgeHTML,
      '    <img src="' + escapeHTML(p.image) + '" alt="' + escapeHTML(p.name) + '"',
      '         class="product-card__img" loading="lazy"',
      '         onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">',
      '    ' + placeholderHTML,
      '  </div>',
      '  <div class="product-card__body">',
      '    <div class="product-card__meta">',
      '      <span class="product-card__brand">' + escapeHTML(p.brand) + '</span>',
      '      ' + weightHTML,
      '    </div>',
      '    <h3 class="product-card__name">' + escapeHTML(p.name) + '</h3>',
      '    <p class="product-card__description">' + escapeHTML(p.description) + '</p>',
      '  </div>',
      '  <div class="product-card__footer">',
      '    <p class="product-card__price">',
      '      <span class="product-card__price-currency">R$</span>',
      '      <span class="product-card__price-value">' + p.price.toFixed(2).replace('.', ',') + '</span>',
      '    </p>',
      '    <div class="product-card__actions">',
      '      <a href="produto.html?id=' + p.id + '" class="btn btn--details">',
      '        <i class="fa-solid fa-eye" aria-hidden="true"></i>',
      '        Mais Detalhes',
      '      </a>',
      '      <a href="' + getProductWaURL(p) + '" target="_blank" rel="noopener noreferrer"',
      '         class="btn btn--whatsapp">',
      '        <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>',
      '        Comprar pelo WhatsApp',
      '      </a>',
      '    </div>',
      '  </div>',
      '</article>',
    ].join('');
  }

  function renderRelated() {
    var section = $('pdpRelated');
    var grid    = $('pdpRelatedGrid');
    if (!section || !grid) return;

    var related = PRODUCTS.filter(function (p) {
      return p.category === product.category && p.id !== product.id;
    }).slice(0, 4);

    if (!related.length) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';
    grid.innerHTML = related.map(buildCardHTML).join('');
    observeReveal();
  }

  /* ══════════════════════════════════════════════════════
     STICKY DETAIL NAV — highlight active section
     ══════════════════════════════════════════════════════ */
  function initDetailsNav() {
    var navLinks = document.querySelectorAll('.pdp-details-nav__link');
    var sections = ['beneficios', 'ingredientes', 'modo-de-uso', 'nutricao']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (!navLinks.length || !sections.length) return;

    /* Smooth scroll on click with sticky nav offset */
    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href[0] !== '#') return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        var headerH  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 76;
        var detailNav = document.querySelector('.pdp-details-nav');
        var navH     = detailNav ? detailNav.offsetHeight : 0;
        var top      = target.getBoundingClientRect().top + window.pageYOffset - headerH - navH - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });

    /* Highlight active link on scroll */
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('active'); });
          var link = document.querySelector('.pdp-details-nav__link[href="#' + entry.target.id + '"]');
          if (link) link.classList.add('active');
        }
      });
    }, {
      rootMargin: '-' + ((parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 76) + 56) + 'px 0px -60% 0px',
    });

    sections.forEach(function (s) { obs.observe(s); });
    if (navLinks[0]) navLinks[0].classList.add('active');
  }

  /* ══════════════════════════════════════════════════════
     SHARE BUTTON
     ══════════════════════════════════════════════════════ */
  function initShareBtn() {
    var btn = $('pdpShareBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var data = {
        title: product.name + ' — ' + product.brand + ' | Alphenix',
        text:  product.description,
        url:   window.location.href,
      };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else {
        navigator.clipboard.writeText(window.location.href).then(function () {
          var span = btn.querySelector('span');
          var prev = span ? span.textContent : '';
          if (span) span.textContent = 'Link copiado!';
          btn.style.color = 'var(--clr-orange)';
          setTimeout(function () {
            if (span) span.textContent = prev;
            btn.style.color = '';
          }, 2200);
        }).catch(function () {});
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     SHOW/HIDE CONTENT BLOCKS
     ══════════════════════════════════════════════════════ */
  function showContent() {
    var el = $('pdpContent');
    if (el) el.style.display = '';
  }

  function showError() {
    var el = $('pdpNotFound');
    if (el) el.style.display = '';
  }

  /* ══════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════ */
  function init() {
    initLoader();
    initHeader();
    initMobileMenu();
    initWhatsAppLinks();
    initFooterCategories();

    if (!product) {
      showError();
      return;
    }

    /* Render all product data */
    updateMeta();
    showContent();
    renderInfo();
    initGallery();
    initGalleryNav();
    renderBenefits();
    renderIngredients();
    renderHowToUse();
    renderNutrition();
    renderRelated();

    /* UI interactions */
    initDetailsNav();
    initShareBtn();
    observeReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
