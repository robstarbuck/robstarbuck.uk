export const layout = "index.vto"

export default function (page: Lume.Data) {

  const posts = page.search.pages("post");

  return `
    <h1>404</h1>
    <p>Page Not Found</p>
    <ul>
      ${posts.map((post) => {
        return `<li><a href="${post.url}">${post.title}</a></li>`
      }).join("")
    }
    </ul>
  `;
}