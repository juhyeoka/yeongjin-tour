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
    region: "대전",
    short: "대전",
    name: "주식회사 영진관광 대전 본점",
    address: "대전광역시 서구 계백로1249번길 58",
    lat: 36.3057,
    lng: 127.3739,
  },
  {
    id: "sejong",
    region: "세종",
    short: "세종",
    name: "주식회사 영진관광 세종 지사",
    address: "세종특별자치시 갈매로 351, 5118호",
    lat: 36.5038,
    lng: 127.2628,
  },
  {
    id: "cheonan",
    region: "천안",
    short: "천안",
    name: "영진관광 천안 사업장",
    address: "충청남도 천안시 동남구 다가말2길 80, 1층",
    lat: 36.7996,
    lng: 127.1482,
  },
  {
    id: "boryeong",
    region: "보령",
    short: "보령",
    name: "주식회사 하나관광 보령 사업장",
    address: "충청남도 보령시 번영로 30",
    lat: 36.3507,
    lng: 126.5964,
  },
];

let map;
let kakaoMarkers = [];
let activeInfoWindow = null;

function loadKakaoMapScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(resolve);
      return;
    }

    const key = window.KAKAO_JAVASCRIPT_KEY;

    if (!key) {
      reject(new Error("Kakao JavaScript key missing"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function makeMarkerContent(branch) {
  return `
    <div class="custom-marker">
      <div class="marker-pin"><span>${branch.short}</span></div>
      <div class="marker-label">${branch.name}</div>
    </div>
  `;
}

function setCaption(branch) {
  const name = document.querySelector("#selectedBranchName");
  const address = document.querySelector("#selectedBranchAddress");

  if (name) name.textContent = branch.name;
  if (address) address.textContent = branch.address;
}

function setActiveBranch(id) {
  document.querySelectorAll(".branch-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.branch === id);
  });

  const branch = branches.find((item) => item.id === id);
  if (!branch || !map || !window.kakao) return;

  const pos = new kakao.maps.LatLng(branch.lat, branch.lng);
  map.panTo(pos);
  map.setLevel(5);
  setCaption(branch);
}

function initKakaoMap() {
  const mapContainer = document.querySelector("#kakaoMap");
  if (!mapContainer) return;

  loadKakaoMapScript()
    .then(() => {
      const center = new kakao.maps.LatLng(36.35, 127.1);

      map = new kakao.maps.Map(mapContainer, {
        center,
        level: 10,
      });

      const bounds = new kakao.maps.LatLngBounds();

      branches.forEach((branch) => {
        const position = new kakao.maps.LatLng(branch.lat, branch.lng);
        bounds.extend(position);

        const marker = new kakao.maps.CustomOverlay({
          position,
          content: makeMarkerContent(branch),
          yAnchor: 1,
          clickable: true,
        });

        marker.setMap(map);
        kakaoMarkers.push(marker);

        const infoWindow = new kakao.maps.InfoWindow({
          content: `
            <div style="padding:14px 16px;min-width:230px;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
              <strong style="display:block;margin-bottom:6px;color:#1f2933;font-size:15px;">${branch.name}</strong>
              <span style="display:block;color:#667085;font-size:13px;line-height:1.45;">${branch.address}</span>
            </div>
          `,
        });

        kakao.maps.event.addListener(map, "click", () => {
          activeInfoWindow?.close();
        });

        kakao.maps.event.addListener(marker, "click", () => {
          activeInfoWindow?.close();
          infoWindow.open(map);
          activeInfoWindow = infoWindow;
          setActiveBranch(branch.id);
        });
      });

      map.setBounds(bounds);

      document.querySelectorAll(".branch-card").forEach((card) => {
        card.addEventListener("click", () => {
          setActiveBranch(card.dataset.branch);
        });
      });

      setTimeout(() => {
        map.relayout();
        map.setBounds(bounds);
      }, 250);

      setCaption(branches[0]);
    })
    .catch(() => {
      mapContainer.innerHTML = `
        <div class="map-loading">
          <strong>지도를 불러오지 못했습니다</strong>
          <p>map-config.js의 카카오 JavaScript 키와 Render 도메인 등록을 확인하세요.</p>
        </div>
      `;
    });
}

document.addEventListener("DOMContentLoaded", initKakaoMap);
