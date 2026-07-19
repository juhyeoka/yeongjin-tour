const menuButton = document.querySelector("#menuButton");
const mobileNav = document.querySelector("#mobileNav");

function closeMobileMenu() {
  if (!menuButton || !mobileNav) return;

  menuButton.setAttribute("aria-expanded", "false");
  mobileNav.classList.remove("active");
  document.body.classList.remove("menu-open");
}

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";

  menuButton.setAttribute("aria-expanded", String(!isOpen));
  mobileNav?.classList.toggle("active", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

document.querySelectorAll(".mobile-nav a").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) closeMobileMenu();
});

function createAutoSlider({
  trackSelector,
  buttonSelector,
  interval = 5200,
}) {
  const track = document.querySelector(trackSelector);
  const buttons = [...document.querySelectorAll(buttonSelector)];

  if (!track || buttons.length < 2) return;

  let activeIndex = 0;
  let timer = null;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function showSlide(index) {
    activeIndex = (index + buttons.length) % buttons.length;
    track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;

    buttons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activeIndex;
      button.classList.toggle("active", isActive);
      button.toggleAttribute("aria-current", isActive);
    });
  }

  function stopAutoPlay() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function startAutoPlay() {
    stopAutoPlay();
    if (prefersReducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => showSlide(activeIndex + 1), interval);
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      showSlide(index);
      startAutoPlay();
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoPlay();
    else startAutoPlay();
  });

  prefersReducedMotion.addEventListener?.("change", startAutoPlay);
  showSlide(0);
  startAutoPlay();
}

createAutoSlider({
  trackSelector: ".hero-slider-track",
  buttonSelector: "[data-hero-slide]",
  interval: 5400,
});

createAutoSlider({
  trackSelector: ".about-slider-track",
  buttonSelector: "[data-about-slide]",
  interval: 6200,
});

const branches = [
  {
    id: "daejeon",
    region: "대전",
    name: "주식회사 영진관광 대전 본점",
    address: "대전광역시 서구 계백로1249번길 58",
    lat: 36.3057,
    lng: 127.3739,
  },
  {
    id: "sejong",
    region: "세종",
    name: "주식회사 영진관광 세종 지사",
    address: "세종특별자치시 갈매로 351, 5118호",
    lat: 36.5038,
    lng: 127.2628,
  },
  {
    id: "cheonan",
    region: "천안",
    name: "영진관광 천안 사업장",
    address: "충청남도 천안시 동남구 다가말2길 80, 1층",
    lat: 36.7996,
    lng: 127.1482,
  },
  {
    id: "boryeong",
    region: "보령",
    name: "주식회사 하나관광 보령 사업장",
    address: "충청남도 보령시 번영로 30",
    lat: 36.3507,
    lng: 126.5964,
  },
];

let map = null;
let activeInfoWindow = null;
let mapBounds = null;
let activeBranch = branches[0];
let hasFocusedBranch = false;
let mapResizeFrame = null;

function showMapError(message) {
  const mapContainer = document.querySelector("#kakaoMap");
  if (!mapContainer) return;

  mapContainer.innerHTML = `
    <div class="map-loading">
      <span class="map-loading-dot" aria-hidden="true"></span>
      <strong>지도를 불러오지 못했습니다</strong>
      <p>${message}</p>
    </div>
  `;
}

function loadKakaoMapScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(resolve);
      return;
    }

    const key = String(window.KAKAO_JAVASCRIPT_KEY || "").trim();

    if (!key) {
      reject(new Error("카카오 지도 JavaScript 키를 확인해 주세요."));
      return;
    }

    const existingScript = document.querySelector("#kakaoMapSdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => window.kakao.maps.load(resolve), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("카카오 지도 연결을 확인해 주세요.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakaoMapSdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
    script.async = true;
    script.addEventListener("load", () => window.kakao.maps.load(resolve), { once: true });
    script.addEventListener("error", () => reject(new Error("카카오 지도 연결을 확인해 주세요.")), { once: true });
    document.head.appendChild(script);
  });
}

function updateSelectedBranch(branch) {
  const region = document.querySelector("#selectedBranchRegion");
  const name = document.querySelector("#selectedBranchName");
  const address = document.querySelector("#selectedBranchAddress");

  if (region) region.textContent = branch.region;
  if (name) name.textContent = branch.name;
  if (address) address.textContent = branch.address;
}

function setActiveBranchCard(branchId) {
  document.querySelectorAll(".branch-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.branch === branchId);
  });
}

function focusBranch(branch) {
  activeBranch = branch;
  hasFocusedBranch = true;
  updateSelectedBranch(branch);
  setActiveBranchCard(branch.id);

  if (!map || !window.kakao?.maps) return;

  const position = new kakao.maps.LatLng(branch.lat, branch.lng);
  map.setLevel(5);
  map.panTo(position);
}

function scheduleMapRelayout() {
  if (!map || !mapBounds) return;

  if (mapResizeFrame) window.cancelAnimationFrame(mapResizeFrame);

  mapResizeFrame = window.requestAnimationFrame(() => {
    map.relayout();

    if (hasFocusedBranch && activeBranch) {
      const position = new kakao.maps.LatLng(activeBranch.lat, activeBranch.lng);
      map.setCenter(position);
      return;
    }

    map.setBounds(mapBounds);
  });
}

function createInfoWindow(branch) {
  return new kakao.maps.InfoWindow({
    content: `
      <div style="min-width:220px;padding:13px 15px;font-family:Pretendard,SUIT,'Apple SD Gothic Neo',sans-serif;word-break:keep-all;">
        <strong style="display:block;color:#111a2b;font-size:14px;line-height:1.4;">${branch.name}</strong>
        <span style="display:block;margin-top:5px;color:#697386;font-size:11px;line-height:1.5;">${branch.address}</span>
      </div>
    `,
  });
}

function initializeKakaoMap() {
  const mapContainer = document.querySelector("#kakaoMap");
  if (!mapContainer || map) return;

  map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(36.48, 127.05),
    level: 10,
  });

  mapBounds = new kakao.maps.LatLngBounds();

  branches.forEach((branch) => {
    const position = new kakao.maps.LatLng(branch.lat, branch.lng);
    mapBounds.extend(position);

    const marker = new kakao.maps.Marker({
      map,
      position,
      title: branch.name,
    });

    new kakao.maps.CustomOverlay({
      map,
      position,
      yAnchor: 2.25,
      content: `<div class="marker-label">${branch.region}</div>`,
    });

    const infoWindow = createInfoWindow(branch);

    kakao.maps.event.addListener(marker, "click", () => {
      activeInfoWindow?.close();
      infoWindow.open(map, marker);
      activeInfoWindow = infoWindow;
      focusBranch(branch);
    });
  });

  map.setBounds(mapBounds);

  document.querySelectorAll(".branch-card").forEach((card) => {
    card.addEventListener("click", () => {
      const branch = branches.find((item) => item.id === card.dataset.branch);
      if (branch) focusBranch(branch);
    });
  });

  updateSelectedBranch(branches[0]);

  if (window.ResizeObserver) {
    const mapResizeObserver = new ResizeObserver(scheduleMapRelayout);
    mapResizeObserver.observe(mapContainer);
  }

  window.addEventListener("resize", scheduleMapRelayout, { passive: true });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(scheduleMapRelayout, 180);
  });

  window.setTimeout(() => {
    scheduleMapRelayout();
  }, 250);
}

function initializeSite() {
  loadKakaoMapScript()
    .then(initializeKakaoMap)
    .catch((error) => {
      showMapError(error.message || "카카오 지도 설정을 확인해 주세요.");
    });
}

document.addEventListener("DOMContentLoaded", initializeSite);
