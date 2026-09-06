(() => {
  const script = document.currentScript;
  const version = script ? new URL(script.src).searchParams.get("v") : "";
  const homepageUrl = `/index.html${version ? `?v=${encodeURIComponent(version)}` : ""}`;
  const snapshot = document.getElementById("entrySnapshot");

  fetch(homepageUrl, { cache: "no-cache" })
    .then(response => {
      if (!response.ok) throw new Error(`Homepage request failed (${response.status})`);
      return response.text();
    })
    .then(async html => {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const scripts = [...parsed.body.querySelectorAll("script[src]")].map(element => element.getAttribute("src"));
      parsed.body.querySelectorAll("script").forEach(element => element.remove());
      parsed.body.classList.add("entry-hydrating");
      if (snapshot) parsed.body.append(snapshot);

      const ready = new Promise(resolve => {
        window.addEventListener("atspices:route-ready", resolve, { once: true });
      });

      document.body.replaceWith(parsed.body);

      for (const source of scripts) {
        await new Promise((resolve, reject) => {
          const nextScript = document.createElement("script");
          const scriptUrl = new URL(source, `${window.location.origin}/`);
          if (version) scriptUrl.searchParams.set("v", version);
          nextScript.src = scriptUrl.href;
          nextScript.onload = resolve;
          nextScript.onerror = reject;
          document.body.append(nextScript);
        });
      }

      await ready;
      requestAnimationFrame(() => {
        document.body.classList.remove("entry-hydrating");
        if (!snapshot) return;
        snapshot.classList.add("entry-snapshot-leaving");
        snapshot.addEventListener("transitionend", () => snapshot.remove(), { once: true });
        window.setTimeout(() => snapshot.remove(), 400);
      });
    })
    .catch(error => {
      console.warn("The interactive store could not be loaded; the static page remains available.", error);
    });
})();
