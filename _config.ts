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

site.copy([".pdf", ".png"]);

site.copy("code", ".");
site.copy("styles", ".");
site.copy("images", ".");

site.use(codeHighlight());

// Site Process

const wrapElement = (el: HTMLElement, wrapper: HTMLElement) => {
  if (el.parentNode) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }
};

// test for tagName, instanceof is unavailable in this context
const isIframe = (e: Element): e is HTMLIFrameElement => {
  return e.tagName === "IFRAME";
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
      page.data.layout = "post.vto";
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

site.process([".html"], (pages) => {
  const cv = pages.find((p) => p.data.title === "CV");

  cv?.document?.querySelectorAll("h1").forEach((h1) => {
    h1.setAttribute("data-id", h1.innerText.replace(/ +/g, "-"));
  });

  pages.forEach((page) => {
    const document = page.document;
    if (document === undefined) {
      return;
    }
    document.querySelectorAll("iframe, a, img").forEach((element) => {
      if (isIframe(element)) {
        const div = document.createElement("div");
        div.classList.add("iframe");
        wrapElement(element, div);
      }
      if (isAnchor(element)) {
        const href = element.getAttribute("href");
        if (href && isLinkExternal(href)) {
          element.setAttribute("target", "_blank");
        }
      }
      if (isImage(element)) {
        const div = document.createElement("div");
        div.classList.add("image");
        wrapElement(element, div);
      }
    });
  });
});

export default site;
