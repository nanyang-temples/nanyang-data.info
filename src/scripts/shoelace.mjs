import "@shoelace-style/shoelace/dist/components/details/details.js";

document.querySelectorAll("sl-details").forEach((details) => {
  details.addEventListener("sl-after-show", () =>
    details.scrollIntoView({ behavior: "smooth", block: "nearest" }),
  );
});
