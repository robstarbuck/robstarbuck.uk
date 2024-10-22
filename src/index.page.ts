export const title = "Web Design";

export const data = {
  hideTitle: true,
};

export default function (page: Lume.Data) {
  const homeImprovement = page.search.page("title='Home Improvements'");

  const other = page.search.pages("post");

  const cv = page.search.page("cv");

  const dateParts = cv?.date.toDateString().split(" ");
  const month = dateParts?.at(1);
  const year = dateParts?.at(3);

  return `
    <ul>
      ${other.reverse()
        .map((post) => {
          return `<li><a href="${post.url}">${post.title}</a></li>`;
        })
        .join("")}
    </ul>
    <ul>
  `.concat(
    cv
      ? `<hr />
          <li><a href="${cv?.url}">CV ${month} ${year}</a></li>`
      : ``
  ).concat(
    homeImprovement ? `<li><a href="${homeImprovement?.url}">${homeImprovement.title}</a></li>` : ``
  ).concat(`</ul>`);
}
