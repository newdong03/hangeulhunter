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
  // 충돌하지 않도록 정리한다.
  function playStory3CardEntrance() {
    story3Card.classList.remove("is-settled", "is-flipped");
    story3Card.getAnimations().forEach((anim) => anim.cancel());
    story3CardInner.getAnimations().forEach((anim) => anim.cancel());

    story3Card.animate(
      [
        { top: "130%", opacity: 0, offset: 0 },
        { top: "130%", opacity: 1, offset: 0.12 },
        { top: "55%", opacity: 1, offset: 1 },
      ],
      { duration: 900, delay: 500, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)", fill: "forwards" }
    );

    const spin = story3CardInner.animate(
      [{ transform: "rotateY(0deg)" }, { transform: "rotateY(1080deg)" }], // 1080deg = 3바퀴, 앞면으로 정지
      { duration: 900, delay: 500, easing: "linear", fill: "forwards" }
    );

    spin.onfinish = () => {
      story3Card.getAnimations().forEach((anim) => anim.cancel());
      story3CardInner.getAnimations().forEach((anim) => anim.cancel());
      story3Card.classList.add("is-settled"); // 정지 + 클릭 가능 상태로 전환
    };
  }

  function goToStory3() {
    enterScreen(yagwanggwiStory3Screen);
    playStory3CardEntrance();
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
});
