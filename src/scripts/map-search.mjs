import Autocomplete from "@vendor/autocomplete.esm.js";

const markupSearchResult = (siteName, query) => {
  return siteName
    ? siteName.replace(new RegExp(query, "i"), (str) => `<mark>${str}</mark>`)
    : null;
};

const formatSearchResult = (site, query) => {
  return `<li>${[
    `<span class="pill pill-${site.datasetIdx}">${site.datasetName}</span>`,
    markupSearchResult(site.siteNameZh, query),
    markupSearchResult(site.siteNameEn, query),
    markupSearchResult(site.siteNameAlt1, query),
  ]
    .filter(Boolean)
    .join("<br>")}</li>`;
};

export const initSearch = (sites, map, popupClick) => {
  const searchInput = new Autocomplete("search", {
    cache: false,
    selectFirst: true,

    onSearch: ({ currentValue }) => {
      return Object.values(sites).filter(
        (site) =>
          site.siteNameEn?.match(new RegExp(currentValue, "i")) ||
          site.siteNameZh?.match(new RegExp(currentValue, "i")) ||
          site.siteNameAlt1?.match(new RegExp(currentValue, "i")),
      );
    },

    onResults: ({ currentValue, matches, template }) => {
      return matches === 0
        ? template
        : matches
            .map((site) => formatSearchResult(site, currentValue))
            .join("");
    },

    onSubmit: ({ element, object }) => {
      searchInput.destroy();
      element.blur();
      map.once("zoomend", () =>
        setTimeout(() => {
          object.marker.openPopup();
          popupClick(object.marker, [object]);
        }, 1),
      );
      map.flyTo(Object.values(object.marker._latlng), 12);
    },

    onOpened: ({ results }) => {
      document.querySelector(".auto-search-wrapper").style.zIndex = "1003";
      const resultsTop = results.parentElement.getBoundingClientRect().top;
      const footerHeight = document.body.querySelector("footer").offsetHeight;
      results.parentElement.style.maxHeight = `calc(100dvh - ${resultsTop}px - ${footerHeight}px - 10px)`;
    },

    onClose: () => {
      document.querySelector(".auto-search-wrapper").style.zIndex = "999";
    },

    noResults: ({ currentValue, template }) =>
      template(`<li>No results found: “${currentValue}”</li>`),
  });

  document.querySelector(".auto-search-wrapper").style.display = "block";
};
