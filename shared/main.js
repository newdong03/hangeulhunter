document.addEventListener("DOMContentLoaded", () => {
  const screens = document.querySelectorAll(".screen");
  const startScreen = document.getElementById("start-screen");
  const characterScreen = document.getElementById("character-screen");
  const mapScreen = document.getElementById("map-screen");
  const game1RuleScreen = document.getElementById("game1-rule-screen");
  const game1ChallengeButton = document.getElementById("game1-challenge-button");
  const game1PlayScreen = document.getElementById("game1-play-screen");
  const startButton = document.getElementById("start-button");
  const charCards = document.querySelectorAll(".char-card");

  let selectedCharacter = null;

  function showScreen(screen) {
    screens.forEach((s) => {
      s.hidden = s !== screen;
    });
  }

  // 등장 애니메이션은 CSS의 "is-playing" 클래스 여부로 재생된다.
  // 같은 화면을 다시 보여줄 때도 처음부터 재생되도록 클래스를 뗐다가
  // 강제로 리플로우시킨 뒤 다시 붙인다.
  function playEntryAnimation(screen) {
    screen.classList.remove("is-playing");
    void screen.offsetWidth;
    screen.classList.add("is-playing");
  }

  function enterScreen(screen) {
    showScreen(screen);
    playEntryAnimation(screen);
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
  // 발판 클릭 시 이동할 룰 설명/게임 화면. 아직 만들지 않은 스테이지는 매핑이 없어
  // 기존처럼 콘솔 로그만 찍힌다.
  const STAGE_SCREENS = {
    yagwanggwi: game1RuleScreen,
  };

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

        const targetScreen = STAGE_SCREENS[stage.key];
        if (targetScreen) {
          enterScreen(targetScreen);
        }
        // TODO: 나머지 스테이지 게임 화면 연결 예정
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

  // ---------- 야광귀 룰 설명 화면 ----------
  game1ChallengeButton.addEventListener("click", () => {
    console.log("야광귀 게임 시작");
    resetGame1();
    showScreen(game1PlayScreen);
  });

  // ---------- 야광귀 실제 게임 화면 ('짚신' 자모 조합) ----------

  const game1Character = document.getElementById("game1-character");
  const jamoPieces = document.querySelectorAll(".jamo-piece");
  const JIPSIN_LENGTH = jamoPieces.length; // 짚신 = 자모 6개

  let jipsinProgress = 0; // 지금까지 맞춘 자모 개수 (다음에 눌러야 할 순번 = jipsinProgress + 1)
  let faceResetTimer = null;

  function setCharacterFace(face) {
    game1Character.src = `asset/image/ms_yg_${face}.png`;
  }

  // 각 자모 조각 고유 색상 (game1_word1~6.png에서 추출한 코어 색상)
  const JAMO_COLORS = {
    1: "#f0681d",
    2: "#81b2fd",
    3: "#f4af23",
    4: "#dded23",
    5: "#6fc8fd",
    6: "#f2cf2a",
  };

  function resetGame1() {
    jipsinProgress = 0;
    clearTimeout(faceResetTimer);
    setCharacterFace("basic");
    game1PlayScreen.classList.remove("is-shaking");

    jamoPieces.forEach((piece) => {
      piece.classList.remove("is-correct", "is-used");
      piece.style.visibility = "";
    });

    for (let order = 1; order <= JIPSIN_LENGTH; order++) {
      const box = document.getElementById(`wordbox-${order}`);
      box.classList.remove("is-filled");
      box.src = `asset/image/game1_wordbox${order}_off.png`;
    }
  }

  // 조각의 화면상 중심 좌표(%)를 계산해 그 위치에 자모 고유 색으로 반짝이는
  // 파티클(중심 플래시 + 사방으로 튀는 점들)을 띄운다.
  function spawnSparkle(piece, order) {
    const pieceRect = piece.getBoundingClientRect();
    const screenRect = game1PlayScreen.getBoundingClientRect();
    const color = JAMO_COLORS[order] || "#ffe08a";

    const burst = document.createElement("div");
    burst.className = "sparkle-burst";
    burst.style.left = `${((pieceRect.left + pieceRect.width / 2 - screenRect.left) / screenRect.width) * 100}%`;
    burst.style.top = `${((pieceRect.top + pieceRect.height / 2 - screenRect.top) / screenRect.height) * 100}%`;
    burst.style.setProperty("--burst-color", color);

    const core = document.createElement("div");
    core.className = "sparkle-core";
    burst.appendChild(core);

    const DOT_COUNT = 12;
    for (let i = 0; i < DOT_COUNT; i++) {
      const angle = (360 / DOT_COUNT) * i + (Math.random() * 18 - 9); // 살짝 흩뿌려 자연스럽게
      const radius = 9 + Math.random() * 7; // vh 단위, 사방으로 퍼지는 거리
      const rad = (angle * Math.PI) / 180;

      const dot = document.createElement("div");
      dot.className = "sparkle-dot";
      dot.style.setProperty("--dx", `${Math.cos(rad) * radius}vh`);
      dot.style.setProperty("--dy", `${Math.sin(rad) * radius}vh`);
      dot.style.background = color;
      dot.style.boxShadow = `0 0 8px 2px ${color}`;
      dot.style.animationDelay = `${Math.random() * 0.05}s`;
      burst.appendChild(dot);
    }

    game1PlayScreen.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
  }

  function flashCharacterFace(face) {
    setCharacterFace(face);
    clearTimeout(faceResetTimer);
    faceResetTimer = setTimeout(() => setCharacterFace("basic"), 700);
  }

  function handleCorrectJamo(piece, order) {
    jipsinProgress = order;

    piece.classList.add("is-used");
    piece.classList.add("is-correct");
    spawnSparkle(piece, order);
    piece.addEventListener("animationend", () => {
      piece.style.visibility = "hidden";
    }, { once: true });

    const box = document.getElementById(`wordbox-${order}`);
    box.src = `asset/image/game1_wordbox${order}_on.png`;
    box.classList.remove("is-filled");
    void box.offsetWidth; // 리플로우시켜 완성 박스 애니메이션이 매번 재생되게 함
    box.classList.add("is-filled");

    flashCharacterFace("happy");

    if (jipsinProgress === JIPSIN_LENGTH) {
      console.log("짚신 완성!");
      setTimeout(() => {
        goToScreen("yagwanggwi-clear");
      }, 1000);
    }
  }

  function handleWrongJamo() {
    game1PlayScreen.classList.remove("is-shaking");
    void game1PlayScreen.offsetWidth; // 리플로우시켜 연속 오답에도 흔들림 애니메이션이 매번 재생되게 함
    game1PlayScreen.classList.add("is-shaking");

    flashCharacterFace("sad");
  }

  jamoPieces.forEach((piece) => {
    piece.addEventListener("click", () => {
      const order = Number(piece.dataset.order);
      const isPiecesTurn = order === jipsinProgress + 1;

      if (piece.classList.contains("is-used") || !isPiecesTurn) {
        handleWrongJamo();
        return;
      }

      handleCorrectJamo(piece, order);
    });
  });

  // 짚신 획득 연출 / 아래아 카드 획득 화면은 아직 만들지 않아 자리만 비워둔다.
  function goToScreen(name) {
    console.log(`다음 화면으로 이동 예정: ${name}`);
    // TODO: yagwanggwi-clear 화면 연결 예정
  }
});
