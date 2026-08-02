document.addEventListener("DOMContentLoaded", () => {
  const screens = document.querySelectorAll(".screen");
  const startScreen = document.getElementById("start-screen");
  const characterScreen = document.getElementById("character-screen");
  const mapScreen = document.getElementById("map-screen");
  const game1RuleScreen = document.getElementById("game1-rule-screen");
  const game1ChallengeButton = document.getElementById("game1-challenge-button");
  const game1PlayScreen = document.getElementById("game1-play-screen");
  const game2RuleScreen = document.getElementById("game2-rule-screen");
  const game2ChallengeButton = document.getElementById("game2-challenge-button");
  const game2PlayScreen = document.getElementById("game2-play-screen");
  const game2HiddenLayer = document.getElementById("game2-hidden-layer");
  const game2Mission = document.getElementById("game2-mission");
  const game2MissionFind = document.getElementById("game2-mission-find");
  const game3RuleScreen = document.getElementById("game3-rule-screen");
  const game3ChallengeButton = document.getElementById("game3-challenge-button");
  const game3PlayScreen = document.getElementById("game3-play-screen");
  const game4RuleScreen = document.getElementById("game4-rule-screen");
  const game4ChallengeButton = document.getElementById("game4-challenge-button");
  const game4PlayScreen = document.getElementById("game4-play-screen");
  const game4QuizAButton = document.getElementById("game4-quiz-a");
  const game4QuizBButton = document.getElementById("game4-quiz-b");
  const game3Character = document.getElementById("game3-character");
  const game3DropLayer = document.getElementById("game3-drop-layer");
  const game3CountBox = document.getElementById("game3-count");
  const game3CountValue = document.getElementById("game3-count-value");
  const startButton = document.getElementById("start-button");
  const charCards = document.querySelectorAll(".char-card");

  let selectedCharacter = null;

  function showScreen(screen) {
    // 웹캠 화면을 벗어나는 모든 경로(다음 버튼뿐 아니라 뒤로가기/홈 버튼
    // 포함)에서 카메라 스트림을 확실히 꺼야 하므로, 화면 전환이 실제로
    // 일어나는 이 지점에서 한 번만 체크한다. webcamScreen/stopWebcamStream은
    // 아래쪽에서 선언되지만, 이 함수는 그 선언이 끝난 뒤(사용자가 실제로
    // 화면을 조작할 때)에만 호출되므로 문제없다.
    const current = getVisibleScreen();
    if (current === webcamScreen && screen !== webcamScreen) {
      stopWebcamStream();
    }

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

  // ---------- 화면 공통 UI: 뒤로가기 / 홈 / 사운드 버튼 ----------
  // 시작화면·캐릭터 선택 화면을 제외한 모든 화면(요괴맵부터 그 이후 전부)에
  // 공통으로 붙는다. 화면마다 버튼 마크업을 반복해서 넣지 않도록, 여기서
  // 한 번만 만들어서 각 화면에 주입한다.

  let screenHistory = []; // 실제로 밟아온 화면 순서 스택. 뒤로가기는 여기서 pop한다.
  let soundOn = true; // 사운드 on/off 상태. 아직 실제 재생 로직은 없고, 나중에 배경음/효과음을 붙일 때 이 값을 참조하면 된다.

  function getVisibleScreen() {
    return Array.from(screens).find((s) => !s.hidden) || null;
  }

  // 화면 전환 + 히스토리 기록을 함께 처리한다. 요괴맵 이후의 모든 "다음
  // 화면으로 이동" 로직은 showScreen/enterScreen을 직접 부르는 대신 이
  // 함수를 거쳐야 뒤로가기가 정확한 직전 화면을 기억한다.
  function changeScreen(nextScreen, { animate = false } = {}) {
    const current = getVisibleScreen();
    if (current && current !== nextScreen) screenHistory.push(current);

    if (animate) enterScreen(nextScreen);
    else showScreen(nextScreen);
  }

  // 요괴맵은 히스토리 스택의 "루트"다. 요괴맵으로 돌아올 때마다(첫 진입,
  // 스테이지 클리어 후 복귀) 스택을 비워서, 요괴맵에서 뒤로가기를 누르면
  // 항상 시작화면으로 가도록 만든다(기존 button_back의 동작 그대로 유지).
  function resetHistoryAndShow(screen) {
    screenHistory = [];
    showScreen(screen);
  }

  function goBackScreen() {
    const previous = screenHistory.pop();
    showScreen(previous || startScreen);
  }

  function goHomeScreen() {
    screenHistory = [];
    showScreen(startScreen);
  }

  function toggleSound(soundImg) {
    soundOn = !soundOn;
    soundImg.src = `asset/image/button_sound_${soundOn ? "on" : "off"}.png`;
    console.log(soundOn ? "사운드 켜짐" : "사운드 꺼짐");
  }

  // 화면 하나에 붙일 뒤로가기/홈/사운드 버튼 3개를 새로 만들어 반환한다.
  function createCommonUiButtons() {
    const fragment = document.createDocumentFragment();

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "back-button";
    backBtn.innerHTML = `<img src="asset/image/button_back.png" alt="뒤로가기">`;
    backBtn.addEventListener("click", goBackScreen);

    const homeBtn = document.createElement("button");
    homeBtn.type = "button";
    homeBtn.className = "home-button";
    homeBtn.innerHTML = `<img src="asset/image/button_home.png" alt="처음으로">`;
    homeBtn.addEventListener("click", goHomeScreen);

    const soundBtn = document.createElement("button");
    soundBtn.type = "button";
    soundBtn.className = "sound-button";
    const soundImg = document.createElement("img");
    soundImg.src = `asset/image/button_sound_${soundOn ? "on" : "off"}.png`;
    soundImg.alt = "사운드 켜기/끄기";
    soundBtn.appendChild(soundImg);
    soundBtn.addEventListener("click", () => toggleSound(soundImg));

    fragment.appendChild(backBtn);
    fragment.appendChild(homeBtn);
    fragment.appendChild(soundBtn);
    return fragment;
  }

  // 시작화면·캐릭터 선택 화면을 제외한 모든 화면에 공통 버튼 3개를 주입한다.
  const COMMON_UI_EXCLUDED_SCREENS = [startScreen, characterScreen];
  screens.forEach((screen) => {
    if (COMMON_UI_EXCLUDED_SCREENS.includes(screen)) return;
    screen.appendChild(createCommonUiButtons());
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
        resetHistoryAndShow(mapScreen);
        renderMap();
      }, 600);
    });
  });

  // ---------- 3단계: 요괴맵 ----------

  // 좌 -> 우 순서: 야광귀 -> 그슨대 -> 불가살이 -> 도깨비
  // top/left는 목업(3.map.png) 실측 좌표(화면 대비 %). 이름 라벨은 이 좌표에서
  // 파생시켜 배치하므로(buildStageTrack 참고) 별도의 라벨 좌표는 필요 없다.
  const STAGES = [
    { key: "yagwanggwi", name: "야광귀", asset: "stage_1", top: 68.5, left: 15.5 },
    { key: "geuseundae", name: "그슨대", asset: "stage_2", top: 60.9, left: 38.4 },
    { key: "bulgasari", name: "불가살이", asset: "stage_3", top: 60.9, left: 59.4 },
    { key: "dokkaebi", name: "도깨비", asset: "stage_4", top: 70.1, left: 81.1 },
  ];
  // 발판 클릭 시 이동할 룰 설명/게임 화면. 아직 만들지 않은 스테이지는 매핑이 없어
  // 기존처럼 콘솔 로그만 찍힌다.
  const STAGE_SCREENS = {
    yagwanggwi: game1RuleScreen,
    geuseundae: game2RuleScreen,
    bulgasari: game3RuleScreen,
    dokkaebi: game4RuleScreen,
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

  // 디버그 모드(시작화면 cloud1 클릭)로 진입했는지 여부. 평소에는 이미
  // 클리어된("on") 발판을 다시 클릭할 수 없지만, 디버그 모드에서는 모든
  // 스테이지를 자유롭게 다시 들어가볼 수 있어야 하므로 이 값으로 그 조건만
  // 풀어준다.
  let debugModeActive = false;

  // 스테이지 상태 규칙(엄격 버전):
  // 앞에서부터 순서대로 훑으면서, "여기까지 전부 클리어됐다"는 사실이 끊기는
  // 순간 그 뒤는 전부 "off"로 확정한다 — 자기 자신의 clearedStages 값만
  // 보고 "on"을 주면(이전 버전의 버그) 앞 스테이지가 어떤 이유로든 아직
  // false인 상태에서 뒤쪽이 true가 되는 비정상 상황을 걸러내지 못한다.
  // - previousAllCleared(자기 앞까지 전부 true)가 깨진 이후의 모든 스테이지: "off"
  // - previousAllCleared가 유지된 상태에서 자기 자신이 true: "on"
  // - previousAllCleared가 유지된 상태에서 자기 자신이 false: "select"
  //   (그리고 이 지점에서 previousAllCleared를 false로 내려 그 뒤는 전부 off)
  function computeStageStatuses() {
    const statuses = [];
    let previousAllCleared = true;

    STAGES.forEach((stage) => {
      if (!previousAllCleared) {
        statuses.push("off");
        return;
      }

      if (clearedStages[stage.key]) {
        statuses.push("on");
        return;
      }

      statuses.push("select");
      previousAllCleared = false; // 여기서부터는 아직 도전 전이니 이후 스테이지는 전부 off
    });

    return statuses;
  }

  const stageTrack = document.getElementById("stage-track");
  const mapCharacter = document.getElementById("map-character");

  // ---------- 배경 반딧불이 파티클 ----------
  const FIREFLY_COUNT = 13;

  function buildFireflies(layerId, count = FIREFLY_COUNT) {
    const layer = document.getElementById(layerId);
    if (!layer) return;
    layer.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const firefly = document.createElement("div");
      firefly.className = "firefly";
      firefly.style.left = `${Math.random() * 100}%`;
      firefly.style.top = `${Math.random() * 100}%`;
      firefly.style.setProperty("--drift-x", `${(Math.random() * 3 - 1.5).toFixed(1)}vw`);
      firefly.style.setProperty("--drift-y", `${(Math.random() * 4 + 2).toFixed(1)}vh`);

      const driftDuration = (7 + Math.random() * 5).toFixed(1);
      const twinkleDuration = (2.5 + Math.random() * 2).toFixed(1);
      firefly.style.animationDuration = `${driftDuration}s, ${twinkleDuration}s`;
      firefly.style.animationDelay = `${(Math.random() * 6).toFixed(1)}s, ${(Math.random() * 3).toFixed(1)}s`;

      layer.appendChild(firefly);
    }
  }

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

      // 라벨을 wrap의 자식으로 두고 left:50% + translateX(-50%)로 배치하면
      // (style.css의 .stage-label 참고) 발판이 세로로 얼마나 어긋나 있든
      // 항상 그 발판 바로 아래, 가로 중심이 정확히 일치한 위치에 놓인다.
      const label = document.createElement("img");
      label.className = "stage-label";
      label.src = `asset/image/${stage.asset}_name.png`;
      label.alt = stage.name;
      wrap.appendChild(label);

      wrap.addEventListener("click", () => {
        // 평소엔 "select"(아직 도전 전) 상태만 클릭 가능하다. 디버그
        // 모드에서는 이미 클리어된("on") 발판도 자유롭게 다시 들어갈 수
        // 있게 조건을 풀어준다.
        const isClickable = wrap.dataset.status === "select" || (debugModeActive && wrap.dataset.status === "on");
        if (!isClickable) return; // off 상태(또는 일반 모드의 on)는 반응 없음
        console.log(`스테이지 이동: ${stage.name}`);

        const targetScreen = STAGE_SCREENS[stage.key];
        if (targetScreen) {
          changeScreen(targetScreen, { animate: true });
        }
        // TODO: 나머지 스테이지 게임 화면 연결 예정
      });

      stageTrack.appendChild(wrap);
    });
  }

  function getCharacterSpriteSrc() {
    return `asset/image/${window.selectedCharacter === "girl" ? "cr_girl.png" : "cr_boy.png"}`;
  }

  // skipCharacterPlacement: 클리어 연출 중에는 캐릭터 위치를 이 함수가 아니라
  // playStageJumpSequence의 점프 애니메이션이 직접 제어한다.
  function renderMap({ skipCharacterPlacement = false } = {}) {
    let selectedStage = null;
    const statuses = computeStageStatuses();

    STAGES.forEach((stage, index) => {
      const status = statuses[index];
      const wrap = document.getElementById(`stage-wrap-${stage.key}`);
      const platformImg = document.getElementById(`stage-platform-${stage.key}`);

      wrap.dataset.status = status;
      wrap.classList.toggle("is-select", status === "select");
      platformImg.src = `asset/image/${stage.asset}_${status}.png`;

      if (status === "select") selectedStage = stage;
    });

    // 디버그용: 계산된 상태뿐 아니라 실제 DOM에 반영된 클래스/이미지까지
    // 함께 찍어서, "계산은 맞는데 반영이 안 됐다" vs "계산 자체가 틀렸다"를
    // 바로 구분할 수 있게 한다.
    console.log("[요괴맵] clearedStages:", JSON.parse(JSON.stringify(clearedStages)));
    console.table(
      STAGES.map((stage, index) => {
        const wrap = document.getElementById(`stage-wrap-${stage.key}`);
        const platformImg = document.getElementById(`stage-platform-${stage.key}`);
        return {
          스테이지: stage.name,
          key: stage.key,
          cleared: clearedStages[stage.key],
          계산된상태: statuses[index],
          "wrap.dataset.status": wrap.dataset.status,
          "is-select 클래스": wrap.classList.contains("is-select"),
          "실제 이미지 파일": platformImg.src.split("/").pop(),
        };
      })
    );

    if (selectedStage) {
      if (!skipCharacterPlacement) {
        mapCharacter.src = getCharacterSpriteSrc();
        mapCharacter.style.left = `${selectedStage.left}%`;
        mapCharacter.style.top = `${selectedStage.top - CHAR_TOP_OFFSET}%`;
        mapCharacter.hidden = false;
      }
    } else if (debugModeActive) {
      // 디버그 모드는 모든 발판이 "on"이라 "select" 상태 발판이 없다.
      // 그렇다고 캐릭터를 숨기면 요괴맵이 텅 비어 보이므로, 마지막 스테이지
      // 발판 위에 세워 둔다.
      if (!skipCharacterPlacement) {
        const lastStage = STAGES[STAGES.length - 1];
        mapCharacter.src = getCharacterSpriteSrc();
        mapCharacter.style.left = `${lastStage.left}%`;
        mapCharacter.style.top = `${lastStage.top - CHAR_TOP_OFFSET}%`;
        mapCharacter.hidden = false;
      }
    } else {
      // 모든 스테이지 클리어 (디버그 모드가 아니면 현재는 발생하지 않지만 확장 대비)
      mapCharacter.hidden = true;
    }
  }

  const STAGE_JUMP_START_DELAY = 300; // 요괴맵 진입 후 점프 시작까지 짧은 텀 (ms)
  const STAGE_JUMP_DURATION = 550; // 발판에서 발판으로 한 번에 점프하는 시간 (ms)

  // 캐릭터를 fromStage 발판에서 toStage 발판으로 한 번에, 포물선을 그리며 점프시킨다.
  function animateStageJump(fromStage, toStage, onDone) {
    const fromLeft = fromStage.left;
    const fromTop = fromStage.top - CHAR_TOP_OFFSET;
    const toLeft = toStage.left;
    const toTop = toStage.top - CHAR_TOP_OFFSET;
    const midLeft = (fromLeft + toLeft) / 2;
    const midTop = (fromTop + toTop) / 2;

    const jump = mapCharacter.animate(
      [
        { left: `${fromLeft}%`, top: `${fromTop}%`, transform: "translate(-50%, -50%) translateY(0)", offset: 0 },
        { left: `${midLeft}%`, top: `${midTop}%`, transform: "translate(-50%, -50%) translateY(-9vh)", offset: 0.5 },
        { left: `${toLeft}%`, top: `${toTop}%`, transform: "translate(-50%, -50%) translateY(0)", offset: 1 },
      ],
      { duration: STAGE_JUMP_DURATION, easing: "ease-in-out", fill: "forwards" }
    );

    jump.onfinish = () => {
      jump.cancel();
      mapCharacter.style.left = `${toLeft}%`;
      mapCharacter.style.top = `${toTop}%`;
      mapCharacter.style.transition = ""; // 평소 트랜지션 복원
      onDone();
    };
  }

  // 야광귀를 처음 클리어한 직후에만 재생되는 연출: 캐릭터가 야광귀 발판에서
  // 그슨대 발판으로 곧장 점프해서 이동한다.
  function playStageJumpSequence(fromStage, toStage) {
    mapCharacter.src = getCharacterSpriteSrc();
    mapCharacter.style.transition = "none"; // 평소의 left/top 트랜지션과 겹치지 않도록 잠깐 끈다
    mapCharacter.style.left = `${fromStage.left}%`;
    mapCharacter.style.top = `${fromStage.top - CHAR_TOP_OFFSET}%`;
    mapCharacter.hidden = false;

    setTimeout(() => {
      animateStageJump(fromStage, toStage, () => {
        renderMap(); // 최종 상태(발판/캐릭터 위치)를 한 번 더 정리해 확실히 맞춘다
      });
    }, STAGE_JUMP_START_DELAY);
  }

  // 스테이지를 클리어 처리하고 요괴맵으로 돌아간다. 방금 클리어한 스테이지 다음
  // 구간이 있으면 점프 연출을, 없으면(마지막 스테이지) 평소처럼 정적으로 보여준다.
  function clearStageAndReturnToMap(stageKey) {
    clearedStages[stageKey] = true;
    resetHistoryAndShow(mapScreen);

    const fromIndex = STAGES.findIndex((s) => s.key === stageKey);
    const fromStage = STAGES[fromIndex];
    const toStage = STAGES[fromIndex + 1];

    if (!toStage) {
      renderMap();
      return;
    }

    renderMap({ skipCharacterPlacement: true });
    playStageJumpSequence(fromStage, toStage);
  }

  buildStageTrack();
  renderMap();
  buildFireflies("firefly-layer");
  buildFireflies("start-firefly-layer", 14);

  // ---------- 디버그 모드: 요괴맵으로 즉시 진입 + 전체 스테이지 클리어 ----------
  // 시작화면의 cloud1 장식 이미지를 클릭하면 캐릭터 선택(2단계)을 건너뛰고
  // 곧장 요괴맵으로 이동한다. 테스트 편의용이라 별도의 숨김 처리 없이 기존
  // 장식 이미지를 그대로 트리거로 쓴다(style.css의 #debug-cloud-trigger가
  // 이 이미지만 클릭 가능하도록 pointer-events를 풀어준다).
  const debugCloudTrigger = document.getElementById("debug-cloud-trigger");
  debugCloudTrigger.addEventListener("click", () => {
    console.log("디버그 모드 진입");

    debugModeActive = true;

    // 캐릭터 선택을 건너뛰므로, 아직 캐릭터가 선택되지 않았다면 요괴맵에
    // 캐릭터가 정상적으로 보이도록 기본값을 넣어준다.
    if (!window.selectedCharacter) {
      window.selectedCharacter = "boy";
    }

    Object.keys(clearedStages).forEach((key) => {
      clearedStages[key] = true;
    });

    resetHistoryAndShow(mapScreen);
    renderMap();
  });

  // ---------- 야광귀 룰 설명 화면 ----------
  game1ChallengeButton.addEventListener("click", () => {
    console.log("야광귀 게임 시작");
    resetGame1();
    changeScreen(game1PlayScreen);
  });

  // ---------- 그슨대 룰 설명 화면 ----------
  game2ChallengeButton.addEventListener("click", () => {
    console.log("그슨대 게임 시작");
    resetGame2();
    changeScreen(game2PlayScreen);
  });

  // ---------- 불가살이 룰 설명 화면 ----------
  game3ChallengeButton.addEventListener("click", () => {
    console.log("불가살이 게임 시작");
    changeScreen(game3PlayScreen);
    startGame3();
  });

  // ---------- 도깨비 룰 설명 화면 ----------
  game4ChallengeButton.addEventListener("click", () => {
    console.log("도깨비 게임 시작");
    changeScreen(game4PlayScreen, { animate: true });
  });

  // ---------- 도깨비 실제 게임 화면 (맞춤법 퀴즈) ----------

  function handleGame4Correct() {
    console.log("정답! 여린히읗 획득 스토리 화면으로 이동");
    goToGame4Clear();
  }

  // 오답 연출은 야광귀 게임의 handleWrongJamo()와 동일한 기법(화면 흔들림
  // 클래스를 뗐다 리플로우 후 다시 붙이기)을 재사용한다. 다시 선택할 수
  // 있도록 화면 전환 없이 그대로 유지한다.
  function handleGame4Wrong() {
    game4PlayScreen.classList.remove("is-shaking");
    void game4PlayScreen.offsetWidth;
    game4PlayScreen.classList.add("is-shaking");
  }

  function goToGame4Clear() {
    goToGame4Story1();
  }

  game4QuizAButton.addEventListener("click", handleGame4Correct);
  game4QuizBButton.addEventListener("click", handleGame4Wrong);

  // ---------- 불가살이 실제 게임 화면 (쇠 받기) ----------

  const GAME3_STEEL_GOAL = 3; // 클리어에 필요한 쇠 개수
  const GAME3_MOVE_SPEED_PERCENT = 45; // 캐릭터 초당 좌우 이동 속도 (화면 너비 대비 %)
  const GAME3_CHAR_MIN_LEFT = 8; // 캐릭터 이동 가능 범위 (%)
  const GAME3_CHAR_MAX_LEFT = 92;
  const GAME3_FALL_SPEED_MIN = 18; // 낙하 아이템 초당 낙하 속도 최소/최대 (화면 높이 대비 %)
  const GAME3_FALL_SPEED_MAX = 27;
  const GAME3_SPAWN_INTERVAL_MIN = 900; // 아이템 생성 간격 최소/최대 (ms)
  const GAME3_SPAWN_INTERVAL_MAX = 1400;
  const GAME3_ITEM_SPAWN_MARGIN = 8; // 아이템이 스폰되는 x좌표의 좌우 여백 (%)
  const GAME3_MIN_SPAWN_X_GAP = 22; // 직전에 스폰한 아이템과 x좌표가 이 값(%)보다 가까우면 다시 뽑는다
  const GAME3_ITEM_DESPAWN_Y = 112; // 이 아래로 내려가면 화면 밖으로 사라진 것으로 간주 (%)
  // 바구니는 캐릭터 이미지(ms_bs_game_*.png) 안에 이미 그려져 있어서 별도
  // 요소 없이, 캐릭터 렌더링 박스를 기준으로 한 비율로 판정 영역을 잡는다.
  const GAME3_BASKET_Y_RATIO = 0.14; // 캐릭터 박스 위쪽에서부터 바구니 중심까지 비율
  const GAME3_BASKET_HALF_WIDTH_RATIO = 0.4; // 캐릭터 박스 너비 대비 바구니 판정 반폭
  const GAME3_BASKET_CATCH_HEIGHT_RATIO = 0.22; // 캐릭터 박스 높이 대비 세로 판정 허용 범위
  const GAME3_FIRE_SAD_HOLD_MS = 700; // 불을 담은 뒤 슬픈 얼굴을 유지하는 시간
  const GAME3_CLEAR_ADVANCE_MS = 900; // 3개를 다 모은 뒤 다음 화면으로 넘어가기까지의 텀
  const GAME3_TRAIL_PARTICLE_INTERVAL_MS = 220; // 낙하 중 은은한 파티클이 튀는 간격
  const GAME3_TRAIL_PARTICLE_LIFETIME_MS = 550; // 파티클이 사라지기까지(위 keyframe 재생 시간과 맞춤)

  let game3Active = false;
  let game3AnimationFrameId = null;
  let game3SpawnTimer = null;
  let game3LastFrameTime = null;
  let game3FaceResetTimer = null;
  let game3SteelCount = 0;
  let game3CharLeft = 50; // 캐릭터 중심의 left(%)
  let game3DropItems = []; // { el(wrap), img, type, xPercent, yPercent, speed }
  let game3LastSpawnX = null; // 직전에 스폰한 아이템의 x좌표(%) — 연달아 같은 자리에 몰리지 않게 참고한다
  let game3SteelSpawnCount = 0; // 쇠/불 스폰 비율을 50:50에 가깝게 자기보정하기 위한 누적 카운트
  let game3FireSpawnCount = 0;
  const game3KeysPressed = { left: false, right: false };

  function setGame3CharacterFace(face) {
    game3Character.src = `asset/image/ms_bs_game_${face}.png`;
  }

  function flashGame3CharacterFace(face, holdMs) {
    setGame3CharacterFace(face);
    clearTimeout(game3FaceResetTimer);
    game3FaceResetTimer = setTimeout(() => setGame3CharacterFace("happy"), holdMs);
  }

  function updateGame3Count() {
    game3CountValue.textContent = `${game3SteelCount}/${GAME3_STEEL_GOAL}`;
    game3CountBox.classList.remove("is-updated");
    void game3CountBox.offsetWidth; // 연속으로 쇠를 담아도 매번 팝 애니메이션이 재생되도록 리플로우
    game3CountBox.classList.add("is-updated");
  }

  function resetGame3() {
    game3SteelCount = 0;
    game3CharLeft = 50;
    game3KeysPressed.left = false;
    game3KeysPressed.right = false;
    clearTimeout(game3FaceResetTimer);

    game3Character.style.left = `${game3CharLeft}%`;
    setGame3CharacterFace("happy");
    game3PlayScreen.classList.remove("is-shaking", "is-fire-hit");
    updateGame3Count();

    game3DropLayer.innerHTML = "";
    game3DropItems = [];
    game3LastSpawnX = null;
    game3SteelSpawnCount = 0;
    game3FireSpawnCount = 0;
  }

  function scheduleGame3Spawn() {
    const delay = GAME3_SPAWN_INTERVAL_MIN + Math.random() * (GAME3_SPAWN_INTERVAL_MAX - GAME3_SPAWN_INTERVAL_MIN);
    game3SpawnTimer = setTimeout(() => {
      if (!game3Active || game3PlayScreen.hidden) return; // 화면을 벗어난 뒤에는 스스로 멈춘다
      spawnGame3Item();
      scheduleGame3Spawn();
    }, delay);
  }

  // 직전 스폰 위치와 너무 가까우면 다시 뽑아서, 아이템들이 같은 자리에
  // 겹쳐 떨어지는 일을 줄인다.
  function pickGame3SpawnX() {
    const range = 100 - GAME3_ITEM_SPAWN_MARGIN * 2;
    let xPercent = GAME3_ITEM_SPAWN_MARGIN + Math.random() * range;

    if (game3LastSpawnX !== null) {
      let attempts = 0;
      while (Math.abs(xPercent - game3LastSpawnX) < GAME3_MIN_SPAWN_X_GAP && attempts < 6) {
        xPercent = GAME3_ITEM_SPAWN_MARGIN + Math.random() * range;
        attempts += 1;
      }
    }

    return xPercent;
  }

  // 매번 완전히 독립적인 동전 던지기(Math.random() < 0.5)만 쓰면 수학적으로는
  // 50:50이어도 짧은 구간에서는 한쪽이 몰아서 나오는 스트릭이 흔해서 체감상
  // 편중돼 보인다. 지금까지 더 적게 나온 쪽에 확률을 살짝 더 실어주는
  // 자기보정 방식으로 바꿔, 실제 체감 비율이 50:50에 가깝게 유지되게 한다.
  function pickGame3ItemType() {
    if (game3SteelSpawnCount === game3FireSpawnCount) {
      return Math.random() < 0.5 ? "steel" : "fire";
    }

    const steelIsBehind = game3SteelSpawnCount < game3FireSpawnCount;
    const steelChance = steelIsBehind ? 0.7 : 0.3;
    return Math.random() < steelChance ? "steel" : "fire";
  }

  // <img>에는 ::before 트레일이 렌더링되지 않는 브라우저가 많아서, 위치를
  // 잡는 wrap(div) 안에 실제 그림(img)을 한 겹 더 넣는 구조로 만든다.
  function spawnGame3Item() {
    const type = pickGame3ItemType();
    if (type === "steel") game3SteelSpawnCount += 1;
    else game3FireSpawnCount += 1;

    const xPercent = pickGame3SpawnX();
    const speed = GAME3_FALL_SPEED_MIN + Math.random() * (GAME3_FALL_SPEED_MAX - GAME3_FALL_SPEED_MIN);
    const yPercent = -8;
    game3LastSpawnX = xPercent;

    const wrap = document.createElement("div");
    wrap.className = `game3-drop-item-wrap game3-drop-item-wrap--${type}`;
    wrap.style.left = `${xPercent}%`;
    wrap.style.top = `${yPercent}%`;

    const img = document.createElement("img");
    img.className = "game3-drop-item";
    img.src = `asset/image/game3_${type}.png`;
    img.alt = type === "steel" ? "쇠" : "불";
    wrap.appendChild(img);

    game3DropLayer.appendChild(wrap);
    game3DropItems.push({ el: wrap, img, type, xPercent, yPercent, speed, particleTimer: 0 });
  }

  // 아이템 현재 위치에 아주 작은 불꽃/파편 파티클 하나를 튀우고 짧게 사라지게 한다.
  function spawnGame3TrailParticle(item) {
    const screenRect = game3PlayScreen.getBoundingClientRect();
    const itemRect = item.img.getBoundingClientRect();
    const leftPercent = ((itemRect.left + itemRect.width / 2 - screenRect.left) / screenRect.width) * 100;
    const topPercent = ((itemRect.top + itemRect.height / 2 - screenRect.top) / screenRect.height) * 100;

    const particle = document.createElement("div");
    particle.className = `game3-trail-particle game3-trail-particle--${item.type}`;
    particle.style.left = `${leftPercent + (Math.random() * 5 - 2.5)}%`;
    particle.style.top = `${topPercent + (Math.random() * 3 - 1.5)}%`;
    game3DropLayer.appendChild(particle);

    setTimeout(() => particle.remove(), GAME3_TRAIL_PARTICLE_LIFETIME_MS);
  }

  function handleGame3SteelCatch(item) {
    item.el.classList.add("is-caught");
    setTimeout(() => item.el.remove(), 300);

    const screenRect = game3PlayScreen.getBoundingClientRect();
    const itemRect = item.img.getBoundingClientRect();
    const leftPercent = ((itemRect.left + itemRect.width / 2 - screenRect.left) / screenRect.width) * 100;
    const topPercent = ((itemRect.top + itemRect.height / 2 - screenRect.top) / screenRect.height) * 100;
    createSparkleBurst(game3PlayScreen, leftPercent, topPercent, "#eef3ff");

    game3SteelCount += 1;
    updateGame3Count();

    if (game3SteelCount >= GAME3_STEEL_GOAL) {
      console.log("불가살이 클리어!");
      stopGame3();
      setTimeout(goToGame3Clear, GAME3_CLEAR_ADVANCE_MS);
    }
  }

  function handleGame3FireCatch(item) {
    item.el.remove();

    game3PlayScreen.classList.remove("is-fire-hit");
    void game3PlayScreen.offsetWidth;
    game3PlayScreen.classList.add("is-fire-hit");

    game3PlayScreen.classList.remove("is-shaking");
    void game3PlayScreen.offsetWidth; // 연속으로 불을 담아도 매번 흔들림이 재생되도록 리플로우 (야광귀 오답 연출과 동일한 기법)
    game3PlayScreen.classList.add("is-shaking");

    flashGame3CharacterFace("sad", GAME3_FIRE_SAD_HOLD_MS);
  }

  // 캐릭터 이동 + 낙하 아이템 갱신 + 바구니 충돌 판정을 매 프레임 처리한다.
  function stepGame3(timestamp) {
    if (!game3Active || game3PlayScreen.hidden) {
      game3Active = false;
      return;
    }

    if (game3LastFrameTime === null) game3LastFrameTime = timestamp;
    const deltaSeconds = (timestamp - game3LastFrameTime) / 1000;
    game3LastFrameTime = timestamp;

    if (game3KeysPressed.left && !game3KeysPressed.right) {
      game3CharLeft -= GAME3_MOVE_SPEED_PERCENT * deltaSeconds;
    } else if (game3KeysPressed.right && !game3KeysPressed.left) {
      game3CharLeft += GAME3_MOVE_SPEED_PERCENT * deltaSeconds;
    }
    game3CharLeft = Math.min(GAME3_CHAR_MAX_LEFT, Math.max(GAME3_CHAR_MIN_LEFT, game3CharLeft));
    game3Character.style.left = `${game3CharLeft}%`;

    const charRect = game3Character.getBoundingClientRect();
    const basketCenterX = charRect.left + charRect.width / 2;
    const basketCenterY = charRect.top + charRect.height * GAME3_BASKET_Y_RATIO;
    const basketHalfWidth = charRect.width * GAME3_BASKET_HALF_WIDTH_RATIO;
    const basketCatchHeight = charRect.height * GAME3_BASKET_CATCH_HEIGHT_RATIO;

    for (let i = game3DropItems.length - 1; i >= 0; i--) {
      const item = game3DropItems[i];
      item.yPercent += item.speed * deltaSeconds;
      item.el.style.top = `${item.yPercent}%`;

      item.particleTimer += deltaSeconds * 1000;
      if (item.particleTimer >= GAME3_TRAIL_PARTICLE_INTERVAL_MS) {
        item.particleTimer = 0;
        spawnGame3TrailParticle(item);
      }

      const itemRect = item.img.getBoundingClientRect();
      const itemCenterX = itemRect.left + itemRect.width / 2;
      const itemCenterY = itemRect.top + itemRect.height / 2;
      const dx = Math.abs(itemCenterX - basketCenterX);
      const dy = Math.abs(itemCenterY - basketCenterY);

      if (dx <= basketHalfWidth && dy <= basketCatchHeight) {
        game3DropItems.splice(i, 1);
        if (item.type === "steel") {
          handleGame3SteelCatch(item);
        } else {
          handleGame3FireCatch(item);
        }
        continue;
      }

      if (item.yPercent > GAME3_ITEM_DESPAWN_Y) {
        item.el.remove(); // 못 담고 지나친 아이템은 페널티 없이 그냥 사라진다
        game3DropItems.splice(i, 1);
      }
    }

    game3AnimationFrameId = requestAnimationFrame(stepGame3);
  }

  function startGame3() {
    resetGame3();
    game3Active = true;
    game3LastFrameTime = null;
    scheduleGame3Spawn();
    game3AnimationFrameId = requestAnimationFrame(stepGame3);
  }

  function stopGame3() {
    game3Active = false;
    if (game3AnimationFrameId) cancelAnimationFrame(game3AnimationFrameId);
    clearTimeout(game3SpawnTimer);
    game3AnimationFrameId = null;
    game3SpawnTimer = null;
  }

  function goToGame3Clear() {
    console.log("옛이응 획득 스토리 화면으로 이동");
    goToGame3Story1();
  }

  document.addEventListener("keydown", (event) => {
    if (!game3Active) return;
    if (event.key === "ArrowLeft") game3KeysPressed.left = true;
    else if (event.key === "ArrowRight") game3KeysPressed.right = true;
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") game3KeysPressed.left = false;
    else if (event.key === "ArrowRight") game3KeysPressed.right = false;
  });

  // ---------- 그슨대 실제 게임 화면 (숨은그림찾기 + 손전등) ----------

  // 목업(5.game2.png) 실측 좌표(화면 대비 %) 기준 배치. gs 하나만 진짜
  // 그슨대이고 나머지(item1~3)는 손전등을 비춰도 밝아지기만 하는 가짜 세모다.
  const HIDDEN_OBJECTS = [
    { id: "deco-1", type: "item1", top: 69.9, left: 7.8, width: 9.2 },
    { id: "deco-2", type: "item2", top: 78.7, left: 23.2, width: 9.8 },
    { id: "deco-3", type: "item3", top: 70.8, left: 38.5, width: 9.2 },
    { id: "deco-4", type: "item2", top: 87.9, left: 54.2, width: 9.8 },
    { id: "gs", type: "gs", top: 72.2, left: 71.4, width: 10.2 },
    { id: "deco-5", type: "item1", top: 70.8, left: 88.5, width: 9.2 },
  ];

  const SPOTLIGHT_RADIUS_PERCENT = 11; // 손전등 반경 (화면 너비 대비 %)
  const GS_SURPRISE_TO_FLEE_MS = 900; // 놀람(hidgs_3) -> 도망(hidgs_4)
  const GS_FLEE_TO_NEXT_MS = 900; // 도망 연출 후 다음 화면 전환까지

  let game2Found = false; // 그슨대를 이미 찾았는지 (중복 트리거 방지)

  // 가짜 세모(item1~3)의 실제 파일명은 game2_hiditem1.png / _on.png 형태라
  // obj.type("item1")과 파일명 사이에 "hid" 접두어가 하나 더 붙는다.
  function getHiddenObjectSrc(type, isLit) {
    if (type === "gs") return "asset/image/game2_hidgs_1.png";
    return `asset/image/game2_hid${type}${isLit ? "_on" : ""}.png`;
  }

  function buildGame2HiddenObjects() {
    game2HiddenLayer.innerHTML = "";

    HIDDEN_OBJECTS.forEach((obj) => {
      const img = document.createElement("img");
      img.className = "game2-hidden-obj";
      img.id = `game2-hidden-${obj.id}`;
      img.dataset.type = obj.type;
      img.dataset.lit = "false";
      img.style.top = `${obj.top}%`;
      img.style.left = `${obj.left}%`;
      img.style.width = `${obj.width}%`;
      img.src = getHiddenObjectSrc(obj.type, false);
      img.alt = obj.type === "gs" ? "그슨대" : "";
      game2HiddenLayer.appendChild(img);
    });
  }

  function resetGame2() {
    game2Found = false;
    game2Mission.classList.remove("is-hidden");
    game2MissionFind.classList.remove("is-visible");
    game2PlayScreen.style.setProperty("--x", "50%");
    game2PlayScreen.style.setProperty("--y", "50%");
    game2PlayScreen.style.setProperty("--radius", "0px");
    buildGame2HiddenObjects();
  }

  // 미션 문구(mission_game2_main.png)가 안내하는 대로, 손전등이 그슨대를
  // 비추고 있는(hidgs_2) 상태에서 화면을 클릭하면 호출된다. 이후는 되돌릴
  // 수 없는 '놀람(hidgs_3, 찾았다! 등장) -> 도망(hidgs_4)' 순서 연출로 넘어간다.
  function revealGeuseundae() {
    if (game2Found) return;
    game2Found = true;

    const gsEl = document.getElementById("game2-hidden-gs");
    gsEl.src = "asset/image/game2_hidgs_3.png";
    game2Mission.classList.add("is-hidden"); // 상단 기본 미션 문구는 사라지고
    game2MissionFind.classList.add("is-visible"); // "찾았다!"가 그 자리에 나타난다

    setTimeout(() => {
      gsEl.src = "asset/image/game2_hidgs_4.png";
      gsEl.classList.add("is-fleeing");
    }, GS_SURPRISE_TO_FLEE_MS);

    setTimeout(() => {
      console.log("반시옷 획득 스토리 화면으로 이동");
      goToGame2Story1();
    }, GS_SURPRISE_TO_FLEE_MS + GS_FLEE_TO_NEXT_MS);
  }

  // 손전등 중심(px, 뷰포트 기준)과 각 요소 중심 사이 거리를 재서 반경 안에
  // 들어왔는지 판정한다. 반경 안에 들어오면 hidgs_1 <-> hidgs_2(밝아짐,
  // 가짜 세모는 _on)를 오간다. 미션 문구가 안내하는 "눌러 찾기"는 이 함수가
  // 아니라 아래 click 리스너가 처리한다 — 여기서는 시각적 밝기 상태만 갱신한다.
  function updateGame2SpotlightHits(cursorX, cursorY, radiusPx) {
    if (game2Found) return;

    const screenRect = game2PlayScreen.getBoundingClientRect();

    HIDDEN_OBJECTS.forEach((obj) => {
      const el = document.getElementById(`game2-hidden-${obj.id}`);
      if (!el) return;

      const centerX = screenRect.left + (obj.left / 100) * screenRect.width;
      const centerY = screenRect.top + (obj.top / 100) * screenRect.height;
      const isLit = Math.hypot(cursorX - centerX, cursorY - centerY) <= radiusPx;

      const wasLit = el.dataset.lit === "true";
      if (isLit === wasLit) return;

      el.dataset.lit = isLit ? "true" : "false";
      el.src =
        obj.type === "gs"
          ? `asset/image/game2_hidgs_${isLit ? "2" : "1"}.png`
          : getHiddenObjectSrc(obj.type, isLit);
      el.classList.toggle("is-lit", isLit);
    });
  }

  game2PlayScreen.addEventListener("mousemove", (event) => {
    const screenRect = game2PlayScreen.getBoundingClientRect();
    const radiusPx = screenRect.width * (SPOTLIGHT_RADIUS_PERCENT / 100);
    const x = event.clientX - screenRect.left;
    const y = event.clientY - screenRect.top;

    game2PlayScreen.style.setProperty("--x", `${x}px`);
    game2PlayScreen.style.setProperty("--y", `${y}px`);
    game2PlayScreen.style.setProperty("--radius", `${radiusPx}px`);

    updateGame2SpotlightHits(event.clientX, event.clientY, radiusPx);
  });

  // 미션 문구(mission_game2_main.png): "비슷한 세모들 사이에서 그슨대를
  // 눌러 찾아주세요" — 손전등으로 비춘 뒤 "클릭"해야 다음 단계로 넘어가는
  // 것이 원래 의도였는데, 기존 코드에는 클릭 리스너 자체가 없어 손전등을
  // 3초간 움직이지 않고 버텨야만(그마저도 클릭 동작과 무관하게) 자동으로
  // 통과되는 상태였다. 손전등이 그슨대를 비추고 있는 동안 클릭하면 바로
  // 찾은 것으로 처리하도록 클릭 판정을 좌표 기반으로 새로 추가한다.
  game2PlayScreen.addEventListener("click", (event) => {
    if (game2Found) return;

    const gsObj = HIDDEN_OBJECTS.find((obj) => obj.type === "gs");
    const screenRect = game2PlayScreen.getBoundingClientRect();
    const radiusPx = screenRect.width * (SPOTLIGHT_RADIUS_PERCENT / 100);
    const centerX = screenRect.left + (gsObj.left / 100) * screenRect.width;
    const centerY = screenRect.top + (gsObj.top / 100) * screenRect.height;
    const isOnGs = Math.hypot(event.clientX - centerX, event.clientY - centerY) <= radiusPx;

    if (isOnGs) revealGeuseundae();
  });

  // ---------- 야광귀 실제 게임 화면 ('짚신' 자모 조합) ----------

  const game1Character = document.getElementById("game1-character");
  const jamoPieces = document.querySelectorAll(".jamo-piece");

  // '짚신'의 자모 순서. 2번째·5번째가 둘 다 'ㅣ'라서 game1_word2 / game1_word5
  // 중 아직 안 쓴 조각을 아무거나 클릭해도 그 순번의 정답으로 인정된다.
  const JIPSIN_LETTERS = ["ㅈ", "ㅣ", "ㅍ", "ㅅ", "ㅣ", "ㄴ"];
  const JIPSIN_LENGTH = JIPSIN_LETTERS.length;

  let jipsinProgress = 0; // 지금까지 맞춘 자모 개수 (다음에 필요한 글자 = JIPSIN_LETTERS[jipsinProgress])
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
      piece.classList.remove("is-used");
      piece.style.visibility = "";
      piece.getAnimations().forEach((anim) => anim.cancel()); // 진행 중이던 날아가기 애니메이션 정리
    });

    for (let order = 1; order <= JIPSIN_LENGTH; order++) {
      const box = document.getElementById(`wordbox-${order}`);
      box.classList.remove("is-filled");
      box.src = `asset/image/game1_wordbox${order}_off.png`;
    }
  }

  // container 안의 (leftPercent, topPercent) 위치에 color 색으로 반짝이는
  // 파티클(중심 플래시 + 사방으로 튀는 점들)을 띄운다. 야광귀 게임의 자모 정답
  // 이펙트와 짚신 완성 스토리 연출이 함께 사용한다.
  // options.scale: 코어/점 크기와 퍼지는 반경을 함께 키우는 배율(기본 1) —
  // 엔딩의 "화면 전체에 크게 한 번" 연출이 이 배율만 키워서 재사용한다.
  // options.dotCount: 사방으로 튀는 점 개수(기본 14).
  function createSparkleBurst(container, leftPercent, topPercent, color, options = {}) {
    const scale = options.scale || 1;
    const dotCount = options.dotCount || 14;

    const burst = document.createElement("div");
    burst.className = "sparkle-burst";
    burst.style.left = `${leftPercent}%`;
    burst.style.top = `${topPercent}%`;
    burst.style.setProperty("--burst-color", color);
    burst.style.setProperty("--burst-scale", scale);

    const core = document.createElement("div");
    core.className = "sparkle-core";
    burst.appendChild(core);

    for (let i = 0; i < dotCount; i++) {
      const angle = (360 / dotCount) * i + (Math.random() * 18 - 9); // 살짝 흩뿌려 자연스럽게
      const radius = (13 + Math.random() * 9) * scale; // vh 단위, 사방으로 퍼지는 거리 (더 넓게)
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

    container.appendChild(burst);
    setTimeout(() => burst.remove(), 400);
  }

  // 조각의 화면상 중심 좌표(%)를 계산해 그 위치에 자모 고유 색으로 파티클을 띄운다.
  function spawnSparkle(piece, order) {
    const pieceRect = piece.getBoundingClientRect();
    const screenRect = game1PlayScreen.getBoundingClientRect();
    const color = JAMO_COLORS[order] || "#ffe08a";
    const leftPercent = ((pieceRect.left + pieceRect.width / 2 - screenRect.left) / screenRect.width) * 100;
    const topPercent = ((pieceRect.top + pieceRect.height / 2 - screenRect.top) / screenRect.height) * 100;

    createSparkleBurst(game1PlayScreen, leftPercent, topPercent, color);
  }

  // 정답 조각이 파티클 이펙트 직후 해당 wordbox 위치로 짧게 날아가 들어가는 연출.
  // 도착 타이밍에 맞춰 wordbox가 off -> on 이미지로 전환된다.
  function flyPieceIntoBox(piece, box, slot) {
    const pieceRect = piece.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    const dx = (boxRect.left + boxRect.width / 2) - (pieceRect.left + pieceRect.width / 2);
    const dy = (boxRect.top + boxRect.height / 2) - (pieceRect.top + pieceRect.height / 2);

    const flight = piece.animate(
      [
        { transform: "translate(-50%, -50%) translate(0px, 0px) scale(1)", offset: 0 },
        { transform: `translate(-50%, -50%) translate(${dx * 0.4}px, ${dy * 0.4}px) scale(1.15)`, offset: 0.35 },
        { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.15)`, offset: 1 },
      ],
      { duration: 230, easing: "cubic-bezier(0.45, 0, 0.8, 0.4)", fill: "forwards" }
    );

    flight.onfinish = () => {
      box.src = `asset/image/game1_wordbox${slot}_on.png`;
      box.classList.remove("is-filled");
      void box.offsetWidth; // 리플로우시켜 완성 박스 애니메이션이 매번 재생되게 함
      box.classList.add("is-filled");

      piece.style.visibility = "hidden";
    };
  }

  function flashCharacterFace(face) {
    setCharacterFace(face);
    clearTimeout(faceResetTimer);
    faceResetTimer = setTimeout(() => setCharacterFace("basic"), 700);
  }

  const SPARKLE_TO_FLIGHT_DELAY = 80; // 파티클이 터지고 나서 자모가 날아가기 시작하기까지(ms)

  function handleCorrectJamo(piece) {
    jipsinProgress += 1;
    const slot = jipsinProgress; // 방금 채운 wordbox 순번
    const order = Number(piece.dataset.order); // 조각 고유 색상 조회용
    const box = document.getElementById(`wordbox-${slot}`);

    piece.classList.add("is-used"); // 재클릭 방지 (파티클/비행 중 클릭 잠금)
    spawnSparkle(piece, order);

    setTimeout(() => {
      flyPieceIntoBox(piece, box, slot);
    }, SPARKLE_TO_FLIGHT_DELAY);

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
      const neededLetter = JIPSIN_LETTERS[jipsinProgress];
      const isMatchingLetter = piece.dataset.letter === neededLetter;

      if (piece.classList.contains("is-used") || !isMatchingLetter) {
        handleWrongJamo();
        return;
      }

      handleCorrectJamo(piece);
    });
  });

  // ---------- 야광귀 클리어 스토리 연출 ----------

  const yagwanggwiStory1Screen = document.getElementById("yagwanggwi-story1-screen");
  const yagwanggwiStory2Screen = document.getElementById("yagwanggwi-story2-screen");
  const yagwanggwiStory3Screen = document.getElementById("yagwanggwi-story3-screen");
  const story3Card = document.getElementById("story3-card");
  const story3CardInner = document.getElementById("story3-card-inner");
  const story3NextButton = document.getElementById("story3-next-button");

  const STORY_HOLD_MS = 3000; // 각 스토리 화면이 완전히 등장한 뒤 유지되는 시간
  const ZIPSIN_SPARKLE_DELAY_MS = 950; // 짚신이 팝인을 마치고 반짝임이 시작되는 시점과 맞춘다

  // 짚신이 나타나며 한 번 반짝이는 순간에 맞춰 터지는 파티클.
  function spawnZipsinSparkle() {
    createSparkleBurst(yagwanggwiStory1Screen, 50, 54, "#ffe08a");
  }

  function goToStory1() {
    changeScreen(yagwanggwiStory1Screen, { animate: true });
    setTimeout(spawnZipsinSparkle, ZIPSIN_SPARKLE_DELAY_MS);
    setTimeout(goToStory2, 1300 + STORY_HOLD_MS); // 등장 연출(약 1.3초) + 유지(3초)
  }

  function goToStory2() {
    changeScreen(yagwanggwiStory2Screen, { animate: true });
    setTimeout(goToStory3, 1400 + STORY_HOLD_MS);
  }

  // 카드가 아래에서 회전하며 올라오는 연출은 순수 CSS 키프레임이 아니라
  // Web Animations API로 직접 재생한다. 애니메이션이 끝나면 반드시 cancel()해서
  // "채워진 채로 남아있는" 애니메이션 값이 클릭 후 뒤집기(.is-flipped) 클래스와
  // 충돌하지 않도록 정리한다. 야광귀/그슨대 카드 클리어 스토리가 공용으로 쓴다.
  function playClearCardEntrance(card, cardInner) {
    card.classList.remove("is-settled", "is-flipped");
    card.getAnimations().forEach((anim) => anim.cancel());
    cardInner.getAnimations().forEach((anim) => anim.cancel());

    card.animate(
      [
        { top: "130%", opacity: 0, offset: 0 },
        { top: "130%", opacity: 1, offset: 0.12 },
        { top: "55%", opacity: 1, offset: 1 },
      ],
      { duration: 900, delay: 500, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)", fill: "forwards" }
    );

    const spin = cardInner.animate(
      [{ transform: "rotateY(0deg)" }, { transform: "rotateY(1080deg)" }], // 1080deg = 3바퀴, 앞면으로 정지
      { duration: 900, delay: 500, easing: "linear", fill: "forwards" }
    );

    spin.onfinish = () => {
      card.getAnimations().forEach((anim) => anim.cancel());
      cardInner.getAnimations().forEach((anim) => anim.cancel());
      card.classList.add("is-settled"); // 정지 + 클릭 가능 상태로 전환
    };
  }

  function goToStory3() {
    changeScreen(yagwanggwiStory3Screen, { animate: true });
    playClearCardEntrance(story3Card, story3CardInner);
  }

  story3Card.addEventListener("click", () => {
    if (!story3Card.classList.contains("is-settled")) return; // 등장 연출 끝나기 전엔 무시
    story3Card.classList.toggle("is-flipped");
  });

  story3NextButton.addEventListener("click", () => {
    clearStageAndReturnToMap("yagwanggwi");
  });

  function goToScreen(name) {
    if (name === "yagwanggwi-clear") {
      goToStory1();
    }
  }

  // ---------- 그슨대 클리어 스토리 연출 ----------

  const game2Story1Screen = document.getElementById("game2-story1-screen");
  const game2Story2Screen = document.getElementById("game2-story2-screen");
  const game2StoryCard = document.getElementById("game2-story-card");
  const game2StoryCardInner = document.getElementById("game2-story-card-inner");
  const game2StoryNextButton = document.getElementById("game2-story-next-button");

  // 그슨대가 2초간 멈춰 있다가 말풍선이 뜨는 연출은 CSS의
  // .game2-story1-talk animation-delay(2s)가 담당한다.
  const GAME2_STORY1_ADVANCE_MS = 4500; // 진입 후 story2로 자동 전환되기까지 총 시간

  function goToGame2Story1() {
    changeScreen(game2Story1Screen, { animate: true });
    setTimeout(goToGame2Story2, GAME2_STORY1_ADVANCE_MS);
  }

  function goToGame2Story2() {
    changeScreen(game2Story2Screen, { animate: true });
    playClearCardEntrance(game2StoryCard, game2StoryCardInner);
  }

  game2StoryCard.addEventListener("click", () => {
    if (!game2StoryCard.classList.contains("is-settled")) return; // 등장 연출 끝나기 전엔 무시
    game2StoryCard.classList.toggle("is-flipped");
  });

  game2StoryNextButton.addEventListener("click", () => {
    clearStageAndReturnToMap("geuseundae");
  });

  // ---------- 불가살이 클리어 스토리 연출 ----------

  const game3Story1Screen = document.getElementById("game3-story1-screen");
  const game3Story2Screen = document.getElementById("game3-story2-screen");
  const game3StoryCard = document.getElementById("game3-story-card");
  const game3StoryCardInner = document.getElementById("game3-story-card-inner");
  const game3StoryNextButton = document.getElementById("game3-story-next-button");

  const GAME3_STORY1_ADVANCE_MS = 3200; // 진입 후 카드 획득 화면으로 자동 전환되기까지 총 시간

  function goToGame3Story1() {
    changeScreen(game3Story1Screen, { animate: true });
    setTimeout(goToGame3Story2, GAME3_STORY1_ADVANCE_MS);
  }

  function goToGame3Story2() {
    changeScreen(game3Story2Screen, { animate: true });
    playClearCardEntrance(game3StoryCard, game3StoryCardInner);
  }

  game3StoryCard.addEventListener("click", () => {
    if (!game3StoryCard.classList.contains("is-settled")) return; // 등장 연출 끝나기 전엔 무시
    game3StoryCard.classList.toggle("is-flipped");
  });

  game3StoryNextButton.addEventListener("click", () => {
    clearStageAndReturnToMap("bulgasari");
  });

  // ---------- 도깨비 클리어 스토리 연출 ----------

  const game4Story1Screen = document.getElementById("game4-story1-screen");
  const game4Story2Screen = document.getElementById("game4-story2-screen");
  const game4StoryCard = document.getElementById("game4-story-card");
  const game4StoryCardInner = document.getElementById("game4-story-card-inner");
  const game4StoryNextButton = document.getElementById("game4-story-next-button");

  const GAME4_STORY1_ADVANCE_MS = 3200; // 진입 후 카드 획득 화면으로 자동 전환되기까지 총 시간

  function goToGame4Story1() {
    changeScreen(game4Story1Screen, { animate: true });
    setTimeout(goToGame4Story2, GAME4_STORY1_ADVANCE_MS);
  }

  function goToGame4Story2() {
    changeScreen(game4Story2Screen, { animate: true });
    playClearCardEntrance(game4StoryCard, game4StoryCardInner);
  }

  game4StoryCard.addEventListener("click", () => {
    if (!game4StoryCard.classList.contains("is-settled")) return; // 등장 연출 끝나기 전엔 무시
    game4StoryCard.classList.toggle("is-flipped");
  });

  // 도깨비는 마지막 스테이지라 요괴맵으로 돌아가는 대신 곧장 엔딩(4장의
  // 자모 카드 모으기) 연출로 이어간다. clearedStages는 요괴맵 상태 표시용으로
  // 계속 갱신해 두되(나중에 뒤로가기/홈으로 맵에 들르는 경우를 대비),
  // 화면 전환 자체는 resetHistoryAndShow(mapScreen) 없이 바로 진행한다.
  game4StoryNextButton.addEventListener("click", () => {
    clearedStages.dokkaebi = true;
    console.log("게임 클리어! 모든 자모 획득 완료 -> 엔딩 카드 연출로 이동");
    goToEndingCards();
  });

  // ---------- 엔딩: 4장의 자모 카드 모으기 ----------

  const endingCardsScreen = document.getElementById("ending-cards-screen");
  const endingNextButton = document.getElementById("ending-next-button");

  // 카드 4장이 card_1 -> card_2 -> card_3 -> card_5 순서로 하나씩 내려와
  // 자리잡은 뒤 잠깐(0.5초) 멈춰 있다가, 화면 전체에 크게 반짝이는 빛과
  // 완성 문구가 뜬다. 각 카드의 등장 애니메이션(순차 진입, 0.85초씩)은
  // CSS(#ending-cards-screen.is-playing .ending-card--*)가 담당하므로,
  // 여기서는 그 애니메이션들이 전부 끝난 뒤의 타이밍만 계산한다:
  // 가장 늦게 시작하는 카드(1.65s 딜레이) + 재생 시간(0.85s) = 2.5s에
  // 안착 -> 0.5초 정지 -> 3s에 빛 연출 시작.
  const ENDING_GLOW_DELAY_MS = 3000;

  function goToEndingCards() {
    changeScreen(endingCardsScreen, { animate: true });

    setTimeout(() => {
      // 정답 파티클(createSparkleBurst)을 화면 중앙에 훨씬 크게 한 번
      // 터뜨려 "훈민정음 28자모 완성!" 텍스트와 함께 등장하게 한다.
      createSparkleBurst(endingCardsScreen, 50, 50, "#ffe08a", { scale: 3.2, dotCount: 24 });
    }, ENDING_GLOW_DELAY_MS);
  }

  endingNextButton.addEventListener("click", () => {
    changeScreen(endingGreetingScreen, { animate: true });
  });

  // ---------- 엔딩: 요괴들 인사 ----------

  const endingGreetingScreen = document.getElementById("ending-greeting-screen");
  const endingGreetingNextButton = document.getElementById("ending-greeting-next-button");

  endingGreetingNextButton.addEventListener("click", () => {
    changeScreen(webcamScreen, { animate: true });
    startWebcamStream();
  });

  // ---------- 엔딩: 웹캠 촬영 화면 ----------

  const webcamScreen = document.getElementById("webcam-screen");
  const webcamVideo = document.getElementById("webcam-video");
  const webcamFrameImg = document.getElementById("webcam-frame-img");
  const webcamError = document.getElementById("webcam-error");
  const webcamPhotoButton = document.getElementById("webcam-photo-button");

  // final_frame.png(1920x1080) 원본을 실측해서 구한, 가운데 투명 구멍(웹캠이
  // 비치는 자리)의 픽셀 좌표. style.css의 .webcam-video-wrap(%) 값과
  // 반드시 같은 자리를 가리켜야 미리보기와 캡처 결과가 어긋나지 않는다.
  const FRAME_NATIVE_WIDTH = 1920;
  const FRAME_NATIVE_HEIGHT = 1080;
  const WEBCAM_HOLE_PX = { x: 473, y: 170, width: 974, height: 589 };

  // 캔버스에 그려 넣을 프레임 이미지는 화면에 항상 떠 있는 webcamFrameImg
  // (#webcam-frame-img)를 그대로 재사용하지 않고 별도로 한 번 더 로드한다.
  // file://로 페이지를 직접 열었을 때, crossOrigin 없이 로드된 로컬 이미지를
  // canvas에 그리면 canvas가 "오염(tainted)"되어 toDataURL() 호출 시
  // SecurityError가 난다 — crossOrigin="anonymous"를 준 뒤 다시 로드하면
  // 해결되는, 이 문제의 표준적인 우회법이다. 화면에 계속 보여야 하는
  // webcamFrameImg 자체를 건드리면 혹시 이 로드가 실패했을 때 프레임 장식이
  // 통째로 사라지는 회귀가 생기므로, 캡처 전용 사본을 따로 둔다.
  let webcamFrameCaptureImg = null;
  let webcamFrameCaptureImgPromise = null;

  function loadWebcamFrameCaptureImg() {
    if (webcamFrameCaptureImgPromise) return webcamFrameCaptureImgPromise;

    webcamFrameCaptureImgPromise = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        webcamFrameCaptureImg = img;
        console.log("[웹캠] 캡처용 프레임 이미지(crossOrigin) 로드 성공");
        resolve(img);
      };
      img.onerror = (event) => {
        // crossOrigin 로드가 실패하면(주로 file://를 벗어난 특이 케이스)
        // 이미 화면에 붙어 있는 프레임 이미지로 대체한다. 이 경우 캡처 시
        // 여전히 SecurityError가 날 수 있지만, 그때는 콘솔에 그대로 로그가
        // 남으므로 원인 파악은 가능하다.
        console.log("[웹캠] 캡처용 프레임 이미지(crossOrigin) 로드 실패, 기본 프레임 이미지로 대체:", event);
        webcamFrameCaptureImg = webcamFrameImg;
        resolve(webcamFrameImg);
      };
      img.src = webcamFrameImg.currentSrc || webcamFrameImg.src;
    });

    return webcamFrameCaptureImgPromise;
  }

  let webcamStream = null;
  let capturedPhotoDataUrl = null; // 다음 화면(결과 확인)에서 쓸 합성 캡처 결과(base64 PNG)
  let webcamNoticeTimer = null; // "아직 준비 중이에요" 같은 일시적 안내 문구를 자동으로 닫는 타이머

  function stopWebcamStream() {
    webcamVideo.onloadedmetadata = null;
    if (!webcamStream) return;
    webcamStream.getTracks().forEach((track) => track.stop());
    webcamStream = null;
    webcamVideo.srcObject = null;
  }

  function showWebcamError(message) {
    clearTimeout(webcamNoticeTimer);
    webcamError.textContent = message;
    webcamError.hidden = false;
    webcamPhotoButton.disabled = true;
  }

  // 에러는 아니지만 "아직 촬영할 수 없는 상태"를 잠깐 알려주는 안내 문구.
  // (예: 카메라 초기화가 끝나기 전에 촬영 버튼을 눌렀을 때) 일정 시간 뒤
  // 자동으로 사라지고, 버튼을 비활성화하지는 않는다.
  function flashWebcamNotice(message, durationMs = 1600) {
    webcamError.textContent = message;
    webcamError.hidden = false;
    clearTimeout(webcamNoticeTimer);
    webcamNoticeTimer = setTimeout(() => {
      webcamError.hidden = true;
    }, durationMs);
  }

  async function startWebcamStream() {
    clearTimeout(webcamNoticeTimer);
    webcamError.hidden = true;
    webcamPhotoButton.disabled = true;
    loadWebcamFrameCaptureImg(); // 촬영 버튼을 누르기 전에 미리 로드해둔다.

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showWebcamError("이 브라우저에서는 카메라를 사용할 수 없어요.\n다른 브라우저로 시도해주세요.");
      return;
    }

    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      console.log("[웹캠] 카메라 스트림 획득 성공");

      // 화면을 이동한 사이(연출 애니메이션 중) 사용자가 이미 뒤로가기/홈으로
      // 나가버렸다면 스트림만 즉시 정리하고 video에는 연결하지 않는다.
      if (webcamScreen.hidden) {
        webcamStream.getTracks().forEach((track) => track.stop());
        webcamStream = null;
        return;
      }

      webcamVideo.srcObject = webcamStream;

      // loadedmetadata 전에는 videoWidth/videoHeight가 0이라 캡처가 불가능하다.
      // 카메라 초기화가 느린 환경(특히 실제 하드웨어)에서 그 사이에 촬영
      // 버튼을 눌러도 조용히 아무 일도 안 일어나는 문제를 막기 위해, 버튼은
      // 반드시 메타데이터가 준비된 뒤에만 활성화한다.
      webcamVideo.onloadedmetadata = () => {
        console.log(
          "[웹캠] 비디오 메타데이터 로드 완료 - readyState:",
          webcamVideo.readyState,
          "크기:",
          webcamVideo.videoWidth,
          "x",
          webcamVideo.videoHeight
        );
        webcamPhotoButton.disabled = false;
      };

      // srcObject를 스크립트로 지정한 경우 autoplay 속성만으로는 재생이
      // 시작되지 않는 브라우저가 있어 명시적으로 재생을 요청한다.
      try {
        await webcamVideo.play();
      } catch (playError) {
        console.log("[웹캠] video.play() 호출 실패(무시 가능):", playError);
      }
    } catch (error) {
      console.log("[웹캠] 카메라 접근 실패:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        showWebcamError("카메라 권한이 거부되었어요.\n브라우저 설정에서 카메라 접근을 허용한 뒤 다시 시도해주세요.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        showWebcamError("사용할 수 있는 카메라를 찾지 못했어요.");
      } else {
        showWebcamError("카메라를 불러오는 중 문제가 생겼어요.");
      }
    }
  }

  // video의 object-fit:cover와 동일한 비율로 잘라내야 미리보기와 캡처
  // 결과가 어긋나지 않는다 — dest(구멍) 비율에 맞춰 source(비디오 원본)의
  // 가운데를 기준으로 잘라낼 영역을 계산한다.
  function getCoverSourceRect(sourceWidth, sourceHeight, destWidth, destHeight) {
    const sourceRatio = sourceWidth / sourceHeight;
    const destRatio = destWidth / destHeight;

    if (sourceRatio > destRatio) {
      const sh = sourceHeight;
      const sw = sh * destRatio;
      return { sx: (sourceWidth - sw) / 2, sy: 0, sw, sh };
    }

    const sw = sourceWidth;
    const sh = sw / destRatio;
    return { sx: 0, sy: (sourceHeight - sh) / 2, sw, sh };
  }

  function capturePhoto() {
    console.log("[웹캠] 촬영 버튼 클릭됨 - hasStream:", !!webcamStream, "readyState:", webcamVideo.readyState, "크기:", webcamVideo.videoWidth, "x", webcamVideo.videoHeight);

    if (!webcamStream || !webcamVideo.videoWidth) {
      // 예전에는 여기서 아무 반응 없이 조용히 리턴해서, 카메라 초기화가
      // 아직 끝나지 않은 사이에 누르면 "눌러도 안 찍힘"처럼 보였다.
      // 이제는 버튼 자체가 loadedmetadata 이후에만 활성화되므로 정상
      // 흐름에서는 이 분기를 탈 일이 거의 없지만, 혹시 모를 상황을 대비해
      // 사용자에게 이유를 알려준다.
      flashWebcamNotice("카메라를 아직 불러오는 중이에요. 잠시 후 다시 눌러주세요.");
      return;
    }

    // canvas 합성 단계(drawImage/toDataURL)는 브라우저·실행 환경에 따라
    // 보안 제약(예: file://로 직접 열었을 때의 캔버스 오염 등)으로 예외를
    // 던질 수 있다. try/catch 없이 두면 예외가 콘솔에만 조용히 찍히고
    // 화면은 아무 반응이 없어 "눌러도 안 찍힘"처럼 보이므로, 반드시
    // 잡아서 원인을 로그로 남기고 사용자에게도 알려준다.
    try {
      const canvas = document.createElement("canvas");
      canvas.width = FRAME_NATIVE_WIDTH;
      canvas.height = FRAME_NATIVE_HEIGHT;
      const ctx = canvas.getContext("2d");

      const { sx, sy, sw, sh } = getCoverSourceRect(
        webcamVideo.videoWidth,
        webcamVideo.videoHeight,
        WEBCAM_HOLE_PX.width,
        WEBCAM_HOLE_PX.height
      );
      // 1) 웹캠 프레임을 구멍 자리에 맞춰 그리고, 2) 그 위에 final_frame.png를
      // 통째로 덮어써 프레임이 캡처 이미지에 포함되도록 합성한다.
      ctx.drawImage(webcamVideo, sx, sy, sw, sh, WEBCAM_HOLE_PX.x, WEBCAM_HOLE_PX.y, WEBCAM_HOLE_PX.width, WEBCAM_HOLE_PX.height);
      // crossOrigin으로 다시 로드해둔 프레임 사본이 있으면 그것을 쓰고,
      // 아직 준비되지 않았다면(로드가 늦었거나 실패) 화면에 이미 떠 있는
      // 기본 프레임 이미지로 대체한다.
      ctx.drawImage(webcamFrameCaptureImg || webcamFrameImg, 0, 0, FRAME_NATIVE_WIDTH, FRAME_NATIVE_HEIGHT);

      capturedPhotoDataUrl = canvas.toDataURL("image/png");
      console.log("[웹캠] 촬영 완료 - 캡처 이미지 생성됨 (base64 길이:", capturedPhotoDataUrl.length, ")");
      stopWebcamStream();
      goToPhotoResult();
    } catch (captureError) {
      console.error("[웹캠] 촬영 합성 중 오류 - name:", captureError.name, "message:", captureError.message, captureError);

      if (captureError.name === "SecurityError") {
        console.error(
          "[웹캠] SecurityError = canvas가 오염(tainted)됐다는 뜻. crossOrigin 없이 로드된 로컬 이미지를 canvas에 그린 뒤 " +
            "toDataURL()을 호출하면 발생한다 — 특히 index.html을 file://로 직접 열었을 때 흔하다. " +
            "webcamFrameCaptureImg(crossOrigin=\"anonymous\") 로드 여부: " + (webcamFrameCaptureImg ? "로드됨" : "아직 로드 안 됨/실패") +
            ". 그래도 계속되면 file:// 대신 로컬 서버(http://localhost:...)로 열어서 실행해봐야 한다."
        );
        flashWebcamNotice("사진을 저장하는 중 보안 오류가 발생했어요.\n파일을 직접 연 경우, 로컬 서버로 실행해보세요.", 3000);
      } else {
        flashWebcamNotice("사진을 저장하는 중 문제가 생겼어요. 다시 시도해주세요.", 2200);
      }
    }
  }

  webcamPhotoButton.addEventListener("click", capturePhoto);

  // ---------- 엔딩: 촬영 결과 확인 화면 ----------

  const photoResultScreen = document.getElementById("photo-result-screen");
  const photoResultImg = document.getElementById("photo-result-img");
  const photoAgainButton = document.getElementById("photo-again-button");
  const photoStoreButton = document.getElementById("photo-store-button");

  function goToPhotoResult() {
    photoResultImg.src = capturedPhotoDataUrl;
    changeScreen(photoResultScreen, { animate: true });
  }

  photoAgainButton.addEventListener("click", () => {
    changeScreen(webcamScreen, { animate: true });
    startWebcamStream();
  });

  photoStoreButton.addEventListener("click", () => {
    // TODO: QR 변환/저장 로직은 다음 단계에서 별도로 연결
    console.log("QR 저장 로직 연결 예정");
  });
});
