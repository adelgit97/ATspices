/* Shared header and footer components */
class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="site-header">
        <div class="header-inner header-shell">
          <a class="brand" href="#shopView" aria-label="A.T. Spices">
            <img src="assets/ATlogo-round-ar-630.png" alt="" width="70" height="70">
            <span class="brand-copy">
              <strong>A.T. Spices</strong>
              <small data-i18n="brandLine">نكهة تستحق المشاركة</small>
            </span>
          </a>

          <div class="header-actions">
            <button class="icon-button contact-button" id="contactOpen" type="button" aria-controls="contactDrawer" data-i18n-aria-label="contact" aria-label="تواصل معنا">
              <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>
              <span class="header-action-label" data-i18n="contact">تواصل معنا</span>
            </button>
            <button class="icon-button share-button" id="shareToggle" type="button" data-i18n-aria-label="share" aria-label="شارك">
              <i class="bi bi-share" aria-hidden="true"></i>
              <span class="header-action-label" data-i18n="share">شارك</span>
            </button>
            <button class="icon-button language-button" id="langToggle" type="button" data-i18n-aria-label="changeLanguage" aria-label="تغيير اللغة">
              <i class="bi bi-translate" aria-hidden="true"></i>
              <span id="langLabel">English</span>
            </button>
            <button class="icon-button cart-button" id="cartOpen" type="button" aria-controls="cartDrawer">
              <i class="bi bi-bag" aria-hidden="true"></i>
              <span class="header-action-label" data-i18n="cart">السلة</span>
              <span class="cart-count" id="cartCount" aria-label="0 items">0</span>
            </button>
          </div>
        </div>
      </header>
    `;

    this.querySelector("#shareToggle").addEventListener("click", () => this.sharePage());
  }

  async sharePage() {
    const isArabic = document.documentElement.lang === "ar";
    const shareData = {
      title: "A.T. Spices | بهارات، مكسرات، عسل والعناية والجمال",
      text: isArabic
        ? "اكتشف منتجات A.T. Spices واطلب من بيتك بسهولة."
        : "Discover A.T. Spices products and place your order from home.",
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error.name !== "AbortError") this.copyShareUrl(isArabic);
      }
      return;
    }
    this.copyShareUrl(isArabic);
  }

  async copyShareUrl(isArabic) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      window.alert(isArabic ? "تم نسخ الرابط" : "Link copied");
    } catch {
      window.prompt(isArabic ? "انسخ الرابط:" : "Copy this link:", window.location.href);
    }
  }
}

customElements.define("site-header", SiteHeader);

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="shared-footer">
        <div class="shared-footer-inner footer-shell">
          <div class="footer-identity">
            <a class="shared-footer-brand" href="#shopView" aria-label="A.T. Spices">
              <img src="assets/ATlogo-round-ar-630.png" alt="" width="52" height="52" loading="lazy">
              <span>
                <strong>A.T. Spices</strong>
                <small data-i18n="footerLine">بهارات، مكسرات، عسل، بخور وعناية شخصية</small>
              </span>
            </a>
          
          </div>
          <nav class="footer-contact-icons" data-i18n-aria-label="contactLinks" aria-label="روابط التواصل">
            <a href="https://maps.app.goo.gl/BiupkAsG192nppYC6" target="_blank" rel="noopener noreferrer" data-i18n-aria-label="location" aria-label="موقع المتجر">
              <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>
            </a>
            <a id="footerWhatsappLink" target="_blank" rel="noopener noreferrer" data-i18n-aria-label="whatsapp" aria-label="واتساب 01036578338">
              <i class="bi bi-whatsapp" aria-hidden="true"></i>
            </a>
            <a href="https://www.instagram.com/a.tspicess" target="_blank" rel="noopener noreferrer" data-i18n-aria-label="instagram" aria-label="إنستجرام">
              <i class="bi bi-instagram" aria-hidden="true"></i>
            </a>
            <a href="https://www.facebook.com/people/AT-Spices/61587448102563/" target="_blank" rel="noopener noreferrer" data-i18n-aria-label="facebook" aria-label="فيسبوك">
              <i class="bi bi-facebook" aria-hidden="true"></i>
            </a>
            <a id="footerEmailLink" data-i18n-aria-label="email" aria-label="at.spicesstore@gmail.com">
              <i class="bi bi-envelope-fill" aria-hidden="true"></i>
            </a>
          </nav>
        </div>
      </footer>
    `;
  }
}

customElements.define("site-footer", SiteFooter);

/* SPA routing, translations, catalog, cart, and caching */
const PHONE = "201036578338";
const EMAIL = "at.spicesstore@gmail.com";
const LANGUAGE_KEY = "lang";
const CART_KEY = "at-spices-cart";
const DEFAULT_PRODUCT_IMAGE = "assets/ATlogo-round-ar-630.png";

const PRODUCTS_URL = "data/products.csv";
const PRODUCTS_CACHE_KEY = "at-spices-products-v3";
const PRODUCTS_CACHE_VERSION = 3;

let products = [];
let categoryDefinitions = [];
let catalogReady = false;
let catalogStatus = "loading";
let catalogStarted = false;

const translations = {
  ar: {
    skipToProducts: "تخطَّ إلى المنتجات",
    brandLine: "نكهة تستحق المشاركة",
    shop: "المتجر",
    contact: "تواصل معنا",
    closeContact: "إغلاق معلومات التواصل",
    contactLinks: "روابط التواصل",
    share: "شارك",
    changeLanguage: "تغيير اللغة",
    cart: "السلة",
    contactEyebrow: "نحن قريبون منك",
    contactTitle: "A.T. Spices",
    contactDescription: "بهارات، أعشاب، والمزيد.<br>١٠ ب شارع مهدي عرفه، مشروع ١٤ عمارة الحي العاشر - مدينة نصر",
    location: "موقع المتجر",
    whatsapp: "واتساب 01036578338",
    instagram: "إنستجرام",
    facebook: "فيسبوك",
    email: "at.spicesstore@gmail.com",
    whatsappText: "مرحباً، أود الاستفسار عن المنتجات",
    emailSubject: "استفسار عن المنتجات",
    emailBody: "مرحباً، أود الاستفسار عن المنتجات.",
    heroEyebrow: "اختيارات طبيعية بعناية",
    heroTitle: "نكهات أصيلة،<br><em>من رفّنا إلى بيتك.</em>",
    heroText: "اكتشف بهارات عطرية، مكسرات طازجة، عسل طبيعي، بخور ومنتجات عناية مختارة.",
    browseProducts: "تصفح المنتجات",
    fresh: "طازج",
    selected: "مختار بعناية",
    quality: "جودة تثق بها",
    packaging: "تعبئة بعناية",
    easyOrder: "اطلب من بيتك بسهولة",
    ourCollection: "تشكيلتنا",
    findFavorite: "اختر ما تحب",
    collectionText: "منتجات مختارة للاستخدام اليومي واللحظات المميزة.",
    searchPlaceholder: "ابحث عن منتج",
    scrollFilters: "عرض المزيد من التصنيفات",
    sortBy: "ترتيب حسب",
    sortFeatured: "المميزة",
    sortName: "الاسم: أ–ي",
    sortPriceAsc: "السعر: الأقل أولاً",
    sortPriceDesc: "السعر: الأعلى أولاً",
    clearFilters: "مسح التصفية",
    productsPerPage: "منتج في الصفحة",
    paginationLabel: "صفحات المنتجات",
    previousPage: "الصفحة السابقة",
    nextPage: "الصفحة التالية",
    goToPage: "الانتقال إلى الصفحة {page}",
    pageOf: "صفحة {current} من {total}",
    showingProducts: "عرض {start}–{end} من {count} منتج",
    loadingProducts: "جارٍ تحميل المنتجات...",
    catalogLoadError: "تعذر تحميل المنتجات. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
    noResultsTitle: "لم نجد منتجات مطابقة",
    noResultsText: "جرّب كلمة أخرى أو اعرض كل المنتجات.",
    showAll: "عرض كل المنتجات",
    footerLine: "بهارات، مكسرات، عسل، بخور وعناية شخصية",
    yourOrder: "طلبك",
    shoppingCart: "سلة المشتريات",
    closeCart: "إغلاق السلة",
    emptyCartTitle: "سلتك بانتظار اختياراتك",
    emptyCartText: "أضف منتجاتك المفضلة وستظهر هنا.",
    continueShopping: "متابعة التسوق",
    subtotal: "الإجمالي",
    checkoutNote: "أرسل طلبك وسنتواصل معك لتأكيد التفاصيل والتوصيل.",
    placeOrder: "إتمام الطلب",
    all: "الكل",
    offers: "العروض",
    from: "يبدأ من",
    add: "أضف",
    viewDetails: "التفاصيل",
    hideDetails: "إخفاء التفاصيل",
    remove: "حذف",
    decrease: "تقليل الكمية",
    increase: "زيادة الكمية",
    productCountOne: "منتج واحد",
    productCount: "{count} منتجات",
    addedToCart: "تمت إضافة {name} إلى السلة",
    itemsLabel: "{count} منتجات في السلة",
    currency: "جنيه",
    orderIntro: "مرحباً، أود طلب المنتجات التالية:",
    orderTotal: "الإجمالي",
    orderOutro: "برجاء تأكيد الطلب والتوصيل.",
    weight125: "125 جم",
    weight250: "250 جم",
    weight500: "500 جم",
    weight1000: "1 كجم",
    shaker: "ملاحة",
    unit: "قطعة"
  },
  en: {
    skipToProducts: "Skip to products",
    brandLine: "Flavor worth sharing",
    shop: "Shop",
    contact: "Contact us",
    closeContact: "Close contact information",
    contactLinks: "Contact links",
    share: "Share",
    changeLanguage: "Change language",
    cart: "Cart",
    contactEyebrow: "We are here for you",
    contactTitle: "A.T. Spices",
    contactDescription: "Spices, herbs, and more.<br>10B Mahdy Arafa Street, Project 14, 10th District, Nasr City",
    location: "Store location",
    whatsapp: "WhatsApp 01036578338",
    instagram: "Instagram",
    facebook: "Facebook",
    email: "at.spicesstore@gmail.com",
    whatsappText: "Hello, I would like to ask about your products",
    emailSubject: "Product inquiry",
    emailBody: "Hello, I would like to ask about your products.",
    heroEyebrow: "Naturally selected with care",
    heroTitle: "Authentic flavor,<br><em>from our shelf to your home.</em>",
    heroText: "Discover aromatic spices, fresh nuts, natural honey, distinctive incense and selected personal care.",
    browseProducts: "Browse products",
    fresh: "Fresh",
    selected: "Carefully selected",
    quality: "Quality to trust",
    packaging: "Packed with care",
    easyOrder: "Order easily from home",
    ourCollection: "Our collection",
    findFavorite: "Find your favorite",
    collectionText: "Carefully selected products for everyday use and special moments.",
    searchPlaceholder: "Search products",
    scrollFilters: "Show more categories",
    sortBy: "Sort by",
    sortFeatured: "Featured",
    sortName: "Name: A–Z",
    sortPriceAsc: "Price: Low to high",
    sortPriceDesc: "Price: High to low",
    clearFilters: "Clear filters",
    productsPerPage: "Products per page",
    paginationLabel: "Product pages",
    previousPage: "Previous page",
    nextPage: "Next page",
    goToPage: "Go to page {page}",
    pageOf: "Page {current} of {total}",
    showingProducts: "Showing {start}–{end} of {count} products",
    loadingProducts: "Loading products...",
    catalogLoadError: "Products could not be loaded. Please refresh the page and try again.",
    noResultsTitle: "No matching products",
    noResultsText: "Try another word or show all products.",
    showAll: "Show all products",
    footerLine: "Spices, nuts, honey, incense and personal care",
    yourOrder: "Your order",
    shoppingCart: "Shopping cart",
    closeCart: "Close cart",
    emptyCartTitle: "Your cart is ready for something good",
    emptyCartText: "Add your favorites and they will appear here.",
    continueShopping: "Continue shopping",
    subtotal: "Subtotal",
    checkoutNote: "Place your order and we’ll contact you to confirm the details and delivery.",
    placeOrder: "Place order",
    all: "All",
    offers: "Offers",
    from: "From",
    add: "Add",
    viewDetails: "Details",
    hideDetails: "Hide details",
    remove: "Remove",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    productCountOne: "1 product",
    productCount: "{count} products",
    addedToCart: "{name} added to your cart",
    itemsLabel: "{count} items in cart",
    currency: "EGP",
    orderIntro: "Hello, I would like to order the following:",
    orderTotal: "Total",
    orderOutro: "Please confirm the order and delivery details.",
    weight125: "125 g",
    weight250: "250 g",
    weight500: "500 g",
    weight1000: "1 kg",
    shaker: "Shaker",
    unit: "Unit"
  }
};

const categoryIcons = {
  all: "✦",
  offers: "%",
  "بهارات": "✺",
  "مكسرات": "◉",
  "عسل": "◆",
  "بخور": "♨",
  "العناية والجمال": "♡"
};

const categoryTones = {
  "بهارات": "#e9c6aa",
  "مكسرات": "#dfc9a5",
  "عسل": "#edcf83",
  "بخور": "#d8c5c0",
  "العناية والجمال": "#e8cfd1"
};

const sizeColumns = [
  { key: "price_125", label: "weight125" },
  { key: "price_250", label: "weight250" },
  { key: "price_500", label: "weight500" },
  { key: "price_1000", label: "weight1000" },
  { key: "price_shaker", label: "shaker" },
  { key: "price_unit", label: "unit" }
];

const state = {
  lang: resolveInitialLanguage(),
  category: "all",
  search: "",
  sort: "featured",
  page: 1,
  pageSize: 10,
  cart: readCart()
};

const elements = {
  skipLink: document.getElementById("skipLink"),
  browseProducts: document.getElementById("browseProducts"),
  emailLink: document.getElementById("emailLink"),
  whatsappLink: document.getElementById("whatsappLink"),
  footerEmailLink: document.getElementById("footerEmailLink"),
  footerWhatsappLink: document.getElementById("footerWhatsappLink"),
  langToggle: document.getElementById("langToggle"),
  langLabel: document.getElementById("langLabel"),
  contactOpen: document.getElementById("contactOpen"),
  contactClose: document.getElementById("contactClose"),
  contactOverlay: document.getElementById("contactOverlay"),
  contactDrawer: document.getElementById("contactDrawer"),
  categoryFilters: document.getElementById("categoryFilters"),
  filterScroll: document.getElementById("filterScroll"),
  filterNext: document.getElementById("filterNext"),
  productSearch: document.getElementById("productSearch"),
  productSort: document.getElementById("productSort"),
  productsGrid: document.getElementById("productsGrid"),
  resultsCount: document.getElementById("resultsCount"),
  catalogPagination: document.getElementById("catalogPagination"),
  pageSize: document.getElementById("pageSize"),
  paginationPrevious: document.getElementById("paginationPrevious"),
  paginationNext: document.getElementById("paginationNext"),
  paginationPages: document.getElementById("paginationPages"),
  pageSummary: document.getElementById("pageSummary"),
  clearFilters: document.getElementById("clearFilters"),
  resetFilters: document.getElementById("resetFilters"),
  noResults: document.getElementById("noResults"),
  cartOpen: document.getElementById("cartOpen"),
  cartClose: document.getElementById("cartClose"),
  drawerOverlay: document.getElementById("drawerOverlay"),
  cartDrawer: document.getElementById("cartDrawer"),
  cartItems: document.getElementById("cartItems"),
  emptyCart: document.getElementById("emptyCart"),
  cartSummary: document.getElementById("cartSummary"),
  cartCount: document.getElementById("cartCount"),
  cartTotal: document.getElementById("cartTotal"),
  continueShopping: document.getElementById("continueShopping"),
  placeOrderButton: document.getElementById("placeOrderButton"),
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toastMessage")
};

let lastFocusedElement = null;
let toastTimer = null;

function resolveInitialLanguage() {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved === "ar" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

function parseCsvRows(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const text = csvText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (character === "\n" && !quoted) {
      row.push(field);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The products CSV contains an unclosed quote.");
  if (field || row.length) {
    row.push(field);
    if (row.some(value => value.trim())) rows.push(row);
  }
  if (rows.length < 2) throw new Error("The products CSV is empty.");

  const headers = rows.shift().map(header => header.trim());
  return rows.map(values => Object.fromEntries(
    headers.map((header, index) => [header, (values[index] ?? "").trim()])
  ));
}

function parseNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseBoolean(value) {
  if (value === true) return true;
  return ["true", "1", "yes"].includes(String(value).trim().toLowerCase());
}

function normalizeProducts(rows) {
  const seenIds = new Set();
  return rows.map((row, index) => {
    const id = String(row.id || "").trim();
    const name = String(row.name || row.name_eng || "").trim();
    const nameEng = String(row.name_eng || name).trim();
    const category = String(row.category || row.category_eng || "").trim();
    const categoryEng = String(row.category_eng || category).trim();

    if (!id || !name || !category || seenIds.has(id)) {
      console.warn(`Skipped invalid product row ${index + 2}.`);
      return null;
    }
    seenIds.add(id);

    return {
      id,
      name,
      name_eng: nameEng,
      category,
      category_eng: categoryEng,
      description: String(row.description || row.description_eng || "").trim(),
      description_eng: String(row.description_eng || row.description || "").trim(),
      tag: String(row.tag || "").trim(),
      tag_eng: String(row.tag_eng || row.tag || "").trim(),
      image: String(row.image || "").trim(),
      active: parseBoolean(row.active),
      featured_order: parseNumber(row.featured_order),
      price_125: parseNumber(row.price_125),
      price_250: parseNumber(row.price_250),
      price_500: parseNumber(row.price_500),
      price_1000: parseNumber(row.price_1000),
      price_shaker: parseNumber(row.price_shaker),
      price_unit: parseNumber(row.price_unit),
      discount: Math.max(0, parseNumber(row.discount) || 0)
    };
  }).filter(Boolean);
}

function setProducts(nextProducts) {
  const normalized = normalizeProducts(nextProducts);
  if (!normalized.length) throw new Error("No valid products were found.");
  products = normalized;
  categoryDefinitions = [...new Map(
    products
      .filter(product => product.active)
      .map(product => [product.category, { value: product.category, label_eng: product.category_eng }])
  ).values()];
  catalogReady = true;
  catalogStatus = "ready";
}

function readProductsCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY));
    if (cached?.version !== PRODUCTS_CACHE_VERSION || !Array.isArray(cached.products)) return null;
    return cached.products;
  } catch {
    return null;
  }
}

function saveProductsCache(nextProducts) {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
      version: PRODUCTS_CACHE_VERSION,
      savedAt: Date.now(),
      products: nextProducts
    }));
  } catch {
    // The shop still works when private browsing or a full storage quota blocks caching.
  }
}

async function fetchProducts() {
  const response = await fetch(PRODUCTS_URL, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Products request failed with ${response.status}.`);
  return normalizeProducts(parseCsvRows(await response.text()));
}

function t(key, values = {}) {
  let value = translations[state.lang][key] ?? key;
  Object.entries(values).forEach(([name, replacement]) => {
    value = value.replace(`{${name}}`, replacement);
  });
  return value;
}

function updateDocumentTitle() {
  document.title = state.lang === "ar" ? "A.T. Spices | المتجر" : "A.T. Spices | Shop";
}

function localized(product, field) {
  if (state.lang === "en") return product[`${field}_eng`] || product[field];
  return product[field];
}

function productOptions(product) {
  return sizeColumns
    .filter(({ key }) => Number(product[key]) > 0)
    .map(({ key, label }) => ({ key, label: t(label), price: Number(product[key]) }));
}

function lowestPrice(product) {
  const prices = productOptions(product).map(option => option.price);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

function formatPrice(value) {
  const locale = state.lang === "ar" ? "ar-EG" : "en-EG";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)} ${t("currency")}`;
}

function applyLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  updateDocumentTitle();
  localStorage.setItem(LANGUAGE_KEY, lang);

  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.innerHTML = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach(element => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  elements.langLabel.textContent = lang === "ar" ? "English" : "عربي";
  const emailHref = `mailto:${EMAIL}?subject=${encodeURIComponent(t("emailSubject"))}&body=${encodeURIComponent(t("emailBody"))}`;
  const whatsappHref = `https://wa.me/${PHONE}?text=${encodeURIComponent(t("whatsappText"))}`;
  elements.emailLink.href = emailHref;
  elements.footerEmailLink.href = emailHref;
  elements.whatsappLink.href = whatsappHref;
  elements.footerWhatsappLink.href = whatsappHref;
  if (catalogReady) {
    renderFilters();
    renderProducts();
    renderCart();
  } else if (catalogStatus === "error") {
    renderCatalogError();
  } else {
    renderCatalogLoading();
  }
}

function renderFilters() {
  const categories = categoryDefinitions.filter(category =>
    products.some(product => product.active && product.category === category.value)
  );
  const filters = [
    { value: "all", label: t("all") },
    ...categories.map(category => ({
      value: category.value,
      label: state.lang === "en" ? category.label_eng : category.value
    })),
    { value: "offers", label: t("offers") }
  ];

  elements.categoryFilters.replaceChildren(...filters.map(filter => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-button${filter.value === "offers" ? " offer-filter" : ""}${state.category === filter.value ? " active" : ""}`;
    button.dataset.category = filter.value;
    button.setAttribute("aria-pressed", String(state.category === filter.value));
    button.textContent = `${categoryIcons[filter.value] || "•"} ${filter.label}`;
    return button;
  }));
  requestAnimationFrame(updateFilterArrow);
}

function updateFilterArrow() {
  elements.filterNext.hidden = elements.filterScroll.scrollWidth <= elements.filterScroll.clientWidth + 2;
}

function scrollCategoryFilters() {
  const direction = state.lang === "ar" ? -1 : 1;
  elements.filterScroll.scrollBy({ left: direction * 210, behavior: "smooth" });
}

function filteredProducts() {
  const query = state.search.trim().toLocaleLowerCase(state.lang === "ar" ? "ar" : "en");
  const visible = products.filter(product => {
    if (!product.active || !productOptions(product).length) return false;
    const matchesCategory = state.category === "all"
      || (state.category === "offers" ? Number(product.discount) > 0 : product.category === state.category);
    const searchable = [
      product.name,
      product.name_eng,
      product.category,
      product.category_eng,
      product.description,
      product.description_eng,
      product.tag,
      product.tag_eng
    ].join(" ").toLocaleLowerCase(state.lang === "ar" ? "ar" : "en");
    return matchesCategory && (!query || searchable.includes(query));
  });

  return visible.sort((a, b) => {
    if (state.sort === "name") {
      return localized(a, "name").localeCompare(localized(b, "name"), state.lang);
    }
    if (state.sort === "price-asc") return lowestPrice(a) - lowestPrice(b);
    if (state.sort === "price-desc") return lowestPrice(b) - lowestPrice(a);

    const aRank = Number(a.featured_order) || Number.POSITIVE_INFINITY;
    const bRank = Number(b.featured_order) || Number.POSITIVE_INFINITY;
    if (aRank !== bRank) return aRank - bRank;
    return localized(a, "name").localeCompare(localized(b, "name"), state.lang);
  });
}

function createProductImage(product, { lazy = true } = {}) {
  const image = document.createElement("img");
  const source = product.image || DEFAULT_PRODUCT_IMAGE;
  const usesFallback = !product.image || source.replace(/^\.\//, "") === DEFAULT_PRODUCT_IMAGE;
  image.alt = localized(product, "name");
  image.decoding = "async";
  if (lazy) {
    image.loading = "lazy";
    image.fetchPriority = "low";
  }
  image.classList.toggle("product-image-fallback", usesFallback);
  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied === "true") return;
    image.dataset.fallbackApplied = "true";
    image.classList.add("product-image-fallback");
    image.src = DEFAULT_PRODUCT_IMAGE;
  });
  image.src = source;
  return image;
}

function setProductDescriptionExpanded(card, expanded) {
  const toggle = card.querySelector(".description-toggle");
  if (!toggle) return;

  card.classList.toggle("description-open", expanded);
  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.querySelector("span").textContent = t(expanded ? "hideDetails" : "viewDetails");
  toggle.querySelector("i").className = expanded ? "bi bi-chevron-up" : "bi bi-info-circle";
}

function closeProductDescriptions(exceptCard = null) {
  elements.productsGrid.querySelectorAll(".product-card.description-open").forEach(card => {
    if (card !== exceptCard) setProductDescriptionExpanded(card, false);
  });
}

function createProductCard(product) {
  const options = productOptions(product);
  const article = document.createElement("article");
  article.className = "product-card";
  article.dataset.productId = product.id;

  const media = document.createElement("div");
  media.className = "product-media";
  media.style.setProperty("--product-tone", categoryTones[product.category] || "#efe1d2");

  const badges = document.createElement("div");
  badges.className = "product-badges";
  const tag = localized(product, "tag");
  if (tag) {
    const tagElement = document.createElement("span");
    tagElement.className = "product-tag";
    tagElement.textContent = tag;
    badges.append(tagElement);
  }
  if (Number(product.discount) > 0) {
    const discount = document.createElement("span");
    discount.className = "discount-badge";
    discount.textContent = `${product.discount}% ${state.lang === "ar" ? "خصم" : "OFF"}`;
    badges.append(discount);
  }
  media.append(badges);

  media.append(createProductImage(product));

  const content = document.createElement("div");
  content.className = "product-content";

  const meta = document.createElement("span");
  meta.className = "product-meta";
  meta.textContent = localized(product, "category");

  const title = document.createElement("h3");
  title.className = "product-title";
  title.textContent = localized(product, "name");

  const description = document.createElement("p");
  description.className = "product-description";
  description.id = `product-description-${product.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  description.textContent = localized(product, "description");

  const descriptionToggle = document.createElement("button");
  descriptionToggle.type = "button";
  descriptionToggle.className = "description-toggle";
  descriptionToggle.setAttribute("aria-expanded", "false");
  descriptionToggle.setAttribute("aria-controls", description.id);
  descriptionToggle.innerHTML = `<i class="bi bi-info-circle" aria-hidden="true"></i><span>${t("viewDetails")}</span>`;
  descriptionToggle.addEventListener("click", event => {
    event.stopPropagation();
    const shouldOpen = !article.classList.contains("description-open");
    closeProductDescriptions(article);
    setProductDescriptionExpanded(article, shouldOpen);
  });

  const priceRow = document.createElement("div");
  priceRow.className = "price-row";
  const pricePrefix = document.createElement("span");
  pricePrefix.className = "price-prefix";
  pricePrefix.textContent = t("from");
  const price = document.createElement("span");
  price.className = "product-price";
  price.textContent = formatPrice(lowestPrice(product));
  priceRow.append(pricePrefix, price);

  const controls = document.createElement("div");
  controls.className = "product-controls";
  const select = document.createElement("select");
  select.className = "size-select";
  select.setAttribute("aria-label", `${localized(product, "name")} - ${t("sortBy")}`);
  options.forEach(option => {
    const optionElement = document.createElement("option");
    optionElement.value = option.key;
    optionElement.textContent = `${option.label} - ${formatPrice(option.price)}`;
    select.append(optionElement);
  });

  select.addEventListener("change", () => {
    const selected = options.find(option => option.key === select.value);
    pricePrefix.hidden = true;
    price.textContent = formatPrice(selected.price);
  });

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "add-button";
  addButton.innerHTML = `<i class="bi bi-plus-lg" aria-hidden="true"></i><span>${t("add")}</span>`;
  addButton.addEventListener("click", () => addToCart(product.id, select.value));
  controls.append(select, addButton);
  content.append(meta, title, descriptionToggle, description, priceRow, controls);
  article.append(media, content);
  return article;
}

function renderCatalogLoading() {
  const skeletons = Array.from({ length: 6 }, () => {
    const card = document.createElement("article");
    card.className = "product-card product-card-skeleton";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = `
      <div class="product-media skeleton-block"></div>
      <div class="product-content">
        <span class="skeleton-line skeleton-line-short"></span>
        <span class="skeleton-line skeleton-line-title"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line skeleton-line-price"></span>
      </div>`;
    return card;
  });
  elements.productsGrid.setAttribute("aria-busy", "true");
  elements.productsGrid.replaceChildren(...skeletons);
  elements.productsGrid.hidden = false;
  elements.noResults.hidden = true;
  elements.resultsCount.textContent = t("loadingProducts");
  elements.clearFilters.hidden = true;
  elements.catalogPagination.hidden = true;
  elements.categoryFilters.replaceChildren();
  elements.filterNext.hidden = true;
}

function renderCatalogError() {
  const message = document.createElement("p");
  message.className = "catalog-message";
  message.textContent = t("catalogLoadError");
  elements.productsGrid.removeAttribute("aria-busy");
  elements.productsGrid.replaceChildren(message);
  elements.productsGrid.hidden = false;
  elements.noResults.hidden = true;
  elements.resultsCount.textContent = "";
  elements.clearFilters.hidden = true;
  elements.catalogPagination.hidden = true;
  elements.categoryFilters.replaceChildren();
  elements.filterNext.hidden = true;
}

function formatPageNumber(value) {
  return new Intl.NumberFormat(state.lang === "ar" ? "ar-EG" : "en-EG", {
    useGrouping: false
  }).format(value);
}

function paginationItems(totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, state.page - 1, state.page, state.page + 1]);
  const sorted = [...pages].filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("ellipsis");
    items.push(page);
  });
  return items;
}

function renderPagination(totalProducts, totalPages) {
  elements.catalogPagination.hidden = totalProducts === 0;
  if (!totalProducts) return;

  elements.pageSize.value = String(state.pageSize);
  elements.paginationPrevious.disabled = state.page === 1;
  elements.paginationNext.disabled = state.page === totalPages;
  elements.pageSummary.textContent = t("pageOf", {
    current: formatPageNumber(state.page),
    total: formatPageNumber(totalPages)
  });

  const items = paginationItems(totalPages).map(item => {
    if (item === "ellipsis") {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "…";
      ellipsis.setAttribute("aria-hidden", "true");
      return ellipsis;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = `pagination-page${item === state.page ? " active" : ""}`;
    button.dataset.page = String(item);
    button.textContent = formatPageNumber(item);
    button.setAttribute("aria-label", t("goToPage", { page: formatPageNumber(item) }));
    if (item === state.page) button.setAttribute("aria-current", "page");
    return button;
  });
  elements.paginationPages.replaceChildren(...items);
}

function scrollProductsIntoView() {
  const reducedMotion = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elements.productsGrid.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function changePage(page) {
  const totalPages = Math.max(1, Math.ceil(filteredProducts().length / state.pageSize));
  const nextPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  if (nextPage === state.page) return;
  state.page = nextPage;
  renderProducts();
  scrollProductsIntoView();
}

function renderProducts() {
  const visibleProducts = filteredProducts();
  const totalProducts = visibleProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / state.pageSize));
  state.page = Math.min(Math.max(state.page, 1), totalPages);
  const startIndex = (state.page - 1) * state.pageSize;
  const pageProducts = visibleProducts.slice(startIndex, startIndex + state.pageSize);

  elements.productsGrid.removeAttribute("aria-busy");
  elements.productsGrid.replaceChildren(...pageProducts.map(createProductCard));
  elements.productsGrid.hidden = totalProducts === 0;
  elements.noResults.hidden = totalProducts !== 0;
  elements.resultsCount.textContent = totalProducts
    ? t("showingProducts", {
        start: formatPageNumber(startIndex + 1),
        end: formatPageNumber(startIndex + pageProducts.length),
        count: formatPageNumber(totalProducts)
      })
    : t("productCount", { count: formatPageNumber(0) });
  renderPagination(totalProducts, totalPages);
  elements.clearFilters.hidden = state.category === "all" && !state.search;
}

function resetFilters() {
  state.category = "all";
  state.search = "";
  state.page = 1;
  elements.productSearch.value = "";
  renderFilters();
  renderProducts();
}

function addToCart(productId, sizeKey) {
  const product = products.find(item => item.id === productId);
  const option = productOptions(product).find(item => item.key === sizeKey);
  if (!product || !option) return;

  const lineId = `${productId}::${sizeKey}`;
  const existing = state.cart.find(item => item.lineId === lineId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ lineId, productId, sizeKey, quantity: 1 });
  }
  saveCart();
  renderCart();
  showToast(t("addedToCart", { name: localized(product, "name") }));
}

function cartLineDetails(item) {
  const product = products.find(candidate => candidate.id === item.productId);
  if (!product) return null;
  const option = productOptions(product).find(candidate => candidate.key === item.sizeKey);
  if (!option) return null;
  return { ...item, product, option, lineTotal: option.price * item.quantity };
}

function cleanCart() {
  state.cart = state.cart
    .map(cartLineDetails)
    .filter(Boolean)
    .map(({ lineId, productId, sizeKey, quantity }) => ({ lineId, productId, sizeKey, quantity }));
  saveCart();
}

function createCartItem(item) {
  const details = cartLineDetails(item);
  const row = document.createElement("article");
  row.className = "cart-item";

  const visual = document.createElement("div");
  visual.className = "cart-item-visual";
  visual.append(createProductImage(details.product, { lazy: false }));

  const info = document.createElement("div");
  info.className = "cart-item-info";
  const title = document.createElement("h3");
  title.textContent = localized(details.product, "name");
  const variant = document.createElement("p");
  variant.textContent = `${details.option.label} - ${formatPrice(details.option.price)}`;

  const quantity = document.createElement("div");
  quantity.className = "quantity-control";
  const decrease = document.createElement("button");
  decrease.type = "button";
  decrease.setAttribute("aria-label", t("decrease"));
  decrease.textContent = "−";
  decrease.addEventListener("click", () => changeQuantity(item.lineId, -1));
  const count = document.createElement("span");
  count.textContent = item.quantity;
  const increase = document.createElement("button");
  increase.type = "button";
  increase.setAttribute("aria-label", t("increase"));
  increase.textContent = "+";
  increase.addEventListener("click", () => changeQuantity(item.lineId, 1));
  quantity.append(decrease, count, increase);
  info.append(title, variant, quantity);

  const side = document.createElement("div");
  side.className = "cart-item-side";
  const total = document.createElement("strong");
  total.textContent = formatPrice(details.lineTotal);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-button";
  remove.setAttribute("aria-label", `${t("remove")} ${localized(details.product, "name")}`);
  remove.innerHTML = '<i class="bi bi-trash3" aria-hidden="true"></i>';
  remove.addEventListener("click", () => removeCartItem(item.lineId));
  side.append(remove, total);
  row.append(visual, info, side);
  return row;
}

function renderCart() {
  cleanCart();
  const details = state.cart.map(cartLineDetails).filter(Boolean);
  const itemCount = details.reduce((sum, item) => sum + item.quantity, 0);
  const total = details.reduce((sum, item) => sum + item.lineTotal, 0);

  elements.cartItems.replaceChildren(...state.cart.map(createCartItem));
  elements.cartItems.hidden = state.cart.length === 0;
  elements.emptyCart.hidden = state.cart.length !== 0;
  elements.cartSummary.hidden = state.cart.length === 0;
  elements.cartCount.textContent = itemCount;
  elements.cartCount.setAttribute("aria-label", t("itemsLabel", { count: itemCount }));
  elements.cartTotal.textContent = formatPrice(total);
}

function changeQuantity(lineId, amount) {
  const item = state.cart.find(candidate => candidate.lineId === lineId);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) state.cart = state.cart.filter(candidate => candidate.lineId !== lineId);
  saveCart();
  renderCart();
}

function removeCartItem(lineId) {
  state.cart = state.cart.filter(item => item.lineId !== lineId);
  saveCart();
  renderCart();
}

function openDrawer(drawer, overlay, closeButton) {
  lastFocusedElement = document.activeElement;
  overlay.hidden = false;
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  requestAnimationFrame(() => {
    overlay.classList.add("visible");
    drawer.classList.add("open");
    closeButton.focus();
  });
}

function closeDrawer(drawer, overlay) {
  overlay.classList.remove("visible");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  if (!elements.cartDrawer.classList.contains("open") && !elements.contactDrawer.classList.contains("open")) {
    document.body.classList.remove("drawer-open");
  }
  window.setTimeout(() => {
    overlay.hidden = true;
    lastFocusedElement?.focus();
  }, 300);
}

function openCart() {
  openDrawer(elements.cartDrawer, elements.drawerOverlay, elements.cartClose);
}

function closeCart() {
  closeDrawer(elements.cartDrawer, elements.drawerOverlay);
}

function openContact() {
  openDrawer(elements.contactDrawer, elements.contactOverlay, elements.contactClose);
}

function closeContact() {
  closeDrawer(elements.contactDrawer, elements.contactOverlay);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toastMessage.textContent = message;
  elements.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2400);
}

function submitOrder() {
  const details = state.cart.map(cartLineDetails).filter(Boolean);
  if (!details.length) return;
  const total = details.reduce((sum, item) => sum + item.lineTotal, 0);
  const lines = details.map((item, index) => {
    const name = localized(item.product, "name");
    return `${index + 1}. ${name} — ${item.option.label} × ${item.quantity} — ${formatPrice(item.lineTotal)}`;
  });
  const message = [
    t("orderIntro"),
    "",
    ...lines,
    "",
    `${t("orderTotal")}: ${formatPrice(total)}`,
    "",
    t("orderOutro")
  ].join("\n");
  window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

async function initializeCatalog() {
  if (catalogStarted) return;
  catalogStarted = true;
  applyLanguage(state.lang);
  const cached = readProductsCache();

  if (cached) {
    try {
      setProducts(cached);
      applyLanguage(state.lang);
    } catch {
      localStorage.removeItem(PRODUCTS_CACHE_KEY);
    }
  }

  try {
    const freshProducts = await fetchProducts();
    setProducts(freshProducts);
    saveProductsCache(products);
    applyLanguage(state.lang);
  } catch (error) {
    console.error("Could not load the product catalog.", error);
    if (!catalogReady) {
      catalogStarted = false;
      catalogStatus = "error";
      applyLanguage(state.lang);
    }
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.warn("Offline cache registration was skipped.", error);
    });
  });
}

elements.langToggle.addEventListener("click", () => applyLanguage(state.lang === "ar" ? "en" : "ar"));
elements.browseProducts.addEventListener("click", event => {
  event.preventDefault();
  document.getElementById("productsSection").scrollIntoView({ behavior: "smooth" });
});
elements.filterNext.addEventListener("click", scrollCategoryFilters);
elements.categoryFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  state.page = 1;
  renderFilters();
  renderProducts();
});
elements.productSearch.addEventListener("input", event => {
  state.search = event.target.value;
  state.page = 1;
  renderProducts();
});
elements.productSort.addEventListener("change", event => {
  state.sort = event.target.value;
  state.page = 1;
  renderProducts();
});
elements.pageSize.addEventListener("change", event => {
  state.pageSize = Number(event.target.value) === 20 ? 20 : 10;
  state.page = 1;
  renderProducts();
  scrollProductsIntoView();
});
elements.paginationPrevious.addEventListener("click", () => changePage(state.page - 1));
elements.paginationNext.addEventListener("click", () => changePage(state.page + 1));
elements.paginationPages.addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (button) changePage(button.dataset.page);
});
document.addEventListener("pointerdown", event => {
  if (!event.target.closest(".product-card.description-open") && !event.target.closest(".description-toggle")) {
    closeProductDescriptions();
  }
});
elements.clearFilters.addEventListener("click", resetFilters);
elements.resetFilters.addEventListener("click", resetFilters);
elements.contactOpen.addEventListener("click", openContact);
elements.contactClose.addEventListener("click", closeContact);
elements.contactOverlay.addEventListener("click", closeContact);
elements.cartOpen.addEventListener("click", openCart);
elements.cartClose.addEventListener("click", closeCart);
elements.drawerOverlay.addEventListener("click", closeCart);
elements.continueShopping.addEventListener("click", closeCart);
elements.placeOrderButton.addEventListener("click", submitOrder);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeProductDescriptions();
  if (event.key === "Escape" && elements.cartDrawer.classList.contains("open")) closeCart();
  if (event.key === "Escape" && elements.contactDrawer.classList.contains("open")) closeContact();
});
window.addEventListener("resize", updateFilterArrow);

registerServiceWorker();
localStorage.removeItem("at-spices-products-v1");
localStorage.removeItem("at-spices-products-v2");
if (window.location.hash === "#contact") history.replaceState(null, "", "#shopView");
applyLanguage(state.lang);
initializeCatalog();
