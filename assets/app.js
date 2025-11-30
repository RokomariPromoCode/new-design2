(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function create(tag, className) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function cleanDesc(str) {
    if (!str) return "";
    var t = String(str)
      .replace(/<\s*br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return t;
  }

  var CATEGORIES = [
    { key: "best_seller",  label: "Best Seller",     data: "data/best_seller.json",  url: "rokomari-best-seller.html" },
    { key: "books",        label: "Books",           data: "data/books.json",        url: "rokomari-book.html" },
    { key: "electronics",  label: "Electronics",     data: "data/electronics.json",  url: "rokomari-electronics.html" },
    { key: "foods",        label: "Foods & Grocery", data: "data/foods.json",        url: "rokomari-foods.html" },
    { key: "kids-toys",    label: "Kids Toys",       data: "data/kids-toys.json",    url: "rokomari-kids-toys.html" },
    { key: "beauty",       label: "Beauty",          data: "data/beauty.json",       url: "rokomari-beauty.html" },
    { key: "others",       label: "Others",          data: "data/others.json",       url: "rokomari-others.html" }
  ];

  var dataCache = {};
  var allItemsCache = null;

  function loadCategoryData(key) {
    if (dataCache[key]) return dataCache[key];
    var cfg = CATEGORIES.find(function (c) { return c.key === key; });
    if (!cfg) return Promise.resolve([]);
    var url = cfg.data;

    dataCache[key] = fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load " + url);
        return res.json();
      })
      .then(function (arr) {
        if (!Array.isArray(arr)) return [];
        return arr.map(function (item) {
          return {
            title: item.title || "",
            author: item.author || "",
            seller: item.seller || "",
            img: item.img || "",
            desc: cleanDesc(item.desc || ""),
            link: item.link || "",
            categoryKey: key
          };
        });
      })
      .catch(function () { return []; });

    return dataCache[key];
  }

  function loadAllItems() {
    if (allItemsCache) return allItemsCache;
    allItemsCache = Promise.all(
      CATEGORIES.map(function (c) { return loadCategoryData(c.key); })
    ).then(function (groups) {
      return groups.reduce(function (acc, group) { return acc.concat(group); }, []);
    });
    return allItemsCache;
  }

  /* THEME HANDLING */
  function applyTheme(theme) {
    var body = document.body;
    var btn = qs("#theme-toggle");
    if (theme === "light") {
      body.classList.add("theme-light");
      if (btn) btn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      body.classList.remove("theme-light");
      if (btn) btn.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }

  function initTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem("rp_theme");
    } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored || (prefersDark ? "dark" : "dark");
    applyTheme(theme);

    var btn = qs("#theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = document.body.classList.contains("theme-light") ? "light" : "dark";
        var next = current === "light" ? "dark" : "light";
        applyTheme(next);
        try {
          localStorage.setItem("rp_theme", next);
        } catch (e) {}
      });
    }
  }

  /* NAVIGATION */
  function initNav() {
    var ul = qs(".menu-links");
    if (!ul) return;

    var links = [
      { href: "index.html",                label: "Home" },
      { href: "rokomari-best-seller.html", label: "Best Seller" },
      { href: "rokomari-book.html",        label: "Books" },
      { href: "rokomari-electronics.html", label: "Electronics" },
      { href: "rokomari-foods.html",       label: "Foods" },
      { href: "rokomari-kids-toys.html",   label: "Kids Toys" },
      { href: "rokomari-beauty.html",      label: "Beauty" },
      { href: "rokomari-others.html",      label: "Others" }
    ];

    var current = window.location.pathname.split("/").pop() || "index.html";

    ul.innerHTML = "";
    links.forEach(function (lnk) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = lnk.href;
      a.textContent = lnk.label;
      if (current === lnk.href) a.classList.add("active");
      li.appendChild(a);
      ul.appendChild(li);
    });

    var burger = qs(".hamburger");
    if (burger) {
      burger.addEventListener("click", function () {
        ul.classList.toggle("open");
      });
    }

    document.addEventListener("click", function (e) {
      if (!ul.classList.contains("open")) return;
      if (e.target.closest(".modern-header")) return;
      ul.classList.remove("open");
    });
  }

  /* CARD CREATION */
  function createCard(item, isSeeMore) {
    var card = create("article", "deal-card");
    if (isSeeMore) {
      card.classList.add("see-more-card");
      card.innerHTML =
        '<h3>See more deals</h3>' +
        '<p style="font-size:0.85rem;color:#94a3b8;margin-bottom:10px;">এই ক্যাটাগরির আরও প্রোমো কোড ও অফার দেখতে ক্লিক করুন।</p>' +
        '<button class="btn-primary">Browse all</button>';
      return card;
    }

    var img = create("img");
    img.src = item.img || "assets/placeholder.png";
    img.alt = item.title || "Product image";
    img.onerror = function () {
      this.onerror = null;
      this.src = "assets/placeholder.png";
    };
    card.appendChild(img);

    var body = create("div", "deal-body");
    var title = create("div", "deal-title");
    title.textContent = item.title || "Untitled product";
    body.appendChild(title);

    var metaStr = "";
    if (item.author) metaStr += "লেখক: " + item.author;
    if (item.seller) {
      if (metaStr) metaStr += " · ";
      metaStr += "বিক্রেতা: " + item.seller;
    }
    if (metaStr) {
      var meta = create("div", "deal-meta");
      meta.textContent = metaStr;
      body.appendChild(meta);
    }

    if (item.desc) {
      var desc = create("div", "deal-desc");
      desc.textContent = item.desc;
      body.appendChild(desc);
    }

    card.appendChild(body);

    var footer = create("div", "deal-footer");
    var hint = create("div", "deal-hint");
    hint.textContent = "ডিসকাউন্ট পেতে Rokomari পেইজ থেকে অর্ডার করুন।";
    footer.appendChild(hint);

    var btn = create("button", "btn-primary");
    btn.textContent = "Buy Now";
    btn.addEventListener("click", function () {
      if (!item.link) return;
      window.open(item.link, "_blank", "noopener");
    });
    footer.appendChild(btn);

    card.appendChild(footer);
    return card;
  }

  /* HOME: mobile vs desktop cards + arrows + animation */
  function initHome() {
    var anchor = qs("#home-cards-anchor");
    if (!anchor) return;

    var isMobile = window.matchMedia("(max-width: 767px)").matches;
    var maxHomeDesktop = 4;
    var maxHomeMobile  = 6;

    CATEGORIES.forEach(function (cat) {
      loadCategoryData(cat.key).then(function (items) {
        if (!items || !items.length) return;

        var section = create("section", "home-category-row");
        var ctr = create("div", "container");
        section.appendChild(ctr);

        var header = create("div", "home-category-header");
        var h2 = document.createElement("h2");
        h2.textContent = "Rokomari Promocode For " + cat.label;
        header.appendChild(h2);

        var moreLink = document.createElement("a");
        moreLink.href = cat.url;
        moreLink.textContent = "See all " + cat.label + " deals";
        header.appendChild(moreLink);
        ctr.appendChild(header);

        var wrap = create("div", "home-cards-wrapper");
        var track = create("div", "home-cards-track");

        var maxItems = isMobile ? maxHomeMobile : maxHomeDesktop;
        items.slice(0, maxItems).forEach(function (item) {
          track.appendChild(createCard(item, false));
        });

        var seeMore = createCard({}, true);
        seeMore.addEventListener("click", function () {
          window.location.href = cat.url;
        });
        track.appendChild(seeMore);

        wrap.appendChild(track);

        var leftBtn = create("button", "scroll-btn left");
        leftBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        var rightBtn = create("button", "scroll-btn right");
        rightBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

        function animateCards() {
          var cards = qsa(".deal-card", track);
          cards.forEach(function (c) {
            c.classList.add("swipe-animate");
            setTimeout(function () {
              c.classList.remove("swipe-animate");
            }, 250);
          });
        }

        function scrollByCard(dir) {
          var firstCard = track.querySelector(".deal-card");
          if (!firstCard) return;
          var cardWidth = firstCard.getBoundingClientRect().width || 260;
          track.scrollBy({ left: dir * (cardWidth + 16), behavior: "smooth" });
          animateCards();
        }

        leftBtn.addEventListener("click", function () { scrollByCard(-1); });
        rightBtn.addEventListener("click", function () { scrollByCard(1); });

        wrap.appendChild(leftBtn);
        wrap.appendChild(rightBtn);

        ctr.appendChild(wrap);
        anchor.appendChild(section);
      });
    });
  }

  /* CATEGORY PAGES: 9 + load more 9 */
  function initCategoryPage() {
    var main = qs("#main[data-src]");
    if (!main) return;

    var src = main.getAttribute("data-src") || "";
    fetch(src)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(function (arr) {
        if (!Array.isArray(arr)) arr = [];
        var items = arr.map(function (item) {
          return {
            title: item.title || "",
            author: item.author || "",
            seller: item.seller || "",
            img: item.img || "",
            desc: cleanDesc(item.desc || ""),
            link: item.link || ""
          };
        });

        var grid = create("div", "cards-grid");
        main.appendChild(grid);

        var batchSize = 9;
        var index = 0;

        function renderNextBatch() {
          var slice = items.slice(index, index + batchSize);
          slice.forEach(function (item) {
            grid.appendChild(createCard(item, false));
          });
          index += slice.length;

          if (index >= items.length) {
            loadMoreBtn.style.display = "none";
          }
        }

        var loadMoreBtn = create("button", "btn-primary");
        loadMoreBtn.style.margin = "20px auto 0";
        loadMoreBtn.style.display = "block";
        loadMoreBtn.textContent = "আরো ৯ টি দেখুন";
        loadMoreBtn.addEventListener("click", renderNextBatch);

        renderNextBatch();
        if (items.length > batchSize) {
          main.appendChild(loadMoreBtn);
        }
      })
      .catch(function () {
        var msg = document.createElement("p");
        msg.textContent = "ডাটা লোড করতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।";
        main.appendChild(msg);
      });
  }

  /* SEARCH */
  function initSearch() {
    var input = qs("#header-search-input");
    var resultsBox = qs("#header-search-results");
    var clearBtn = qs("#search-clear");

    if (!input || !resultsBox) return;

    var allItems = null;

    function ensureData() {
      if (allItems) return Promise.resolve(allItems);
      return loadAllItems().then(function (items) {
        allItems = items;
        return items;
      });
    }

    function hideResults() {
      resultsBox.classList.remove("visible");
      resultsBox.innerHTML = "";
    }

    function showResults(items) {
      if (!items.length) {
        resultsBox.innerHTML =
          '<div style="padding:10px;font-size:0.85rem;color:#94a3b8;">কিছু পাওয়া যায়নি। অন্য কিছু লিখে চেষ্টা করুন।</div>';
        resultsBox.classList.add("visible");
        return;
      }

      resultsBox.innerHTML = "";
      items.slice(0, 12).forEach(function (item) {
        var catCfg = CATEGORIES.find(function (c) { return c.key === item.categoryKey; });
        var catLabel = (catCfg && catCfg.label) || "Other";

        var row = create("div", "result-item");
        var img = create("img");
        img.src = item.img || "assets/placeholder.png";
        img.alt = item.title || "";

        var info = create("div", "result-info");
        var title = document.createElement("h4");
        title.textContent = item.title || "";

        var meta = document.createElement("p");
        var metaPieces = [];
        if (item.author) metaPieces.push(item.author);
        if (item.seller) metaPieces.push(item.seller);
        metaPieces.push(catLabel);
        meta.textContent = metaPieces.join(" · ");

        info.appendChild(title);
        info.appendChild(meta);

        row.appendChild(img);
        row.appendChild(info);

        row.addEventListener("click", function () {
          if (item.link) {
            window.open(item.link, "_blank", "noopener");
          }
        });

        resultsBox.appendChild(row);
      });

      resultsBox.classList.add("visible");
    }

    input.addEventListener("input", function () {
      var q = input.value.trim();
      clearBtn.style.display = q ? "block" : "none";

      if (q.length < 2) {
        hideResults();
        return;
      }

      ensureData().then(function (items) {
        q = q.toLowerCase();
        var filtered = items.filter(function (item) {
          return (
            (item.title && item.title.toLowerCase().indexOf(q) !== -1) ||
            (item.author && item.author.toLowerCase().indexOf(q) !== -1) ||
            (item.seller && item.seller.toLowerCase().indexOf(q) !== -1)
          );
        });
        showResults(filtered);
      });
    });

    clearBtn.addEventListener("click", function () {
      input.value = "";
      clearBtn.style.display = "none";
      hideResults();
      input.focus();
    });

    input.addEventListener("focus", function () {
      if (resultsBox.innerHTML.trim()) {
        resultsBox.classList.add("visible");
      }
    });

    document.addEventListener("click", function (e) {
      if (e.target === input || e.target.closest(".search-box")) return;
      hideResults();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        hideResults();
        input.blur();
      }
    });
  }

  function init() {
    initTheme();
    initNav();
    initSearch();
    initHome();
    initCategoryPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();