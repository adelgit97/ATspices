import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSV_PATH = path.join(ROOT, "data", "products.csv");
const SITE_URL = "https://atspicesstore.com";
const BRAND = "A.T. Spices";
const CURRENCY = "EGP";
const GOOGLE_TAG_ID = "G-WH27RVYZHK";
const GENERATED_ROOTS = [
  path.join(ROOT, "ar", "product"),
  path.join(ROOT, "en", "product"),
  path.join(ROOT, "ar", "category"),
  path.join(ROOT, "en", "category")
];
const PRICE_FIELDS = [
  ["price_125", "125 جم", "125 g"],
  ["price_250", "250 جم", "250 g"],
  ["price_500", "500 جم", "500 g"],
  ["price_1000", "1 كجم", "1 kg"],
  ["price_shaker", "ملاحة", "Shaker"],
  ["price_unit", "قطعة", "Unit"]
];

function parseCsv(text) {
  const matrix = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
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
      if (row.some(value => value.trim())) matrix.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("products.csv contains an unclosed quote.");
  if (field || row.length) {
    row.push(field);
    if (row.some(value => value.trim())) matrix.push(row);
  }
  if (matrix.length < 2) throw new Error("products.csv has no product rows.");

  const headers = matrix.shift().map(value => value.trim());
  return matrix.map(values => Object.fromEntries(
    headers.map((header, index) => [header, (values[index] ?? "").trim()])
  ));
}

function isTrue(value) {
  return ["true", "1", "yes"].includes(String(value).trim().toLowerCase());
}

function number(value) {
  if (String(value ?? "").trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productSlug(product) {
  return `${slugify(product.name_eng || product.name) || "product"}-${slugify(product.id) || "item"}`;
}

function categorySlug(category) {
  return slugify(category.category_eng || category.category) || `category-${slugify(category.category)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function absoluteAsset(asset) {
  const cleaned = String(asset || "assets/ATlogo-round-ar-630.png").replace(/^\.?\//, "");
  return `${SITE_URL}/${cleaned}`;
}

function productValues(product, lang) {
  const english = lang === "en";
  const options = PRICE_FIELDS
    .map(([key, ar, en]) => ({ key, label: english ? en : ar, price: number(product[key]) }))
    .filter(option => option.price);
  return {
    name: (english ? product.name_eng : product.name) || product.name || product.name_eng,
    category: (english ? product.category_eng : product.category) || product.category || product.category_eng,
    description: english ? product.description_eng : product.description,
    tag: english ? product.tag_eng : product.tag,
    options,
    lowestPrice: Math.min(...options.map(option => option.price))
  };
}

function metadataDescription(product, lang, values) {
  if (values.description) return values.description;
  return lang === "ar"
    ? `${values.name} | ${values.category} | ${BRAND} مصر. السعر يبدأ من ${values.lowestPrice} جنيه.`
    : `${values.name} | ${values.category} | ${BRAND} Egypt. Price from ${values.lowestPrice} EGP.`;
}

function sharedHead({ lang, title, description, canonical, image, type = "website", version }) {
  const locale = lang === "ar" ? "ar_EG" : "en_US";
  return `
  <meta charset="UTF-8">
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#69462f">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GOOGLE_TAG_ID}');
  </script>
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/png" href="/assets/ATlogo-round-ar-630.png?v=${version}">
  <link rel="preload" href="/assets/fonts/cairo/Cairo-Arabic.woff2?v=${version}" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:locale" content="${locale}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  <link rel="stylesheet" href="/css/fonts.css?v=${version}">
  <link rel="stylesheet" href="/css/app.css?v=${version}">`;
}

function staticHeader(lang, alternateUrl) {
  const isAr = lang === "ar";
  return `<header class="site-header"><div class="header-inner header-shell">
    <a class="brand" href="/" aria-label="A.T. Spices"><img src="/assets/ATlogo-round-ar-630.png" alt="" width="70" height="70"><span class="brand-copy"><strong>A.T. Spices</strong><small>${isAr ? "نكهة تستحق المشاركة" : "Flavor worth sharing"}</small></span></a>
    <div class="header-actions"><a class="icon-button language-button" href="${alternateUrl}" aria-label="${isAr ? "عرض الصفحة بالإنجليزية" : "View this page in Arabic"}"><i class="bi bi-translate" aria-hidden="true"></i><span>${isAr ? "English" : "عربي"}</span></a></div>
  </div></header>`;
}

function staticFooter() {
  return `<footer class="shared-footer"><div class="shared-footer-inner footer-shell"><a class="shared-footer-brand" href="/"><img src="/assets/ATlogo-round-ar-630.png" alt="A.T. Spices" width="52" height="52"><span><strong>A.T. Spices</strong></span></a><div class="footer-contact-icons"><a href="https://maps.app.goo.gl/BiupkAsG192nppYC6" aria-label="Location"><i class="bi bi-geo-alt-fill"></i></a><a href="https://wa.me/201036578338" aria-label="WhatsApp"><i class="bi bi-whatsapp"></i></a><a href="https://www.instagram.com/a.tspicess" aria-label="Instagram"><i class="bi bi-instagram"></i></a><a href="https://www.facebook.com/people/AT-Spices/61587448102563/" aria-label="Facebook"><i class="bi bi-facebook"></i></a><a href="mailto:at.spicesstore@gmail.com" aria-label="Email"><i class="bi bi-envelope-fill"></i></a></div></div></footer>`;
}

function productPage(product, lang, version) {
  const values = productValues(product, lang);
  const slug = productSlug(product);
  const canonical = `${SITE_URL}/${lang}/product/${slug}/`;
  const alternateLang = lang === "ar" ? "en" : "ar";
  const alternate = `${SITE_URL}/${alternateLang}/product/${slug}/`;
  const image = absoluteAsset(product.image);
  const description = metadataDescription(product, lang, values);
  const title = `${values.name}${values.category ? ` | ${values.category}` : ""} | ${BRAND}`;
  const isAr = lang === "ar";
  const productData = {
    id: product.id,
    name: values.name,
    isPowder: isTrue(product.is_powder),
    options: values.options
  };
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: values.name,
    image: [image],
    sku: product.id,
    brand: { "@type": "Brand", name: BRAND },
    url: canonical,
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: CURRENCY,
      price: values.lowestPrice
    }
  };
  if (values.description) schema.description = values.description;

  const options = values.options.map(option => `<option value="${option.key}">${escapeHtml(option.label)} - ${option.price} ${isAr ? "جنيه" : "EGP"}</option>`).join("");
  const preparation = isTrue(product.is_powder) ? `<fieldset class="preparation-options"><legend class="visually-hidden">${isAr ? "شكل المنتج" : "Product form"}</legend><label><input type="radio" name="preparation" value="whole" checked><span>${isAr ? "صحيح" : "Whole"}</span></label><label><input type="radio" name="preparation" value="ground"><span>${isAr ? "ناعم" : "Powder"}</span></label></fieldset>` : "";
  const visibleDescription = values.description ? `<p class="product-detail-description">${escapeHtml(values.description)}</p>` : "";
  const tag = values.tag ? `<span class="product-tag">${escapeHtml(values.tag)}</span>` : "";
  const discount = number(product.discount) ? `<span class="discount-badge">${product.discount}% ${isAr ? "خصم" : "OFF"}</span>` : "";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? "rtl" : "ltr"}">
<head>${sharedHead({ lang, title, description, canonical, image, type: "product", version })}
  <link rel="alternate" hreflang="ar" href="${SITE_URL}/ar/product/${slug}/">
  <link rel="alternate" hreflang="en" href="${SITE_URL}/en/product/${slug}/">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/product/${slug}/">
  <script type="application/ld+json">${safeJson(schema)}</script>
</head>
<body class="seo-detail-page">
  <div class="entry-snapshot" id="entrySnapshot">
    ${staticHeader(lang, `/${alternateLang}/product/${slug}/`)}
    <main class="entry-product-background" aria-hidden="true"><div class="entry-product-background-inner"><img src="/assets/ATlogo-round-ar-630.png?v=${version}" alt="" width="240" height="240"><p>${isAr ? "نكهات أصيلة، من رفّنا إلى بيتك." : "Authentic flavor, from our shelf to your home."}</p></div></main>
    ${staticFooter()}
    <div class="drawer-overlay visible"></div>
    <aside class="product-drawer open" role="dialog" aria-modal="true" aria-labelledby="productTitle">
      <div class="drawer-header"><div><span class="section-kicker">${isAr ? "تفاصيل المنتج" : "Product details"}</span><h1 id="productTitle">${escapeHtml(values.name)}</h1></div><a class="close-button" href="/" aria-label="${isAr ? "إغلاق تفاصيل المنتج" : "Close product details"}"><i class="bi bi-x-lg"></i></a></div>
      <div class="product-detail product-drawer-content">
        <div class="product-detail-media"><img${product.image ? "" : ' class="product-image-fallback"'} src="/${escapeHtml(product.image || "assets/ATlogo-round-ar-630.png")}?v=${version}" alt="${escapeHtml(values.name)}" width="800" height="667"></div>
        <div class="product-detail-info"><span class="product-meta">${escapeHtml(values.category)}</span><h2>${escapeHtml(values.name)}</h2><div class="product-detail-badges">${tag}${discount}</div>${visibleDescription}<div class="price-row product-detail-price"><span class="price-prefix">${isAr ? "يبدأ من" : "From"}</span><strong class="product-price">${values.lowestPrice} ${isAr ? "جنيه" : "EGP"}</strong></div>${preparation}<div class="product-controls product-detail-controls"><select class="size-select" id="productSize">${options}</select><button class="add-button" id="productAdd" type="button"><i class="bi bi-plus-lg"></i><span>${isAr ? "أضف" : "Add"}</span></button></div><p class="seo-add-status" id="addStatus" role="status" aria-live="polite"></p></div>
      </div>
    </aside>
  </div>
  <script id="productData" type="application/json">${safeJson(productData)}</script>
  <script src="/js/product-page.js?v=${version}"></script>
  <script src="/js/entry-page.js?v=${version}"></script>
</body>
</html>`;
}

function categoryPage(category, products, lang, version) {
  const isAr = lang === "ar";
  const name = (isAr ? category.category : category.category_eng) || category.category || category.category_eng;
  const slug = categorySlug(category);
  const canonical = `${SITE_URL}/${lang}/category/${slug}/`;
  const alternateLang = isAr ? "en" : "ar";
  const description = isAr ? `${name} من ${BRAND} في مصر.` : `${name} from ${BRAND} in Egypt.`;
  const title = `${name} | ${BRAND}`;
  const cards = products.map(product => {
    const values = productValues(product, lang);
    const url = `/${lang}/product/${productSlug(product)}/`;
    return `<li><a class="seo-category-card" href="${url}"><img src="/${escapeHtml(product.image || "assets/ATlogo-round-ar-630.png")}?v=${version}" alt="${escapeHtml(values.name)}" loading="lazy" width="320" height="267"><span><strong>${escapeHtml(values.name)}</strong><small>${values.lowestPrice} ${isAr ? "جنيه" : "EGP"}</small></span></a></li>`;
  }).join("");
  return `<!DOCTYPE html><html lang="${lang}" dir="${isAr ? "rtl" : "ltr"}"><head>${sharedHead({ lang, title, description, canonical, image: `${SITE_URL}/assets/Atlogo-round-ar-1200-630.png`, version })}<link rel="alternate" hreflang="ar" href="${SITE_URL}/ar/category/${slug}/"><link rel="alternate" hreflang="en" href="${SITE_URL}/en/category/${slug}/"><link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/category/${slug}/"></head><body class="seo-detail-page"><div class="entry-snapshot" id="entrySnapshot">${staticHeader(lang, `/${alternateLang}/category/${slug}/`)}<main class="seo-category-main page-shell"><div class="section-heading"><div><span class="section-kicker">${isAr ? "تشكيلتنا" : "Our collection"}</span><h1>${escapeHtml(name)}</h1></div><a class="secondary-button" href="/#productsSection">${isAr ? "كل المنتجات" : "All products"}</a></div><div class="catalog-tools seo-category-tools"><span class="filter-button active">${escapeHtml(name)}</span></div><ul class="seo-category-grid">${cards}</ul></main>${staticFooter()}</div><script src="/js/entry-page.js?v=${version}"></script></body></html>`;
}

async function writePage(directory, html) {
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), html, "utf8");
}

async function main() {
  const csv = await readFile(CSV_PATH, "utf8");
  const versionSource = await readFile(path.join(ROOT, "js", "deployment-version.js"), "utf8");
  const version = versionSource.match(/AT_SPICES_DEPLOYMENT_VERSION\s*=\s*"([^"]+)"/)?.[1] || "dev";
  const rows = parseCsv(csv);
  const ids = new Set();
  const products = rows.filter(product => {
    if (!product.id || !product.name || !product.category) throw new Error(`Invalid product row with ID '${product.id || "missing"}'.`);
    if (ids.has(product.id)) throw new Error(`Duplicate product ID '${product.id}'.`);
    ids.add(product.id);
    return isTrue(product.active) && PRICE_FIELDS.some(([key]) => number(product[key]));
  });
  if (!products.length) throw new Error("No active products with prices were found.");

  const categories = [...new Map(products.map(product => [product.category, {
    category: product.category,
    category_eng: product.category_eng || product.category
  }])).values()];

  for (const directory of GENERATED_ROOTS) await rm(directory, { recursive: true, force: true });

  const sitemapUrls = [`${SITE_URL}/`];
  for (const product of products) {
    const slug = productSlug(product);
    for (const lang of ["ar", "en"]) {
      await writePage(path.join(ROOT, lang, "product", slug), productPage(product, lang, version));
      sitemapUrls.push(`${SITE_URL}/${lang}/product/${slug}/`);
    }
  }
  for (const category of categories) {
    const slug = categorySlug(category);
    const members = products.filter(product => product.category === category.category);
    for (const lang of ["ar", "en"]) {
      await writePage(path.join(ROOT, lang, "category", slug), categoryPage(category, members, lang, version));
      sitemapUrls.push(`${SITE_URL}/${lang}/category/${slug}/`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map(url => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
  await writeFile(path.join(ROOT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, "utf8");
  console.log(`Generated ${products.length * 2} product pages, ${categories.length * 2} category pages, sitemap.xml, and robots.txt.`);
}

main().catch(error => {
  console.error(`SEO generation failed: ${error.message}`);
  process.exitCode = 1;
});
