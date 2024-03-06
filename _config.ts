import { Page } from "lume/core/file.ts";
import lume from "lume/mod.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";

const site = lume({
  src: "./src",
});

const [date, time] = new Date().toISOString().split(/T|\./);

site.data("buildDate", date);
site.data("buildTime", time);

site.data("github", "https://github.com/robstarbuck");
site.data("logoFill", "#2b2031");

site.copy([".pdf", ".png", ".svg"]);

site.copy("code", ".");
site.copy("styles", ".");
site.copy("images", ".");

site.use(codeHighlight());

// Site Process

const isCustomTag = (el?: Element | null): el is Element => {
  return el?.tagName.includes("-") ?? false;
};

const wrapElement = (el: Element, wrapper: HTMLElement) => {
  if (el.parentNode) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }
};

// test for tagName, instanceof is unavailable in this context
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

site.preprocess([".html"], (pages) => {
  pages.forEach((page) => {
    if (/posts/.test(page.src.path)) {
      page.data.tags = ["post"];
      if (page.data.layout === undefined) {
        page.data.layout = "index.vto";
      }
    }
    if (page.data.title?.toLocaleLowerCase() === "cv") {
      const [cvDate] = page.data.date.toISOString().split("T");
      const pdfName = cvDate.concat(".pdf");
      const pdfMatch = site.files.find((f) => f.entry.name === pdfName);
      page.data.pdfLink = pdfMatch?.entry.path;

      const { github, repoUrl } = page.data;
      page.data.markdownLink =
        github && repoUrl ? github.concat(repoUrl) : undefined;

      page.data.layout = "cv.vto";
      page.data.url = "./cv/";
      page.data.tags = ["document", "cv"];
    }
  });
  // page.data.filename = page.src.path + page.src.ext;
});

site.process([".html"], (pages, allPages) => {
  const cv = pages.find((p) => p.data.title === "CV");

  cv?.document?.querySelectorAll("h1").forEach((h1) => {
    h1.setAttribute("data-id", h1.innerText.replace(/ +/g, "-"));
  });

  pages.forEach((page) => {
    const document = page.document;
    if (document === undefined) {
      return;
    }

    // Create demo pages wherever a .create-page element exists
    document
      .querySelectorAll("main :where(.create-page)")
      .forEach((element) => {
        // Avoid mutating the original page
        const doc = page.document?.cloneNode(true) as Document;
        const main = doc?.querySelector("main");
        const nav = doc?.querySelector("nav");
        const footer = doc?.querySelector("footer");
        if(nav){
          nav.parentElement?.removeChild(nav)
        }
        if (footer) {
          footer.parentElement?.removeChild(footer);
        }
        if (main) {
          main.outerHTML = element.outerHTML;
        }

        const demoPage = Page.create({
          title: page.data.title,
          url: page.data.url + "demo",
          content: doc?.documentElement.outerHTML,
          layout: "index.vto",
        });
        allPages.push(demoPage);
      });

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
  });

  const readMe = Page.create({
    url: "README.md",
    content: `# Site Build
      - Page Count: ${allPages.length}
      - Build Date: ${date} ${time}
    `,
  });

  allPages.push(readMe);
});

export default site;
