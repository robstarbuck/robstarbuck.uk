import { Page } from "lume/core/file.ts";
import lume from "lume/mod.ts";
import dateplugin from "lume/plugins/date.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import esbuild from "lume/plugins/esbuild.ts";

const site = lume({
  src: "./src",
});

// -----------------------------------------------------------------------------
// Plugins
// -----------------------------------------------------------------------------

site.use(
  esbuild({
    extensions: [".ts", ".js"],
    options: {
      bundle: true,
      format: "esm",
      minify: true,
      keepNames: true,
      platform: "browser",
      target: "esnext",
      treeShaking: true,
    },
  })
);

site.use(dateplugin());
site.use(codeHighlight());

// -----------------------------------------------------------------------------
// Site Data & Assets
// -----------------------------------------------------------------------------

const [date, time] = new Date().toISOString().split(/T|\./);

site.data("layout", "layouts/index.vto");

site.data("buildDate", date);
site.data("buildTime", time);
site.data("github", "https://github.com/robstarbuck");
site.data("logoFill", "#2b2031");

site.copy([".pdf", ".png", ".svg"]);
site.copy("code", ".");
site.copy("styles", ".");
site.copy("images", ".");

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const isCustomTag = (el?: Element | null): el is Element => {
  return el?.tagName.includes("-") ?? false;
};

const wrapElement = (el: Element, wrapper: HTMLElement) => {
  if (el.parentNode) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }
};

// Type predicates (instanceof is unavailable in this context)
const isIframe = (e: Element): e is HTMLIFrameElement => {
  return e.tagName === "IFRAME";
};

const isSVG = (e: Element): e is SVGElement => {
  return e.tagName === "SVG";
};

const isAnchor = (e: Element): e is HTMLAnchorElement => {
  return e.tagName === "A";
};

const isImage = (e: Element): e is HTMLImageElement => {
  return e.tagName === "IMG";
};

const isLinkExternal = (link: string) => {
  return /^http/.test(link);
};

// -----------------------------------------------------------------------------
// Pre-process (Frontmatter & Data)
// -----------------------------------------------------------------------------

site.preprocess([".html"], (pages) => {
  pages.forEach((page) => {
    // Configure Posts
    if (/posts/.test(page.src.path)) {
      page.data.tags = ["post"];
      page.data.layout ??= "layouts/index.vto";
    }

    // Configure Invoices
    if (page.data.url.startsWith("/invoice")) {
      page.data.layout = "layouts/invoice.vto";
    }

    page.data.modules ??= [];

    // Configure CV
    if (page.data.title?.toLowerCase() === "cv") {
      const [cvDate] = page.data.date.toISOString().split("T");
      const pdfName = cvDate.concat(".pdf");
      const pdfMatch = site.files.find((f) => f.entry.name === pdfName);
      page.data.pdfLink = pdfMatch?.entry.path;

      const { github, repoUrl } = page.data;
      page.data.markdownLink =
        github && repoUrl ? github.concat(repoUrl) : undefined;

      page.data.layout = "layouts/cv.vto";
      page.data.url = "/cv/";
      page.data.tags = ["document", "cv"];
    }
  });
});

// -----------------------------------------------------------------------------
// Process (DOM Transformations)
// -----------------------------------------------------------------------------

site.process([".html"], (pages, allPages) => {
  // Add IDs to CV headers for linking
  const cv = pages.find((p) => p.data.title === "CV");
  cv?.document?.querySelectorAll("h1").forEach((h1) => {
    h1.setAttribute("data-id", h1.innerText.replace(/ +/g, "-"));
  });

  pages.forEach((page) => {
    const document = page.document;
    if (document === undefined) {
      return;
    }

    // 1. Wrap specific elements for styling/layout
    document
      .querySelectorAll("main :where(iframe, a, img, svg)")
      .forEach((element) => {
        if (isCustomTag(element.parentElement)) {
          const div = document.createElement("div");
          div.classList.add("custom");
          wrapElement(element.parentElement, div);
          return;
        }
        if (isIframe(element)) {
          const div = document.createElement("div");
          div.classList.add("iframe");
          wrapElement(element, div);
          return;
        }
        if (isSVG(element)) {
          const div = document.createElement("div");
          div.classList.add("svg");
          wrapElement(element, div);
          return;
        }
        if (isAnchor(element)) {
          const href = element.getAttribute("href");
          if (href && isLinkExternal(href)) {
            element.setAttribute("target", "_blank");
            return;
          }
          return;
        }
        if (isImage(element)) {
          const div = document.createElement("div");
          div.classList.add("image");
          wrapElement(element, div);
          return;
        }
      });

    // 2. Generate "Breakout" demo pages
    // Finds elements with `data-breakout-url`, creates a standalone page for them,
    // and adds a link to that page in the original document.
    document.querySelectorAll("main [data-breakout-url]").forEach((element) => {
      // Clone the document to create the standalone demo page
      const doc = page.document?.cloneNode(true) as Document;

      const urlSuffix = element.getAttribute("data-breakout-url");
      const breakoutClass = element.getAttribute("data-breakout-class");
      const breakoutButtonColor = element.getAttribute(
        "data-breakout-button-color"
      );

      const breakoutUrl = page.data.url + urlSuffix + ".html";

      // Add "Open" link to the ORIGINAL page
      const a = document.createElement("a");
      a.setAttribute("href", breakoutUrl);
      a.textContent = "Open ↗";
      a.classList.add("breakout-link");
      element.parentElement?.appendChild(a);

      // Apply style to the parent in the ORIGINAL page
      element.parentElement?.setAttribute(
        "style",
        `--breakout-link-color: ${breakoutButtonColor}`
      );

      // Setup the NEW demo page content
      const body = doc?.querySelector("body");
      if (body) {
        doc.documentElement.classList.add("breakout", breakoutClass ?? "");
        body.innerHTML = element.outerHTML;
        if (breakoutButtonColor) {
          body.setAttribute(
            "style",
            `--breakout-link-color: ${breakoutButtonColor}`
          );
        }
      }

      const demoPage = Page.create({
        title: page.data.title ?? "FB",
        url: breakoutUrl,
        content: doc?.documentElement.outerHTML,
        layout: "layouts/index.vto",
      });

      allPages.push(demoPage);
    });
  });

  // 3. Generate README
  const readMe = Page.create({
    title: "READ ME",
    url: "README.md",
    content: `# Site Build
      - Page Count: ${allPages.length}
      - Build Date: ${date} ${time}
    `,
  });

  allPages.push(readMe);
});

export default site;
