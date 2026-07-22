document.addEventListener("DOMContentLoaded", () => {
  const screens = document.querySelectorAll(".screen");
  const startScreen = document.getElementById("start-screen");
  const characterScreen = document.getElementById("character-screen");
  const mapScreen = document.getElementById("map-screen");
  const startButton = document.getElementById("start-button");
  const charCards = document.querySelectorAll(".char-card");

  let selectedCharacter = null;

  function showScreen(screen) {
    screens.forEach((s) => {
      s.hidden = s !== screen;
    });
  }

  // ---------- 화면 공통: 뒤로가기 버튼 ----------
  // 각 화면(.screen)의 data-back-target 속성이 가리키는 화면으로 돌아간다.
  // 스테이지 게임 화면들도 같은 마크업 패턴(.back-button + data-back-target="map-screen")을
  // 붙이기만 하면 자동으로 동작한다.
  document.querySelectorAll(".back-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentScreen = btn.closest(".screen");
      const targetId = currentScreen.dataset.backTarget;
      const targetScreen = document.getElementById(targetId);
      if (targetScreen) showScreen(targetScreen);
    });
  });

  // ---------- 1단계 -> 2단계 ----------
  startButton.addEventListener("click", () => {
    console.log("게임 시작");
    charCards.forEach((c) => c.classList.remove("is-selected"));
    selectedCharacter = null;
    showScreen(characterScreen);
  });

  // ---------- 2단계: 캐릭터 선택 -> 3단계(요괴맵) ----------
  charCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (selectedCharacter) return; // 선택 후 중복 클릭 방지

      const character = card.dataset.character;
      selectedCharacter = character;
      window.selectedCharacter = character; // 이후 화면에서 계속 사용

      charCards.forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");

      console.log(`캐릭터 선택: ${character}`);

      setTimeout(() => {
        selectedCharacter = null;
        showScreen(mapScreen);
        renderMap();
      }, 600);
    });
  });

  // ---------- 3단계: 요괴맵 ----------

  // 좌 -> 우 순서: 야광귀 -> 그슨대 -> 불가살이 -> 도깨비
  // top/left/labelTop/labelLeft는 목업(3.map.png) 실측 좌표(화면 대비 %)
  const STAGES = [
    { key: "yagwanggwi", name: "야광귀", asset: "stage_1", top: 68.5, left: 15.5, labelTop: 85.9, labelLeft: 15.2 },
    { key: "geuseundae", name: "그슨대", asset: "stage_2", top: 60.9, left: 38.4, labelTop: 76.6, labelLeft: 38.5 },
    { key: "bulgasari", name: "불가살이", asset: "stage_3", top: 60.9, left: 59.4, labelTop: 76.6, labelLeft: 59.6 },
    { key: "dokkaebi", name: "도깨비", asset: "stage_4", top: 70.1, left: 81.1, labelTop: 87.7, labelLeft: 82.2 },
  ];
  const STAGE_WIDTH = 14; // 발판 가로폭 (%)
  const CHAR_TOP_OFFSET = 26.4; // 캐릭터가 발판 위에 서는 높이 오프셋 (%)

  // 클리어 상태 저장소. 이후 스테이지를 실제로 클리어하면 이 값을 true로 바꾸고
  // renderMap()을 다시 호출하면 발판/캐릭터 표시가 알아서 갱신된다.
  const clearedStages = {
    yagwanggwi: false,
    geuseundae: false,
    bulgasari: false,
    dokkaebi: false,
  };

  function getStageStatus(index) {
    const stage = STAGES[index];
    if (clearedStages[stage.key]) return "on";
    const nextChallengeIndex = STAGES.findIndex((s) => !clearedStages[s.key]);
    return index === nextChallengeIndex ? "select" : "off";
  }

  const stageTrack = document.getElementById("stage-track");
  const mapCharacter = document.getElementById("map-character");

  function buildStageTrack() {
    stageTrack.innerHTML = "";

    STAGES.forEach((stage) => {
      const wrap = document.createElement("div");
      wrap.className = "stage-wrap";
      wrap.id = `stage-wrap-${stage.key}`;
      wrap.style.top = `${stage.top}%`;
      wrap.style.left = `${stage.left}%`;
      wrap.style.width = `${STAGE_WIDTH}%`;

      const platformImg = document.createElement("img");
      platformImg.className = "stage-platform-img";
      platformImg.id = `stage-platform-${stage.key}`;
      platformImg.alt = stage.name;
      wrap.appendChild(platformImg);

      wrap.addEventListener("click", () => {
        if (wrap.dataset.status !== "select") return; // off/on 상태는 반응 없음
        console.log(`스테이지 이동: ${stage.name}`);
        // TODO: 스테이지 게임 화면 연결 예정
      });

      stageTrack.appendChild(wrap);

      const label = document.createElement("img");
      label.className = "stage-label";
      label.src = `asset/image/${stage.asset}_name.png`;
      label.alt = stage.name;
      label.style.top = `${stage.labelTop}%`;
      label.style.left = `${stage.labelLeft}%`;
      stageTrack.appendChild(label);
    });
  }

  function renderMap() {
    let selectedStage = null;

    STAGES.forEach((stage, index) => {
      const status = getStageStatus(index);
      const wrap = document.getElementById(`stage-wrap-${stage.key}`);
      const platformImg = document.getElementById(`stage-platform-${stage.key}`);

      wrap.dataset.status = status;
      wrap.classList.toggle("is-select", status === "select");
      platformImg.src = `asset/image/${stage.asset}_${status}.png`;

      if (status === "select") selectedStage = stage;
    });

    if (selectedStage) {
      const character = window.selectedCharacter === "girl" ? "cr_girl.png" : "cr_boy.png";
      mapCharacter.src = `asset/image/${character}`;
      mapCharacter.style.left = `${selectedStage.left}%`;
      mapCharacter.style.top = `${selectedStage.top - CHAR_TOP_OFFSET}%`;
      mapCharacter.hidden = false;
    } else {
      // 모든 스테이지 클리어 (현재는 발생하지 않지만 확장 대비)
      mapCharacter.hidden = true;
    }
  }

  buildStageTrack();
  renderMap();
});
