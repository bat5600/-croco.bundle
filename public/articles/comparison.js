// comparison.js
(function () {
  function updateProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = scrolled + "%";
  }

  window.addEventListener("scroll", updateProgressBar, { passive: true });
  window.addEventListener("load", updateProgressBar);
})();
