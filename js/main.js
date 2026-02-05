const PHONE = "201036578338";
const EMAIL = "at.spicesstore@gmail.com";


const translations = {
  ar: {
    title: "A.T. Spices",
    description:
      "بهارات، أعشاب، والمزيد.<br>١٠ ب شارع مهدي عرفه ،مشروع ال ١٤ عمارة الحي العاشر - مدينة نصر",
    location: "موقع المتجر",
    whatsapp: "واتساب 01036578338",
    instagram: "إنستجرام",
    facebook: "فيسبوك",
    email: "at.spicesstore@gmail.com",
    toggle: "English",
    whatsappText: "مرحباً، أود الاستفسار عن المنتجات",
    emailSubject: "استفسار عن المنتجات",
    emailBody: "مرحباً، أود الاستفسار عن المنتجات.",
    shareClick:"شارك"
  },
  en: {
    title: "A.T. Spices",
    description:
      "Spices, herbs, and more.<br>10B Mahdy Arafa Street, Project 14, 10th District, Nasr City",
    location: "Store Location",
    whatsapp: "WhatsApp 01036578338",
    instagram: "Instagram",
    facebook: "Facebook",
    email: "at.spicesstore@gmail.com",
    toggle: "عربي",
    whatsappText: "Hello, I would like to ask about your products",
    emailSubject: "Product Inquiry",
    emailBody: "Hello, I would like to ask about your products.",
    shareClick:"Share"
  },
};

const elements = document.querySelectorAll("[data-i18n]");
const langLabel = document.getElementById("langLabel");
const emailLink = document.getElementById("emailLink");
const whatsappLink = document.getElementById("whatsappLink");
const toggleBtn = document.getElementById("langToggle");

function applyLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  elements.forEach(el => {
    const key = el.dataset.i18n;
    el.innerHTML = translations[lang][key];
  });

  langLabel.textContent = translations[lang].toggle;

  // Email
  emailLink.href =
    `mailto:${EMAIL}` +
    `?subject=${encodeURIComponent(translations[lang].emailSubject)}` +
    `&body=${encodeURIComponent(translations[lang].emailBody)}`;

  // WhatsApp
  whatsappLink.href =
    `https://wa.me/${PHONE}?text=${encodeURIComponent(translations[lang].whatsappText)}`;

  localStorage.setItem("lang", lang);
}

// Initial language resolution
const savedLang = localStorage.getItem("lang");
const browserLang = navigator.language.startsWith("ar") ? "ar" : "en";
const initialLang = savedLang || browserLang;

applyLanguage(initialLang);

// Toggle manually
toggleBtn.addEventListener("click", () => {
  const newLang = document.documentElement.lang === "ar" ? "en" : "ar";
  applyLanguage(newLang);
});

const shareToggle = document.getElementById("shareToggle");

shareToggle.addEventListener("click", async () => {
  const shareData = {
    title: "A.T. Spices | بهارات، أعشاب، مكسرات وعسل",
    text: "Check out A.T. Spices – متجر بهارات، أعشاب، مكسرات وعسل في مدينة نصر والتجمع",
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      //console.log("Page shared successfully");
    } catch (err) {
      //console.error("Share failed:", err);
    }
  } else {
    // Fallback: copy URL to clipboard
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert("الرابط تم نسخه / Link copied!"))
      .catch(() => alert("يرجى نسخ الرابط يدوياً / Please copy the link manually"));
  }
});
