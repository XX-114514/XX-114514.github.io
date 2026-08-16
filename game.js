/*
 * Rogue Cell — a small evasion roguelike built for the portfolio.
 * You play a cancer cell trying to survive contact with the immune system.
 * Self-contained: no dependencies, canvas 2D only.
 */
(() => {
  const root = document.querySelector("[data-cell-game]");
  if (!(root instanceof HTMLElement)) return;
  const canvas = root.querySelector("[data-game-canvas]");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const isZh = document.documentElement.lang.toLowerCase().startsWith("zh");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  /* ---------------------------------------------------------------- */
  /* Strings                                                           */
  /* ---------------------------------------------------------------- */
  const STR = isZh ? {
    ready: "准备就绪",
    running: "存活中",
    paused: "已暂停",
    over: "已被清除",
    startTitle: "Rogue Cell",
    startSub: "扮演一个癌细胞，躲避免疫系统的追杀，能活多久？",
    startRules: ["方向键 / WASD 移动", "能力键释放已解锁的能力（默认 J / K / L，可在设置中修改）", "触屏：用左下角摇杆移动，点击右下角技能按钮释放能力"],
    startBtn: "开始逃亡",
    resumeBtn: "继续",
    pauseBtn: "暂停",
    restartBtn: "重新开始",
    fullscreenBtn: "全屏",
    moreBtn: "更多",
    settingsBtn: "按键设置",
    rotateHint: "横屏体验更佳",
    dismissBtn: "关闭",
    joystickLabel: "移动摇杆",
    settingsTitle: "自定义能力按键",
    settingsHint: "点击按钮，然后按下想要绑定的按键",
    pressKeyLabel: "按下按键…",
    resetKeysBtn: "恢复默认",
    keyReserved: "该按键已被占用或保留",
    statsBtn: "属性面板",
    statsTitle: "当前属性",
    statsEmpty: "还没有获得任何强化。",
    statLabels: {
      speed: "移动速度", hp: "最大膜完整性", regen: "膜完整性恢复", resist: "接触伤害抗性",
      evasion: "完全免疫几率", xpgain: "增殖倍率", magnet: "营养吸收半径", stealth: "探测范围降低",
      chemoResist: "化疗耐药性", shield: "护盾层数"
    },
    statsAbilitiesTitle: "已解锁能力",
    statsNoAbilities: "尚未解锁任何主动能力。",
    pausedTitle: "已暂停",
    pausedSub: "免疫系统仍在待命。",
    levelupTitle: "细胞发生突变",
    levelupSub: "选择一项适应性变化",
    overTitle: "被免疫系统清除",
    overSub: "这一次，监视系统赢了。",
    timeUpTitle: "肿瘤负荷不可逆转",
    timeUpSub: "十五分钟后，病程还是占了上风——但你撑到了最后。",
    statTime: "存活时间",
    statLevel: "突变等级",
    statNutrients: "吸收的营养",
    statBest: "历史最佳",
    newBest: "新纪录！",
    hp: "膜完整性",
    xp: "增殖进度",
    level: "Lv",
    abilityNames: { pulse: "细胞因子脉冲", mitosis: "有丝分裂诱饵", hijack: "免疫劫持" },
    organNames: { 1: "肺", 2: "肝", 3: "脑" },
    bootLines: ["正在绕过 MHC-I 呈递…", "下调死亡受体信号…", "重排细胞骨架…", "突变体已就绪"],
    transitionLines: {
      2: ["脱落进入血流…", "在血管中存活…", "在新器官定植…", "转移灶：肝脏"],
      3: ["穿越血脑屏障…", "在中枢神经系统存活…", "在新器官定植…", "转移灶：脑"]
    },
    milestones: [
      { t: 15, text: "微转移灶已建立" },
      { t: 38, text: "免疫逃逸初见成效" },
      { t: 65, text: "血管新生信号增强" },
      { t: 100, text: "免疫编辑压力达到峰值" },
      { t: 210, text: "适应新的微环境" },
      { t: 310, text: "耐药亚克隆开始出现" },
      { t: 425, text: "肿瘤异质性加剧" },
      { t: 540, text: "免疫抑制微环境成型" },
      { t: 700, text: "治疗耐受性接近极限" },
      { t: 825, text: "宿主储备已近枯竭" }
    ],
    stormWarn: "细胞因子风暴来袭",
    beaconWarn: "树突状细胞信号灯激活",
    cloneWarn: "克隆增殖预警",
    metastasisWarn: "检测到远端转移",
    targetedWarn: "靶向药物锁定",
    cafWarn: "癌症相关成纤维细胞聚集",
    netWarn: "中性粒细胞陷阱形成",
    upgrades: {
      speed: { name: "细胞骨架重塑", desc: "移动速度 +10%" },
      hp: { name: "膜增厚", desc: "最大膜完整性 +20，并完全恢复" },
      stealth: { name: "MHC-I 下调", desc: "免疫细胞的探测范围 -12%" },
      regen: { name: "DNA 错配修复", desc: "每秒回复 1.5 点膜完整性" },
      resist: { name: "粘附抵抗", desc: "受到的接触伤害 -15%" },
      xpgain: { name: "快速分裂", desc: "营养获取的增殖值 +25%" },
      magnet: { name: "趋化性增强", desc: "营养吸收半径 +40%" },
      evasion: { name: "PD-L1 上调", desc: "有几率完全免疫一次接触伤害（+10%，上限 40%）" },
      chemoResist: { name: "耐药性", desc: "降低你对化疗脉冲伤害的敏感度（-20%，上限 80%；对其他伤害无效）" },
      ability_pulse: { name: "细胞因子脉冲", desc: "解锁主动能力：击退并短暂麻痹附近的免疫细胞" },
      ability_mitosis: { name: "有丝分裂诱饵", desc: "解锁主动能力：分裂出一个能自主移动的诱饵细胞，长期吸引免疫细胞的注意" },
      ability_hijack: { name: "免疫劫持", desc: "解锁主动能力：策反一个附近的 T 细胞，使其转而攻击其他免疫细胞（信号灯在范围内时会被优先摧毁）" },
      pulseUp: { name: "脉冲强化", desc: "细胞因子脉冲：冷却 -20%，范围增大" },
      mitosisUp: { name: "增殖强化", desc: "有丝分裂诱饵：冷却 -15%，持续时间更长，且额外多分裂一个诱饵" },
      hijackUp: { name: "劫持强化", desc: "免疫劫持：冷却 -20%，范围增大，策反持续时间更长，且可以一次策反更多 T 细胞" },
      shield: { name: "双核化", desc: "获得一层可抵挡下一次伤害的护盾，会自动恢复" }
    }
  } : {
    ready: "Ready",
    running: "Surviving",
    paused: "Paused",
    over: "Eliminated",
    startTitle: "Rogue Cell",
    startSub: "You are a cancer cell. Evade the immune system for as long as you can.",
    startRules: ["Arrow keys / WASD to move", "Ability keys fire unlocked abilities (default J / K / L — remappable)", "Touch: use the joystick in the bottom-left to move, tap an ability button to use it"],
    startBtn: "Start the run",
    resumeBtn: "Resume",
    pauseBtn: "Pause",
    restartBtn: "Restart",
    fullscreenBtn: "Full screen",
    moreBtn: "More",
    settingsBtn: "Keys",
    rotateHint: "Rotate for a better view",
    dismissBtn: "Dismiss",
    joystickLabel: "Movement joystick",
    settingsTitle: "Customize ability keys",
    settingsHint: "Click a button, then press the key you want to bind",
    pressKeyLabel: "Press a key…",
    resetKeysBtn: "Reset to default",
    keyReserved: "That key is reserved or already in use",
    statsBtn: "Stats",
    statsTitle: "Current attributes",
    statsEmpty: "No adaptations acquired yet.",
    statLabels: {
      speed: "Move speed", hp: "Max membrane integrity", regen: "Membrane regeneration", resist: "Contact damage resistance",
      evasion: "Full-evade chance", xpgain: "Proliferation multiplier", magnet: "Nutrient pickup radius", stealth: "Detection radius reduction",
      chemoResist: "Chemoresistance", shield: "Shield charges"
    },
    statsAbilitiesTitle: "Unlocked abilities",
    statsNoAbilities: "No active abilities unlocked yet.",
    pausedTitle: "Paused",
    pausedSub: "Immune surveillance is still standing by.",
    levelupTitle: "Mutation acquired",
    levelupSub: "Choose one adaptation",
    overTitle: "Cleared by the immune system",
    overSub: "Surveillance wins this round.",
    timeUpTitle: "Tumor burden becomes irreversible",
    timeUpSub: "After fifteen minutes, disease progression finally caught up — but you outlasted the clock.",
    statTime: "Time survived",
    statLevel: "Mutation level",
    statNutrients: "Nutrients absorbed",
    statBest: "Best run",
    newBest: "New best!",
    hp: "Membrane integrity",
    xp: "Proliferation",
    level: "Lv",
    abilityNames: { pulse: "Cytokine Pulse", mitosis: "Mitosis Decoy", hijack: "Immune Hijack" },
    organNames: { 1: "Lung", 2: "Liver", 3: "Brain" },
    bootLines: ["Bypassing MHC-I presentation…", "Downregulating death receptors…", "Remodeling cytoskeleton…", "Mutant clone ready"],
    transitionLines: {
      2: ["Shedding into the bloodstream…", "Surviving vascular transit…", "Colonizing a new organ…", "Metastasis site: liver"],
      3: ["Crossing the blood-brain barrier…", "Surviving in the CNS…", "Colonizing a new organ…", "Metastasis site: brain"]
    },
    milestones: [
      { t: 15, text: "Micrometastasis established" },
      { t: 38, text: "Early immune evasion" },
      { t: 65, text: "Angiogenic signaling rising" },
      { t: 100, text: "Immunoediting pressure peaks" },
      { t: 210, text: "Adapting to the new microenvironment" },
      { t: 310, text: "Resistant subclones emerging" },
      { t: 425, text: "Tumor heterogeneity increasing" },
      { t: 540, text: "Immunosuppressive niche established" },
      { t: 700, text: "Treatment tolerance nearing its limit" },
      { t: 825, text: "Host reserves nearly exhausted" }
    ],
    stormWarn: "Cytokine storm incoming",
    beaconWarn: "Dendritic signal beacon active",
    cloneWarn: "Clonal expansion incoming",
    metastasisWarn: "Distant metastasis detected",
    targetedWarn: "Targeted therapy lock-on",
    cafWarn: "Cancer-associated fibroblasts gathering",
    netWarn: "Neutrophil extracellular trap forming",
    upgrades: {
      speed: { name: "Cytoskeletal Remodeling", desc: "+10% move speed" },
      hp: { name: "Membrane Thickening", desc: "+20 max membrane integrity, full heal" },
      stealth: { name: "MHC-I Downregulation", desc: "-12% immune cell detection radius" },
      regen: { name: "Mismatch Repair", desc: "Regenerate 1.5 integrity per second" },
      resist: { name: "Adhesion Resistance", desc: "-15% contact damage taken" },
      xpgain: { name: "Rapid Division", desc: "+25% proliferation from nutrients" },
      magnet: { name: "Chemotaxis Boost", desc: "+40% nutrient pickup radius" },
      evasion: { name: "PD-L1 Upregulation", desc: "Chance to fully evade a contact hit (+10%, capped at 40%)" },
      chemoResist: { name: "Chemoresistance", desc: "Reduces your sensitivity to chemo pulse damage specifically (-20%, capped at 80%; no effect on other damage)" },
      ability_pulse: { name: "Cytokine Pulse", desc: "Unlock an active ability: knock back and briefly stun nearby immune cells" },
      ability_mitosis: { name: "Mitosis Decoy", desc: "Unlock an active ability: split off a decoy that moves on its own and keeps drawing attention for a long time" },
      ability_hijack: { name: "Immune Hijack", desc: "Unlock an active ability: turn a nearby T cell so it attacks other immune cells instead of you (a signal beacon in range is destroyed first)" },
      pulseUp: { name: "Pulse Overcharge", desc: "Cytokine Pulse: -20% cooldown, larger radius" },
      mitosisUp: { name: "Mitotic Overcharge", desc: "Mitosis Decoy: -15% cooldown, longer duration, and splits one extra decoy" },
      hijackUp: { name: "Hijack Overcharge", desc: "Immune Hijack: -20% cooldown, larger radius, longer turned duration, and turns more T cells at once" },
      shield: { name: "Binucleation", desc: "Gain a shield that blocks the next hit, then slowly recharges" }
    }
  };

  const fmtTime = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? "0" : ""}${r}`;
  };

  /* ---------------------------------------------------------------- */
  /* DOM scaffolding (toolbar, HUD, overlays)                          */
  /* ---------------------------------------------------------------- */
  root.classList.add("game-viewer");
  canvas.setAttribute("tabindex", "0");

  const toolbar = document.createElement("div");
  toolbar.className = "game-toolbar";
  toolbar.innerHTML = `
    <span class="game-status" data-status>${STR.ready}</span>
    <div class="game-toolbar-controls">
      <button class="btn btn-compact" type="button" data-pause>${STR.pauseBtn}</button>
      <button class="btn btn-compact game-more-btn" type="button" data-more aria-haspopup="true" aria-expanded="false">${STR.moreBtn}</button>
      <div class="game-actions" data-actions>
        <button class="btn btn-compact" type="button" data-restart>${STR.restartBtn}</button>
        <button class="btn btn-compact" type="button" data-stats>${STR.statsBtn}</button>
        <button class="btn btn-compact" type="button" data-settings>${STR.settingsBtn}</button>
        <button class="btn btn-compact" type="button" data-fullscreen>${STR.fullscreenBtn}</button>
      </div>
    </div>`;
  root.insertBefore(toolbar, canvas);

  const rotateHint = document.createElement("div");
  rotateHint.className = "game-rotate-hint";
  rotateHint.innerHTML = `
    <span>${STR.rotateHint}</span>
    <button type="button" data-rotate-dismiss aria-label="${STR.dismissBtn}">&times;</button>`;
  root.insertBefore(rotateHint, canvas);

  const stage = document.createElement("div");
  stage.className = "game-stage";
  canvas.parentElement.insertBefore(stage, canvas);
  stage.appendChild(canvas);

  const settingsPanel = document.createElement("div");
  settingsPanel.className = "game-settings";
  settingsPanel.hidden = true;
  settingsPanel.innerHTML = `
    <p class="game-settings-title">${STR.settingsTitle}</p>
    <p class="game-settings-hint">${STR.settingsHint}</p>
    <div class="game-settings-rows" data-settings-rows></div>
    <div class="game-settings-actions">
      <button class="btn btn-compact" type="button" data-settings-reset>${STR.resetKeysBtn}</button>
    </div>`;
  stage.appendChild(settingsPanel);

  const statsPanel = document.createElement("div");
  statsPanel.className = "game-settings game-stats-panel";
  statsPanel.hidden = true;
  statsPanel.innerHTML = `
    <p class="game-settings-title">${STR.statsTitle}</p>
    <div class="game-settings-rows" data-stats-rows></div>
    <p class="game-settings-title game-stats-subtitle">${STR.statsAbilitiesTitle}</p>
    <div class="game-settings-rows" data-stats-abilities></div>`;
  stage.appendChild(statsPanel);

  const ABILITY_ORDER = ["hijack", "mitosis", "pulse"];
  const hud = document.createElement("div");
  hud.className = "game-hud";
  hud.innerHTML = `
    <div class="hud-row hud-top">
      <div class="hud-block hud-hp-block">
        <span class="hud-label">${STR.hp}</span>
        <div class="hud-bar hud-hp-bar"><div class="hud-bar-fill" data-hp-fill></div></div>
      </div>
      <div class="hud-block hud-meta">
        <span class="hud-level" data-level>${STR.level} 1</span>
        <span class="hud-timer" data-timer>0:00</span>
        <span class="hud-organ" data-organ></span>
        <span class="hud-best" data-best></span>
      </div>
    </div>
    <div class="hud-xp-bar-row"><div class="hud-bar hud-xp-bar"><div class="hud-bar-fill" data-xp-fill></div></div></div>
    <div class="hud-abilities" data-abilities>
      ${ABILITY_ORDER.map((kind) => `
      <button class="hud-ability" type="button" data-ability-btn="${kind}" hidden>
        <span class="hud-ability-fill" data-ability-fill="${kind}"></span>
        <span class="hud-ability-key" data-ability-key="${kind}"></span>
        <span class="hud-ability-label">${STR.abilityNames[kind]}</span>
      </button>`).join("")}
    </div>
    <div class="game-joystick" data-joystick role="button" aria-label="${STR.joystickLabel}">
      <div class="game-joystick-knob" data-joystick-knob></div>
    </div>
    <div class="hud-milestone" data-milestone aria-live="polite"></div>
    <div class="hud-event" data-event aria-live="polite"></div>
    <div class="hud-vignette" data-vignette aria-hidden="true"></div>`;
  stage.appendChild(hud);

  const overlay = document.createElement("div");
  overlay.className = "game-overlay";
  stage.appendChild(overlay);

  /* ---------------------------------------------------------------- */
  /* Sizing                                                             */
  /* ---------------------------------------------------------------- */
  let W = 0, H = 0, DPR = 1;
  const resize = () => {
    const rect = stage.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  window.addEventListener("resize", resize, { passive: true });

  /* ---------------------------------------------------------------- */
  /* Utility                                                            */
  /* ---------------------------------------------------------------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  const palette = {
    mint: "149, 229, 193",
    coral: "255, 107, 87",
    ivory: "241, 239, 231",
    gold: "234, 196, 122",
    violet: "196, 140, 224",
    rose: "216, 158, 168",
    nightSoft: "14, 27, 24"
  };
  const rgba = (tone, a) => `rgba(${palette[tone]}, ${a})`;

  /* ---------------------------------------------------------------- */
  /* Game state                                                         */
  /* ---------------------------------------------------------------- */
  const BEST_KEY = "xx-rogue-cell-best";
  const loadBest = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(BEST_KEY) || "null");
      if (raw && typeof raw.time === "number") return raw;
    } catch (_e) { /* ignore */ }
    return { time: 0, level: 1, nutrients: 0 };
  };
  const saveBest = (record) => {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(record)); } catch (_e) { /* ignore */ }
  };
  let best = loadBest();

  const KEYBINDS_KEY = "xx-rogue-cell-keys";
  const DEFAULT_KEYBINDS = { pulse: "j", mitosis: "k", hijack: "l" };
  const RESERVED_KEYS = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "p", "escape", " ", "enter", "1", "2", "3"]);
  const loadKeyBindings = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEYBINDS_KEY) || "null");
      if (raw && raw.pulse && raw.mitosis && raw.hijack) return raw;
    } catch (_e) { /* ignore */ }
    return { ...DEFAULT_KEYBINDS };
  };
  const saveKeyBindings = () => {
    try { localStorage.setItem(KEYBINDS_KEY, JSON.stringify(keyBindings)); } catch (_e) { /* ignore */ }
  };
  let keyBindings = loadKeyBindings();
  let rebindingKind = null;

  const BOOT_DURATION = 1.7;
  const TRANSITION_DURATION = 2.6;
  const T_CAP = 40;
  const EXHAUST_AGE = 24;
  const EXHAUST_LINGER = 8;
  const STAGE_DURATION = 300; // 5 minutes per stage: lung -> liver -> brain (scene only — no gameplay scaling is keyed off this)
  const RUN_LIMIT = STAGE_DURATION * 3; // 15 minutes total
  const CHEMO_ESCALATE_T = 600; // the 10-minute mark: chemo's kill chance reaches certainty here, and its
  // radius/frequency/player damage all start ramping toward maximum from here to the end of the run
  const chemoKillProgress = (t) => clamp(t / CHEMO_ESCALATE_T, 0, 1);
  const chemoEscalation = (t) => clamp((t - CHEMO_ESCALATE_T) / (RUN_LIMIT - CHEMO_ESCALATE_T), 0, 1);
  const STORM_START = 120;
  const STORM_INTERVAL = 48;
  const STORM_DURATION = 12;
  const BEACON_START = 75;
  const BEACON_INTERVAL = 21;
  const TARGETED_START = 130;
  const TARGETED_INTERVAL = 68;
  const TARGETED_TRACK = 1.6;
  const TARGETED_LOCK = 0.6;
  // calibrated so a player at base speed (150) and base radius (15) cannot outrun the lock window,
  // but exactly a +20% speed bonus makes it (just barely) survivable — no speed upgrade, no escape
  const TARGETED_RADIUS = 150 * 1.2 * TARGETED_LOCK - 15;
  const TARGETED_DAMAGE = 38;
  const CAF_START = 300; // a pure time threshold — happens to land around the liver-stage transition, not gated by stage
  const CAF_INTERVAL = 60;
  const NET_START = 600; // a pure time threshold — happens to land around the brain-stage transition, not gated by stage
  const NET_INTERVAL = 45;

  const ABILITY_DEFAULTS = {
    pulse: { cooldown: 6, radius: 140 },
    mitosis: { cooldown: 10, duration: 16, count: 1 },
    hijack: { cooldown: 9, radius: 130, duration: 5, count: 1 }
  };
  const ABILITY_UNLOCK_ID = { pulse: "ability_pulse", mitosis: "ability_mitosis", hijack: "ability_hijack" };
  const ABILITY_UP_ID = { pulse: "pulseUp", mitosis: "mitosisUp", hijack: "hijackUp" };
  const UPGRADE_TO_ABILITY_KIND = { ability_pulse: "pulse", ability_mitosis: "mitosis", ability_hijack: "hijack", pulseUp: "pulse", mitosisUp: "mitosis", hijackUp: "hijack" };

  const UPGRADE_ORDER = ["speed", "hp", "stealth", "regen", "resist", "xpgain", "magnet", "evasion", "chemoResist", "ability_pulse", "ability_mitosis", "ability_hijack", "pulseUp", "mitosisUp", "hijackUp", "shield"];
  const MAX_STACKS = { speed: 5, hp: 5, stealth: 4, regen: 3, resist: 4, xpgain: 4, magnet: 3, evasion: 4, chemoResist: 4, ability_pulse: 1, ability_mitosis: 1, ability_hijack: 1, pulseUp: 3, mitosisUp: 3, hijackUp: 3, shield: 2 };

  const freshState = () => ({
    phase: "idle", // idle | boot | running | levelup | paused | gameover | transition
    t: 0,
    bootTimer: 0,
    transitionTimer: 0,
    transitionTarget: 2,
    stage: 1,
    deathCause: "immune", // immune | time
    nutrients: 0,
    milestoneIndex: 0,
    milestoneTimer: 0,
    milestoneText: "",
    eventTimer: 0,
    eventText: "",
    eventTone: "mint",
    stormActive: false,
    stormTimer: 0,
    nextStormT: STORM_START,
    nextBeaconT: BEACON_START,
    nextTargetedT: TARGETED_START,
    nextCafT: CAF_START,
    nextNetT: NET_START,
    nextChemoT: 100,
    autoMitosisTimer: 18,
    auraRegen: 0,
    auraResist: 0,
    auraEvasion: 0,
    auraDetectMult: 1,
    shake: 0,
    pendingUpgrades: [],
    pendingClones: [],
    lastSpawnT: { t: 0, nk: 0, mac: 0 }
  });
  let state = freshState();

  const freshPlayer = () => ({
    x: 0, y: 0, r: 15,
    vx: 0, vy: 0,
    baseSpeed: 150,
    stacks: {},
    hp: 100, maxHp: 100,
    xp: 0, xpToNext: 30, level: 1,
    regen: 0,
    contactResist: 0,
    evasionChance: 0,
    chemoResist: 0,
    xpMult: 1,
    magnetR: 46,
    detectMult: 1,
    invuln: 0,
    hitFlash: 0,
    evadeFlash: 0,
    shieldMax: 0, shield: 0, shieldTimer: 0,
    abilities: { pulse: null, mitosis: null, hijack: null },
    facing: 0
  });
  let player = freshPlayer();

  let enemies = [];
  let nutrients = [];
  let hazards = [];
  let beacons = [];
  let particles = [];
  let decoys = [];
  let strikes = [];
  let auras = [];

  /* ---------------------------------------------------------------- */
  /* Input                                                              */
  /* ---------------------------------------------------------------- */
  const keys = new Set();
  const touch = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
  const STICK_RADIUS = 46;
  const stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
  const abilityTapped = { pulse: false, mitosis: false, hijack: false };

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (rebindingKind) {
      event.preventDefault();
      if (key === "escape") { rebindingKind = null; renderKeySettings(); return; }
      if (!RESERVED_KEYS.has(key)) {
        Object.keys(keyBindings).forEach((k) => { if (keyBindings[k] === key) keyBindings[k] = keyBindings[rebindingKind]; });
        keyBindings[rebindingKind] = key;
        saveKeyBindings();
        syncAbilityKeyLabels();
      }
      rebindingKind = null;
      renderKeySettings();
      return;
    }
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) event.preventDefault();
    keys.add(key);
    if (key === keyBindings.pulse) abilityTapped.pulse = true;
    if (key === keyBindings.mitosis) abilityTapped.mitosis = true;
    if (key === keyBindings.hijack) abilityTapped.hijack = true;
    if (key === "escape" && !settingsPanel.hidden) { settingsPanel.hidden = true; return; }
    if (key === "escape" && !statsPanel.hidden) { statsPanel.hidden = true; return; }
    if (key === "p" || key === "escape") togglePause();
    if (state.phase === "levelup" && ["1", "2", "3"].includes(event.key)) {
      chooseUpgrade(Number(event.key) - 1);
    }
    if (state.phase === "idle" && (event.key === "Enter" || event.key === " ")) startRun();
    if (state.phase === "boot" && (event.key === "Enter" || event.key === " ")) state.bootTimer = BOOT_DURATION;
    if (state.phase === "gameover" && event.key === "Enter") startRun();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

  canvas.addEventListener("pointerdown", (event) => {
    canvas.focus({ preventScroll: true });
    if (state.phase === "boot") { state.bootTimer = BOOT_DURATION; return; }
    if (state.phase !== "running") return;
    touch.active = true;
    const rect = canvas.getBoundingClientRect();
    touch.ox = event.clientX - rect.left;
    touch.oy = event.clientY - rect.top;
    touch.dx = 0;
    touch.dy = 0;
  });
  window.addEventListener("pointermove", (event) => {
    if (!touch.active) return;
    const rect = canvas.getBoundingClientRect();
    touch.dx = event.clientX - rect.left - touch.ox;
    touch.dy = event.clientY - rect.top - touch.oy;
  });
  window.addEventListener("pointerup", () => { touch.active = false; touch.dx = 0; touch.dy = 0; });

  const joystick = hud.querySelector("[data-joystick]");
  const joystickKnob = hud.querySelector("[data-joystick-knob]");
  const setJoystickKnob = (x, y) => { joystickKnob.style.transform = `translate(${x}px, ${y}px)`; };
  joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    try { joystick.setPointerCapture(event.pointerId); } catch (_e) { /* ignore */ }
    const rect = joystick.getBoundingClientRect();
    stick.active = true;
    stick.ox = rect.left + rect.width / 2;
    stick.oy = rect.top + rect.height / 2;
    stick.dx = 0;
    stick.dy = 0;
    setJoystickKnob(0, 0);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (!stick.active) return;
    stick.dx = event.clientX - stick.ox;
    stick.dy = event.clientY - stick.oy;
    const len = Math.hypot(stick.dx, stick.dy) || 1;
    const clamped = Math.min(len, STICK_RADIUS);
    setJoystickKnob((stick.dx / len) * clamped, (stick.dy / len) * clamped);
  });
  const releaseJoystick = () => {
    stick.active = false;
    stick.dx = 0;
    stick.dy = 0;
    setJoystickKnob(0, 0);
  };
  joystick.addEventListener("pointerup", releaseJoystick);
  joystick.addEventListener("pointercancel", releaseJoystick);
  joystick.addEventListener("lostpointercapture", releaseJoystick);

  rotateHint.querySelector("[data-rotate-dismiss]").addEventListener("click", () => {
    rotateHint.classList.add("is-dismissed");
  });

  const moveVector = () => {
    let x = 0, y = 0;
    if (keys.has("arrowleft") || keys.has("a")) x -= 1;
    if (keys.has("arrowright") || keys.has("d")) x += 1;
    if (keys.has("arrowup") || keys.has("w")) y -= 1;
    if (keys.has("arrowdown") || keys.has("s")) y += 1;
    if (stick.active) {
      const mag = clamp(Math.hypot(stick.dx, stick.dy) / STICK_RADIUS, 0, 1);
      const len = Math.hypot(stick.dx, stick.dy) || 1;
      return { x: (stick.dx / len) * mag, y: (stick.dy / len) * mag };
    }
    if (touch.active) {
      const mag = clamp(Math.hypot(touch.dx, touch.dy) / 46, 0, 1);
      const len = Math.hypot(touch.dx, touch.dy) || 1;
      x = (touch.dx / len) * mag;
      y = (touch.dy / len) * mag;
      return { x, y };
    }
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; }
    return { x, y };
  };

  /* ---------------------------------------------------------------- */
  /* Overlays                                                           */
  /* ---------------------------------------------------------------- */
  const renderOverlay = () => {
    if (state.phase === "idle") {
      overlay.innerHTML = `
        <div class="game-panel">
          <p class="game-panel-kicker">${STR.ready}</p>
          <h3>${STR.startTitle}</h3>
          <p class="game-panel-sub">${STR.startSub}</p>
          <ul class="game-panel-rules">${STR.startRules.map((r) => `<li>${r}</li>`).join("")}</ul>
          <button class="btn game-panel-btn" type="button" data-start>${STR.startBtn}</button>
          ${best.time > 0 ? `<p class="game-panel-best">${STR.statBest}: ${fmtTime(best.time)} · ${STR.level} ${best.level}</p>` : ""}
        </div>`;
      overlay.querySelector("[data-start]")?.addEventListener("click", startRun);
      overlay.hidden = false;
    } else if (state.phase === "paused") {
      overlay.innerHTML = `
        <div class="game-panel">
          <p class="game-panel-kicker">${STR.paused}</p>
          <h3>${STR.pausedTitle}</h3>
          <p class="game-panel-sub">${STR.pausedSub}</p>
          <button class="btn game-panel-btn" type="button" data-resume>${STR.resumeBtn}</button>
        </div>`;
      overlay.querySelector("[data-resume]")?.addEventListener("click", togglePause);
      overlay.hidden = false;
    } else if (state.phase === "levelup") {
      const cards = state.pendingUpgrades.map((id, index) => {
        const up = STR.upgrades[id];
        const kind = UPGRADE_TO_ABILITY_KIND[id];
        const keyBadge = kind ? ` <span class="game-card-key">${keyBindings[kind].toUpperCase()}</span>` : "";
        return `<button class="game-card" type="button" data-choice="${index}">
          <span class="game-card-no">${index + 1}</span>
          <strong>${up.name}${keyBadge}</strong>
          <span>${up.desc}</span>
        </button>`;
      }).join("");
      overlay.innerHTML = `
        <div class="game-panel game-panel-wide">
          <p class="game-panel-kicker">${STR.level} ${player.level}</p>
          <h3>${STR.levelupTitle}</h3>
          <p class="game-panel-sub">${STR.levelupSub}</p>
          <div class="game-card-row">${cards}</div>
        </div>`;
      overlay.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => chooseUpgrade(Number(button.getAttribute("data-choice"))));
      });
      overlay.hidden = false;
    } else if (state.phase === "gameover") {
      const record = { time: state.t, level: player.level, nutrients: state.nutrients };
      const isNewBest = record.time > best.time;
      if (isNewBest) { best = record; saveBest(best); }
      const timeUp = state.deathCause === "time";
      overlay.innerHTML = `
        <div class="game-panel">
          <p class="game-panel-kicker">${STR.over}${isNewBest ? ` · ${STR.newBest}` : ""}</p>
          <h3>${timeUp ? STR.timeUpTitle : STR.overTitle}</h3>
          <p class="game-panel-sub">${timeUp ? STR.timeUpSub : STR.overSub}</p>
          <dl class="game-stats">
            <div><dt>${STR.statTime}</dt><dd>${fmtTime(state.t)}</dd></div>
            <div><dt>${STR.statLevel}</dt><dd>${player.level}</dd></div>
            <div><dt>${STR.statNutrients}</dt><dd>${state.nutrients}</dd></div>
            <div><dt>${STR.statBest}</dt><dd>${fmtTime(best.time)}</dd></div>
          </dl>
          <button class="btn game-panel-btn" type="button" data-restart-panel>${STR.restartBtn}</button>
        </div>`;
      overlay.querySelector("[data-restart-panel]")?.addEventListener("click", startRun);
      overlay.hidden = false;
    } else {
      overlay.hidden = true;
      overlay.innerHTML = "";
    }
  };

  const statusEl = toolbar.querySelector("[data-status]");
  const setStatus = () => {
    statusEl.textContent = state.phase === "running" || state.phase === "boot" || state.phase === "transition" || state.phase === "levelup" ? STR.running
      : state.phase === "paused" ? STR.paused
      : state.phase === "gameover" ? STR.over
      : STR.ready;
  };

  /* ---------------------------------------------------------------- */
  /* Flow control                                                      */
  /* ---------------------------------------------------------------- */
  // Orientation Lock only takes effect inside fullscreen (and isn't supported at all on iOS Safari) —
  // the rotate-hint banner is the fallback for platforms where this silently does nothing.
  const lockLandscapeIfPossible = () => {
    try {
      const orientation = screen.orientation;
      if (orientation && orientation.lock) orientation.lock("landscape").catch(() => {});
    } catch (_e) { /* ignore unsupported/denied orientation lock */ }
  };

  const requestFullscreenIfPossible = () => {
    try {
      if (!document.fullscreenElement && root.requestFullscreen) {
        const request = root.requestFullscreen();
        if (isTouchDevice && request && request.then) request.then(lockLandscapeIfPossible).catch(() => {});
      } else if (isTouchDevice) {
        lockLandscapeIfPossible();
      }
    } catch (_e) { /* ignore unsupported/denied fullscreen */ }
  };

  function startRun() {
    requestFullscreenIfPossible();
    state = freshState();
    player = freshPlayer();
    player.x = W / 2;
    player.y = H / 2;
    enemies = [];
    nutrients = [];
    hazards = [];
    beacons = [];
    particles = [];
    decoys = [];
    strikes = [];
    auras = [];
    state.phase = "boot";
    setStatus();
    renderOverlay();
    canvas.focus({ preventScroll: true });
  }

  function togglePause() {
    if (state.phase === "running") { state.phase = "paused"; }
    else if (state.phase === "paused") { state.phase = "running"; }
    else return;
    setStatus();
    renderOverlay();
  }

  function endRun(cause) {
    state.deathCause = cause || "immune";
    state.phase = "gameover";
    setStatus();
    renderOverlay();
  }

  const upgradePool = () => {
    const available = UPGRADE_ORDER.filter((id) => {
      const stacks = player.stacks[id] || 0;
      if (stacks >= (MAX_STACKS[id] || 99)) return false;
      const unlockKind = Object.keys(ABILITY_UNLOCK_ID).find((k) => ABILITY_UNLOCK_ID[k] === id);
      if (unlockKind && player.abilities[unlockKind]) return false;
      const upKind = Object.keys(ABILITY_UP_ID).find((k) => ABILITY_UP_ID[k] === id);
      if (upKind && !player.abilities[upKind]) return false;
      return true;
    });
    const pool = available.length ? available : UPGRADE_ORDER;
    const picks = [];
    const copy = pool.slice();
    while (picks.length < 3 && copy.length) {
      const index = Math.floor(Math.random() * copy.length);
      picks.push(copy.splice(index, 1)[0]);
    }
    return picks;
  };

  const openLevelUp = () => {
    state.pendingUpgrades = upgradePool();
    state.phase = "levelup";
    setStatus();
    renderOverlay();
  };

  function chooseUpgrade(index) {
    const id = state.pendingUpgrades[index];
    if (!id) return;
    player.stacks[id] = (player.stacks[id] || 0) + 1;
    switch (id) {
      case "speed": player.baseSpeed *= 1.1; break;
      case "hp": player.maxHp += 20; player.hp = player.maxHp; break;
      case "stealth": player.detectMult *= 0.88; break;
      case "regen": player.regen += 1.5; break;
      case "resist": player.contactResist = clamp(player.contactResist + 0.15, 0, 0.7); break;
      case "xpgain": player.xpMult += 0.25; break;
      case "magnet": player.magnetR *= 1.4; break;
      case "evasion": player.evasionChance = clamp(player.evasionChance + 0.1, 0, 0.4); break;
      case "chemoResist": player.chemoResist = clamp(player.chemoResist + 0.2, 0, 0.8); break;
      case "ability_pulse": player.abilities.pulse = { timer: 0, ...ABILITY_DEFAULTS.pulse }; break;
      case "ability_mitosis": player.abilities.mitosis = { timer: 0, ...ABILITY_DEFAULTS.mitosis }; break;
      case "ability_hijack": player.abilities.hijack = { timer: 0, ...ABILITY_DEFAULTS.hijack }; break;
      case "pulseUp": player.abilities.pulse.cooldown *= 0.8; player.abilities.pulse.radius += 30; break;
      case "mitosisUp": player.abilities.mitosis.cooldown *= 0.85; player.abilities.mitosis.duration += 6; player.abilities.mitosis.count += 1; break;
      case "hijackUp": player.abilities.hijack.cooldown *= 0.8; player.abilities.hijack.radius += 25; player.abilities.hijack.duration += 2; player.abilities.hijack.count += 1; break;
      case "shield": player.shieldMax += 1; player.shield = player.shieldMax; break;
      default: break;
    }
    state.phase = "running";
    setStatus();
    renderOverlay();
  }

  toolbar.querySelector("[data-restart]").addEventListener("click", startRun);
  toolbar.querySelector("[data-pause]").addEventListener("click", () => {
    if (state.phase === "running" || state.phase === "paused") togglePause();
  });
  toolbar.querySelector("[data-fullscreen]").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await root.requestFullscreen();
        if (isTouchDevice) lockLandscapeIfPossible();
      } else {
        await document.exitFullscreen();
      }
    } catch (_e) { /* ignore unsupported fullscreen */ }
  });
  root.addEventListener("fullscreenchange", () => {
    window.setTimeout(resize, 60);
    if (!document.fullscreenElement) {
      try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch (_e) { /* ignore */ }
    }
  });

  /* ---------------------------------------------------------------- */
  /* Toolbar overflow menu (narrow screens)                            */
  /* ---------------------------------------------------------------- */
  const moreBtn = toolbar.querySelector("[data-more]");
  const actionsMenu = toolbar.querySelector("[data-actions]");
  const closeMoreMenu = () => {
    actionsMenu.classList.remove("is-open");
    moreBtn.setAttribute("aria-expanded", "false");
  };
  moreBtn.addEventListener("click", () => {
    const open = actionsMenu.classList.toggle("is-open");
    moreBtn.setAttribute("aria-expanded", String(open));
  });
  actionsMenu.addEventListener("click", (event) => {
    if (event.target.closest("button")) closeMoreMenu();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!actionsMenu.classList.contains("is-open")) return;
    if (event.target.closest(".game-toolbar-controls")) return;
    closeMoreMenu();
  });

  /* ---------------------------------------------------------------- */
  /* Key binding settings                                              */
  /* ---------------------------------------------------------------- */
  const syncAbilityKeyLabels = () => {
    hud.querySelectorAll("[data-ability-key]").forEach((el) => {
      const kind = el.getAttribute("data-ability-key");
      el.textContent = keyBindings[kind].toUpperCase();
    });
  };

  const renderKeySettings = () => {
    const rows = settingsPanel.querySelector("[data-settings-rows]");
    rows.innerHTML = ABILITY_ORDER.slice().reverse().map((kind) => `
      <div class="game-settings-row">
        <span>${STR.abilityNames[kind]}</span>
        <button class="game-key-btn${rebindingKind === kind ? " is-listening" : ""}" type="button" data-rebind="${kind}">${rebindingKind === kind ? STR.pressKeyLabel : keyBindings[kind].toUpperCase()}</button>
      </div>`).join("");
    rows.querySelectorAll("[data-rebind]").forEach((button) => {
      button.addEventListener("click", () => {
        rebindingKind = button.getAttribute("data-rebind");
        renderKeySettings();
      });
    });
  };

  toolbar.querySelector("[data-settings]").addEventListener("click", () => {
    statsPanel.hidden = true;
    settingsPanel.hidden = !settingsPanel.hidden;
    rebindingKind = null;
    if (!settingsPanel.hidden) renderKeySettings();
  });
  settingsPanel.querySelector("[data-settings-reset]").addEventListener("click", () => {
    keyBindings = { ...DEFAULT_KEYBINDS };
    saveKeyBindings();
    syncAbilityKeyLabels();
    renderKeySettings();
  });
  syncAbilityKeyLabels();

  /* ---------------------------------------------------------------- */
  /* Attribute panel — a running record of every stat the run has boosted */
  /* ---------------------------------------------------------------- */
  const renderStatsPanel = () => {
    const rows = statsPanel.querySelector("[data-stats-rows]");
    const abilitiesEl = statsPanel.querySelector("[data-stats-abilities]");
    const stacksOf = (id) => player.stacks[id] || 0;
    const lines = [];
    if (stacksOf("speed")) lines.push([STR.statLabels.speed, `+${Math.round((player.baseSpeed / 150 - 1) * 100)}% (×${stacksOf("speed")})`]);
    if (stacksOf("hp")) lines.push([STR.statLabels.hp, `${player.maxHp} (+${player.maxHp - 100})`]);
    if (stacksOf("regen")) {
      const lateness = clamp(state.t / RUN_LIMIT, 0, 1);
      const baselineRegen = 0.2 + lateness * 1.0;
      lines.push([STR.statLabels.regen, `${(player.regen + baselineRegen + state.auraRegen).toFixed(1)} / s`]);
    }
    if (stacksOf("resist")) lines.push([STR.statLabels.resist, `${Math.round(clamp(player.contactResist + state.auraResist, 0, 0.85) * 100)}%`]);
    if (stacksOf("evasion")) lines.push([STR.statLabels.evasion, `${Math.round(clamp(player.evasionChance + state.auraEvasion, 0, 0.75) * 100)}%`]);
    if (stacksOf("chemoResist")) lines.push([STR.statLabels.chemoResist, `${Math.round(player.chemoResist * 100)}%`]);
    if (stacksOf("xpgain")) lines.push([STR.statLabels.xpgain, `×${player.xpMult.toFixed(2)}`]);
    if (stacksOf("magnet")) lines.push([STR.statLabels.magnet, `${Math.round(player.magnetR)}px`]);
    if (stacksOf("stealth")) lines.push([STR.statLabels.stealth, `-${Math.round((1 - player.detectMult) * 100)}%`]);
    if (player.shieldMax > 0) lines.push([STR.statLabels.shield, `${player.shield} / ${player.shieldMax}`]);
    rows.innerHTML = lines.length
      ? lines.map(([label, val]) => `<div class="game-settings-row"><span>${label}</span><strong>${val}</strong></div>`).join("")
      : `<p class="game-settings-hint">${STR.statsEmpty}</p>`;

    const abilityLines = ABILITY_ORDER.filter((kind) => player.abilities[kind]).map((kind) => {
      const ab = player.abilities[kind];
      const level = (player.stacks[ABILITY_UP_ID[kind]] || 0) + 1;
      const countBadge = (kind === "mitosis" || kind === "hijack") && ab.count > 1 ? ` · ×${ab.count}` : "";
      return `<div class="game-settings-row"><span>${STR.abilityNames[kind]} [${keyBindings[kind].toUpperCase()}]</span><strong>Lv${level} · ${ab.cooldown.toFixed(1)}s${countBadge}</strong></div>`;
    });
    abilitiesEl.innerHTML = abilityLines.length ? abilityLines.join("") : `<p class="game-settings-hint">${STR.statsNoAbilities}</p>`;
  };

  toolbar.querySelector("[data-stats]").addEventListener("click", () => {
    settingsPanel.hidden = true;
    statsPanel.hidden = !statsPanel.hidden;
    if (!statsPanel.hidden) renderStatsPanel();
  });

  const launchButton = document.querySelector("[data-launch]");
  if (launchButton) {
    launchButton.addEventListener("click", () => {
      startRun();
      stage.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ---------------------------------------------------------------- */
  /* Spawning                                                           */
  /* ---------------------------------------------------------------- */
  const edgeSpawn = (margin) => {
    const side = Math.floor(rand(0, 4));
    if (side === 0) return { x: rand(0, W), y: -margin };
    if (side === 1) return { x: rand(0, W), y: H + margin };
    if (side === 2) return { x: -margin, y: rand(0, H) };
    return { x: W + margin, y: rand(0, H) };
  };

  const tCellCount = () => enemies.reduce((n, e) => n + (e.type === "t" ? 1 : 0), 0);

  const spawnTCell = (pos) => {
    if (tCellCount() >= T_CAP) return;
    const p = pos || edgeSpawn(30);
    enemies.push({
      type: "t", x: p.x, y: p.y, r: 12, speed: rand(70, 92),
      detect: 900, wobble: rand(0, Math.PI * 2), hitCd: 0,
      age: 0, exhausted: false, buffTimer: 0, hijacked: false, hijackTimer: 0
    });
  };
  const spawnNK = () => {
    const pos = edgeSpawn(30);
    enemies.push({
      type: "nk", x: pos.x, y: pos.y, r: 10, speed: rand(46, 58),
      detect: 230, wobble: rand(0, Math.PI * 2), hitCd: 0,
      dashState: "idle", dashTimer: rand(0.5, 1.6), dashVX: 0, dashVY: 0,
      hijacked: false, hijackTimer: 0
    });
  };
  const spawnMacrophage = () => {
    const pos = edgeSpawn(40);
    enemies.push({
      type: "mac", x: pos.x, y: pos.y, r: 22, speed: rand(26, 34),
      detect: 900, wobble: rand(0, Math.PI * 2), hitCd: 0, engulf: 0,
      presentTimer: 0, hijacked: false, hijackTimer: 0
    });
  };
  const spawnChemo = () => {
    // small and mild before the 10-minute mark; only then does radius start ramping toward full-screen coverage
    const escalation = chemoEscalation(state.t);
    const r = rand(40, 70) + escalation * Math.max(W, H) * 0.85;
    // best-effort placement: try a few candidate centers and keep the one furthest from any still-active zone
    const margin = Math.min(r * 0.6, Math.min(W, H) * 0.4);
    let bestX = W / 2;
    let bestY = H / 2;
    let bestScore = -Infinity;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const cx = rand(margin, Math.max(margin, W - margin));
      const cy = rand(margin, Math.max(margin, H - margin));
      let score = 0;
      hazards.forEach((hz) => {
        if (hz.phase === "fade") return;
        score = Math.min(score, dist(cx, cy, hz.x, hz.y) - hz.r - r);
      });
      if (score > bestScore) { bestScore = score; bestX = cx; bestY = cy; }
    }
    hazards.push({
      x: bestX, y: bestY,
      r, timer: 1.1, phase: "warn", hitApplied: false, enemyHitApplied: false
    });
  };
  const spawnBeacon = () => {
    beacons.push({
      x: rand(W * 0.25, W * 0.75), y: rand(H * 0.25, H * 0.75),
      r: 15, life: 26, pulseTimer: 1.5, vx: rand(-14, 14), vy: rand(-14, 14)
    });
    state.eventText = STR.beaconWarn;
    state.eventTone = "gold";
    state.eventTimer = 3;
  };
  const spawnNutrient = () => {
    const big = Math.random() < 0.1;
    nutrients.push({
      x: rand(30, W - 30), y: rand(30, H - 30), r: big ? 9 : 5, phase: rand(0, Math.PI * 2), big
    });
  };
  const nutrientValue = (n) => {
    const base = 10 + Math.floor(state.t / 22) * 2;
    return n && n.big ? Math.round(base * 3.2) : base;
  };

  const spawnDecoy = (count) => {
    const ab = player.abilities.mitosis;
    const duration = ab ? ab.duration : 14;
    const hp = 3 + (ab ? (player.stacks.mitosisUp || 0) : 0);
    for (let i = 0; i < count; i += 1) {
      decoys.push({
        x: player.x + rand(-10, 10), y: player.y + rand(-10, 10), r: player.r * 0.85,
        hp, life: duration, maxLife: duration,
        vx: rand(-40, 40), vy: rand(-40, 40), wanderTimer: rand(0.6, 1.4)
      });
    }
  };

  /* ---------------------------------------------------------------- */
  /* Abilities                                                          */
  /* ---------------------------------------------------------------- */
  const burst = (x, y, tone, count) => {
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      particles.push({
        x, y, vx: Math.cos(angle) * rand(80, 200), vy: Math.sin(angle) * rand(80, 200),
        life: 0.5, maxLife: 0.5, tone, r: rand(1.5, 3)
      });
    }
  };

  // NET fields wade-drag immune cells hard, but the cancer cell slips through mostly unhindered
  const netSlowMultiplier = (x, y, isPlayer) => {
    let mult = 1;
    auras.forEach((a) => {
      if (a.kind === "net" && dist(x, y, a.x, a.y) < a.r) {
        mult = Math.min(mult, isPlayer ? 0.85 : 0.45);
      }
    });
    return mult;
  };

  const useAbility = (kind) => {
    const ab = player.abilities[kind];
    if (!ab || ab.timer > 0) return;
    if (kind === "pulse") {
      ab.timer = ab.cooldown;
      player.invuln = Math.max(player.invuln, 0.25);
      state.shake = Math.max(state.shake, 6);
      enemies.forEach((enemy) => {
        if (enemy.hijacked) return;
        const d = dist(player.x, player.y, enemy.x, enemy.y);
        if (d < ab.radius) {
          const push = (1 - d / ab.radius) * 260;
          const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
          enemy.x += Math.cos(angle) * push * 0.05 * 6;
          enemy.y += Math.sin(angle) * push * 0.05 * 6;
          enemy.stun = 0.9;
        }
      });
      burst(player.x, player.y, "mint", 20);
    } else if (kind === "mitosis") {
      ab.timer = ab.cooldown;
      spawnDecoy(ab.count);
      burst(player.x, player.y, "mint", 14);
    } else if (kind === "hijack") {
      // a signal beacon always takes priority when in range; otherwise hijack only ever turns T cells,
      // and higher tiers can turn several at once in a single activation
      let bestBeacon = null;
      let bestBeaconDist = ab.radius;
      beacons.forEach((b) => {
        const d = dist(player.x, player.y, b.x, b.y);
        if (d < bestBeaconDist) { bestBeaconDist = d; bestBeacon = b; }
      });
      if (bestBeacon) {
        ab.timer = ab.cooldown;
        beacons = beacons.filter((b) => b !== bestBeacon);
        burst(bestBeacon.x, bestBeacon.y, "gold", 18);
        gainXP(20);
        return;
      }
      const targets = enemies
        .filter((enemy) => enemy.type === "t" && !enemy.hijacked)
        .map((enemy) => ({ enemy, d: dist(player.x, player.y, enemy.x, enemy.y) }))
        .filter((c) => c.d < ab.radius)
        .sort((a, b) => a.d - b.d)
        .slice(0, ab.count);
      if (!targets.length) {
        burst(player.x, player.y, "ivory", 8);
        return;
      }
      ab.timer = ab.cooldown;
      targets.forEach(({ enemy }) => {
        enemy.hijacked = true;
        enemy.hijackTimer = ab.duration;
        enemy.hijackHitCd = 0;
        enemy.stun = 0;
        burst(enemy.x, enemy.y, "mint", 12);
      });
    }
  };

  /* ---------------------------------------------------------------- */
  /* Update                                                             */
  /* ---------------------------------------------------------------- */
  const damagePlayer = (amount) => {
    if (player.invuln > 0) return;
    const totalEvasion = clamp(player.evasionChance + state.auraEvasion, 0, 0.75);
    if (totalEvasion > 0 && Math.random() < totalEvasion) {
      player.invuln = 0.3;
      player.evadeFlash = 0.6;
      return;
    }
    if (player.shield > 0) {
      player.shield -= 1;
      player.shieldTimer = 0;
      player.invuln = 0.4;
      player.hitFlash = 0.3;
      state.shake = Math.max(state.shake, 4);
      return;
    }
    const totalResist = clamp(player.contactResist + state.auraResist, 0, 0.85);
    const actual = amount * (1 - totalResist);
    player.hp -= actual;
    player.invuln = 0.55;
    player.hitFlash = 0.35;
    state.shake = Math.max(state.shake, Math.min(10, amount * 0.7));
    burst(player.x, player.y, "coral", 8);
    if (player.hp <= 0) { player.hp = 0; endRun("immune"); }
  };

  // targeted therapy bypasses invulnerability, evasion, and shielding — only positioning can dodge it,
  // and membrane resistance still blunts the hit since that isn't a dodge, just a damage reduction
  const damagePlayerForced = (amount) => {
    const totalResist = clamp(player.contactResist + state.auraResist, 0, 0.85);
    const actual = amount * (1 - totalResist);
    player.hp -= actual;
    player.invuln = Math.max(player.invuln, 0.3);
    player.hitFlash = 0.4;
    state.shake = Math.max(state.shake, 9);
    burst(player.x, player.y, "violet", 14);
    if (player.hp <= 0) { player.hp = 0; endRun("immune"); }
  };

  const gainXP = (amount) => {
    player.xp += amount * player.xpMult;
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.xpToNext = Math.round(player.xpToNext * 1.32 + 6);
      player.level += 1;
      openLevelUp();
      return; // pause and let the level-up flow continue via chooseUpgrade
    }
  };

  const triggerClone = (x, y) => {
    if (tCellCount() >= T_CAP) return;
    state.pendingClones.push({ x: x + rand(-24, 24), y: y + rand(-24, 24), timer: 1.1 });
  };

  const beginTransition = (targetStage) => {
    state.phase = "transition";
    state.transitionTimer = 0;
    state.transitionTarget = targetStage;
    state.stage = targetStage;
    enemies = [];
    hazards = [];
    beacons = [];
    strikes = [];
    auras = [];
    state.pendingClones = [];
    state.eventText = STR.metastasisWarn;
    state.eventTone = "gold";
    state.eventTimer = 3.4;
    setStatus();
    renderOverlay();
  };

  const updateBoot = (dt) => {
    state.bootTimer += dt;
    if (state.bootTimer >= BOOT_DURATION) {
      state.phase = "running";
      setStatus();
      renderOverlay();
    }
  };

  const updateTransition = (dt) => {
    state.transitionTimer += dt;
    if (state.transitionTimer >= TRANSITION_DURATION) {
      state.phase = "running";
      setStatus();
      renderOverlay();
    }
  };

  const update = (dt) => {
    state.t += dt;

    if (state.t >= RUN_LIMIT) {
      endRun("time");
      return;
    }
    if (state.stage < 3 && state.t >= state.stage * STAGE_DURATION) {
      beginTransition(state.stage + 1);
      return;
    }

    // difficulty schedule — every scaling knob below runs off total elapsed time, not the current stage;
    // stage only ever changes the scene (organ, background tint, transition banner)
    const t = state.t;
    const lateness = clamp(t / RUN_LIMIT, 0, 1); // 0 at the start of the run, 1 at the 15-minute mark
    const lateGameSpawnMult = 1 + lateness * 0.9; // immune spawns thin out continuously as the run goes on
    const tInterval = clamp(2.3 - t * 0.012, 0.75, 2.3) * lateGameSpawnMult;
    state.lastSpawnT.t += dt;
    if (state.lastSpawnT.t >= tInterval) { state.lastSpawnT.t = 0; spawnTCell(); }

    if (t > 30) {
      const nkInterval = clamp(3.4 - (t - 30) * 0.01, 1.6, 3.4) * lateGameSpawnMult;
      state.lastSpawnT.nk += dt;
      if (state.lastSpawnT.nk >= nkInterval) { state.lastSpawnT.nk = 0; spawnNK(); }
    }
    if (t > 65) {
      const macInterval = clamp(5.5 - (t - 65) * 0.012, 3, 5.5) * lateGameSpawnMult;
      state.lastSpawnT.mac += dt;
      if (state.lastSpawnT.mac >= macInterval) { state.lastSpawnT.mac = 0; spawnMacrophage(); }
    }
    if (t > state.nextChemoT) {
      // deliberately irregular: neither the gap nor the burst count follows a fixed schedule, only their
      // averages trend up — and only past the 10-minute mark, so early runs see a single mild zone at a
      // time while late runs see frequent, overlapping, near-continuous waves; a new wave can also start
      // while the last one is still resolving
      const escalation = chemoEscalation(t);
      const burstCount = 1 + Math.floor(escalation * 4.2);
      for (let i = 0; i < burstCount; i += 1) spawnChemo();
      const baseGap = clamp(8 - escalation * 6.2, 1.8, 8);
      state.nextChemoT = t + baseGap * rand(0.6, 1.6);
    }
    const nutrientCap = Math.round(7 + lateness * 3);
    if (nutrients.length < nutrientCap && Math.random() < dt * (0.9 + lateness * 0.5)) spawnNutrient();

    // late-game beacons
    if (t > state.nextBeaconT && beacons.length === 0) {
      spawnBeacon();
      state.nextBeaconT = t + BEACON_INTERVAL;
    }

    // mid/late-game targeted therapy strikes — rare, powerful, long interval
    if (t > state.nextTargetedT && strikes.length === 0) {
      strikes.push({ x: player.x, y: player.y, phase: "track", timer: TARGETED_TRACK });
      state.eventText = STR.targetedWarn;
      state.eventTone = "violet";
      state.eventTimer = 3;
      state.nextTargetedT = t + TARGETED_INTERVAL;
    }

    // cancer-associated fibroblasts (mid-game onward) — a friendly stromal aura that shields and heals nearby
    if (t > state.nextCafT && auras.filter((a) => a.kind === "caf").length === 0) {
      auras.push({ kind: "caf", x: rand(W * 0.2, W * 0.8), y: rand(H * 0.2, H * 0.8), r: 70, life: 32, vx: rand(-10, 10), vy: rand(-10, 10) });
      state.eventText = STR.cafWarn;
      state.eventTone = "rose";
      state.eventTimer = 3;
      state.nextCafT = t + CAF_INTERVAL;
    }

    // neutrophil extracellular traps (late-game onward) — a wide sticky field: immune cells wade through it,
    // the cancer cell barely notices, plus stealth + evasion while inside
    if (t > state.nextNetT && auras.filter((a) => a.kind === "net").length === 0) {
      auras.push({ kind: "net", x: rand(W * 0.25, W * 0.75), y: rand(H * 0.25, H * 0.75), r: 150, life: 26, vx: 0, vy: 0 });
      state.eventText = STR.netWarn;
      state.eventTone = "rose";
      state.eventTimer = 3;
      state.nextNetT = t + NET_INTERVAL;
    }

    // late-game autonomous proliferation: past 70% of the run, the cell divides on its own even without the Mitosis ability
    if (lateness > 0.7) {
      state.autoMitosisTimer -= dt;
      if (state.autoMitosisTimer <= 0) { state.autoMitosisTimer = 16; spawnDecoy(1); }
    }

    // cytokine storm escalation
    if (!state.stormActive && t > state.nextStormT) {
      state.stormActive = true;
      state.stormTimer = STORM_DURATION;
      state.eventText = STR.stormWarn;
      state.eventTone = "coral";
      state.eventTimer = 3.4;
      state.nextStormT = t + STORM_INTERVAL;
    }
    if (state.stormActive) {
      state.stormTimer -= dt;
      if (state.stormTimer <= 0) { state.stormActive = false; }
    }
    const stormMult = state.stormActive ? 1.25 : 1;

    // pending clonal-expansion reinforcements
    state.pendingClones.forEach((c) => { c.timer -= dt; });
    state.pendingClones = state.pendingClones.filter((c) => {
      if (c.timer <= 0) { spawnTCell({ x: c.x, y: c.y }); burst(c.x, c.y, "ivory", 6); return false; }
      return true;
    });

    // milestones
    const nextMilestone = STR.milestones[state.milestoneIndex];
    if (nextMilestone && t >= nextMilestone.t) {
      state.milestoneText = nextMilestone.text;
      state.milestoneTimer = 3.2;
      state.milestoneIndex += 1;
    }
    if (state.milestoneTimer > 0) state.milestoneTimer -= dt;
    if (state.eventTimer > 0) state.eventTimer -= dt;

    // player movement
    const move = moveVector();
    const speed = player.baseSpeed * netSlowMultiplier(player.x, player.y, true);
    player.vx = move.x * speed;
    player.vy = move.y * speed;
    if (move.x || move.y) player.facing = Math.atan2(move.y, move.x);
    player.x = clamp(player.x + player.vx * dt, player.r, W - player.r);
    player.y = clamp(player.y + player.vy * dt, player.r, H - player.r);

    if (player.invuln > 0) player.invuln -= dt;
    if (player.hitFlash > 0) player.hitFlash -= dt;
    if (player.evadeFlash > 0) player.evadeFlash -= dt;

    // CAFs and NETs — helper stroma the cancer cell can shelter near
    state.auraRegen = 0;
    state.auraResist = 0;
    state.auraEvasion = 0;
    state.auraDetectMult = 1;
    auras.forEach((a) => {
      a.life -= dt;
      a.x = clamp(a.x + a.vx * dt, a.r, W - a.r);
      a.y = clamp(a.y + a.vy * dt, a.r, H - a.r);
      if (a.x <= a.r || a.x >= W - a.r) a.vx *= -1;
      if (a.y <= a.r || a.y >= H - a.r) a.vy *= -1;
      if (dist(player.x, player.y, a.x, a.y) < a.r) {
        if (a.kind === "caf") {
          state.auraRegen += 2.5;
          state.auraResist = Math.max(state.auraResist, 0.2);
        } else if (a.kind === "net") {
          state.auraDetectMult = Math.min(state.auraDetectMult, 0.55);
          state.auraEvasion = Math.max(state.auraEvasion, 0.15);
        }
      }
    });
    auras = auras.filter((a) => a.life > 0);

    // baseline membrane regeneration strengthens continuously over the run, on top of any regen upgrades and aura bonuses
    const baselineRegen = 0.2 + lateness * 1.0;
    const effectiveRegen = player.regen + baselineRegen + state.auraRegen;
    if (effectiveRegen > 0 && player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + effectiveRegen * dt);
    if (player.shield < player.shieldMax) {
      player.shieldTimer += dt;
      if (player.shieldTimer > 14) { player.shield += 1; player.shieldTimer = 0; }
    }
    Object.keys(player.abilities).forEach((kind) => {
      const ab = player.abilities[kind];
      if (ab && ab.timer > 0) ab.timer -= dt;
    });
    if (abilityTapped.pulse) { abilityTapped.pulse = false; useAbility("pulse"); }
    if (abilityTapped.mitosis) { abilityTapped.mitosis = false; useAbility("mitosis"); }
    if (abilityTapped.hijack) { abilityTapped.hijack = false; useAbility("hijack"); }

    // decoys (mitosis) — persist, wander autonomously, keep splitting enemy aggro
    decoys.forEach((d) => {
      d.life -= dt;
      d.wanderTimer -= dt;
      if (d.wanderTimer <= 0) {
        d.wanderTimer = rand(0.8, 1.8);
        const angle = rand(0, Math.PI * 2);
        d.vx = Math.cos(angle) * rand(30, 60);
        d.vy = Math.sin(angle) * rand(30, 60);
      }
      d.x = clamp(d.x + d.vx * dt, d.r, W - d.r);
      d.y = clamp(d.y + d.vy * dt, d.r, H - d.r);
    });
    decoys.forEach((d) => { if (d.life <= 0 || d.hp <= 0) { burst(d.x, d.y, "mint", 10); d.marked = true; } });
    decoys = decoys.filter((d) => !d.marked);

    // beacons
    beacons.forEach((b) => {
      b.life -= dt;
      b.x = clamp(b.x + b.vx * dt, b.r, W - b.r);
      b.y = clamp(b.y + b.vy * dt, b.r, H - b.r);
      if (b.x <= b.r || b.x >= W - b.r) b.vx *= -1;
      if (b.y <= b.r || b.y >= H - b.r) b.vy *= -1;
      b.pulseTimer -= dt;
      if (b.pulseTimer <= 0) {
        b.pulseTimer = 3.2;
        enemies.forEach((enemy) => {
          if (dist(enemy.x, enemy.y, b.x, b.y) < 190) enemy.buffTimer = Math.max(enemy.buffTimer || 0, 4.5);
        });
      }
    });
    beacons = beacons.filter((b) => b.life > 0);

    // targeted therapy strikes — track the player, lock briefly, then hit hard
    strikes.forEach((s) => {
      s.timer -= dt;
      if (s.phase === "track") {
        s.x = player.x;
        s.y = player.y;
        if (s.timer <= 0) { s.phase = "lock"; s.timer = TARGETED_LOCK; }
      } else if (s.phase === "lock") {
        if (s.timer <= 0) {
          if (dist(player.x, player.y, s.x, s.y) < TARGETED_RADIUS + player.r) {
            damagePlayerForced(TARGETED_DAMAGE);
          }
          burst(s.x, s.y, "violet", 16);
          s.phase = "fade";
          s.timer = 0.6;
        }
      }
    });
    strikes = strikes.filter((s) => s.phase !== "fade" || s.timer > 0);

    // enemies
    enemies.forEach((enemy) => {
      if (enemy.hijacked) {
        enemy.hijackTimer -= dt;
        enemy.hijackHitCd = Math.max(0, (enemy.hijackHitCd || 0) - dt);
        // turned allies actively hunt down other immune cells instead of wandering harmlessly
        let target = null;
        let targetDist = Infinity;
        enemies.forEach((other) => {
          if (other === enemy || other.hijacked) return;
          const d = dist(enemy.x, enemy.y, other.x, other.y);
          if (d < targetDist) { targetDist = d; target = other; }
        });
        if (target) {
          const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
          enemy.x += Math.cos(angle) * 96 * dt;
          enemy.y += Math.sin(angle) * 96 * dt;
          if (targetDist < enemy.r + target.r + 4 && enemy.hijackHitCd <= 0) {
            target.marked = true;
            enemy.hijackHitCd = 0.6;
            burst(target.x, target.y, "coral", 10);
            gainXP(6);
          }
        } else {
          enemy.x += Math.cos(enemy.wobble) * 18 * dt;
          enemy.y += Math.sin(enemy.wobble * 1.3) * 18 * dt;
        }
        enemy.wobble += dt * 2;
        enemy.x = clamp(enemy.x, -60, W + 60);
        enemy.y = clamp(enemy.y, -60, H + 60);
        if (enemy.hijackTimer <= 0) { enemy.marked = true; burst(enemy.x, enemy.y, "coral", 14); gainXP(14); }
        return;
      }
      if (enemy.stun > 0) { enemy.stun -= dt; return; }
      if (enemy.buffTimer > 0) enemy.buffTimer -= dt;
      const buffed = enemy.buffTimer > 0;
      const speedMult = (buffed ? 1.3 : 1) * stormMult * netSlowMultiplier(enemy.x, enemy.y, false);
      const detectMult = (buffed ? 1.25 : 1) * stormMult;

      // target selection: player or whichever decoy is currently nearest
      let tx = player.x, ty = player.y, targetIsDecoy = null;
      let bestD = dist(enemy.x, enemy.y, player.x, player.y);
      decoys.forEach((d) => {
        const dd = dist(enemy.x, enemy.y, d.x, d.y);
        if (dd < bestD) { bestD = dd; tx = d.x; ty = d.y; targetIsDecoy = d; }
      });
      const d = bestD;
      const detect = enemy.detect * player.detectMult * state.auraDetectMult * detectMult;
      enemy.wobble += dt * 3;

      if (enemy.type === "t") {
        enemy.age += dt;
        const exhaustAge = EXHAUST_AGE * (1 - lateness * 0.35);
        enemy.exhausted = enemy.age > exhaustAge;
        if (enemy.exhausted && enemy.age > exhaustAge + EXHAUST_LINGER) { enemy.marked = true; return; }
        const exhaustMult = enemy.exhausted ? 0.5 : 1;
        if (d < detect || d < 999) {
          const angle = Math.atan2(ty - enemy.y, tx - enemy.x);
          enemy.x += Math.cos(angle) * enemy.speed * exhaustMult * speedMult * dt;
          enemy.y += Math.sin(angle) * enemy.speed * exhaustMult * speedMult * dt;
        }
      } else if (enemy.type === "nk") {
        if (enemy.dashState === "idle") {
          if (d < detect) {
            enemy.dashTimer -= dt;
            if (enemy.dashTimer <= 0) {
              enemy.dashState = "windup";
              enemy.dashTimer = 0.35;
            }
          } else {
            enemy.x += Math.cos(enemy.wobble) * enemy.speed * 0.35 * dt;
            enemy.y += Math.sin(enemy.wobble * 0.7) * enemy.speed * 0.35 * dt;
          }
        } else if (enemy.dashState === "windup") {
          enemy.dashTimer -= dt;
          if (enemy.dashTimer <= 0) {
            const angle = Math.atan2(ty - enemy.y, tx - enemy.x);
            enemy.dashVX = Math.cos(angle) * 300 * speedMult;
            enemy.dashVY = Math.sin(angle) * 300 * speedMult;
            enemy.dashState = "dash";
            enemy.dashTimer = 0.42;
          }
        } else if (enemy.dashState === "dash") {
          enemy.x += enemy.dashVX * dt;
          enemy.y += enemy.dashVY * dt;
          enemy.dashTimer -= dt;
          if (enemy.dashTimer <= 0) { enemy.dashState = "idle"; enemy.dashTimer = rand(1.6, 2.6); }
        }
      } else if (enemy.type === "mac") {
        if (enemy.presentTimer > 0) {
          enemy.presentTimer -= dt;
        } else if (d < detect) {
          const angle = Math.atan2(ty - enemy.y, tx - enemy.x);
          enemy.x += Math.cos(angle) * enemy.speed * speedMult * dt;
          enemy.y += Math.sin(angle) * enemy.speed * speedMult * dt;
        }
        enemy.engulf = d < enemy.r + player.r + 6 ? enemy.engulf + dt : Math.max(0, enemy.engulf - dt * 2);
      }

      enemy.x = clamp(enemy.x, -60, W + 60);
      enemy.y = clamp(enemy.y, -60, H + 60);

      // contact resolution: real player takes damage; a decoy absorbs hits but takes its killer down with it
      const overlapPlayer = dist(player.x, player.y, enemy.x, enemy.y) < enemy.r + player.r;
      const overlapDecoy = targetIsDecoy && dist(targetIsDecoy.x, targetIsDecoy.y, enemy.x, enemy.y) < enemy.r + targetIsDecoy.r;
      enemy.hitCd = Math.max(0, enemy.hitCd - dt);
      if (overlapDecoy && enemy.hitCd <= 0) {
        targetIsDecoy.hp -= 1;
        enemy.hitCd = 0.5;
        burst(targetIsDecoy.x, targetIsDecoy.y, "mint", 4);
        if (targetIsDecoy.hp <= 0) {
          enemy.marked = true;
          burst(enemy.x, enemy.y, "coral", 10);
          gainXP(8);
        }
      } else if (overlapPlayer && enemy.hitCd <= 0) {
        if (enemy.type === "t") {
          damagePlayer(9);
          enemy.marked = true;
          burst(enemy.x, enemy.y, "ivory", 10);
          if (Math.random() < 0.16) { triggerClone(enemy.x, enemy.y); }
        } else if (enemy.type === "nk") {
          if (enemy.dashState === "dash") { damagePlayer(15); enemy.hitCd = 0.6; } else { damagePlayer(4); enemy.hitCd = 0.5; }
        } else if (enemy.type === "mac") {
          if (enemy.engulf > 0.9) {
            damagePlayer(26);
            enemy.engulf = 0;
            enemy.hitCd = 1.1;
            enemy.presentTimer = 1.4;
            const nearbyT = enemies.filter((e) => e.type === "t" && !e.hijacked && e !== enemy && dist(e.x, e.y, enemy.x, enemy.y) < 170);
            if (nearbyT.length) {
              nearbyT.forEach((e) => { e.buffTimer = Math.max(e.buffTimer || 0, 10); });
            } else {
              triggerClone(enemy.x, enemy.y);
              state.eventText = STR.cloneWarn;
              state.eventTone = "gold";
              state.eventTimer = 2.6;
            }
          } else {
            damagePlayer(5);
            enemy.hitCd = 0.5;
          }
        }
      }
    });
    enemies = enemies.filter((enemy) => !enemy.marked);

    // hazards — chemo bursts are indiscriminate: they can hit the player, immune cells, decoys, and even
    // turned allies. Before the 10-minute mark every kill is a coin flip that only gets more favorable with
    // time; from the 10-minute mark on it's a certain kill for everything except you — and your own hit
    // grows heavier over the same back half of the run, tempered only by chemoresistance if you've taken it
    hazards.forEach((hz) => {
      hz.timer -= dt;
      if (hz.phase === "warn" && hz.timer <= 0) { hz.phase = "burst"; hz.timer = 0.4; }
      else if (hz.phase === "burst") {
        if (!hz.hitApplied && dist(player.x, player.y, hz.x, hz.y) < hz.r + player.r) {
          const dmg = (20 + chemoEscalation(state.t) * 24) * (1 - player.chemoResist);
          damagePlayer(dmg);
          hz.hitApplied = true;
        }
        if (!hz.enemyHitApplied) {
          const killChance = chemoKillProgress(state.t);
          enemies.forEach((enemy) => {
            if (dist(enemy.x, enemy.y, hz.x, hz.y) < hz.r + enemy.r && Math.random() < killChance) {
              enemy.marked = true;
              burst(enemy.x, enemy.y, "coral", 10);
              gainXP(6);
            }
          });
          decoys.forEach((d) => {
            if (dist(d.x, d.y, hz.x, hz.y) < hz.r + d.r && Math.random() < killChance) {
              d.marked = true;
              burst(d.x, d.y, "coral", 8);
            }
          });
          hz.enemyHitApplied = true;
        }
        if (hz.timer <= 0) { hz.phase = "fade"; hz.timer = 0.6; }
      }
    });
    decoys = decoys.filter((d) => !d.marked);
    enemies = enemies.filter((enemy) => !enemy.marked);
    hazards = hazards.filter((hz) => hz.phase !== "fade" || hz.timer > 0);

    // nutrients — later pickups (and the liver stage) are worth more
    nutrients = nutrients.filter((n) => {
      n.phase += dt * 2;
      const d = dist(player.x, player.y, n.x, n.y);
      if (d < player.magnetR) {
        const angle = Math.atan2(player.y - n.y, player.x - n.x);
        n.x += Math.cos(angle) * 160 * dt;
        n.y += Math.sin(angle) * 160 * dt;
      }
      if (d < player.r + n.r + 4) {
        gainXP(nutrientValue(n));
        state.nutrients += 1;
        burst(n.x, n.y, n.big ? "gold" : "mint", n.big ? 12 : 6);
        return false;
      }
      return true;
    });

    // particles
    particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= 0.94; p.vy *= 0.94; });
    particles = particles.filter((p) => p.life > 0);

    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 24);

    // cull enemies far outside bounds after wandering off (rare)
    enemies = enemies.filter((enemy) => enemy.x > -120 && enemy.x < W + 120 && enemy.y > -120 && enemy.y < H + 120);
  };

  /* ---------------------------------------------------------------- */
  /* Rendering                                                          */
  /* ---------------------------------------------------------------- */
  const drawBackground = (time) => {
    ctx.fillStyle = "#07110f";
    ctx.fillRect(0, 0, W, H);
    let tint = state.stage === 3 ? "rgba(140, 110, 214, 0.28)" : state.stage === 2 ? "rgba(191, 110, 58, 0.30)" : "rgba(23, 87, 71, 0.32)";
    if (state.stormActive) tint = "rgba(255, 107, 87, 0.2)";
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.42, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    grad.addColorStop(0, tint);
    grad.addColorStop(1, "rgba(7, 17, 15, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(241, 239, 231, 0.045)";
    ctx.lineWidth = 1;
    const grid = 46;
    for (let x = (time * 0.004) % grid; x < W; x += grid) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = (time * 0.004) % grid; y < H; y += grid) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  };

  const drawCellBody = (x, y, r, toneA, toneB, spikes, wobble, alpha = 1) => {
    ctx.beginPath();
    ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(toneA, 0.14 * alpha);
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i <= 24; i += 1) {
      const a = (i / 24) * Math.PI * 2;
      const bump = spikes ? Math.sin(a * spikes + wobble) * r * 0.08 : 0;
      const rr = r + bump;
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = rgba(toneA, 0.22 * alpha);
    ctx.fill();
    ctx.strokeStyle = rgba(toneA, 0.68 * alpha);
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - r * 0.16, y + r * 0.1, r * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = rgba(toneB, 0.45 * alpha);
    ctx.fill();
  };

  const drawPlayer = () => {
    const flashed = player.hitFlash > 0 && Math.floor(player.hitFlash * 20) % 2 === 0;
    const tone = flashed ? "coral" : "mint";
    ctx.save();
    if (player.invuln > 0) ctx.globalAlpha = 0.75;
    drawCellBody(player.x, player.y, player.r, tone, "coral", 6, state.t * 4);
    if (player.shield > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("ivory", 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (player.evadeFlash > 0) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 10, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("gold", clamp(player.evadeFlash / 0.6, 0, 1));
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawDecoy = (d) => {
    ctx.save();
    ctx.globalAlpha = clamp(d.life / d.maxLife + 0.2, 0.3, 1);
    drawCellBody(d.x, d.y, d.r, "mint", "ivory", 5, state.t * 5);
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = rgba("mint", 0.4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  const drawEnemy = (enemy) => {
    if (enemy.hijacked) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(state.t * 8) * 0.15;
      drawCellBody(enemy.x, enemy.y, enemy.r, "mint", "mint", 4, enemy.wobble);
      ctx.restore();
      return;
    }
    const buffed = enemy.buffTimer > 0;
    if (enemy.type === "t") {
      const alpha = enemy.exhausted ? 0.55 : 1;
      drawCellBody(enemy.x, enemy.y, enemy.r, "ivory", "coral", 8, enemy.wobble, alpha);
      if (buffed) {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.r + 6, 0, Math.PI * 2);
        ctx.strokeStyle = rgba("gold", 0.5);
        ctx.stroke();
      }
    } else if (enemy.type === "nk") {
      const glow = enemy.dashState === "windup" ? 0.9 : enemy.dashState === "dash" ? 0.5 : 0.25;
      ctx.save();
      if (enemy.dashState === "windup" && Math.floor(state.t * 12) % 2 === 0) ctx.globalAlpha = 0.55;
      drawCellBody(enemy.x, enemy.y, enemy.r, "coral", "ivory", 5, enemy.wobble);
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("coral", glow * 0.4);
      ctx.stroke();
      ctx.restore();
    } else if (enemy.type === "mac") {
      drawCellBody(enemy.x, enemy.y, enemy.r, "ivory", "ivory", 3, enemy.wobble * 0.6);
      if (enemy.engulf > 0) {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.r * (0.4 + enemy.engulf * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = rgba("coral", 0.28);
        ctx.fill();
      }
      if (enemy.presentTimer > 0) {
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.r + 8 + (1.4 - enemy.presentTimer) * 20, 0, Math.PI * 2);
        ctx.strokeStyle = rgba("gold", enemy.presentTimer / 1.4 * 0.6);
        ctx.stroke();
      }
    }
  };

  const drawBeacon = (b) => {
    const pulse = clamp(1 - b.pulseTimer / 3.2, 0, 1);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + pulse * 30, 0, Math.PI * 2);
    ctx.strokeStyle = rgba("gold", (1 - pulse) * 0.4);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + state.t;
      const px = b.x + Math.cos(a) * b.r;
      const py = b.y + Math.sin(a) * b.r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = rgba("gold", 0.28);
    ctx.fill();
    ctx.strokeStyle = rgba("gold", 0.75);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const drawStrike = (s) => {
    if (s.phase === "track") {
      const alpha = 0.35 + Math.sin(state.t * 14) * 0.15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, TARGETED_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("violet", alpha);
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(s.x - TARGETED_RADIUS - 8, s.y);
      ctx.lineTo(s.x - TARGETED_RADIUS + 8, s.y);
      ctx.moveTo(s.x + TARGETED_RADIUS - 8, s.y);
      ctx.lineTo(s.x + TARGETED_RADIUS + 8, s.y);
      ctx.moveTo(s.x, s.y - TARGETED_RADIUS - 8);
      ctx.lineTo(s.x, s.y - TARGETED_RADIUS + 8);
      ctx.moveTo(s.x, s.y + TARGETED_RADIUS - 8);
      ctx.lineTo(s.x, s.y + TARGETED_RADIUS + 8);
      ctx.strokeStyle = rgba("violet", 0.7);
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (s.phase === "lock") {
      const flashOn = Math.floor(state.t * 20) % 2 === 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, TARGETED_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("violet", flashOn ? 0.9 : 0.4);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      const alpha = clamp(s.timer / 0.6, 0, 1);
      ctx.beginPath();
      ctx.arc(s.x, s.y, TARGETED_RADIUS * (1.4 - alpha * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = rgba("violet", alpha * 0.25);
      ctx.fill();
      ctx.strokeStyle = rgba("violet", alpha * 0.7);
      ctx.stroke();
    }
  };

  const drawAura = (a) => {
    const inside = dist(player.x, player.y, a.x, a.y) < a.r;
    if (a.kind === "caf") {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba("rose", inside ? 0.14 : 0.09);
      ctx.fill();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = rgba("rose", 0.4);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 5; i += 1) {
        const ang = (i / 5) * Math.PI * 2 + state.t * 0.3;
        const px = a.x + Math.cos(ang) * a.r * 0.5;
        const py = a.y + Math.sin(ang) * a.r * 0.5;
        drawCellBody(px, py, 9, "rose", "rose", 4, state.t * 3 + i);
      }
    } else {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba("ivory", inside ? 0.08 : 0.05);
      ctx.fill();
      ctx.strokeStyle = rgba("ivory", 0.3);
      ctx.stroke();
      ctx.strokeStyle = rgba("ivory", 0.22);
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i += 1) {
        const ang1 = (i / 7) * Math.PI * 2;
        const ang2 = ((i + 3) / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(a.x + Math.cos(ang1) * a.r * 0.85, a.y + Math.sin(ang1) * a.r * 0.85);
        ctx.lineTo(a.x + Math.cos(ang2) * a.r * 0.85, a.y + Math.sin(ang2) * a.r * 0.85);
        ctx.stroke();
      }
    }
  };

  const drawHazard = (hz) => {
    if (hz.phase === "warn") {
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("coral", 0.55);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (hz.phase === "burst") {
      ctx.beginPath();
      ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba("coral", 0.32);
      ctx.fill();
      ctx.strokeStyle = rgba("coral", 0.7);
      ctx.stroke();
    } else {
      const alpha = clamp((hz.timer + 0.6) / 0.6, 0, 1) * 0.25;
      ctx.beginPath();
      ctx.arc(hz.x, hz.y, hz.r * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("coral", alpha);
      ctx.stroke();
    }
  };

  const drawClonePending = (c) => {
    const alpha = clamp(1 - c.timer / 1.1, 0, 1);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.arc(c.x, c.y, 14 + (1 - alpha) * 10, 0, Math.PI * 2);
    ctx.strokeStyle = rgba("coral", 0.5 * alpha + 0.15);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawNutrient = (n) => {
    const tone = n.big ? "gold" : "mint";
    const pulse = Math.sin(n.phase) * (n.big ? 0.18 : 0.3) + 1;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = rgba(tone, 0.85);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r * pulse + (n.big ? 7 : 4), 0, Math.PI * 2);
    ctx.strokeStyle = rgba(tone, n.big ? 0.4 : 0.22);
    ctx.lineWidth = n.big ? 1.6 : 1;
    ctx.stroke();
  };

  const drawParticles = () => {
    particles.forEach((p) => {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(p.tone, 1);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawCinematic = (timer, duration, lines) => {
    ctx.fillStyle = "#07110f";
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const frac = clamp(timer / duration, 0, 1);
    for (let i = 0; i < 3; i += 1) {
      const ringFrac = clamp(frac * 3 - i, 0, 1);
      if (ringFrac <= 0) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + ringFrac * 46, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("mint", (1 - ringFrac) * 0.5);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = rgba("mint", 0.6);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.font = "600 13px 'SFMono-Regular', Menlo, monospace";
    const lineCount = lines.length;
    const perLine = duration / lineCount;
    const activeIndex = Math.min(lineCount - 1, Math.floor(timer / perLine));
    const lineFrac = clamp((timer - activeIndex * perLine) / perLine, 0, 1);
    ctx.fillStyle = rgba("mint", 0.35 + lineFrac * 0.55);
    ctx.fillText(lines[activeIndex], cx, cy + 76);
  };

  const render = (time) => {
    ctx.save();
    if (state.shake > 0) {
      ctx.translate(rand(-1, 1) * state.shake, rand(-1, 1) * state.shake);
    }
    if (state.phase === "boot") {
      drawCinematic(state.bootTimer, BOOT_DURATION, STR.bootLines);
      ctx.restore();
      return;
    }
    if (state.phase === "transition") {
      drawCinematic(state.transitionTimer, TRANSITION_DURATION, STR.transitionLines[state.transitionTarget]);
      ctx.restore();
      return;
    }
    drawBackground(time);
    auras.forEach(drawAura);
    hazards.forEach(drawHazard);
    state.pendingClones.forEach(drawClonePending);
    beacons.forEach(drawBeacon);
    strikes.forEach(drawStrike);
    nutrients.forEach(drawNutrient);
    enemies.forEach(drawEnemy);
    decoys.forEach(drawDecoy);
    drawPlayer();
    drawParticles();
    ctx.restore();
  };

  /* ---------------------------------------------------------------- */
  /* HUD sync                                                           */
  /* ---------------------------------------------------------------- */
  const hpFill = hud.querySelector("[data-hp-fill]");
  const xpFill = hud.querySelector("[data-xp-fill]");
  const levelEl = hud.querySelector("[data-level]");
  const timerEl = hud.querySelector("[data-timer]");
  const organEl = hud.querySelector("[data-organ]");
  const bestEl = hud.querySelector("[data-best]");
  const milestoneEl = hud.querySelector("[data-milestone]");
  const eventEl = hud.querySelector("[data-event]");
  const vignetteEl = hud.querySelector("[data-vignette]");
  bestEl.textContent = best.time > 0 ? `${STR.statBest} ${fmtTime(best.time)}` : "";

  const abilityButtons = {};
  ABILITY_ORDER.forEach((kind) => {
    const btn = hud.querySelector(`[data-ability-btn="${kind}"]`);
    btn.addEventListener("click", () => { abilityTapped[kind] = true; });
    abilityButtons[kind] = {
      btn,
      fill: btn.querySelector(`[data-ability-fill="${kind}"]`)
    };
  });

  const syncHud = () => {
    hpFill.style.width = `${clamp((player.hp / player.maxHp) * 100, 0, 100)}%`;
    xpFill.style.width = `${clamp((player.xp / player.xpToNext) * 100, 0, 100)}%`;
    levelEl.textContent = `${STR.level} ${player.level}`;
    timerEl.textContent = fmtTime(state.t);
    organEl.textContent = STR.organNames[state.stage] || "";
    ABILITY_ORDER.forEach((kind) => {
      const ab = player.abilities[kind];
      const { btn, fill } = abilityButtons[kind];
      if (!ab) { btn.hidden = true; return; }
      btn.hidden = false;
      const ready = ab.timer <= 0;
      fill.style.width = ready ? "100%" : `${clamp(100 - (ab.timer / ab.cooldown) * 100, 0, 100)}%`;
      btn.classList.toggle("is-ready", ready);
    });
    milestoneEl.textContent = state.milestoneTimer > 0 ? state.milestoneText : "";
    milestoneEl.classList.toggle("is-visible", state.milestoneTimer > 0);
    eventEl.textContent = state.eventTimer > 0 ? state.eventText : "";
    const toneClass = { coral: " is-warn", gold: " is-gold", violet: " is-violet", rose: " is-rose" }[state.eventTone] || "";
    eventEl.className = `hud-event${state.eventTimer > 0 ? " is-visible" : ""}${toneClass}`;
    const lowHp = player.hp / player.maxHp < 0.3;
    vignetteEl.classList.toggle("is-visible", state.stormActive || lowHp);
    vignetteEl.classList.toggle("is-critical", lowHp && !state.stormActive);
    if (!statsPanel.hidden) renderStatsPanel();
  };

  /* ---------------------------------------------------------------- */
  /* Loop                                                               */
  /* ---------------------------------------------------------------- */
  let last = 0;
  let raf = 0;
  const loop = (time) => {
    const dt = Math.min(0.05, Math.max(0, (time - last) / 1000 || 0));
    last = time;
    if (!reducedMotion) {
      if (state.phase === "running") update(dt);
      else if (state.phase === "boot") updateBoot(dt);
      else if (state.phase === "transition") updateTransition(dt);
    }
    render(time);
    syncHud();
    raf = window.requestAnimationFrame(loop);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.phase === "running") togglePause();
  });

  resize();
  player.x = W / 2;
  player.y = H / 2;
  renderOverlay();
  setStatus();
  raf = window.requestAnimationFrame(loop);
  window.addEventListener("beforeunload", () => window.cancelAnimationFrame(raf));
})();
