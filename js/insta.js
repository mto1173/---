(function () {
  var FEED_URL = "";

  var root = document.querySelector(".insta");
  if (!root) return;

  var closedImg = root.querySelector('[data-slot="closed"] img');
  var now = new Date();
  var mm = ("0" + (now.getMonth() + 1)).slice(-2);
  closedImg.onerror = function () {
    closedImg.onerror = null;
    closedImg.src = "images/closed.jpg";
  };
  closedImg.src = "images/closed-" + now.getFullYear() + "-" + mm + ".jpg";

  if (!FEED_URL) return;

  function toPosts(json) {
    var list = Array.isArray(json) ? json : (json.posts || json.data || []);
    return list.map(function (p) {
      return {
        link: p.permalink || p.link,
        image: p.thumbnailUrl || p.thumbnail_url || p.mediaUrl || p.media_url || p.image
      };
    });
  }

  fetch(FEED_URL)
    .then(function (r) { return r.json(); })
    .then(function (json) {
      var posts = toPosts(json);
      [0, 1].forEach(function (i) {
        var tile = root.querySelector('[data-slot="' + i + '"]');
        if (!tile || !posts[i] || !posts[i].image) return;
        tile.querySelector("img").src = posts[i].image;
        if (posts[i].link) tile.href = posts[i].link;
      });
    })
    .catch(function () {});
})();