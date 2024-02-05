export const layout = "index.vto";

export const title = "404";

export default function (page: Lume.Data) {
  const posts = page.search.pages("post");

  return `
    <p>Page Not Found</p>
    <hr />
    <ul>
      ${posts
        .map((post) => {
          return `<li><a href="${post.url}">${post.title}</a></li>`;
        })
        .join("")}
    </ul>
  `;
}
