const menuButton = document.querySelector("#menuButton");
const mobileNav = document.querySelector("#mobileNav");

menuButton?.addEventListener("click", () => {
  mobileNav?.classList.toggle("active");
});

document.querySelectorAll(".mobile-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav?.classList.remove("active");
  });
});

const branches = [
  {
    id: "daejeon",
    short: "대전",
    name: "주식회사 영진관광 대전 본점",
    address: "대전광역시 서구 계백로1249번길 58",
    lat: 36.3057,
    lng: 127.3739,
  },
  {
    id: "sejong",
    short: "세종",
    name: "주식회사 영진관광 세종 지사",
    address: "세종특별자치시 갈매로 351, 5118호",
    lat: 36.5038,
    lng: 127.2628,
  },
  {
    id: "cheonan",
    short: "천안",
    name: "영진관광 천안 사업장",
    address: "충청남도 천안시 동남구 다가말2길 80, 1층",
    lat: 36.7996,
    lng: 127.1482,
  },
  {
    id: "boryeong",
    short: "보령",
    name: "주식회사 하나관광 보령 사업장",
    address: "충청남도 보령시 번영로 30",
    lat: 36.3507,
    lng: 126.5964,
  },
];

let map;
let activeInfoWindow = null;

function showMapError(message) {
  const mapContainer = document.querySelector("#kakaoMap");
  if (!mapContainer) return;

  mapContainer.innerHTML = `
    <div class="map-loading">
      <strong>지도를 불러오지 못했습니다</strong>
      <p>${message}</p>
    </div>
  `;
}

function loadKakaoMapScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(resolve);
      return;
    }

    const key = window.KAKAO_JAVASCRIPT_KEY;

    if (!key) {
      reject(new Error("map-config.js에 카카오 JavaScript 키가 없습니다."));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => reject(new Error("카카오 SDK 로드 실패"));
    document.head.appendChild(script);
  });
}

function setCaption(branch) {
  const name = document.querySelector("#selectedBranchName");
  const address = document.querySelector("#selectedBranchAddress");

  if (name) name.textContent = branch.name;
  if (address) address.textContent = branch.address;
}

function setActiveCard(id) {
  document.querySelectorAll(".branch-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.branch === id);
  });
}

function focusBranch(branch) {
  if (!map || !window.kakao) return;

  const pos = new kakao.maps.LatLng(branch.lat, branch.lng);
  map.panTo(pos);
  map.setLevel(5);
  setCaption(branch);
  setActiveCard(branch.id);
}

function initKakaoMap() {
  const mapContainer = document.querySelector("#kakaoMap");
  if (!mapContainer) return;

  loadKakaoMapScript()
    .then(() => {
      const center = new kakao.maps.LatLng(36.48, 127.05);

      map = new kakao.maps.Map(mapContainer, {
        center,
        level: 10,
      });

      const bounds = new kakao.maps.LatLngBounds();

      branches.forEach((branch) => {
        const position = new kakao.maps.LatLng(branch.lat, branch.lng);
        bounds.extend(position);

        const marker = new kakao.maps.Marker({
          map,
          position,
          title: branch.name,
        });

        new kakao.maps.CustomOverlay({
          map,
          position,
          yAnchor: 2.25,
          content: `<div class="marker-label">${branch.short}</div>`,
        });

        const infoWindow = new kakao.maps.InfoWindow({
          content: `
            <div style="padding:14px 16px;min-width:240px;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
              <strong style="display:block;margin-bottom:6px;color:#172033;font-size:15px;">${branch.name}</strong>
              <span style="display:block;color:#667085;font-size:13px;line-height:1.45;">${branch.address}</span>
            </div>
          `,
        });

        kakao.maps.event.addListener(marker, "click", () => {
          if (activeInfoWindow) activeInfoWindow.close();
          infoWindow.open(map, marker);
          activeInfoWindow = infoWindow;
          focusBranch(branch);
        });
      });

      map.setBounds(bounds);

      document.querySelectorAll(".branch-card").forEach((card) => {
        card.addEventListener("click", () => {
          const branch = branches.find((item) => item.id === card.dataset.branch);
          if (branch) focusBranch(branch);
        });
      });

      setTimeout(() => {
        map.relayout();
        map.setBounds(bounds);
      }, 300);

      setCaption(branches[0]);
    })
    .catch((error) => {
      showMapError(error.message || "카카오 지도 설정을 확인해야 합니다.");
    });
}

document.addEventListener("DOMContentLoaded", initKakaoMap);
