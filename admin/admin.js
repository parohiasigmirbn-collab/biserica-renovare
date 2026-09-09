import { getUser, login, logout } from "@netlify/identity";

const authView = document.querySelector("#auth-view");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const pageList = document.querySelector("#page-list");
const pageForm = document.querySelector("#page-form");
const blocksRoot = document.querySelector("#blocks");
const editorHeading = document.querySelector("#editor-heading");
const saveState = document.querySelector("#save-state");
const deleteButton = document.querySelector("#delete-page");
const mediaGrid = document.querySelector("#media-grid");
const mediaMessage = document.querySelector("#media-message");

const blockTypes = {
  hero: "Copertă",
  text: "Text",
  image: "Text + imagine",
  quote: "Mesaj evidențiat",
  contact: "Contact",
};

let pages = [];
let media = [];
let activePage = null;
let isNewPage = false;

function setMessage(element, message, type = "error") {
  element.textContent = message;
  element.dataset.type = message ? type : "";
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Cererea nu a putut fi finalizată.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function slugify(value) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function createEmptyBlock(type = "text") {
  return { id: crypto.randomUUID(), type, title: "", subtitle: "", body: "", imageId: null, imageAlt: "", buttonLabel: "", buttonUrl: "", tone: type === "hero" || type === "quote" ? "dark" : "light" };
}

function createEmptyPage() {
  return {
    title: "Pagină nouă",
    navigationLabel: "Pagină nouă",
    slug: "pagina-noua",
    metaDescription: "",
    sortOrder: pages.length,
    published: false,
    showInNavigation: true,
    content: [createEmptyBlock("hero"), createEmptyBlock("text")],
  };
}

function field(labelText, name, value = "", options = {}) {
  const label = document.createElement("label");
  label.textContent = labelText;
  const control = options.textarea ? document.createElement("textarea") : document.createElement("input");
  control.name = name;
  control.value = value ?? "";
  if (options.textarea) control.rows = options.rows || 4;
  if (options.placeholder) control.placeholder = options.placeholder;
  label.append(control);
  return label;
}

function selectField(labelText, name, value, choices) {
  const label = document.createElement("label");
  label.textContent = labelText;
  const select = document.createElement("select");
  select.name = name;
  Object.entries(choices).forEach(([choiceValue, text]) => {
    const option = document.createElement("option");
    option.value = choiceValue;
    option.textContent = text;
    option.selected = choiceValue === String(value ?? "");
    select.append(option);
  });
  label.append(select);
  return label;
}

function mediaSelect(block) {
  const label = document.createElement("label");
  label.textContent = "Imagine din bibliotecă";
  const select = document.createElement("select");
  select.name = "imageId";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Fără imagine / imagine implicită";
  select.append(empty);
  media.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.filename}${item.altText ? ` — ${item.altText}` : ""}`;
    option.selected = Number(block.imageId) === item.id;
    select.append(option);
  });
  label.append(select);
  return label;
}

function renderBlocks() {
  blocksRoot.replaceChildren();
  if (!activePage.content.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<strong>Pagina nu are conținut.</strong><span>Adaugă primul bloc pentru a începe.</span>";
    blocksRoot.append(empty);
    return;
  }

  activePage.content.forEach((block, index) => {
    const card = document.createElement("article");
    card.className = "block-card";
    card.dataset.index = index;
    const header = document.createElement("header");
    const identity = document.createElement("div");
    identity.innerHTML = `<span class="block-number">${String(index + 1).padStart(2, "0")}</span><strong>${blockTypes[block.type] || "Bloc"}</strong>`;
    const actions = document.createElement("div");
    actions.className = "block-actions";
    [["↑", "up", "Mută mai sus"], ["↓", "down", "Mută mai jos"], ["×", "remove", "Șterge blocul"]].forEach(([text, action, title]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.dataset.action = action;
      button.title = title;
      actions.append(button);
    });
    header.append(identity, actions);

    const fields = document.createElement("div");
    fields.className = "block-fields";
    fields.append(
      selectField("Tip bloc", "type", block.type, blockTypes),
      selectField("Fundal", "tone", block.tone, { light: "Deschis", sand: "Bej", dark: "Verde închis" }),
      field("Titlu", "title", block.title),
      field("Supratitlu", "subtitle", block.subtitle, { placeholder: "Textul mic de deasupra titlului" }),
      field("Text", "body", block.body, { textarea: true, rows: block.type === "contact" ? 7 : 5 })
    );
    if (["hero", "image"].includes(block.type)) {
      fields.append(mediaSelect(block), field("Descriere imagine", "imageAlt", block.imageAlt));
    }
    fields.append(field("Text buton", "buttonLabel", block.buttonLabel), field("Link buton", "buttonUrl", block.buttonUrl, { placeholder: "Ex: /p/donatii sau #contact" }));
    card.append(header, fields);
    blocksRoot.append(card);
  });
}

function readBlocksFromForm() {
  return [...blocksRoot.querySelectorAll(".block-card")].map((card, index) => {
    const previous = activePage.content[index];
    const value = (name) => card.querySelector(`[name="${name}"]`)?.value.trim() || "";
    return {
      id: previous.id || crypto.randomUUID(),
      type: value("type") || "text",
      tone: value("tone") || "light",
      title: value("title"),
      subtitle: value("subtitle"),
      body: value("body"),
      imageId: value("imageId") ? Number(value("imageId")) : null,
      imageAlt: value("imageAlt"),
      buttonLabel: value("buttonLabel"),
      buttonUrl: value("buttonUrl"),
      imageUrl: previous.imageUrl || "",
    };
  });
}

function fillPageForm() {
  pageForm.elements.title.value = activePage.title;
  pageForm.elements.navigationLabel.value = activePage.navigationLabel;
  pageForm.elements.slug.value = activePage.slug;
  pageForm.elements.metaDescription.value = activePage.metaDescription || "";
  pageForm.elements.sortOrder.value = activePage.sortOrder ?? 0;
  pageForm.elements.published.checked = activePage.published;
  pageForm.elements.showInNavigation.checked = activePage.showInNavigation;
  editorHeading.textContent = activePage.title;
  deleteButton.hidden = isNewPage || activePage.slug === "acasa";
  renderBlocks();
}

function readPageForm() {
  return {
    ...activePage,
    title: pageForm.elements.title.value.trim(),
    navigationLabel: pageForm.elements.navigationLabel.value.trim(),
    slug: slugify(pageForm.elements.slug.value),
    metaDescription: pageForm.elements.metaDescription.value.trim(),
    sortOrder: Number(pageForm.elements.sortOrder.value || 0),
    published: pageForm.elements.published.checked,
    showInNavigation: pageForm.elements.showInNavigation.checked,
    content: readBlocksFromForm(),
  };
}

function renderPageList() {
  pageList.replaceChildren(...pages.map((page) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = activePage?.id === page.id ? "is-active" : "";
    const label = document.createElement("span");
    label.textContent = page.navigationLabel;
    const status = document.createElement("small");
    status.textContent = page.published ? "Publicată" : "Ciornă";
    button.append(label, status);
    button.addEventListener("click", () => {
      activePage = structuredClone(page);
      isNewPage = false;
      renderPageList();
      fillPageForm();
    });
    return button;
  }));
}

function renderMedia() {
  mediaGrid.replaceChildren();
  if (!media.length) {
    const empty = document.createElement("p");
    empty.className = "media-empty";
    empty.textContent = "Biblioteca este goală.";
    mediaGrid.append(empty);
    return;
  }
  [...media].reverse().forEach((item) => {
    const card = document.createElement("figure");
    const image = document.createElement("img");
    image.src = `/api/media?id=${item.id}`;
    image.alt = item.altText || "";
    image.loading = "lazy";
    const caption = document.createElement("figcaption");
    const name = document.createElement("span");
    name.textContent = item.altText || item.filename;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Șterge";
    remove.addEventListener("click", async () => {
      if (!window.confirm("Ștergi definitiv această imagine? Blocurile care o folosesc vor rămâne fără imagine.")) return;
      try {
        await api(`/api/media?id=${item.id}`, { method: "DELETE" });
        media = media.filter((entry) => entry.id !== item.id);
        renderMedia();
        renderBlocks();
      } catch (error) {
        setMessage(mediaMessage, error.message);
      }
    });
    caption.append(name, remove);
    card.append(image, caption);
    mediaGrid.append(card);
  });
}

async function loadDashboard() {
  const [pageData, mediaData] = await Promise.all([api("/api/cms?admin=1"), api("/api/media")]);
  pages = pageData.pages;
  media = mediaData;
  activePage = structuredClone(pages[0]);
  isNewPage = false;
  authView.hidden = true;
  dashboard.hidden = false;
  renderPageList();
  renderMedia();
  fillPageForm();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "Se verifică datele…", "info");
  const submit = loginForm.querySelector("button[type='submit']");
  submit.disabled = true;
  try {
    await login(loginForm.elements.email.value, loginForm.elements.password.value);
    await loadDashboard();
  } catch (error) {
    if (error.status === 403) await logout().catch(() => {});
    setMessage(loginMessage, error.status === 403 ? "Contul este valid, dar nu are rolul admin." : error.message);
  } finally {
    submit.disabled = false;
  }
});

document.querySelector("#logout").addEventListener("click", async () => {
  await logout();
  window.location.reload();
});

document.querySelector("#new-page").addEventListener("click", () => {
  activePage = createEmptyPage();
  isNewPage = true;
  renderPageList();
  fillPageForm();
});

pageForm.elements.title.addEventListener("input", () => {
  editorHeading.textContent = pageForm.elements.title.value || "Pagină fără titlu";
  if (isNewPage) {
    pageForm.elements.navigationLabel.value = pageForm.elements.title.value;
    pageForm.elements.slug.value = slugify(pageForm.elements.title.value);
  }
});

document.querySelector("#add-block").addEventListener("click", () => {
  activePage.content = readBlocksFromForm();
  activePage.content.push(createEmptyBlock());
  renderBlocks();
  blocksRoot.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
});

blocksRoot.addEventListener("change", (event) => {
  if (event.target.name !== "type") return;
  activePage.content = readBlocksFromForm();
  renderBlocks();
});

blocksRoot.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest(".block-card");
  const index = Number(card.dataset.index);
  activePage.content = readBlocksFromForm();
  if (button.dataset.action === "remove") activePage.content.splice(index, 1);
  if (button.dataset.action === "up" && index > 0) [activePage.content[index - 1], activePage.content[index]] = [activePage.content[index], activePage.content[index - 1]];
  if (button.dataset.action === "down" && index < activePage.content.length - 1) [activePage.content[index + 1], activePage.content[index]] = [activePage.content[index], activePage.content[index + 1]];
  renderBlocks();
});

document.querySelector("#save-page").addEventListener("click", async () => {
  if (!pageForm.reportValidity()) return;
  saveState.textContent = "Se salvează…";
  try {
    const payload = readPageForm();
    const saved = await api("/api/cms", { method: isNewPage ? "POST" : "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const index = pages.findIndex((page) => page.id === saved.id);
    if (index >= 0) pages[index] = saved; else pages.push(saved);
    pages.sort((first, second) => first.sortOrder - second.sortOrder || first.id - second.id);
    activePage = structuredClone(saved);
    isNewPage = false;
    renderPageList();
    fillPageForm();
    saveState.textContent = "Salvat";
    setTimeout(() => { saveState.textContent = ""; }, 2400);
  } catch (error) {
    saveState.textContent = error.message;
  }
});

deleteButton.addEventListener("click", async () => {
  if (!activePage.id || !window.confirm(`Ștergi definitiv pagina „${activePage.title}”?`)) return;
  try {
    await api(`/api/cms?id=${activePage.id}`, { method: "DELETE" });
    pages = pages.filter((page) => page.id !== activePage.id);
    activePage = structuredClone(pages[0]);
    renderPageList();
    fillPageForm();
  } catch (error) {
    saveState.textContent = error.message;
  }
});

document.querySelector("#upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button");
  button.disabled = true;
  setMessage(mediaMessage, "Imaginea se încarcă…", "info");
  try {
    const created = await api("/api/media", { method: "POST", body: new FormData(form) });
    media.push(created);
    form.reset();
    setMessage(mediaMessage, "Imagine adăugată.", "success");
    renderMedia();
    renderBlocks();
  } catch (error) {
    setMessage(mediaMessage, error.message);
  } finally {
    button.disabled = false;
  }
});

(async () => {
  const user = await getUser();
  if (!user) return;
  try {
    await loadDashboard();
  } catch (error) {
    if (error.status === 403) {
      await logout().catch(() => {});
      setMessage(loginMessage, "Contul conectat nu are rolul admin.");
    } else {
      setMessage(loginMessage, error.message);
    }
  }
})();
