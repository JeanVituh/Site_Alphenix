/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              ALPHENIX — Main Script (index.html)            ║
 * ║  Loader · Header · Embers · Filtros · Grid de Produtos     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     DOM REFS
     ══════════════════════════════════════════════════════ */
  var $loader        = document.getElementById('loader');
  var $header        = document.getElementById('header');
  var $hamburger     = document.getElementById('hamburger');
  var $mobileMenu    = document.getElementById('mobileMenu');
  var $filterTabs    = document.getElementById('filterTabs');
  var $productsGrid  = document.getElementById('productsGrid');
  var $productsEmpty = document.getElementById('productsEmpty');
  var $embers        = document.getElementById('embers');

  /* ══════════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════════ */
  var activeCategory = 'all';
  var revealObserver = null;
  var embersInterval = null;

  /* ══════════════════════════════════════════════════════
     UTILITY — XSS-safe escaping
     ══════════════════════════════════════════════════════ */
  function escapeHTML(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ══════════════════════════════════════════════════════
     WHATSAPP HELPERS
     ══════════════════════════════════════════════════════ */
  function getWaURL(msg) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  function getProductWaURL(product) {
    var weight = product.weight ? ' (' + product.weight + ')' : '';
    var price  = 'R$ ' + product.price.toFixed(2).replace('.', ',');
    var msg = [
      'Olá! Tenho interesse no produto:',
      '',
      '*' + product.name + ' — ' + product.brand + weight + '*',
      'Preço: *' + price + '*',
      '',
      'Poderia me passar mais informações? 🙏',
    ].join('\n');
    return getWaURL(msg);
  }

  function getGeneralWaURL() {
    return getWaURL('Olá! Quero saber mais sobre os produtos Alphenix. 🔥');
  }

  function initWhatsAppLinks() {
    var url = getGeneralWaURL();
    ['heroWhatsApp', 'ctaBannerBtn', 'footerWA', 'footerContactWA'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.href = url;
    });
  }

  /* ══════════════════════════════════════════════════════
     LOADER
     ══════════════════════════════════════════════════════ */
  function initLoader() {
    var done = false;
    function hideLoader() {
      if (done) return;
      done = true;
      setTimeout(function () {
        $loader.classList.add('loader--hiding');
        document.body.classList.add('loaded');
        setTimeout(function () { $loader.style.display = 'none'; }, 750);
      }, 1900);
    }
    if (document.readyState === 'complete') { hideLoader(); }
    else { window.addEventListener('load', hideLoader); setTimeout(hideLoader, 4500); }
  }

  /* ══════════════════════════════════════════════════════
     HEADER — scroll behaviour
     ══════════════════════════════════════════════════════ */
  function initHeader() {
    function onScroll() {
      $header.classList.toggle('scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ══════════════════════════════════════════════════════
     MOBILE MENU
     ══════════════════════════════════════════════════════ */
  function initMobileMenu() {
    $hamburger.addEventListener('click', function () {
      var isOpen = $mobileMenu.classList.toggle('active');
      $hamburger.classList.toggle('active', isOpen);
      $hamburger.setAttribute('aria-expanded', String(isOpen));
      $mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      document.body.classList.toggle('menu-open', isOpen);
    });

    $mobileMenu.querySelectorAll('.mobile-menu__link, .mobile-menu__cta').forEach(function (el) {
      el.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', function (e) {
      if ($mobileMenu.classList.contains('active') && !$header.contains(e.target)) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $mobileMenu.classList.contains('active')) closeMobileMenu();
    });
  }

  function closeMobileMenu() {
    $mobileMenu.classList.remove('active');
    $hamburger.classList.remove('active');
    $hamburger.setAttribute('aria-expanded', 'false');
    $mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  }

  /* ══════════════════════════════════════════════════════
     SCROLL REVEAL
     ══════════════════════════════════════════════════════ */
  function initReveal() { observeReveal(); }

  function observeReveal() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ══════════════════════════════════════════════════════
     EMBER PARTICLES
     ══════════════════════════════════════════════════════ */
  function initEmbers() {
    if (!$embers) return;
    function spawnEmber() {
      var e    = document.createElement('div');
      e.className = 'ember';
      var size  = (2 + Math.random() * 4).toFixed(1);
      var drift = ((Math.random() - 0.5) * 120).toFixed(0);
      var dur   = (3.5 + Math.random() * 4).toFixed(1);
      var delay = (Math.random() * 1.5).toFixed(1);
      e.style.cssText = [
        'left:'               + (5 + Math.random() * 90).toFixed(1) + '%',
        'bottom:'             + (Math.random() * 18).toFixed(1) + '%',
        'width:'              + size + 'px',
        'height:'             + size + 'px',
        '--drift:'            + drift + 'px',
        'animation-duration:' + dur + 's',
        'animation-delay:'    + delay + 's',
      ].join(';');
      $embers.appendChild(e);
      setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); },
        (parseFloat(dur) + parseFloat(delay) + 0.5) * 1000);
    }
    embersInterval = setInterval(spawnEmber, 280);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearInterval(embersInterval); }
      else { embersInterval = setInterval(spawnEmber, 280); }
    });
  }

  /* ══════════════════════════════════════════════════════
     FILTER TABS
     ══════════════════════════════════════════════════════ */
  function initFilters() {
    $filterTabs.innerHTML = CATEGORIES.map(function (cat) {
      return [
        '<button class="filter-tab' + (cat.id === 'all' ? ' active' : '') + '"',
        '  data-category="' + cat.id + '"',
        '  role="tab"',
        '  aria-selected="' + (cat.id === 'all') + '">',
        '  <i class="fa-solid ' + cat.icon + '" aria-hidden="true"></i>',
        '  <span>' + escapeHTML(cat.label) + '</span>',
        '</button>',
      ].join('');
    }).join('');

    $filterTabs.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-tab');
      if (!btn || btn.dataset.category === activeCategory) return;
      activeCategory = btn.dataset.category;
      $filterTabs.querySelectorAll('.filter-tab').forEach(function (b) {
        var isThis = b.dataset.category === activeCategory;
        b.classList.toggle('active', isThis);
        b.setAttribute('aria-selected', String(isThis));
      });
      /* Animate grid transition */
      $productsGrid.style.cssText = 'opacity:0;transform:translateY(10px);transition:opacity 160ms,transform 160ms';
      setTimeout(function () {
        renderProducts(getFilteredProducts());
        $productsGrid.style.cssText = 'opacity:1;transform:translateY(0);transition:opacity 220ms,transform 220ms';
      }, 160);
    });
  }

  /* ── URL param ?categoria=X auto-activates filter ── */
  function checkCategoriaParam() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('categoria');
    if (!cat) return;
    var btn = $filterTabs.querySelector('[data-category="' + cat + '"]');
    if (btn) {
      setTimeout(function () { btn.click(); }, 200);
    }
  }

  /* ══════════════════════════════════════════════════════
     PRODUCTS — render
     ══════════════════════════════════════════════════════ */
  function getFilteredProducts() {
    if (activeCategory === 'all') return PRODUCTS;
    return PRODUCTS.filter(function (p) { return p.category === activeCategory; });
  }

  function renderProducts(products) {
    if (!products || products.length === 0) {
      $productsGrid.innerHTML = '';
      $productsEmpty.style.display = 'flex';
      return;
    }
    $productsEmpty.style.display = 'none';

    $productsGrid.innerHTML = products.map(function (product, i) {
      var delay = 'reveal-delay-' + ((i % 4) + 1);

      var badgeHTML = product.badge
        ? '<span class="product-card__badge">' + escapeHTML(product.badge) + '</span>'
        : '';

      var weightHTML = product.weight
        ? '<span class="product-card__weight">' + escapeHTML(product.weight) + '</span>'
        : '';

      var placeholderHTML = [
        '<div class="product-card__placeholder" style="display:none">',
        '  <div class="product-card__placeholder-inner"',
        '       style="background:' + product.brandColor + '18;border:2px solid ' + product.brandColor + '40">',
        '    <span style="color:' + product.brandColor + '">' + escapeHTML(product.brandInitials) + '</span>',
        '  </div>',
        '</div>',
      ].join('');

      return [
        '<article class="product-card reveal ' + delay + '"',
        '         data-id="' + product.id + '"',
        '         data-category="' + escapeHTML(product.category) + '">',

        '  <div class="product-card__image-wrap">',
        '    <a href="produto.html?id=' + product.id + '"',
        '       class="product-card__image-link"',
        '       aria-label="Ver detalhes: ' + escapeHTML(product.name) + '"',
        '       tabindex="-1">',
        '    </a>',
        '    ' + badgeHTML,
        '    <img src="' + escapeHTML(product.image) + '"',
        '         alt="' + escapeHTML(product.name) + '"',
        '         class="product-card__img"',
        '         loading="lazy"',
        '         onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">',
        '    ' + placeholderHTML,
        '  </div>',

        '  <div class="product-card__body">',
        '    <div class="product-card__meta">',
        '      <span class="product-card__brand">' + escapeHTML(product.brand) + '</span>',
        '      ' + weightHTML,
        '    </div>',
        '    <h3 class="product-card__name">' + escapeHTML(product.name) + '</h3>',
        '    <p class="product-card__description">' + escapeHTML(product.description) + '</p>',
        '  </div>',

        '  <div class="product-card__footer">',
        '    <p class="product-card__price">',
        '      <span class="product-card__price-currency">R$</span>',
        '      <span class="product-card__price-value">',
        '        ' + product.price.toFixed(2).replace('.', ','),
        '      </span>',
        '    </p>',
        '    <div class="product-card__actions">',
        '      <a href="produto.html?id=' + product.id + '"',
        '         class="btn btn--details"',
        '         aria-label="Ver detalhes: ' + escapeHTML(product.name) + '">',
        '        <i class="fa-solid fa-eye" aria-hidden="true"></i>',
        '        Mais Detalhes',
        '      </a>',
        '      <a href="' + getProductWaURL(product) + '"',
        '         target="_blank" rel="noopener noreferrer"',
        '         class="btn btn--whatsapp"',
        '         aria-label="Comprar ' + escapeHTML(product.name) + ' pelo WhatsApp">',
        '        <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>',
        '        Comprar pelo WhatsApp',
        '      </a>',
        '    </div>',
        '  </div>',

        '</article>',
      ].join('');
    }).join('');

    observeReveal();
  }

  /* ══════════════════════════════════════════════════════
     FOOTER CATEGORIES
     ══════════════════════════════════════════════════════ */
  function initFooterCategories() {
    var el = document.getElementById('footerCategories');
    if (!el) return;
    el.innerHTML = CATEGORIES
      .filter(function (c) { return c.id !== 'all'; })
      .map(function (cat) {
        return '<li><a href="#produtos" data-filter="' + cat.id + '">' + escapeHTML(cat.label) + '</a></li>';
      }).join('');

    el.querySelectorAll('a[data-filter]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var filterCat = e.currentTarget.dataset.filter;
        setTimeout(function () {
          var btn = $filterTabs.querySelector('[data-category="' + filterCat + '"]');
          if (btn) btn.click();
        }, 380);
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     ACTIVE NAV HIGHLIGHT
     ══════════════════════════════════════════════════════ */
  function initActiveNav() {
    var sections = document.querySelectorAll('section[id], footer[id]');
    var navLinks = document.querySelectorAll('.nav__link');
    if (!sections.length || !navLinks.length) return;

    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.25 });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ══════════════════════════════════════════════════════
     SMOOTH SCROLL
     ══════════════════════════════════════════════════════ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        var hh = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10
        ) || 76;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - hh, behavior: 'smooth' });
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════════ */
  function init() {
    initLoader();
    initHeader();
    initMobileMenu();
    initEmbers();
    initFilters();
    renderProducts(PRODUCTS);
    initWhatsAppLinks();
    initFooterCategories();
    initReveal();
    initActiveNav();
    initSmoothScroll();
    checkCategoriaParam();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
