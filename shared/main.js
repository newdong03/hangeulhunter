document.addEventListener("DOMContentLoaded", () => {
  const screens = document.querySelectorAll(".screen");
  const startScreen = document.getElementById("start-screen");
  const characterScreen = document.getElementById("character-screen");
  const mapScreen = document.getElementById("map-screen");
  const game1IntroNextButton = document.getElementById("game1-intro-next-button");
  const game1RuleScreen = document.getElementById("game1-rule-screen");
  const game1ChallengeButton = document.getElementById("game1-challenge-button");
  const game1PlayScreen = document.getElementById("game1-play-screen");
  const game2IntroNextButton = document.getElementById("game2-intro-next-button");
  const game2RuleScreen = document.getElementById("game2-rule-screen");
  const game2ChallengeButton = document.getElementById("game2-challenge-button");
  const game2PlayScreen = document.getElementById("game2-play-screen");
  const game2HiddenLayer = document.getElementById("game2-hidden-layer");
  const game2Mission = document.getElementById("game2-mission");
  const game2MissionFind = document.getElementById("game2-mission-find");
  const game3IntroNextButton = document.getElementById("game3-intro-next-button");
  const game3RuleScreen = document.getElementById("game3-rule-screen");
  const game3ChallengeButton = document.getElementById("game3-challenge-button");
  const game3PlayScreen = document.getElementById("game3-play-screen");
  const game4IntroNextButton = document.getElementById("game4-intro-next-button");
  const game4RuleScreen = document.getElementById("game4-rule-screen");
  const game4ChallengeButton = document.getElementById("game4-challenge-button");
  const game4PlayScreen = document.getElementById("game4-play-screen");
  const game4QuizAButton = document.getElementById("game4-quiz-a");
  const game4QuizBButton = document.getElementById("game4-quiz-b");
  const game4QuizCharacter = document.getElementById("game4-quiz-character");
  const game4QuizTalk = document.getElementById("game4-quiz-talk");
  const game4QuizAImg = document.getElementById("game4-quiz-a-img");
  const game4QuizBImg = document.getElementById("game4-quiz-b-img");
  const game3Character = document.getElementById("game3-character");
  const game3DropLayer = document.getElementById("game3-drop-layer");
  const game3CountBox = document.getElementById("game3-count");
  const game3CountValue = document.getElementById("game3-count-value");
  const startButton = document.getElementById("start-button");
  const charCards = document.querySelectorAll(".char-card");
  const introVideoScreen = document.getElementById("intro-video-screen");
  const introVideo = document.getElementById("intro-video");
  const introVideoLoading = document.getElementById("intro-video-loading");
  const introVideoSkipButton = document.getElementById("intro-video-skip-button");

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
    // 야광귀 게임 화면을 벗어날 때도 손가락 인식 카메라를 확실히 끈다
    // (stopGame1HandTracking은 더 아래에서 선언되지만, 실제 호출은 항상
    // 그 선언이 끝난 뒤에 일어나므로 문제없다).
    if (current === game1PlayScreen && screen !== game1PlayScreen) {
      stopGame1HandTracking();
    }
    // 인트로 영상 화면을 벗어날 때(스킵/재생 종료 모두 goToCharacterScreenFromIntro를
    // 거쳐 이미 정지시키지만) 혹시 모를 다른 경로로 벗어나는 경우까지 대비해 여기서도 한 번 더 막는다.
    if (current === introVideoScreen && screen !== introVideoScreen) {
      stopIntroVideo();
    }

    screens.forEach((s) => {
      s.hidden = s !== screen;
    });

    playBgm(getBgmKeyForScreen(screen));
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
  let soundOn = true; // 사운드 on/off 상태. button_sound_on/off 토글 버튼과 사운드 시스템(setSoundMuted)이 함께 참조한다.

  // ---------- 사운드 시스템 (BGM + 효과음) ----------
  // sound/ 폴더의 실제 파일과 1:1로 매핑한다. BGM(game_bgm, game_bgm2)은 화면을
  // 옮길 때마다 새로 만들지 않고, 같은 키가 이미 재생 중이면 아무것도 하지
  // 않는다(끊김/재시작 없이 계속 이어지도록). 다른 키로 바뀔 때만 짧게
  // 크로스페이드하며 전환한다. 효과음은 매번 새 Audio 인스턴스를 만들어
  // BGM 위에 겹쳐(믹싱) 재생하고, 재생이 끝나면 알아서 정리된다.
  const SOUND_BASE_PATH = "sound/";
  const SOUND_FILES = {
    game_bgm: "game_bgm.mp3",
    game_bgm2: "game_bgm2.mp3",
    game_click: "game_click.wav",
    game_click_2: "game_click_2.wav",
    introcard: "introcard.mp3",
    yg_basic: "yg_basic.mp3",
    gs_basic: "gs_basic.mp3",
    bs_basic: "bs_basic.mp3",
    dk_basic: "dk_basic.mp3",
    yg_success: "yg_success.mp3",
    yg_fail: "yg_fail.mp3",
    ng: "ng.wav",
    clear_sound1: "clear_sound1.wav",
    clear_sound2: "clear_sound2.wav",
    card_sound: "card_sound.wav",
    gs_fail: "gs_fail.mp3",
    gs_surprise: "gs_surprise.mp3",
    bs_happy: "bs_happy.mp3",
    drop_success: "drop_success.mp3",
    bs_fail: "bs_fail.mp3",
    bs_sad: "bs_sad.mp3",
    dk_success: "dk_success.mp3",
    quiz_o: "quiz_o.wav",
    dk_fail: "dk_fail.mp3",
    camera: "camera.mp3",
  };

  const BGM_CROSSFADE_MS = 500; // 이전 BGM이 사라지고 새 BGM이 차오르는 시간

  let masterSoundOn = true; // soundOn과 항상 동기화되는 사운드 시스템 내부 상태
  let currentBgmKey = null;
  let currentBgmAudio = null;
  const activeSfxAudios = new Set(); // 재생 중인 효과음들 - 음소거 토글 시 즉시 반영하기 위해 추적

  function getSoundSrc(key) {
    return `${SOUND_BASE_PATH}${SOUND_FILES[key]}`;
  }

  // requestAnimationFrame으로 volume을 from -> to까지 선형으로 훑는다.
  // 게임 곳곳의 다른 애니메이션들(sparkle 등)과 같은 기법이라 별도 라이브러리 없이 처리 가능하다.
  function fadeAudioVolume(audio, from, to, durationMs, onDone) {
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / durationMs);
      audio.volume = from + (to - from) * t;
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (onDone) {
        onDone();
      }
    }
    requestAnimationFrame(step);
  }

  function playBgm(key) {
    if (!SOUND_FILES[key] || key === currentBgmKey) return; // 이미 그 BGM이 재생 중이면 끊지 않고 그대로 둔다

    const prevAudio = currentBgmAudio;
    currentBgmKey = key;

    const audio = new Audio(getSoundSrc(key));
    audio.loop = true;
    audio.muted = !masterSoundOn;
    audio.volume = 0;
    currentBgmAudio = audio;

    audio.play().catch(() => {
      // 브라우저 자동재생 정책으로 막힌 경우 - 아래 unlockAudioOnUserGesture가
      // 최초 사용자 입력 시 다시 재생을 시도한다.
    });
    fadeAudioVolume(audio, 0, 1, BGM_CROSSFADE_MS);

    if (prevAudio) {
      fadeAudioVolume(prevAudio, prevAudio.volume, 0, BGM_CROSSFADE_MS, () => {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      });
    }
  }

  function playSfx(key) {
    if (!SOUND_FILES[key]) return;
    const audio = new Audio(getSoundSrc(key));
    audio.muted = !masterSoundOn;
    activeSfxAudios.add(audio);
    audio.addEventListener("ended", () => activeSfxAudios.delete(audio));
    audio.play().catch(() => {});
  }

  function setSoundMuted(muted) {
    masterSoundOn = !muted;
    if (currentBgmAudio) currentBgmAudio.muted = muted;
    activeSfxAudios.forEach((audio) => {
      audio.muted = muted;
    });
  }

  // 인트로 영상 자체에 음성/음악이 들어있어 game_bgm과 겹쳐 들리지 않도록,
  // 영상이 재생되는 동안만 현재 BGM 트랙(currentBgmKey)은 그대로 둔 채
  // 오디오만 일시정지했다가 영상이 끝나면 이어서 재생한다.
  function pauseBgmForVideo() {
    if (currentBgmAudio) currentBgmAudio.pause();
  }

  function resumeBgmAfterVideo() {
    if (currentBgmAudio && masterSoundOn) {
      currentBgmAudio.play().catch(() => {});
    }
  }

  // 자동재생 정책 때문에 페이지 로드 직후 BGM 재생이 막혔을 수 있으므로,
  // 사용자의 첫 클릭/터치에서 한 번만 재생을 다시 시도한다.
  function unlockAudioOnUserGesture() {
    if (currentBgmAudio && currentBgmAudio.paused && masterSoundOn) {
      currentBgmAudio.play().catch(() => {});
    }
    document.removeEventListener("pointerdown", unlockAudioOnUserGesture);
  }
  document.addEventListener("pointerdown", unlockAudioOnUserGesture);

  // 화면 id 접두어 기준으로 어떤 BGM을 틀지 정한다. 시작화면 ~ 요괴맵, 엔딩/웹캠
  // 구간은 game_bgm, 각 게임의 소개~플레이~클리어 스토리 구간은 game_bgm2.
  const BGM2_SCREEN_ID_PREFIXES = ["game1-", "game2-", "game3-", "game4-", "yagwanggwi-story"];

  function getBgmKeyForScreen(screen) {
    if (!screen) return "game_bgm";
    const isBgm2 = BGM2_SCREEN_ID_PREFIXES.some((prefix) => screen.id.startsWith(prefix));
    return isBgm2 ? "game_bgm2" : "game_bgm";
  }

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
    playSfx("game_click");
    const previous = screenHistory.pop();
    showScreen(previous || startScreen);
  }

  function goHomeScreen() {
    playSfx("game_click");
    screenHistory = [];
    showScreen(startScreen);
  }

  // 사운드 버튼은 화면마다 하나씩(createCommonUiButtons) 새로 만들어지므로,
  // 토글 시 지금 보이는 버튼뿐 아니라 다른 화면에 있는 버튼들도 함께
  // on/off 아이콘이 맞게 갱신되도록 전부 이 배열에 모아둔다.
  const soundToggleImages = [];

  function toggleSound() {
    soundOn = !soundOn;
    soundToggleImages.forEach((img) => {
      img.src = `asset/image/button_sound_${soundOn ? "on" : "off"}.png`;
    });
    setSoundMuted(!soundOn);
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
    soundToggleImages.push(soundImg);
    soundBtn.addEventListener("click", toggleSound);

    fragment.appendChild(backBtn);
    fragment.appendChild(homeBtn);
    fragment.appendChild(soundBtn);
    return fragment;
  }

  // 시작화면·캐릭터 선택 화면을 제외한 모든 화면에 공통 버튼 3개를 주입한다.
  const COMMON_UI_EXCLUDED_SCREENS = [startScreen, characterScreen, introVideoScreen];
  screens.forEach((screen) => {
    if (COMMON_UI_EXCLUDED_SCREENS.includes(screen)) return;
    screen.appendChild(createCommonUiButtons());
  });

  // 시작화면은 showScreen()을 거치지 않고 이미 HTML에 보이는 상태로 시작하므로,
  // 여기서 최초 BGM 재생을 직접 트리거한다(자동재생이 막히면
  // unlockAudioOnUserGesture가 첫 클릭/터치에서 재시도한다).
  playBgm("game_bgm");

  // ---------- 시작화면 버전1 <-> 버전2 토글 ----------
  // #start-screen에 is-v2 클래스만 껐다 켰다 한다 — 버전별 레이아웃 차이는
  // style.css의 자손 선택자(#start-screen.is-v2 ...)가 전부 처리하므로,
  // 여기서는 클릭할 때마다 클래스 유무만 뒤집으면 된다. 게임시작 버튼
  // 동작·cloud1 디버그 트리거는 두 버전이 같은 DOM 요소를 공유하므로
  // (버전2에서 위치/크기만 CSS로 달라질 뿐) 별도 처리 없이 그대로 유지된다.
  const startVersionToggle = document.getElementById("start-version-toggle");
  startVersionToggle.addEventListener("click", () => {
    playSfx("game_click");
    const isV2 = startScreen.classList.toggle("is-v2");
    if (isV2) {
      startFloatClouds();
    } else {
      stopFloatClouds();
    }
  });

  // ---------- 언어 전환 (한국어 <-> English) ----------
  // 화면/로직/레이아웃은 언어와 무관하게 완전히 동일하게 유지하고, 텍스트가
  // 들어간 <img>들의 src만 "_eng"가 붙은 영어 버전으로 바꿔치기한다.
  // - currentLang은 전체 게임이 공유하는 전역 상태(하나의 페이지 안에 모든
  //   화면이 이미 같이 들어있으므로 화면 전환과 무관하게 자연히 공유된다)이고,
  //   localStorage에도 저장해 새로고침해도 유지되게 한다.
  // - 각 이미지가 최초 가진 src를 "한국어 원본"으로 한 번만 기억해두고
  //   (data-lang-ko-src), 영어로 전환할 때만 "_eng" 버전이 실제로 로드되는지
  //   확인한다. 로드에 성공한 이미지만 캐시해두고 이후에는 바로 교체하며,
  //   실패(아직 영어 버전이 없는 이미지)한 경우는 조용히 원본을 그대로 둔다
  //   (한 번 확인한 결과는 data-lang-eng-available에 캐시해 재확인하지 않는다).
  const LANG_STORAGE_KEY = "hangulHunter.lang";
  let currentLang = localStorage.getItem(LANG_STORAGE_KEY) === "en" ? "en" : "ko";
  const langToggleButton = document.getElementById("lang-toggle-button");

  function getEngImageSrc(koSrc) {
    const match = koSrc.match(/^(.*)(\.[a-zA-Z0-9]+)$/);
    return match ? `${match[1]}_eng${match[2]}` : null;
  }

  function applyLangToImage(img) {
    if (!img.dataset.langKoSrc) {
      const original = img.getAttribute("src");
      if (!original) return;
      img.dataset.langKoSrc = original;
    }
    const koSrc = img.dataset.langKoSrc;

    if (currentLang === "ko" || img.dataset.langEngAvailable === "0") {
      if (img.getAttribute("src") !== koSrc) img.src = koSrc;
      return;
    }

    const engSrc = getEngImageSrc(koSrc);
    if (!engSrc) {
      img.dataset.langEngAvailable = "0";
      return;
    }

    if (img.dataset.langEngAvailable === "1") {
      img.src = engSrc;
      return;
    }

    // 아직 확인 전인 이미지 - 실제로 로드되는지 먼저 검증한 뒤에만 교체한다.
    const probe = new Image();
    probe.onload = () => {
      img.dataset.langEngAvailable = "1";
      if (currentLang === "en") img.src = engSrc;
    };
    probe.onerror = () => {
      img.dataset.langEngAvailable = "0";
      if (img.getAttribute("src") !== koSrc) img.src = koSrc; // 안전하게 한국어 원본 유지
    };
    probe.src = engSrc;
  }

  function applyLanguageToAllImages() {
    document.querySelectorAll("img").forEach(applyLangToImage);
  }

  // 게임 로직이 <img>의 src를 직접 갈아끼우는 곳(예: 도깨비 퀴즈 문제
  // 전환)은 applyLanguageToAllImages의 정적 스캔 이후에 일어나므로, 그
  // 지점에서만 이 함수로 감싸 언어를 반영한다. 이전에 캐시해둔 한국어
  // 원본/영어 존재 여부는 이번 src와 무관하므로 초기화하고 다시 판정한다.
  function setLangAwareSrc(img, koSrc) {
    img.dataset.langKoSrc = koSrc;
    delete img.dataset.langEngAvailable;
    applyLangToImage(img);
  }

  // <html lang="..">도 currentLang에 맞춰 반영해둔다 — style.css의
  // html[lang="en"] 선택자가 이 값을 보고, 한글판보다 캔버스가 넓게
  // 제작된 일부 _eng 문구 이미지(introduce_ment_eng 등)의 너비를
  // 화면별로 보정한다(실측 비율 역산값, 각 규칙 옆 주석 참고).
  document.documentElement.lang = currentLang;
  applyLanguageToAllImages();
  langToggleButton.classList.toggle("is-en", currentLang === "en");

  langToggleButton.addEventListener("click", () => {
    playSfx("game_click");
    currentLang = currentLang === "ko" ? "en" : "ko";
    localStorage.setItem(LANG_STORAGE_KEY, currentLang);
    document.documentElement.lang = currentLang;
    langToggleButton.classList.toggle("is-en", currentLang === "en");
    applyLanguageToAllImages();
  });

  // ---------- 1단계 -> 2단계 ----------
  startButton.addEventListener("click", () => {
    playSfx("game_click_2");
    console.log("게임 시작");
    charCards.forEach((c) => c.classList.remove("is-selected"));
    selectedCharacter = null;
    startIntroVideoFlow();
  });

  // ---------- 시작화면 -> 캐릭터 선택 화면 사이 인트로 영상 ----------
  // 40MB 안팎의 영상이라 페이지 로드 시점엔 전혀 내려받지 않고(<video preload="none">,
  // src 속성 없음), "게임 시작" 버튼을 눌러 이 화면에 처음 들어올 때만 src를
  // 지연 설정해 로딩을 시작한다. 이후 다시 볼 때는(스킵 후 재도전 등) 이미
  // 받아둔 데이터를 그대로 재사용해 currentTime만 0으로 되돌린다.
  const INTRO_VIDEO_SRC = "asset/video/intro_video.mp4";
  const INTRO_VIDEO_SKIP_DELAY_MS = 5000; // 재생이 실제로 시작된 뒤 스킵 버튼이 나타나기까지의 시간
  const INTRO_VIDEO_READY_STATE = 3; // HAVE_FUTURE_DATA 이상이면 끊김 없이 재생을 이어갈 수 있다고 간주

  let introVideoSrcLoaded = false;
  let introVideoSkipTimer = null;

  function resetIntroVideoUi() {
    introVideo.classList.remove("is-ready");
    introVideoLoading.hidden = false;
    introVideoSkipButton.hidden = true;
    clearTimeout(introVideoSkipTimer);
    introVideoSkipTimer = null;
  }

  function handleIntroVideoCanPlay() {
    introVideo.classList.add("is-ready");
    introVideoLoading.hidden = true;
  }

  // 버퍼링으로 인한 일시정지 후 재생 재개 시에도 'playing'이 다시 발생할 수 있어,
  // 이번 재생에서 이미 타이머를 걸어뒀다면 다시 걸지 않는다(resetIntroVideoUi가
  // 매 진입마다 타이머를 초기화하므로 새로 볼 때는 정상적으로 다시 걸린다).
  function handleIntroVideoPlaying() {
    if (introVideoSkipTimer) return;
    introVideoSkipTimer = setTimeout(() => {
      introVideoSkipButton.hidden = false;
    }, INTRO_VIDEO_SKIP_DELAY_MS);
  }

  function handleIntroVideoEnded() {
    console.log("인트로 영상 재생 완료 - 캐릭터 선택 화면으로 이동");
    goToCharacterScreenFromIntro();
  }

  function stopIntroVideo() {
    introVideo.pause();
    resetIntroVideoUi();
  }

  function goToCharacterScreenFromIntro() {
    stopIntroVideo();
    resumeBgmAfterVideo();
    showScreen(characterScreen);
  }

  introVideo.addEventListener("canplay", handleIntroVideoCanPlay);
  introVideo.addEventListener("playing", handleIntroVideoPlaying);
  introVideo.addEventListener("ended", handleIntroVideoEnded);

  introVideoSkipButton.addEventListener("click", () => {
    playSfx("game_click");
    console.log("인트로 영상 건너뛰기");
    goToCharacterScreenFromIntro();
  });

  function startIntroVideoFlow() {
    showScreen(introVideoScreen);
    resetIntroVideoUi();
    pauseBgmForVideo();

    introVideo.muted = !masterSoundOn;
    if (!introVideoSrcLoaded) {
      introVideoSrcLoaded = true;
      introVideo.src = INTRO_VIDEO_SRC;
    }
    introVideo.currentTime = 0;

    // 이전에 이미 끝까지(또는 충분히) 받아둔 상태라면 로딩 스피너 없이 바로 보여준다.
    if (introVideo.readyState >= INTRO_VIDEO_READY_STATE) {
      handleIntroVideoCanPlay();
    }

    introVideo.play().catch((error) => {
      // 자동재생이 막히는 등 재생 자체가 실패하면 로딩 화면에 무한히 머무르지
      // 않도록 스킵 버튼을 바로 노출해 사용자가 직접 다음으로 넘어갈 수 있게 한다.
      console.log("[인트로 영상] 재생 실패, 스킵 버튼을 바로 노출:", error);
      introVideoLoading.hidden = true;
      introVideoSkipButton.hidden = false;
    });
  }

  // ---------- 2단계: 캐릭터 선택 -> 3단계(요괴맵) ----------
  charCards.forEach((card) => {
    card.addEventListener("mouseenter", () => playSfx("game_click"));

    card.addEventListener("click", () => {
      if (selectedCharacter) return; // 선택 후 중복 클릭 방지

      playSfx("game_click_2");
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
  // 발판 클릭 시 이동할 화면. 게임 소개(인트로)와 룰 설명은 이제 배경을
  // 공유하는 하나의 .screen(gameN-rule-screen)에 콘텐츠 레이어 두 개로
  // 합쳐져 있다 — 처음엔 인트로 레이어가 보이고, 그 안의 "다음" 버튼이
  // is-rule-active 클래스만 붙여 룰 레이어로 크로스페이드시킨다(아래
  // game1~4IntroNextButton 리스너 참고). 아직 만들지 않은 스테이지는
  // 매핑이 없어 기존처럼 콘솔 로그만 찍힌다.
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
  const FIREFLY_MIN_DISTANCE_PCT = 16; // 반딧불이끼리 보장할 최소 거리(%, 화면 기준 좌표계)
  const FIREFLY_PLACEMENT_MAX_ATTEMPTS = 30; // 최소 거리를 만족하는 자리를 찾기 위한 최대 재시도 횟수

  // 순수 Math.random()만 쓰면 반딧불이들이 우연히 한곳에 몰려 찍힐 수
  // 있다. "최소 거리 보장 + 랜덤 오프셋" 방식으로, 이미 배치된 좌표들과
  // FIREFLY_MIN_DISTANCE_PCT 이상 떨어진 자리가 나올 때까지 다시 뽑는다.
  // 재시도 안에서 조건을 만족하는 자리를 못 찾으면(개수가 많거나 화면이
  // 좁을 때) 무한정 재시도하는 대신 마지막 시도 값을 그대로 써서 항상
  // 요청한 개수만큼은 채운다.
  function pickFireflyPosition(placed) {
    for (let attempt = 0; attempt < FIREFLY_PLACEMENT_MAX_ATTEMPTS; attempt++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const tooClose = placed.some((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < FIREFLY_MIN_DISTANCE_PCT;
      });
      if (!tooClose) return { x, y };
    }
    return { x: Math.random() * 100, y: Math.random() * 100 };
  }

  function buildFireflies(layerId, count = FIREFLY_COUNT) {
    const layer = document.getElementById(layerId);
    if (!layer) return;
    layer.innerHTML = "";

    const placed = [];

    for (let i = 0; i < count; i++) {
      const { x, y } = pickFireflyPosition(placed);
      placed.push({ x, y });

      const firefly = document.createElement("div");
      firefly.className = "firefly";
      firefly.style.left = `${x}%`;
      firefly.style.top = `${y}%`;
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
        playSfx("game_click_2");
        console.log(`스테이지 이동: ${stage.name}`);

        const targetScreen = STAGE_SCREENS[stage.key];
        if (targetScreen) {
          // 맵에서 새로 들어올 때는 항상 인트로 레이어부터 다시 보여준다
          // (예전에 이 스테이지를 이미 룰 설명까지 봤어도 처음부터 다시).
          targetScreen.classList.remove("is-rule-active");
          changeScreen(targetScreen, { animate: true });
          playSfx("introcard");
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
    playSfx("game_click");
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
  buildFireflies("game1-firefly-layer");
  buildFireflies("game3-firefly-layer");
  buildFireflies("game4-firefly-layer");

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

  // ---------- 시작화면 버전2: 구름(cloud1~4) 자유 유영 애니메이션 ----------
  // CSS 키프레임은 정해진 왕복 경로만 반복할 수 있어 "화면 안을 랜덤한
  // 방향/속도로 떠다니다 경계에서 반사"하는 움직임은 표현할 수 없다.
  // 그래서 requestAnimationFrame으로 각 구름의 위치(%)·속도(%/s)를 직접
  // 갱신하고, 화면(.screen) 경계에 닿으면 해당 축의 속도 부호만 뒤집어
  // 반사시킨다(속도 크기는 그대로라 튕기는 순간도 매끄럽게 이어진다).
  // cloud1(#debug-cloud-trigger)은 버전1과 공유하는 요소라 이 루프는
  // 버전2가 활성화된 동안만 돌리고, 버전1로 돌아가면 인라인 스타일을
  // 지워 기존 CSS 위치·bobbing 애니메이션(.start-cloud--1)으로 되돌린다.
  // 클릭 핸들러는 위 블록에서 이미 같은 엘리먼트에 걸려 있으므로, 이동
  // 중에도 디버그 모드 진입 기능은 그대로 유지된다.
  //
  // [떨림(jitter) 수정] 이전 버전은 매 프레임 el.style.left/top(%)을
  // 썼는데, left/top은 레이아웃 속성이라 쓸 때마다 리플로우가 일어나고
  // 브라우저가 그 값을 정수 디바이스 픽셀로 반올림한다 — 여기에 transform
  // (translate(-50%,-50%))까지 매 프레임 다시 계산되면서 두 단계의
  // 반올림 오차가 프레임마다 다르게 섞여 미세하게 떨려 보였다. 이제는
  // 요소를 컨테이너 원점(left:0/top:0)에 고정해두고, 실제 이동은 오직
  // transform(합성 전용 속성, 리플로우 없이 서브픽셀 그대로 그려짐)만으로
  // 처리한다 — translate()는 순서를 바꿔도 결과가 같은 순수 이동이라
  // translate(-50%,-50%)(자기 크기 기준 중앙 정렬) 뒤에 translate(px,px)
  // (컨테이너 기준 절대 위치)를 그대로 이어 붙일 수 있다.
  const FLOAT_CLOUD_CONFIG = [
    { el: debugCloudTrigger, speed: 2.7 },
    { el: document.querySelector(".start-v2-cloud--2"), speed: 2.3 },
    { el: document.querySelector(".start-v2-cloud--3"), speed: 3.1 },
    { el: document.querySelector(".start-v2-cloud--4"), speed: 2.5 },
  ].filter((cloud) => cloud.el);

  let floatCloudsState = null;
  let floatCloudsRafId = null;
  let floatCloudsLastTs = null;
  let floatCloudsContainerRect = null;

  function refreshFloatCloudsContainerRect() {
    floatCloudsContainerRect = startScreen.getBoundingClientRect();
  }

  window.addEventListener("resize", () => {
    if (floatCloudsState) refreshFloatCloudsContainerRect();
  });

  function initFloatClouds() {
    refreshFloatCloudsContainerRect();
    const screenRect = floatCloudsContainerRect;
    floatCloudsState = FLOAT_CLOUD_CONFIG.map(({ el, speed }) => {
      const elRect = el.getBoundingClientRect();
      const halfW = ((elRect.width / screenRect.width) * 100) / 2;
      const halfH = ((elRect.height / screenRect.height) * 100) / 2;
      const x = ((elRect.left - screenRect.left + elRect.width / 2) / screenRect.width) * 100;
      const y = ((elRect.top - screenRect.top + elRect.height / 2) / screenRect.height) * 100;
      const angle = Math.random() * Math.PI * 2;

      // 지금부터는 left/top이 아니라 transform만으로 이동시키므로,
      // 레이아웃 상 위치는 컨테이너 원점에 고정해둔다(시각적 위치는
      // 아래 stepFloatClouds가 매기는 translate(px,px)가 전부 담당한다 —
      // 지금 읽은 x/y가 곧 현재 화면에 보이는 위치이므로 전환 시 튐은 없다).
      el.style.left = "0";
      el.style.top = "0";

      return {
        el,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        halfW,
        halfH,
      };
    });
  }

  function stepFloatClouds(dtSeconds) {
    const containerRect = floatCloudsContainerRect;
    floatCloudsState.forEach((cloud) => {
      cloud.x += cloud.vx * dtSeconds;
      cloud.y += cloud.vy * dtSeconds;

      const minX = cloud.halfW;
      const maxX = 100 - cloud.halfW;
      const minY = cloud.halfH;
      const maxY = 100 - cloud.halfH;

      if (cloud.x < minX) {
        cloud.x = minX;
        cloud.vx = Math.abs(cloud.vx);
      } else if (cloud.x > maxX) {
        cloud.x = maxX;
        cloud.vx = -Math.abs(cloud.vx);
      }

      if (cloud.y < minY) {
        cloud.y = minY;
        cloud.vy = Math.abs(cloud.vy);
      } else if (cloud.y > maxY) {
        cloud.y = maxY;
        cloud.vy = -Math.abs(cloud.vy);
      }

      const pxX = (cloud.x / 100) * containerRect.width;
      const pxY = (cloud.y / 100) * containerRect.height;
      cloud.el.style.transform = `translate(-50%, -50%) translate(${pxX}px, ${pxY}px)`;
    });
  }

  function floatCloudsLoop(ts) {
    if (floatCloudsLastTs === null) floatCloudsLastTs = ts;
    // 탭이 백그라운드에 있다 돌아오는 등 큰 시간 간격이 튀는 경우를 대비해
    // 델타를 짧게 캡핑한다 — 없으면 순간이동하듯 한 번에 크게 튈 수 있다.
    const dtSeconds = Math.min((ts - floatCloudsLastTs) / 1000, 0.1);
    floatCloudsLastTs = ts;
    stepFloatClouds(dtSeconds);
    floatCloudsRafId = requestAnimationFrame(floatCloudsLoop);
  }

  function startFloatClouds() {
    if (floatCloudsRafId !== null) return;
    if (!floatCloudsState) initFloatClouds();
    floatCloudsLastTs = null;
    floatCloudsRafId = requestAnimationFrame(floatCloudsLoop);
  }

  // 시작화면은 버전2를 기본값으로 보여준다(index.html의 #start-screen에
  // is-v2 클래스가 이미 붙어 있음) — 그래서 토글 버튼을 누르기 전에도
  // 구름 애니메이션이 곧장 돌아야 한다.
  if (startScreen.classList.contains("is-v2")) {
    startFloatClouds();
  }

  function stopFloatClouds() {
    if (floatCloudsRafId !== null) {
      cancelAnimationFrame(floatCloudsRafId);
      floatCloudsRafId = null;
    }
    // 버전1로 돌아가면 인라인 top/left/transform을 지워 CSS 기본값
    // (.start-cloud--1의 위치 + cloud-float-1 bobbing)으로 되돌린다.
    if (debugCloudTrigger) {
      debugCloudTrigger.style.left = "";
      debugCloudTrigger.style.top = "";
      debugCloudTrigger.style.transform = "";
    }
    floatCloudsState = null;
  }

  // ---------- 게임별 소개(인트로) 화면 ----------
  // 요괴맵 스테이지 클릭 -> (인트로 콘텐츠) -> "다음" 클릭 -> 기존 룰
  // 설명 콘텐츠부터 원래 진행 과정 그대로. 인트로/룰 설명은 이제 화면
  // 전환이 아니라 같은 .screen 안 콘텐츠 레이어 크로스페이드라, 배경은
  // 전혀 다시 그려지지 않고 is-rule-active 클래스 하나로 전환된다
  // (style.css의 .rule-content-layer 참고). 룰 설명 화면 쪽 로직
  // (도전 버튼 등)은 전혀 건드리지 않는다.
  game1IntroNextButton.addEventListener("click", () => {
    playSfx("game_click");
    playSfx("yg_basic");
    game1RuleScreen.classList.add("is-rule-active");
  });
  game2IntroNextButton.addEventListener("click", () => {
    playSfx("game_click");
    playSfx("gs_basic");
    game2RuleScreen.classList.add("is-rule-active");
  });
  game3IntroNextButton.addEventListener("click", () => {
    playSfx("game_click");
    playSfx("bs_basic");
    game3RuleScreen.classList.add("is-rule-active");
  });
  game4IntroNextButton.addEventListener("click", () => {
    playSfx("game_click");
    playSfx("dk_basic");
    game4RuleScreen.classList.add("is-rule-active");
  });

  // ---------- 야광귀 룰 설명 화면 ----------
  game1ChallengeButton.addEventListener("click", () => {
    playSfx("game_click");
    console.log("야광귀 게임 시작");
    resetGame1();
    changeScreen(game1PlayScreen);
    startGame1HandTracking();
  });

  // ---------- 그슨대 룰 설명 화면 ----------
  game2ChallengeButton.addEventListener("click", () => {
    playSfx("game_click");
    console.log("그슨대 게임 시작");
    resetGame2();
    changeScreen(game2PlayScreen);
  });

  // ---------- 불가살이 룰 설명 화면 ----------
  game3ChallengeButton.addEventListener("click", () => {
    playSfx("game_click");
    console.log("불가살이 게임 시작");
    changeScreen(game3PlayScreen);
    startGame3();
  });

  // ---------- 도깨비 룰 설명 화면 ----------
  game4ChallengeButton.addEventListener("click", () => {
    playSfx("game_click");
    console.log("도깨비 게임 시작");
    resetGame4Quiz();
    changeScreen(game4PlayScreen, { animate: true });
  });

  // ---------- 도깨비 실제 게임 화면 (맞춤법 퀴즈, 3문제) ----------

  // 문제별 데이터만 바뀌고 화면 구조(캐릭터/말풍선/선택지 2개)는 그대로
  // 재사용한다 — game4QuizIndex가 지금 몇 번째 문제인지를 가리킨다.
  const GAME4_QUIZZES = [
    {
      character: "ms_dk_sick",
      talk: "talk_dk_quiz",
      talkAlt: "나 너무 아파",
      optionAImg: "game4_quizA",
      optionAAlt: "어서 빨리 나아!",
      optionBImg: "game4_quizB",
      optionBAlt: "어서 빨리 낳아!",
      correct: "a",
    },
    {
      character: "ms_dk_play",
      talk: "talk_dk_quiz2",
      talkAlt: "도깨비 대사",
      optionAImg: "game4_quizA_2",
      optionAAlt: "선택지 A",
      optionBImg: "game4_quizB_2",
      optionBAlt: "선택지 B",
      correct: "b",
    },
    {
      character: "ms_dk_bag",
      talk: "talk_dk_quiz3",
      talkAlt: "도깨비 대사",
      optionAImg: "game4_quizA_3",
      optionAAlt: "선택지 A",
      optionBImg: "game4_quizB_3",
      optionBAlt: "선택지 B",
      correct: "a",
    },
  ];

  let game4QuizIndex = 0;

  function loadGame4Quiz(index) {
    const quiz = GAME4_QUIZZES[index];
    game4QuizCharacter.src = `asset/image/${quiz.character}.png`;
    setLangAwareSrc(game4QuizTalk, `asset/image/${quiz.talk}.png`);
    game4QuizTalk.alt = quiz.talkAlt;
    game4QuizAImg.src = `asset/image/${quiz.optionAImg}.png`;
    game4QuizAImg.alt = quiz.optionAAlt;
    game4QuizBImg.src = `asset/image/${quiz.optionBImg}.png`;
    game4QuizBImg.alt = quiz.optionBAlt;
  }

  function resetGame4Quiz() {
    game4QuizIndex = 0;
    game4QuizAButton.classList.remove("is-correct");
    game4QuizBButton.classList.remove("is-correct");
    // 이전 플레이에서 오답으로 붙은 is-shaking/is-fire-hit이 남아있으면,
    // 화면이 hidden -> visible로 바뀌는 순간 CSS 애니메이션이 처음부터
    // 다시 재생되어(도전하기만 눌렀을 뿐인데) 붉은 화면 플래시가 오작동한다.
    game4PlayScreen.classList.remove("is-shaking", "is-fire-hit");
    loadGame4Quiz(game4QuizIndex);
  }

  function handleGame4Answer(choice, buttonEl) {
    const quiz = GAME4_QUIZZES[game4QuizIndex];
    if (choice === quiz.correct) {
      handleGame4Correct(buttonEl);
    } else {
      handleGame4Wrong();
    }
  }

  const GAME4_CORRECT_FEEDBACK_MS = 650; // 정답 강조 연출 후 다음 문제/클리어로 넘어가기까지의 텀

  // 정답을 고르면 그 카드에 강조 표시(테두리 글로우 + 살짝 확대되는 바운스)와
  // 야광귀 게임의 정답 파티클(createSparkleBurst)을 같은 톤(#ffe08a)으로
  // 짧게 보여준 뒤, 잠깐 텀을 두고서야 다음 문제(또는 클리어)로 넘어간다.
  function handleGame4Correct(buttonEl) {
    playSfx("dk_success");
    playSfx("quiz_o");
    buttonEl.classList.remove("is-correct");
    void buttonEl.offsetWidth; // 리플로우시켜 연속 정답에도 강조 연출이 매번 재생되게 함
    buttonEl.classList.add("is-correct");

    const btnRect = buttonEl.getBoundingClientRect();
    const screenRect = game4PlayScreen.getBoundingClientRect();
    const leftPercent = ((btnRect.left + btnRect.width / 2 - screenRect.left) / screenRect.width) * 100;
    const topPercent = ((btnRect.top + btnRect.height / 2 - screenRect.top) / screenRect.height) * 100;
    createSparkleBurst(game4PlayScreen, leftPercent, topPercent, "#ffe08a");

    setTimeout(() => {
      buttonEl.classList.remove("is-correct");
      advanceGame4Quiz();
    }, GAME4_CORRECT_FEEDBACK_MS);
  }

  function advanceGame4Quiz() {
    game4QuizIndex += 1;

    if (game4QuizIndex >= GAME4_QUIZZES.length) {
      playSfx("clear_sound1");
      console.log("도깨비 퀴즈 3문제 모두 정답! 여린히읗 획득 스토리 화면으로 이동");
      goToGame4Clear();
      return;
    }

    console.log(`정답! ${game4QuizIndex + 1}번째 문제로 이동`);
    loadGame4Quiz(game4QuizIndex);
    // 캐릭터+말풍선이 먼저, 선택지가 그다음 등장하는 기존 등장 연출을
    // 문제가 바뀔 때마다 재사용한다(화면 자체는 그대로 유지되므로 여기서
    // 직접 재생시켜준다).
    playEntryAnimation(game4PlayScreen);
  }

  // 오답 연출은 야광귀 게임의 handleWrongJamo()와 동일한 기법(화면 흔들림
  // 클래스를 뗐다 리플로우 후 다시 붙이기)을 재사용하고, 불가살이 게임의
  // 붉은 화면 플래시(is-fire-hit)도 함께 재사용한다. 다시 선택할 수 있도록
  // 화면 전환 없이 같은 문제를 그대로 유지한다.
  function handleGame4Wrong() {
    playSfx("dk_fail");
    playSfx("ng");
    game4PlayScreen.classList.remove("is-shaking");
    void game4PlayScreen.offsetWidth;
    game4PlayScreen.classList.add("is-shaking");

    game4PlayScreen.classList.remove("is-fire-hit");
    void game4PlayScreen.offsetWidth;
    game4PlayScreen.classList.add("is-fire-hit");
  }

  function goToGame4Clear() {
    goToGame4Story1();
  }

  game4QuizAButton.addEventListener("click", () => handleGame4Answer("a", game4QuizAButton));
  game4QuizBButton.addEventListener("click", () => handleGame4Answer("b", game4QuizBButton));

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
  let game3FireCatchCount = 0; // 실제로 불을 받은(담은) 횟수 - 2회 이상부터 bs_sad+ng를 추가로 재생한다
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
    game3FireCatchCount = 0;
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
    playSfx("bs_happy");
    playSfx("drop_success");

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
      playSfx("clear_sound1");
      console.log("불가살이 클리어!");
      stopGame3();
      setTimeout(goToGame3Clear, GAME3_CLEAR_ADVANCE_MS);
    }
  }

  function handleGame3FireCatch(item) {
    playSfx("bs_fail");
    game3FireCatchCount += 1;
    if (game3FireCatchCount >= 2) {
      playSfx("bs_sad");
      playSfx("ng");
    }

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
  // 그슨대이고 나머지(item1~5)는 손전등을 비춰도 밝아지기만 하는 가짜 세모다.
  // item1~5가 화면 안에서 서로 다른 자리에 하나씩만 나오도록 각 슬롯에
  // 다른 type을 준다(예전에는 item1/item2가 두 자리씩 중복 배치돼 있었다).
  const HIDDEN_OBJECTS = [
    { id: "deco-1", type: "item1", top: 69.9, left: 7.8, width: 9.2 },
    { id: "deco-2", type: "item2", top: 78.7, left: 23.2, width: 9.8 },
    { id: "deco-3", type: "item3", top: 70.8, left: 38.5, width: 9.2 },
    { id: "deco-4", type: "item4", top: 87.9, left: 54.2, width: 9.8 },
    { id: "gs", type: "gs", top: 72.2, left: 71.4, width: 10.2 },
    { id: "deco-5", type: "item5", top: 70.8, left: 88.5, width: 9.2 },
  ];

  const SPOTLIGHT_RADIUS_PERCENT = 11; // 손전등 반경 (화면 너비 대비 %)
  const GS_SURPRISE_TO_FLEE_MS = 900; // 놀람(hidgs_3) -> 도망(hidgs_4)
  const GS_FLEE_TO_NEXT_MS = 900; // 도망 연출 후 다음 화면 전환까지

  let game2Found = false; // 그슨대를 이미 찾았는지 (중복 트리거 방지)

  // 가짜 세모(item1~5)의 실제 파일명은 game2_hiditem1.png / _on.png 형태라
  // obj.type("item1")과 파일명 사이에 "hid" 접두어가 하나 더 붙는다.
  // item1~3은 꺼짐 상태에 접미사가 없지만(game2_hiditem1.png), item4~5는
  // 꺼짐 상태 파일명에도 "_off"가 붙어 있어(game2_hiditem4_off.png) 따로 처리한다.
  function getHiddenObjectSrc(type, isLit) {
    if (type === "gs") return "asset/image/game2_hidgs_1.png";
    if (isLit) return `asset/image/game2_hid${type}_on.png`;
    const offNeedsSuffix = type === "item4" || type === "item5";
    return `asset/image/game2_hid${type}${offNeedsSuffix ? "_off" : ""}.png`;
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
    game2PlayScreen.classList.remove("is-shaking", "is-fire-hit");
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

    playSfx("gs_surprise");
    playSfx("clear_sound1");

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

    const screenRect = game2PlayScreen.getBoundingClientRect();
    const radiusPx = screenRect.width * (SPOTLIGHT_RADIUS_PERCENT / 100);

    // 손전등 반경 안에 들어온 숨은 오브젝트(진짜 그슨대든 가짜 세모든)를 찾는다.
    // 아무것도 비추지 않은 채 화면을 클릭한 경우는 "선택"으로 치지 않아 소리를 내지 않는다.
    const hitObj = HIDDEN_OBJECTS.find((obj) => {
      const centerX = screenRect.left + (obj.left / 100) * screenRect.width;
      const centerY = screenRect.top + (obj.top / 100) * screenRect.height;
      return Math.hypot(event.clientX - centerX, event.clientY - centerY) <= radiusPx;
    });
    if (!hitObj) return;

    if (hitObj.type === "gs") {
      revealGeuseundae();
    } else {
      playSfx("gs_fail");
      playSfx("ng");

      // 가짜 세모를 눌렀을 때도 불가살이 게임과 동일한 화면 흔들림 +
      // 붉은 화면 플래시(is-shaking/is-fire-hit)를 재사용해 통일감을 준다.
      game2PlayScreen.classList.remove("is-shaking");
      void game2PlayScreen.offsetWidth;
      game2PlayScreen.classList.add("is-shaking");

      game2PlayScreen.classList.remove("is-fire-hit");
      void game2PlayScreen.offsetWidth;
      game2PlayScreen.classList.add("is-fire-hit");
    }
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
    game1PlayScreen.classList.remove("is-shaking", "is-fire-hit");

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

  // 파티클 하나의 이동 궤적을 실제 발사체 운동 공식으로 샘플링한 키프레임
  // 배열로 만든다: x는 발사 초기 속도(dx)만큼 일정하게(등속), y는 초기 속도(dy)
  // 성분에 중력 가속도 항(fall * t^2)이 서서히 누적되는 포물선으로 움직여서
  // 방향이 꺾이는 구간 없이 부드럽게 이어진다. 회전(rot)도 같은 t로 선형
  // 진행시켜 통째로 하나의 연속된 곡선을 이룬다.
  function buildFireworkParticleFrames(dx, dy, fall, rotDeg) {
    const STEPS = 20;
    const frames = [];

    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const x = dx * t;
      const y = dy * t + fall * t * t;
      const rot = rotDeg * t;

      let opacity;
      if (t < 0.08) opacity = t / 0.08; // 등장
      else if (t < 0.7) opacity = 1;
      else opacity = 1 - (t - 0.7) / 0.3; // 서서히 페이드아웃

      const scale = t < 0.3 ? 0.3 + 0.85 * (t / 0.3) : 1.15 - 0.65 * ((t - 0.3) / 0.7);

      frames.push({
        transform: `translate(${x.toFixed(2)}vh, ${y.toFixed(2)}vh) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(2)})`,
        opacity: Math.max(0, Math.min(1, opacity)),
        offset: t,
      });
    }

    return frames;
  }

  // 엔딩 4장의 카드 완성 순간 터지는 폭죽 스타일 파티클. createSparkleBurst는
  // 정답 판정처럼 즉각적인 피드백용이라 짧게 끝나야 하지만, 이 이펙트는
  // "훈민정음 28자모 완성!"과 함께 한 번만 크게 터지는 것이라 더 화려하고
  // 오래 지속돼도 된다 — 그래서 별도 함수로 분리했다.
  // 입자마다 발사 시점(delay)·크기·모양(원/별)·색(카드색+화이트/골드)을
  // 랜덤하게 섞어 동시에 딱 맞춰 터지는 기계적인 느낌을 피한다.
  function createEndingFirework(container, leftPercent, topPercent, cardColor) {
    const PARTICLE_COUNT = 32;
    const colors = [cardColor, "#ffffff", "#ffd76a"];

    const burst = document.createElement("div");
    burst.className = "firework-burst";
    burst.style.left = `${leftPercent}%`;
    burst.style.top = `${topPercent}%`;

    const core = document.createElement("div");
    core.className = "firework-core";
    core.style.setProperty("--burst-color", cardColor);
    burst.appendChild(core);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (360 / PARTICLE_COUNT) * i + (Math.random() * 20 - 10); // 살짝 흩뿌려 자연스럽게
      const radius = 20 + Math.random() * 16; // vh, 초기 발사 속도(등속 성분)의 크기
      const rad = (angle * Math.PI) / 180;
      const size = 2 + Math.random() * 6; // 2~8px, 크기를 균일하지 않게
      const dx = Math.cos(rad) * radius;
      const dy = Math.sin(rad) * radius;
      const fall = 10 + Math.random() * 10; // 중력 가속도가 누적돼 추가로 떨어지는 거리
      const rotDeg = (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360);

      const particle = document.createElement("div");
      const isStar = Math.random() < 0.4; // 일부만 별 모양으로 섞기
      particle.className = `firework-particle ${isStar ? "firework-particle--star" : "firework-particle--dot"}`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.marginLeft = `${-size / 2}px`;
      particle.style.marginTop = `${-size / 2}px`;
      particle.style.setProperty("--particle-color", colors[Math.floor(Math.random() * colors.length)]);

      const duration = 1000 + Math.random() * 500; // 1~1.5s
      const delay = Math.random() * 250; // 발사 시점을 살짝 어긋내는 stagger
      particle.animate(buildFireworkParticleFrames(dx, dy, fall, rotDeg), {
        duration,
        delay,
        easing: "linear", // 곡선 자체는 이미 키프레임 샘플링에 담겨 있으므로 구간별로는 선형 보간
        fill: "forwards",
      });

      burst.appendChild(particle);
    }

    container.appendChild(burst);
    setTimeout(() => burst.remove(), 1900);
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
    playSfx("yg_success");

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
      playSfx("clear_sound1");
      console.log("짚신 완성!");
      setTimeout(() => {
        goToScreen("yagwanggwi-clear");
      }, 1000);
    }
  }

  // 화면 흔들림에 더해, 불가살이 게임(is-fire-hit)과 동일한 붉은 화면
  // 플래시도 함께 재사용해 오답 연출의 강도/색상/지속시간을 통일한다.
  function handleWrongJamo() {
    playSfx("yg_fail");
    playSfx("ng");

    game1PlayScreen.classList.remove("is-shaking");
    void game1PlayScreen.offsetWidth; // 리플로우시켜 연속 오답에도 흔들림 애니메이션이 매번 재생되게 함
    game1PlayScreen.classList.add("is-shaking");

    game1PlayScreen.classList.remove("is-fire-hit");
    void game1PlayScreen.offsetWidth;
    game1PlayScreen.classList.add("is-fire-hit");

    flashCharacterFace("sad");
  }

  // 클릭이든 손가락 dwell이든, 최종 선택 판정은 이 함수 하나로 모은다.
  // 정답/오답 처리(handleCorrectJamo/handleWrongJamo)는 완전히 동일하게
  // 유지하고 "무엇이 이 함수를 호출했는가"만 다르다.
  function attemptSelectJamoPiece(piece) {
    const neededLetter = JIPSIN_LETTERS[jipsinProgress];
    const isMatchingLetter = piece.dataset.letter === neededLetter;

    if (piece.classList.contains("is-used") || !isMatchingLetter) {
      handleWrongJamo();
      return;
    }

    handleCorrectJamo(piece);
  }

  jamoPieces.forEach((piece) => {
    piece.addEventListener("click", () => attemptSelectJamoPiece(piece));
  });

  // ---------- 야광귀 게임: 손가락 인식(핸드트래킹) ----------
  // MediaPipe Hands로 검지손가락 끝(landmark 8, INDEX_FINGER_TIP)을 추적해
  // 화면 위 원형 커서를 움직이고, 커서가 자모 조각 위에 일정 시간
  // (GAME1_DWELL_MS) 이상 머무르면 attemptSelectJamoPiece를 호출해 클릭과
  // 완전히 동일한 선택 로직을 태운다. 카메라 권한이 없거나 MediaPipe
  // 로딩이 실패해도 위의 클릭 리스너는 그대로 살아있으므로 마우스로 계속
  // 플레이할 수 있다(폴백) — 이 블록은 순전히 "부가 입력 수단"만 얹는다.

  const game1HandWebcamWrap = document.getElementById("game1-hand-webcam-wrap");
  const game1HandWebcamVideo = document.getElementById("game1-hand-webcam-video");
  const game1HandCursor = document.getElementById("game1-hand-cursor");

  const GAME1_DWELL_MS = 400; // 손가락 커서가 조각 위에 머물러야 선택되는 시간
  const GAME1_DWELL_COOLDOWN_MS = 900; // 선택(정답/오답) 직후 같은 자리 재입력을 잠깐 막는 시간
  const GAME1_CURSOR_SMOOTHING = 0.35; // 클수록 손가락 움직임을 빠르게 따라간다(0~1)

  let game1HandStream = null;
  let game1HandsInstance = null;
  let game1HandTrackingActive = false;
  let game1HandFrameRequestId = null;
  let game1CursorSmoothX = null;
  let game1CursorSmoothY = null;
  let game1DwellTarget = null;
  let game1DwellStartMs = null;
  let game1DwellCooldownUntilMs = 0;

  function setGame1CursorDwell(percent) {
    game1HandCursor.style.setProperty("--dwell", String(percent));
  }

  function updateGame1CursorPosition(xPx, yPx) {
    if (game1CursorSmoothX === null) {
      game1CursorSmoothX = xPx;
      game1CursorSmoothY = yPx;
    } else {
      game1CursorSmoothX += (xPx - game1CursorSmoothX) * GAME1_CURSOR_SMOOTHING;
      game1CursorSmoothY += (yPx - game1CursorSmoothY) * GAME1_CURSOR_SMOOTHING;
    }
    game1HandCursor.style.transform = `translate(${game1CursorSmoothX}px, ${game1CursorSmoothY}px)`;
  }

  // 커서의 뷰포트 좌표(xPx,yPx)가 아직 안 쓴 자모 조각 위에 있는지 검사하고,
  // 같은 조각 위에 GAME1_DWELL_MS 이상 머무르면 클릭한 것과 동일하게 처리한다.
  function checkGame1Dwell(xPx, yPx) {
    const now = performance.now();
    if (now < game1DwellCooldownUntilMs) {
      setGame1CursorDwell(0);
      return;
    }

    let hovered = null;
    jamoPieces.forEach((piece) => {
      if (hovered || piece.classList.contains("is-used")) return;
      const rect = piece.getBoundingClientRect();
      if (xPx >= rect.left && xPx <= rect.right && yPx >= rect.top && yPx <= rect.bottom) {
        hovered = piece;
      }
    });

    if (hovered !== game1DwellTarget) {
      game1DwellTarget = hovered;
      game1DwellStartMs = hovered ? now : null;
    }

    if (!hovered) {
      setGame1CursorDwell(0);
      return;
    }

    const elapsed = now - game1DwellStartMs;
    setGame1CursorDwell(Math.min(100, (elapsed / GAME1_DWELL_MS) * 100));

    if (elapsed >= GAME1_DWELL_MS) {
      game1DwellTarget = null;
      game1DwellStartMs = null;
      game1DwellCooldownUntilMs = now + GAME1_DWELL_COOLDOWN_MS;
      setGame1CursorDwell(0);
      attemptSelectJamoPiece(hovered);
    }
  }

  function onGame1HandResults(results) {
    if (!game1HandTrackingActive) return;

    const hand = results.multiHandLandmarks && results.multiHandLandmarks[0];
    if (!hand) {
      game1HandCursor.hidden = true;
      game1DwellTarget = null;
      game1DwellStartMs = null;
      setGame1CursorDwell(0);
      return;
    }

    const tip = hand[8]; // 검지손가락 끝(INDEX_FINGER_TIP)
    const screenRect = game1PlayScreen.getBoundingClientRect();
    const mirroredX = 1 - tip.x; // 미러링된 미리보기와 같은 방향으로 움직이도록 좌우 반전
    const viewportX = screenRect.left + mirroredX * screenRect.width;
    const viewportY = screenRect.top + tip.y * screenRect.height;

    game1HandCursor.hidden = false;
    updateGame1CursorPosition(viewportX - screenRect.left, viewportY - screenRect.top);
    checkGame1Dwell(viewportX, viewportY);
  }

  async function game1HandFrameLoop() {
    if (!game1HandTrackingActive || !game1HandsInstance) return;

    try {
      await game1HandsInstance.send({ image: game1HandWebcamVideo });
    } catch (error) {
      console.log("[야광귀 손가락 인식] 프레임 처리 중 오류:", error);
    }

    if (game1HandTrackingActive) {
      game1HandFrameRequestId = requestAnimationFrame(game1HandFrameLoop);
    }
  }

  async function startGame1HandTracking() {
    if (game1HandTrackingActive) return; // 이미 실행 중이면 중복 시작 방지

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof Hands === "undefined") {
      console.log("[야광귀 손가락 인식] 카메라 API 또는 MediaPipe Hands를 사용할 수 없어요 - 마우스 클릭으로 계속 플레이할 수 있습니다.");
      return;
    }

    try {
      game1HandStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      // 권한 대기 중에 이미 다른 화면으로 이동했다면 스트림만 정리한다.
      if (game1PlayScreen.hidden) {
        game1HandStream.getTracks().forEach((track) => track.stop());
        game1HandStream = null;
        return;
      }

      game1HandWebcamVideo.srcObject = game1HandStream;
      try {
        await game1HandWebcamVideo.play();
      } catch (playError) {
        console.log("[야광귀 손가락 인식] video.play() 실패(무시 가능):", playError);
      }
      game1HandWebcamWrap.hidden = false;

      game1HandsInstance = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      game1HandsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      game1HandsInstance.onResults(onGame1HandResults);

      game1HandTrackingActive = true;
      console.log("[야광귀 손가락 인식] 카메라 준비 완료, 추적 시작");
      game1HandFrameLoop();
    } catch (error) {
      console.log("[야광귀 손가락 인식] 카메라 접근 실패 - 마우스 클릭으로 계속 플레이할 수 있습니다:", error);
      game1HandWebcamWrap.hidden = true;
    }
  }

  function stopGame1HandTracking() {
    game1HandTrackingActive = false;

    if (game1HandFrameRequestId) {
      cancelAnimationFrame(game1HandFrameRequestId);
      game1HandFrameRequestId = null;
    }
    if (game1HandsInstance) {
      game1HandsInstance.close();
      game1HandsInstance = null;
    }
    if (game1HandStream) {
      game1HandStream.getTracks().forEach((track) => track.stop());
      game1HandStream = null;
    }

    game1HandWebcamVideo.srcObject = null;
    game1HandWebcamWrap.hidden = true;
    game1HandCursor.hidden = true;

    game1CursorSmoothX = null;
    game1CursorSmoothY = null;
    game1DwellTarget = null;
    game1DwellStartMs = null;
    setGame1CursorDwell(0);
  }

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
    playSfx("yg_success"); // 짚신이 야광귀에게 전달되는 순간
    setTimeout(goToStory3, 1400 + STORY_HOLD_MS);
  }

  // 카드가 아래에서 회전하며 올라오는 연출은 순수 CSS 키프레임이 아니라
  // Web Animations API로 직접 재생한다. 애니메이션이 끝나면 반드시 cancel()해서
  // "채워진 채로 남아있는" 애니메이션 값이 클릭 후 뒤집기(.is-flipped) 클래스와
  // 충돌하지 않도록 정리한다. 야광귀/그슨대 카드 클리어 스토리가 공용으로 쓴다.
  function playClearCardEntrance(card, cardInner) {
    playSfx("card_sound");

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
    playSfx("game_click");
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
      // 폭죽 스타일 파티클(createEndingFirework)을 화면 중앙에 한 번 터뜨려
      // "훈민정음 28자모 완성!" 텍스트와 함께 등장하게 한다.
      createEndingFirework(endingCardsScreen, 50, 50, "#ffe08a");
      playSfx("clear_sound2");
    }, ENDING_GLOW_DELAY_MS);
  }

  endingNextButton.addEventListener("click", () => {
    playSfx("game_click");
    changeScreen(endingGreetingScreen, { animate: true });
  });

  // ---------- 엔딩: 요괴들 인사 ----------

  const endingGreetingScreen = document.getElementById("ending-greeting-screen");
  const endingGreetingNextButton = document.getElementById("ending-greeting-next-button");

  endingGreetingNextButton.addEventListener("click", () => {
    playSfx("game_click");
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

    playSfx("camera");

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
      // CSS 미리보기(.webcam-video)를 거울처럼 좌우 반전해 보여주므로,
      // 캡처 결과도 미리보기와 어긋나지 않도록 구멍 영역만 좌우 반전해서 그린다.
      ctx.save();
      ctx.translate(WEBCAM_HOLE_PX.x + WEBCAM_HOLE_PX.width, WEBCAM_HOLE_PX.y);
      ctx.scale(-1, 1);
      ctx.drawImage(webcamVideo, sx, sy, sw, sh, 0, 0, WEBCAM_HOLE_PX.width, WEBCAM_HOLE_PX.height);
      ctx.restore();
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
    playSfx("game_click");
    changeScreen(webcamScreen, { animate: true });
    startWebcamStream();
  });

  photoStoreButton.addEventListener("click", () => {
    playSfx("game_click");
    uploadPhotoAndShowQr();
  });

  // ---------- 엔딩: QR 코드 화면 ----------

  const qrScreen = document.getElementById("qr-screen");
  const qrLoading = document.getElementById("qr-loading");
  const qrPanel = document.getElementById("qr-panel");
  const qrCodeBox = document.getElementById("qr-code-box");
  const qrError = document.getElementById("qr-error");
  const qrHomeButton = document.getElementById("qr-home-button");

  const IMGBB_API_KEY = "80075c1d7994d3c3d381ebfb7a2280ca";
  const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";
  const QR_CODE_PIXEL_SIZE = 320; // .qr-code-box(CSS)가 화면 크기에 맞춰 이 값을 다시 스케일해서 보여준다

  // 로딩 / 성공(QR) / 실패, 이 세 상태 중 하나만 보이도록 나머지를 hidden 처리한다.
  function setQrScreenState(state) {
    qrLoading.hidden = state !== "loading";
    qrPanel.hidden = state !== "success";
    qrError.hidden = state !== "error";
  }

  async function uploadPhotoAndShowQr() {
    changeScreen(qrScreen, { animate: true });
    setQrScreenState("loading");
    qrCodeBox.innerHTML = ""; // 이전에 그려둔 QR이 남아있지 않도록 초기화

    if (!capturedPhotoDataUrl) {
      console.error("[QR] 업로드할 캡처 이미지가 없습니다.");
      qrError.textContent = "업로드할 사진이 없어요.\n사진을 다시 촬영해주세요.";
      setQrScreenState("error");
      return;
    }

    try {
      // "data:image/png;base64,AAAA..." 에서 base64 본문만 잘라 imgbb에 보낸다.
      const base64Data = capturedPhotoDataUrl.split(",")[1];

      const formData = new FormData();
      formData.append("key", IMGBB_API_KEY);
      formData.append("image", base64Data);

      const response = await fetch(IMGBB_UPLOAD_URL, { method: "POST", body: formData });
      const result = await response.json();
      console.log("[QR] imgbb 업로드 응답:", result);

      if (!response.ok || !result.success) {
        const message = (result && result.error && result.error.message) || `업로드 실패(status ${response.status})`;
        throw new Error(message);
      }

      const imageUrl = result && result.data && result.data.url;
      if (!imageUrl) {
        // imgbb가 success:true를 주고도 예상한 위치에 url이 없는 경우(응답
        // 구조가 바뀌는 등) — 원인을 콘솔에서 바로 구분할 수 있게 남겨둔다.
        console.error("[QR] imgbb 응답에 data.url이 없습니다:", result);
        throw new Error("이미지 URL을 응답에서 찾지 못했습니다.");
      }
      console.log("[QR] 업로드 성공 - 이미지 URL:", imageUrl);

      // QRCode는 index.html에서 불러온 qrcodejs(cdnjs) 라이브러리가 전역으로
      // 제공한다 — CDN 로드가 막히면(네트워크 차단 등) 이 전역이 아예
      // 없으므로, new QRCode(...)가 막연한 ReferenceError를 던지기 전에
      // 먼저 확인해서 콘솔에 원인을 명확히 남긴다.
      if (typeof QRCode === "undefined") {
        console.error("[QR] QRCode 라이브러리(cdnjs)가 로드되지 않았습니다.");
        throw new Error("QR코드 라이브러리를 불러오지 못했습니다.");
      }

      new QRCode(qrCodeBox, {
        text: imageUrl,
        width: QR_CODE_PIXEL_SIZE,
        height: QR_CODE_PIXEL_SIZE,
        correctLevel: QRCode.CorrectLevel.M,
      });

      setQrScreenState("success");
    } catch (error) {
      console.error("[QR] 사진 업로드/QR 생성 중 오류:", error);
      qrError.textContent = "저장에 실패했습니다. 다시 시도해주세요.\n(네트워크 연결을 확인해주세요)";
      setQrScreenState("error");
    }
  }

  // "모험 끝내기"(button_fin)는 게임을 전부 끝낸 뒤에만 도달하는 버튼이라,
  // 화면 상단의 일반 홈 버튼(goHomeScreen)과 달리 다음 플레이가 완전히
  // 처음 상태로 시작되도록 진행 상태까지 전부 초기화한다. 중간에 아무
  // 화면에서나 누를 수 있는 일반 홈 버튼은 진행 상황을 지우면 안 되므로
  // 건드리지 않는다.
  function finishGameAndGoHome() {
    Object.keys(clearedStages).forEach((key) => {
      clearedStages[key] = false;
    });
    window.selectedCharacter = null;
    debugModeActive = false;
    renderMap(); // 다음에 요괴맵에 들어갔을 때 바로 초기 상태로 보이도록 미리 갱신
    goHomeScreen();
  }

  qrHomeButton.addEventListener("click", finishGameAndGoHome);
});
