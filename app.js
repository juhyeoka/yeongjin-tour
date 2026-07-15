const menuButton = document.querySelector("#menuButton");
const mobileNav = document.querySelector("#mobileNav");

menuButton?.addEventListener("click", () => {
  mobileNav.classList.toggle("active");
});

document.querySelectorAll(".mobile-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("active");
  });
});

document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const text = link.textContent.trim();

    if (text === "TOP") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (text.includes("전화")) {
      event.preventDefault();
      alert("대표번호가 확정되면 전화 연결로 바꾸면 됩니다.");
      return;
    }

    if (text.includes("카카오톡")) {
      event.preventDefault();
      alert("카카오톡 채널 주소가 생기면 연결하면 됩니다.");
    }
  });
});
