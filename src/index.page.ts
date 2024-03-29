export const layout = "index.vto";

export const title = "Posts";

export const data = {
  hideTitle: true,
};

export default function (page: Lume.Data) {
  const posts = page.search.pages("post");

  const cv = page.search.page("cv");

  const dateParts = cv?.date.toDateString().split(" ");
  const month = dateParts?.at(1);
  const year = dateParts?.at(3);

  return `
    <ul>
      ${posts.reverse()
        .map((post) => {
          return `<li><a href="${post.url}">${post.title}</a></li>`;
        })
        .join("")}
    </ul>
  `.concat(
    cv
      ? `<hr />
          <a href="${cv?.url}">CV ${month} ${year}</a>`
      : ``
  );
}
