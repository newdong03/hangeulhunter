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
  const game3Character = document.getElementById("game3-character");
  const game3DropLayer = document.getElementById("game3-drop-layer");
  const game3CountBox = document.getElementById("game3-count");
  const game3CountValue = document.getElementById("game3-count-value");
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

  function buildFireflies() {
    const layer = document.getElementById("firefly-layer");
    layer.innerHTML = "";

    for (let i = 0; i < FIREFLY_COUNT; i++) {
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
        if (wrap.dataset.status !== "select") return; // off/on 상태는 반응 없음
        console.log(`스테이지 이동: ${stage.name}`);

        const targetScreen = STAGE_SCREENS[stage.key];
        if (targetScreen) {
          enterScreen(targetScreen);
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
    } else {
      // 모든 스테이지 클리어 (현재는 발생하지 않지만 확장 대비)
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
    showScreen(mapScreen);

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
  buildFireflies();

  // ---------- 야광귀 룰 설명 화면 ----------
  game1ChallengeButton.addEventListener("click", () => {
    console.log("야광귀 게임 시작");
    resetGame1();
    showScreen(game1PlayScreen);
  });

  // ---------- 그슨대 룰 설명 화면 ----------
  game2ChallengeButton.addEventListener("click", () => {
    console.log("그슨대 게임 시작");
    resetGame2();
    showScreen(game2PlayScreen);
  });

  // ---------- 불가살이 룰 설명 화면 ----------
  game3ChallengeButton.addEventListener("click", () => {
    console.log("불가살이 게임 시작");
    showScreen(game3PlayScreen);
    startGame3();
  });

  // ---------- 불가살이 실제 게임 화면 (쇠 받기) ----------

  const GAME3_STEEL_GOAL = 3; // 클리어에 필요한 쇠 개수
  const GAME3_MOVE_SPEED_PERCENT = 45; // 캐릭터 초당 좌우 이동 속도 (화면 너비 대비 %)
  const GAME3_CHAR_MIN_LEFT = 8; // 캐릭터 이동 가능 범위 (%)
  const GAME3_CHAR_MAX_LEFT = 92;
  const GAME3_FALL_SPEED_MIN = 9; // 낙하 아이템 초당 낙하 속도 최소/최대 (화면 높이 대비 %)
  const GAME3_FALL_SPEED_MAX = 14;
  const GAME3_SPAWN_INTERVAL_MIN = 1400; // 아이템 생성 간격 최소/최대 (ms) — 여러 개가 한 번에 몰리지 않도록 넉넉하게
  const GAME3_SPAWN_INTERVAL_MAX = 2200;
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
    // TODO: 불가살이 클리어 스토리 화면 연결 예정
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
  const GS_HOLD_MS = 3000; // hidgs_2(밝아짐) 상태를 끊김 없이 유지해야 하는 시간
  const GS_SURPRISE_TO_FLEE_MS = 900; // 놀람(hidgs_3) -> 도망(hidgs_4)
  const GS_FLEE_TO_NEXT_MS = 900; // 도망 연출 후 다음 화면 전환까지

  let game2Found = false; // 그슨대를 이미 찾았는지 (중복 트리거 방지)
  let gsHoldTimer = null; // 그슨대 영역을 계속 비추는 동안 유지되는 3초 타이머

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
    clearTimeout(gsHoldTimer);
    gsHoldTimer = null;
    game2Mission.classList.remove("is-hidden");
    game2MissionFind.classList.remove("is-visible");
    game2PlayScreen.style.setProperty("--x", "50%");
    game2PlayScreen.style.setProperty("--y", "50%");
    game2PlayScreen.style.setProperty("--radius", "0px");
    buildGame2HiddenObjects();
  }

  // hidgs_2(밝아짐) 상태를 GS_HOLD_MS(3초) 동안 끊김 없이 유지했을 때만
  // 호출된다. 이후는 되돌릴 수 없는 '놀람(hidgs_3, 찾았다! 등장) -> 도망
  // (hidgs_4)' 순서 연출로 넘어간다.
  function revealGeuseundae() {
    if (game2Found) return;
    game2Found = true;
    gsHoldTimer = null;

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
  // 들어왔는지 판정한다. 가짜 세모(item1~3)와 마찬가지로 그슨대도 반경을
  // 드나들 때마다 즉시 hidgs_1 <-> hidgs_2(밝아짐)를 오간다. 다만 그슨대는
  // hidgs_2 상태로 3초를 채우면 위 revealGeuseundae() 연출로 넘어가고,
  // 3초를 채우기 전에 반경을 벗어나면 hidgs_1로 되돌아가며 타이머도 리셋된다.
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

      if (obj.type === "gs") {
        if (isLit !== wasLit) {
          el.dataset.lit = isLit ? "true" : "false";
          el.src = `asset/image/game2_hidgs_${isLit ? "2" : "1"}.png`;
          el.classList.toggle("is-lit", isLit);
        }

        if (isLit && !gsHoldTimer) {
          gsHoldTimer = setTimeout(revealGeuseundae, GS_HOLD_MS);
        } else if (!isLit && gsHoldTimer) {
          clearTimeout(gsHoldTimer);
          gsHoldTimer = null;
        }
        return;
      }

      if (isLit === wasLit) return;

      el.dataset.lit = isLit ? "true" : "false";
      el.src = getHiddenObjectSrc(obj.type, isLit);
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
  function createSparkleBurst(container, leftPercent, topPercent, color) {
    const burst = document.createElement("div");
    burst.className = "sparkle-burst";
    burst.style.left = `${leftPercent}%`;
    burst.style.top = `${topPercent}%`;
    burst.style.setProperty("--burst-color", color);

    const core = document.createElement("div");
    core.className = "sparkle-core";
    burst.appendChild(core);

    const DOT_COUNT = 14;
    for (let i = 0; i < DOT_COUNT; i++) {
      const angle = (360 / DOT_COUNT) * i + (Math.random() * 18 - 9); // 살짝 흩뿌려 자연스럽게
      const radius = 13 + Math.random() * 9; // vh 단위, 사방으로 퍼지는 거리 (더 넓게)
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
    enterScreen(yagwanggwiStory1Screen);
    setTimeout(spawnZipsinSparkle, ZIPSIN_SPARKLE_DELAY_MS);
    setTimeout(goToStory2, 1300 + STORY_HOLD_MS); // 등장 연출(약 1.3초) + 유지(3초)
  }

  function goToStory2() {
    enterScreen(yagwanggwiStory2Screen);
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
    enterScreen(yagwanggwiStory3Screen);
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
    enterScreen(game2Story1Screen);
    setTimeout(goToGame2Story2, GAME2_STORY1_ADVANCE_MS);
  }

  function goToGame2Story2() {
    enterScreen(game2Story2Screen);
    playClearCardEntrance(game2StoryCard, game2StoryCardInner);
  }

  game2StoryCard.addEventListener("click", () => {
    if (!game2StoryCard.classList.contains("is-settled")) return; // 등장 연출 끝나기 전엔 무시
    game2StoryCard.classList.toggle("is-flipped");
  });

  game2StoryNextButton.addEventListener("click", () => {
    clearStageAndReturnToMap("geuseundae");
  });
});
