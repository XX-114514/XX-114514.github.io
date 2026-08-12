(() => {
  const LANG_PREF_KEY = "site-lang";
  const GEO_CACHE_KEY = "site-country-code";
  const GEO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const pageName = window.location.pathname.split("/").pop() || "index.html";
  const isZh = document.documentElement.lang.toLowerCase().startsWith("zh") || window.location.pathname.includes("/zh/");
  const currentLang = isZh ? "zh" : "en";
  const switchHref = isZh ? `../${pageName}${window.location.hash}` : `./zh/${pageName}${window.location.hash}`;

  document.body.classList.toggle("is-zh", isZh);

  const getStoredLang = () => {
    try {
      return localStorage.getItem(LANG_PREF_KEY);
    } catch (_error) {
      return null;
    }
  };

  const setStoredLang = (lang) => {
    try {
      localStorage.setItem(LANG_PREF_KEY, lang);
    } catch (_error) {
      // Links still work when storage is unavailable.
    }
  };

  const preferredFromUrl = new URLSearchParams(window.location.search).get("lang");
  if (preferredFromUrl === "zh" || preferredFromUrl === "en") {
    setStoredLang(preferredFromUrl);
  }

  const headerInner = document.querySelector(".header-inner");
  if (headerInner && !document.querySelector(".lang-toggle")) {
    const controls = document.createElement("div");
    controls.className = "header-controls";

    const toggle = document.createElement("a");
    toggle.className = "lang-toggle";
    toggle.textContent = isZh ? "EN" : "中文";
    toggle.href = switchHref;
    toggle.setAttribute("aria-label", isZh ? "Switch to English" : "切换到中文");
    toggle.setAttribute("title", isZh ? "Switch to English" : "切换到中文");
    toggle.addEventListener("click", () => {
      setStoredLang(isZh ? "en" : "zh");
    });

    controls.append(toggle);
    headerInner.append(controls);
  }

  const readCachedCountry = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || "null");
      if (!cached || !cached.country || Date.now() - cached.time > GEO_CACHE_TTL) {
        return null;
      }
      return cached.country;
    } catch (_error) {
      return null;
    }
  };

  const writeCachedCountry = (country) => {
    try {
      localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ country, time: Date.now() }));
    } catch (_error) {
      // Country caching is only an optimization.
    }
  };

  const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1600);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  };

  const detectCountry = async () => {
    const cached = readCachedCountry();
    if (cached) {
      return cached;
    }

    try {
      const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      if (isLocalPreview) return null;
      const trace = await fetchWithTimeout("/cdn-cgi/trace", { cache: "no-store" });
      if (trace.ok) {
        const body = await trace.text();
        const match = body.match(/^loc=([A-Z]{2})$/m);
        if (match) {
          writeCachedCountry(match[1]);
          return match[1];
        }
      }
    } catch (_error) {
      // /cdn-cgi/trace is available only when deployed behind Cloudflare.
    }

    const language = navigator.language || "";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return language.toLowerCase().includes("zh-cn") || timezone === "Asia/Shanghai" ? "CN" : null;
  };

  const redirectToLanguage = (lang) => {
    if (lang === currentLang) {
      return;
    }
    const target = lang === "zh" ? `./zh/${pageName}` : `../${pageName}`;
    window.location.replace(`${target}${window.location.hash}`);
  };

  const applyDefaultLanguage = async () => {
    const storedLang = getStoredLang();
    if (storedLang === "zh" || storedLang === "en") {
      redirectToLanguage(storedLang);
      return;
    }
    if (preferredFromUrl === "zh" || preferredFromUrl === "en") {
      redirectToLanguage(preferredFromUrl);
      return;
    }

    const country = await detectCountry();
    if (country === "CN" && currentLang !== "zh") {
      window.location.replace(`./zh/${pageName}${window.location.hash}`);
    }
  };

  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    applyDefaultLanguage();
  }

  const yearEls = document.querySelectorAll(".js-year");
  yearEls.forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const current = pageName;
  const navLinks = document.querySelectorAll(".top-nav a[data-page]");
  navLinks.forEach((link) => {
    const page = link.getAttribute("data-page");
    if (page === current || (current === "" && page === "index.html")) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  const progressBar = document.querySelector(".scroll-progress");
  const updateProgress = () => {
    if (!progressBar) {
      return;
    }
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  revealEls.forEach((el, index) => {
    el.style.setProperty("--reveal-delay", `${index * 70}ms`);
  });

  if (revealEls.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  document.querySelectorAll("[data-umap-viewer]").forEach((viewer) => {
    const frame = viewer.querySelector("iframe");
    const resetButton = viewer.querySelector(".js-umap-reset");
    const fullscreenButton = viewer.querySelector(".js-umap-fullscreen");
    const legendButton = viewer.querySelector(".js-umap-legend");
    let legendVisible = false;
    resetButton?.addEventListener("click", () => frame?.contentWindow?.postMessage({ type: "umap-reset-view" }, window.location.origin));
    legendButton?.addEventListener("click", () => {
      legendVisible = !legendVisible;
      legendButton.setAttribute("aria-pressed", String(legendVisible));
      legendButton.textContent = legendVisible
        ? (isZh ? "隐藏图例" : "Hide legend")
        : (isZh ? "显示图例" : "Show legend");
      frame?.contentWindow?.postMessage({ type: "umap-set-legend", visible: legendVisible }, window.location.origin);
    });

    fullscreenButton?.addEventListener("click", async () => {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await viewer.requestFullscreen?.();
    });
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) {
        return;
      }
      if (event.data?.type === "umap-ready") {
        frame.contentWindow.postMessage({ type: "umap-set-legend", visible: legendVisible }, window.location.origin);
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (fullscreenButton) fullscreenButton.textContent = document.fullscreenElement ? (isZh ? "退出全屏" : "Exit full screen") : (isZh ? "全屏查看" : "Full screen");
      frame?.contentWindow?.postMessage({ type: "umap-resize" }, window.location.origin);
    });
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    return;
  }

  const reactiveBlocks = document.querySelectorAll(".hero, .page-hero, .section-shell");
  reactiveBlocks.forEach((block) => {
    block.addEventListener("pointermove", (event) => {
      const rect = block.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      block.style.setProperty("--mx", `${x}%`);
      block.style.setProperty("--my", `${y}%`);
    });

    block.addEventListener("pointerleave", () => {
      block.style.setProperty("--mx", "50%");
      block.style.setProperty("--my", "50%");
    });
  });
})();

(() => {
  const body = document.body;
  if (!body.classList.contains("landing-body")) {
    return;
  }

  body.classList.add("js");

  const opening = document.querySelector("[data-opening]");
  const openingKey = "xin-opening-seen";
  const finishOpening = () => opening?.classList.add("is-done");
  let hasSeenOpening = false;
  try {
    hasSeenOpening = sessionStorage.getItem(openingKey) === "1";
    sessionStorage.setItem(openingKey, "1");
  } catch (_error) {
    // The shortened intro still works when session storage is unavailable.
  }
  if (hasSeenOpening) {
    finishOpening();
  } else {
    document.querySelector("[data-opening-skip]")?.addEventListener("click", finishOpening);
    window.setTimeout(finishOpening, 2200);
  }

  const header = document.querySelector(".landing-header");
  if (header && !header.querySelector(".landing-lang")) {
    const isZh = document.documentElement.lang.toLowerCase().startsWith("zh");
    const languageLink = document.createElement("a");
    languageLink.className = "landing-lang";
    languageLink.href = isZh ? "../index.html?lang=en" : "./zh/index.html?lang=zh";
    languageLink.textContent = isZh ? "EN" : "中文";
    languageLink.setAttribute("aria-label", isZh ? "Switch to English" : "切换到中文");
    languageLink.addEventListener("click", () => {
      try {
        localStorage.setItem("site-lang", isZh ? "en" : "zh");
      } catch (_error) {
        // The language link still works if storage is disabled.
      }
    });
    header.append(languageLink);
  }

  const canvas = document.querySelector("#cell-field");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: -1000, y: -1000, active: false };
  const hero = canvas.closest(".landing-hero");
  let canvasVisible = true;
  let width = 0;
  let height = 0;
  let scale = 1;
  let nodes = [];
  let animationFrame = 0;
  let lastFrame = 0;

  const createNodes = () => {
    const count = Math.min(72, Math.max(28, Math.round((width * height) / 18000)));
    nodes = Array.from({ length: count }, (_, index) => {
      const major = index < 4;
      const positions = [
        [0.73, 0.43, 58, "coral"],
        [0.86, 0.27, 31, "mint"],
        [0.63, 0.72, 24, "ivory"],
        [0.91, 0.68, 20, "coral"]
      ];
      const preset = positions[index];
      return {
        x: major ? width * preset[0] : Math.random() * width,
        y: major ? height * preset[1] : Math.random() * height,
        homeX: major ? width * preset[0] : null,
        homeY: major ? height * preset[1] : null,
        vx: (Math.random() - 0.5) * (major ? 0.08 : 0.22),
        vy: (Math.random() - 0.5) * (major ? 0.08 : 0.22),
        radius: major ? preset[2] : 1.2 + Math.random() * 3.2,
        tone: major ? preset[3] : (Math.random() > 0.78 ? "coral" : Math.random() > 0.35 ? "mint" : "ivory"),
        phase: Math.random() * Math.PI * 2,
        major
      };
    });
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    scale = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    createNodes();
  };

  const nodeColor = (tone, alpha) => {
    if (tone === "coral") return `rgba(255, 107, 87, ${alpha})`;
    if (tone === "mint") return `rgba(149, 229, 193, ${alpha})`;
    return `rgba(241, 239, 231, ${alpha})`;
  };

  const drawCell = (node, time) => {
    const pulse = Math.sin(time * 0.001 + node.phase) * 0.06 + 1;
    const radius = node.radius * pulse;

    if (node.major) {
      context.beginPath();
      context.arc(node.x, node.y, radius * 1.38, 0, Math.PI * 2);
      context.strokeStyle = nodeColor(node.tone, 0.11);
      context.lineWidth = 1;
      context.stroke();

      context.beginPath();
      context.arc(node.x, node.y, radius, 0, Math.PI * 2);
      context.fillStyle = nodeColor(node.tone, 0.07);
      context.fill();
      context.strokeStyle = nodeColor(node.tone, 0.46);
      context.stroke();

      context.beginPath();
      context.arc(node.x - radius * 0.13, node.y + radius * 0.08, radius * 0.34, 0, Math.PI * 2);
      context.fillStyle = nodeColor(node.tone, 0.3);
      context.fill();

      for (let index = 0; index < 8; index += 1) {
        const angle = node.phase + index * (Math.PI / 4) + time * 0.00005;
        context.beginPath();
        context.arc(
          node.x + Math.cos(angle) * radius * 0.64,
          node.y + Math.sin(angle) * radius * 0.64,
          Math.max(1, radius * 0.045),
          0,
          Math.PI * 2
        );
        context.fillStyle = nodeColor(node.tone, 0.48);
        context.fill();
      }
      return;
    }

    context.beginPath();
    context.arc(node.x, node.y, radius, 0, Math.PI * 2);
    context.fillStyle = nodeColor(node.tone, node.tone === "ivory" ? 0.34 : 0.58);
    context.fill();
  };

  const render = (time = 0) => {
    const delta = Math.min(2, Math.max(0.4, (time - lastFrame) / 16.67 || 1));
    lastFrame = time;
    context.clearRect(0, 0, width, height);

    const connectionDistance = width < 700 ? 92 : 132;
    for (let first = 0; first < nodes.length; first += 1) {
      for (let second = first + 1; second < nodes.length; second += 1) {
        const a = nodes[first];
        const b = nodes[second];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance > connectionDistance) continue;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.strokeStyle = `rgba(149, 229, 193, ${(1 - distance / connectionDistance) * 0.16})`;
        context.lineWidth = 0.7;
        context.stroke();
      }
    }

    nodes.forEach((node) => {
      if (!reducedMotion) {
        if (node.major) {
          node.vx += (node.homeX - node.x) * 0.000015;
          node.vy += (node.homeY - node.y) * 0.000015;
        }
        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const distance = Math.max(30, Math.hypot(dx, dy));
          if (distance < 180) {
            const force = (1 - distance / 180) * (node.major ? 0.012 : 0.045);
            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        }
        node.vx *= 0.995;
        node.vy *= 0.995;
        node.x += node.vx * delta;
        node.y += node.vy * delta;
        if (node.x < -70) node.x = width + 70;
        if (node.x > width + 70) node.x = -70;
        if (node.y < -70) node.y = height + 70;
        if (node.y > height + 70) node.y = -70;
      }
      drawCell(node, time);
    });

    if (!reducedMotion && canvasVisible && !document.hidden) {
      animationFrame = window.requestAnimationFrame(render);
    }
  };

  hero?.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  hero?.addEventListener("pointerleave", () => { pointer.active = false; });
  window.addEventListener("resize", resize, { passive: true });

  const syncAnimation = () => {
    window.cancelAnimationFrame(animationFrame);
    if (!reducedMotion && canvasVisible && !document.hidden) {
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(render);
    }
  };

  const canvasObserver = new IntersectionObserver(([entry]) => {
    const nextVisible = Boolean(entry?.isIntersecting);
    if (nextVisible === canvasVisible) return;
    canvasVisible = nextVisible;
    syncAnimation();
  }, { rootMargin: "120px" });
  canvasObserver.observe(canvas);

  document.addEventListener("visibilitychange", syncAnimation);

  resize();
  render(performance.now());
})();


(() => {
  const body = document.body;
  if (!body.classList.contains("landing-body")) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const header = document.querySelector(".landing-header");

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 40);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const countElements = Array.from(document.querySelectorAll("[data-count]"));
  const animateCount = (element) => {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";
    const target = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals || 0);
    const suffix = element.dataset.suffix || "";
    if (!Number.isFinite(target) || reducedMotion) {
      element.textContent = target.toFixed(decimals) + suffix;
      return;
    }

    const duration = 1050;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = (target * eased).toFixed(decimals) + suffix;
      if (progress < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };

  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const opening = document.querySelector("[data-opening]:not(.is-done)");
      window.setTimeout(() => animateCount(entry.target), opening ? 1450 : 0);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.55 });
  countElements.forEach((element) => countObserver.observe(element));

  if (!finePointer || reducedMotion) return;

  const cursor = document.createElement("div");
  cursor.className = "cursor-orb";
  cursor.setAttribute("aria-hidden", "true");
  body.append(cursor);

  let cursorFrame = 0;
  let cursorX = -500;
  let cursorY = -500;
  window.addEventListener("pointermove", (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    cursor.classList.add("is-active");
    if (cursorFrame) return;
    cursorFrame = window.requestAnimationFrame(() => {
      cursor.style.setProperty("--cursor-x", cursorX + "px");
      cursor.style.setProperty("--cursor-y", cursorY + "px");
      cursorFrame = 0;
    });
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));

  document.querySelectorAll(".research-card, .proof-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--tilt-x", (0.5 - py) * 4 + "deg");
      card.style.setProperty("--tilt-y", (px - 0.5) * 4 + "deg");
      card.style.setProperty("--spot-x", px * 100 + "%");
      card.style.setProperty("--spot-y", py * 100 + "%");
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
})();


(() => {
  const atlasCanvases = document.querySelectorAll("[data-atlas-preview] canvas");
  if (!atlasCanvases.length) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palettes = [
    [149, 229, 193],
    [255, 107, 87],
    [241, 239, 231],
    [129, 156, 255],
    [246, 198, 96],
  ];
  const clusters = [
    [0.24, 0.28, 0.11, 0.1, 85, 0],
    [0.69, 0.37, 0.14, 0.12, 74, 1],
    [0.57, 0.71, 0.12, 0.09, 66, 2],
    [0.34, 0.61, 0.1, 0.13, 58, 3],
    [0.82, 0.72, 0.07, 0.08, 42, 4],
  ];

  let seed = 114514;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const gaussian = () => {
    const first = Math.max(random(), 0.0001);
    return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * random());
  };

  const points = clusters.flatMap(([cx, cy, sx, sy, count, color]) =>
    Array.from({ length: count }, () => ({
      x: cx + gaussian() * sx,
      y: cy + gaussian() * sy,
      radius: 0.8 + random() * 1.9,
      alpha: 0.28 + random() * 0.58,
      color,
      phase: random() * Math.PI * 2,
    }))
  );

  atlasCanvases.forEach((canvas) => {
    const context = canvas.getContext("2d");
    const container = canvas.parentElement;
    let width = 0;
    let height = 0;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let visible = true;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      draw(performance.now());
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      points.forEach((point) => {
        const color = palettes[point.color];
        const drift = reducedMotion ? 0 : Math.sin(time * 0.00045 + point.phase) * 2.2;
        const x = point.x * width + drift + pointerX * (point.color + 1) * 0.16;
        const y = point.y * height + Math.cos(time * 0.0004 + point.phase) * 1.6 + pointerY * (point.color + 1) * 0.12;
        context.beginPath();
        context.arc(x, y, point.radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(" + color.join(",") + "," + point.alpha + ")";
        context.fill();
      });
      if (!reducedMotion && visible && !document.hidden) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    container.addEventListener("pointermove", (event) => {
      const rect = container.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    }, { passive: true });
    container.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
    });

    const observer = new IntersectionObserver(([entry]) => {
      const nextVisible = Boolean(entry?.isIntersecting);
      if (nextVisible === visible) return;
      visible = nextVisible;
      window.cancelAnimationFrame(frame);
      if (visible && !reducedMotion && !document.hidden) {
        frame = window.requestAnimationFrame(draw);
      }
    }, { rootMargin: "100px" });
    observer.observe(container);

    new ResizeObserver(resize).observe(container);
    resize();
  });
})();
