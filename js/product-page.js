(() => {
  const CART_KEY = "at-spices-cart";
  const dataElement = document.getElementById("productData");
  const addButton = document.getElementById("productAdd");
  const sizeSelect = document.getElementById("productSize");
  const status = document.getElementById("addStatus");
  if (!dataElement || !addButton || !sizeSelect) return;

  const product = JSON.parse(dataElement.textContent);
  addButton.addEventListener("click", () => {
    let cart = [];
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY));
      if (Array.isArray(saved)) cart = saved;
    } catch {
      cart = [];
    }

    const preparationKey = product.isPowder
      ? document.querySelector('input[name="preparation"]:checked')?.value || "whole"
      : null;
    const sizeKey = sizeSelect.value;
    const selectedOption = product.options.find(option => option.key === sizeKey);
    const lineId = `${product.id}::${sizeKey}::${preparationKey || "standard"}`;
    const existing = cart.find(item => item.lineId === lineId);
    if (existing) existing.quantity += 1;
    else cart.push({ lineId, productId: product.id, sizeKey, preparationKey, quantity: 1 });
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    if (typeof globalThis.gtag === "function" && selectedOption) {
      const item = {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_variant: [selectedOption.label, preparationKey].filter(Boolean).join(" - "),
        price: selectedOption.price,
        quantity: 1
      };
      globalThis.gtag("event", "add_to_cart", {
        currency: "EGP",
        value: selectedOption.price,
        items: [item]
      });
    }
    status.textContent = document.documentElement.lang === "ar"
      ? `تمت إضافة ${product.name} إلى السلة`
      : `${product.name} added to your cart`;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js", { updateViaCache: "none" })
        .then(registration => registration.update())
        .catch(() => {});
    });
  }
})();
