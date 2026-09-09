const pageRoot = document.querySelector("#page");
const navigationRoot = document.querySelector("#navigation");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

const escapeText = (value = "") => String(value);

function currentSlug() {
  const match = window.location.pathname.match(/^\/p\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : "acasa";
}

function imageSource(block) {
  if (block.imageId) return `/api/media?id=${encodeURIComponent(block.imageId)}`;
  return block.imageUrl || "";
}

function paragraphLines(value = "") {
  return value.split("\n").filter(Boolean).map((line) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    return paragraph;
  });
}

function addButton(container, block) {
  if (!block.buttonLabel || !block.buttonUrl) return;
  const link = document.createElement("a");
  link.className = "content-button";
  link.href = block.buttonUrl;
  link.textContent = block.buttonLabel;
  container.append(link);
}

function renderBlock(block, index) {
  const section = document.createElement("section");
  section.id = block.id || `sectiune-${index + 1}`;
  section.className = `content-block content-block--${block.type} content-block--${block.tone || "light"}`;
  section.style.setProperty("--block-delay", `${Math.min(index * 80, 480)}ms`);

  const inner = document.createElement("div");
  inner.className = "content-inner";
  const copy = document.createElement("div");
  copy.className = "content-copy";

  if (block.subtitle) {
    const subtitle = document.createElement("p");
    subtitle.className = "content-kicker";
    subtitle.textContent = escapeText(block.subtitle);
    copy.append(subtitle);
  }
  if (block.title) {
    const heading = document.createElement(index === 0 ? "h1" : "h2");
    heading.textContent = escapeText(block.title);
    copy.append(heading);
  }
  paragraphLines(block.body).forEach((paragraph) => copy.append(paragraph));
  addButton(copy, block);

  const source = imageSource(block);
  if (source) {
    const figure = document.createElement("figure");
    figure.className = "content-visual";
    const image = document.createElement("img");
    image.src = source;
    image.alt = block.imageAlt || "";
    image.loading = index === 0 ? "eager" : "lazy";
    figure.append(image);
    inner.append(copy, figure);
  } else {
    inner.append(copy);
  }
  section.append(inner);
  return section;
}

async function loadNavigation() {
  const response = await fetch("/api/cms?navigation=1");
  if (!response.ok) throw new Error("Meniul nu este disponibil.");
  const items = await response.json();
  navigationRoot.replaceChildren(...items.map((item) => {
    const link = document.createElement("a");
    link.href = item.slug === "acasa" ? "/" : `/p/${encodeURIComponent(item.slug)}`;
    link.textContent = item.label;
    if (item.slug === currentSlug()) link.setAttribute("aria-current", "page");
    return link;
  }));
}

async function loadPage() {
  try {
    const response = await fetch(`/api/cms?slug=${encodeURIComponent(currentSlug())}`);
    if (!response.ok) throw new Error(response.status === 404 ? "Pagina nu a fost găsită." : "Conținutul nu poate fi încărcat.");
    const page = await response.json();
    document.title = `${page.title} — Sfântul Nicolae Sigmir`;
    document.querySelector('meta[name="description"]').content = page.metaDescription || page.title;
    pageRoot.replaceChildren(...page.content.map(renderBlock));
  } catch (error) {
    const section = document.createElement("section");
    section.className = "page-error";
    const title = document.createElement("h1");
    title.textContent = error.message;
    const text = document.createElement("p");
    text.textContent = "Te rugăm să reîncerci sau să revii la pagina principală.";
    const link = document.createElement("a");
    link.className = "content-button";
    link.href = "/";
    link.textContent = "Pagina principală";
    section.append(title, text, link);
    pageRoot.replaceChildren(section);
  }
}

menuToggle.addEventListener("click", () => {
  const open = siteNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

Promise.allSettled([loadNavigation(), loadPage()]);
