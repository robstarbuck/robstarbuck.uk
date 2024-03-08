const body = document.body;

if (body && document.documentElement.classList.contains("breakout")) {
  if (document.referrer && window.location.href.includes(document.referrer)) {
    const button = document.createElement("button");
    button.textContent = "↙ Back";
    button.classList.add("breakout-back");
    button.addEventListener("click", () => history.back());
    body.prepend(button);
  }
}
