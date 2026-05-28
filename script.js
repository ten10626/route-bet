"use strict";

const app = document.getElementById("app");

const COLORS = [
  { name: "赤", value: "#e53935", emoji: "🔴" },
  { name: "青", value: "#1e88e5", emoji: "🔵" },
  { name: "黄", value: "#fdd835", emoji: "🟡" },
  { name: "緑", value: "#43a047", emoji: "🟢" },
  { name: "紫", value: "#8e24aa", emoji: "🟣" },
  { name: "ピンク", value: "#ec407a", emoji: "🌸" },
  { name: "水色", value: "#00acc1", emoji: "💧" },
  { name: "黄緑", value: "#9ccc65", emoji: "🍀" }
];

const STAGES = [
  { key: "A", count: 1, multiplier: null },
  { key: "B", count: 2, multiplier: null },
  { key: "C", count: 3, multiplier: 2 },
  { key: "D", count: 4, multiplier: 3 },
  { key: "E", count: 5, multiplier: 4 }
];

const FINAL_MULTIPLIERS = [16, 12, 8, 12, 16];
const STORAGE_KEY = "oneTabletPartyGameState";
const SAVE_VERSION = 1;

const state = {
  phase: "title",
  playerCount: 3,
  players: [],
  parentIndex: 0,
  round: 0,
  deck: [],
  bets: {},
  betOrder: [],
  betTurn: 0,
  selectedCardId: null,
  answers: [],
  route: [],
  currentStage: 0,
  zoom: 1,
  betMessage: "",
  changes: []
};

function html(strings, ...values) {
  return strings.reduce((acc, part, index) => acc + part + (values[index] ?? ""), "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cardMultiplier(cardId) {
  const card = state.deck.find((item) => item.id === cardId);
  return card ? card.multiplier : 1;
}

function startRound() {
  state.deck = buildDeck();
  state.bets = {};
  state.betOrder = state.players.map((_, index) => index).filter((index) => index !== state.parentIndex);
  state.betTurn = 0;
  state.selectedCardId = null;
  state.answers = [];
  state.route = ["A-1"];
  state.currentStage = 0;
  state.betMessage = "";
  state.changes = [];
  state.phase = "bet";
  render();
}

function getSavedPayload() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || payload.version !== SAVE_VERSION || !payload.state) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return payload;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function hasSavedGame() {
  return Boolean(getSavedPayload());
}

function restoreSavedGame() {
  const payload = getSavedPayload();
  if (!payload) return false;
  Object.assign(state, payload.state);
  if (!Array.isArray(state.players) || state.players.length === 0) {
    clearSavedGame();
    return false;
  }
  return true;
}

function saveGameState() {
  if (!shouldPersistState()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      state
    }));
  } catch (error) {
    console.warn("ゲーム進行の保存に失敗しました。", error);
  }
}

function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
}

function shouldPersistState() {
  return ["bet", "answer", "roundResult", "changes", "final"].includes(state.phase);
}

function buildDeck() {
  const picked = shuffle(questions).slice(0, 15);
  let q = 0;
  const deck = [];
  STAGES.forEach((stage) => {
    for (let i = 1; i <= stage.count; i += 1) {
      deck.push({
        id: `${stage.key}-${i}`,
        stage: stage.key,
        stageIndex: STAGES.indexOf(stage),
        index: i - 1,
        question: picked[q],
        multiplier: stage.multiplier,
        bettable: stage.key === "C" || stage.key === "D" || stage.key === "E"
      });
      q += 1;
    }
  });
  for (let i = 1; i <= 5; i += 1) {
    deck.push({ id: `Y-${i}`, finalBase: i - 1, multiplier: FINAL_MULTIPLIERS[i - 1], bettable: true });
    deck.push({ id: `N-${i}`, finalBase: i - 1, multiplier: FINAL_MULTIPLIERS[i - 1], bettable: true });
  }
  return deck;
}

function render() {
  if (state.phase === "title") renderTitle();
  if (state.phase === "count") renderCount();
  if (state.phase === "names") renderNames();
  if (state.phase === "bet") renderGame();
  if (state.phase === "answer") renderGame();
  if (state.phase === "roundResult") renderGame();
  if (state.phase === "changes") renderChanges();
  if (state.phase === "final") renderFinal();
  saveGameState();
}

function renderTitle() {
  const saved = hasSavedGame();
  app.innerHTML = html`
    <section class="screen center-screen title-screen">
      <div class="panel title-panel">
        <div class="title-mark">
          <span>YES</span>
          <span>NO</span>
        </div>
        <h1 class="title">ROUTE BET</h1>
        <p class="tagline">YES/NOの先を読む</p>
        <p class="subtagline">分岐予想ゲーム</p>
        <div class="title-actions">
          ${saved ? `<button id="resume-game">続きから再開</button>` : ""}
          <button id="go-count" class="primary-start">${saved ? "最初から始める" : "ゲーム開始"}</button>
        </div>
      </div>
    </section>
  `;
  document.getElementById("resume-game")?.addEventListener("click", () => {
    if (restoreSavedGame()) {
      render();
      return;
    }
    renderTitle();
  });
  document.getElementById("go-count").addEventListener("click", () => {
    clearSavedGame();
    state.phase = "count";
    render();
  });
}

function renderCount() {
  app.innerHTML = html`
    <section class="screen center-screen">
      <div class="panel">
        <h2>プレイヤー人数</h2>
        <div class="row">
          ${[3, 4, 5, 6, 7, 8].map((count) => `<button class="count-button" data-count="${count}">${count}</button>`).join("")}
        </div>
      </div>
    </section>
  `;
  document.querySelectorAll("[data-count]").forEach((button) => {
    button.addEventListener("click", () => {
      state.playerCount = Number(button.dataset.count);
      state.phase = "names";
      render();
    });
  });
}

function renderNames() {
  const fields = Array.from({ length: state.playerCount }, (_, index) => {
    const color = COLORS[index];
    return html`
      <label class="name-field">
        <span><span class="dot" style="background:${color.value}"></span> プレイヤー${index + 1}（${color.name}）</span>
        <input id="player-${index}" value="プレイヤー${index + 1}" maxlength="12">
      </label>
    `;
  }).join("");

  app.innerHTML = html`
    <section class="screen center-screen">
      <div class="panel">
        <h2>名前入力</h2>
        <div class="name-grid">${fields}</div>
        <p class="small">全員100ptスタート。0ptになったら自動で100pt借ります。</p>
        <button id="start">開始</button>
      </div>
    </section>
  `;
  document.getElementById("start").addEventListener("click", () => {
    state.players = Array.from({ length: state.playerCount }, (_, index) => ({
      name: document.getElementById(`player-${index}`).value.trim() || `プレイヤー${index + 1}`,
      color: COLORS[index],
      points: 100,
      debt: 0
    }));
    state.parentIndex = 0;
    state.round = 0;
    startRound();
  });
}

function renderGame() {
  const parent = state.players[state.parentIndex];
  const bettor = state.players[state.betOrder[state.betTurn]];
  const currentBetCount = getCurrentBetCount();
  const title =
    state.phase === "bet"
      ? `プレイヤー${state.betOrder[state.betTurn] + 1} ${escapeHtml(bettor.name)}のBET`
      : state.phase === "answer"
        ? `親 ${escapeHtml(parent.name)}の回答`
        : "BET結果";

  app.innerHTML = html`
    <section class="screen game-screen">
      <header class="topbar">
        <div class="status">
          <span class="pill">親プレイヤー：<span class="dot" style="background:${parent.color.value}"></span>${escapeHtml(parent.name)}</span>
          <span class="pill">${title}</span>
          <span class="pill">${state.round + 1} / ${state.players.length} ラウンド</span>
        </div>
        <div class="row">
          ${state.phase === "bet" ? `<button id="next-bettor" ${currentBetCount === 0 ? "disabled" : ""}>BET決定</button>` : ""}
          ${state.phase === "answer" ? `<button class="secondary" id="undo-answer" ${state.answers.length === 0 ? "disabled" : ""}>1つ戻る</button>` : ""}
          ${state.phase === "roundResult" ? `<button id="to-changes">次へ</button>` : ""}
          <div class="zoom-controls">
            <button class="secondary" id="zoom-out" aria-label="縮小">−</button>
            <button class="secondary" id="zoom-in" aria-label="拡大">＋</button>
          </div>
        </div>
      </header>
      ${state.phase === "bet" && currentBetCount === 0 ? `<div class="notice">${state.betMessage || "最低1か所BETしてください"}</div>` : ""}
      <div class="board-wrap">
        <div class="board" style="--zoom:${state.zoom}">
          <svg class="guide-layer" aria-hidden="true"></svg>
          ${renderBoard()}
        </div>
      </div>
      ${state.phase === "bet" && state.selectedCardId ? renderBetPanel() : ""}
    </section>
  `;

  bindBoardEvents();
  bindCommonControls();
  drawGuideLines();
}

function renderBoard() {
  const columns = STAGES.map((stage) => {
    const cards = state.deck.filter((card) => card.stage === stage.key).map(renderCard).join("");
    return `<div class="column">${cards}</div>`;
  }).join("");

  const finals = Array.from({ length: 5 }, (_, index) => {
    const yCard = state.deck.find((card) => card.id === `Y-${index + 1}`);
    const nCard = state.deck.find((card) => card.id === `N-${index + 1}`);
    return `<div class="final-pair">${renderCard(yCard)}${renderCard(nCard)}</div>`;
  }).join("");
  return `${columns}<div class="column column-final">${finals}</div>`;
}

function renderCard(card) {
  const isFinal = card.id.startsWith("Y-") || card.id.startsWith("N-");
  const isBettable = state.phase === "bet" && card.bettable;
  const activeId = getActiveAnswerCardId();
  const onRoute = state.route.includes(card.id);
  const dimmed = state.phase !== "bet" && !onRoute && shouldDim(card);
  const classNames = [
    "card",
    isFinal ? "final-card" : "",
    isBettable ? "bettable" : "",
    activeId === card.id ? "active" : "",
    onRoute && state.phase !== "bet" ? "on-route" : "",
    dimmed ? "dimmed" : "",
    state.phase === "roundResult" && card.bettable ? resultClass(card.id) : ""
  ].filter(Boolean).join(" ");

  const nodeAttr = `data-node-id="${card.id}"`;
  const clickAttrs = isBettable ? `tabindex="0" role="button" data-card-id="${card.id}"` : "";
  const head = html`
    <div class="card-head">
      <span>${card.id}</span>
      ${card.multiplier ? `<span class="mult">${card.multiplier}倍</span>` : ""}
    </div>
  `;

  if (isFinal) {
    return html`
      <div class="${classNames}" ${nodeAttr} ${clickAttrs}>
        ${head}
        <div class="bet-strip">${renderBetsForCard(card.id)}</div>
      </div>
    `;
  }

  return html`
    <div class="${classNames}" ${nodeAttr} ${clickAttrs}>
      ${head}
      <div class="question">${escapeHtml(card.question)}</div>
      <div class="answer-buttons">${renderAnswerButtons(card.id)}</div>
      <div class="bet-strip">${renderBetsForCard(card.id)}</div>
    </div>
  `;
}

function renderAnswerButtons(cardId) {
  if (state.phase === "bet") {
    return renderReadonlyAnswerChoices();
  }
  if (state.phase !== "answer" || getActiveAnswerCardId() !== cardId) return renderReadonlyAnswerChoices();
  return html`
    <button data-answer="YES" data-guide-choice="YES">YES</button>
    <button class="no" data-answer="NO" data-guide-choice="NO">NO</button>
  `;
}

function renderReadonlyAnswerChoices() {
  return html`
    <span class="answer-choice readonly" data-guide-choice="YES">YES</span>
    <span class="answer-choice readonly no" data-guide-choice="NO">NO</span>
  `;
}

function renderBetsForCard(cardId) {
  if (state.phase === "bet") {
    const playerIndex = state.betOrder[state.betTurn];
    return (state.bets[playerIndex] || [])
      .filter((bet) => bet.cardId === cardId)
      .map((bet) => betBadge(playerIndex, bet.amount))
      .join("");
  }

  if (state.phase === "roundResult") {
    return Object.entries(state.bets)
      .flatMap(([playerIndex, bets]) => bets.filter((bet) => bet.cardId === cardId).map((bet) => betBadge(Number(playerIndex), bet.amount)))
      .join("");
  }

  return "";
}

function betBadge(playerIndex, amount) {
  const player = state.players[playerIndex];
  return `<span class="bet-badge"><span class="dot" style="background:${player.color.value}"></span>${amount}pt</span>`;
}

function resultClass(cardId) {
  const hasBet = Object.values(state.bets).some((bets) => bets.some((bet) => bet.cardId === cardId));
  if (!hasBet) return "";
  return state.route.includes(cardId) ? "card-hit" : "card-miss";
}

function shouldDim(card) {
  if (state.phase === "answer") {
    if (card.stageIndex === undefined) return false;
    return card.stageIndex < state.currentStage && !state.route.includes(card.id);
  }
  if (state.phase === "roundResult") {
    return !state.route.includes(card.id);
  }
  return false;
}

function getActiveAnswerCardId() {
  if (state.phase !== "answer" || state.currentStage >= 5) return null;
  const stage = STAGES[state.currentStage];
  const index = state.answers.reduce((position, answer) => position + (answer === "NO" ? 1 : 0), 0);
  return `${stage.key}-${index + 1}`;
}

function renderBetPanel() {
  const playerIndex = state.betOrder[state.betTurn];
  const bets = state.bets[playerIndex] || [];
  const existing = bets.find((bet) => bet.cardId === state.selectedCardId);
  const otherTotal = bets.filter((bet) => bet.cardId !== state.selectedCardId).reduce((sum, bet) => sum + bet.amount, 0);
  const max = Math.max(0, state.players[playerIndex].points - otherTotal);
  const value = Math.min(existing ? existing.amount : Math.min(10, max), max);

  return html`
    <div class="bet-panel" data-max="${max}">
      <div>
        <strong>選択中：${state.selectedCardId}</strong>
        <div class="small">残りBET可能額 ${max}pt</div>
      </div>
      <div>
        <input id="bet-range" type="range" min="0" max="${max}" step="10" value="${value}">
        <div class="bet-amount"><span id="bet-amount">${value}</span>pt</div>
      </div>
      <div class="row">
        <button id="save-bet" ${value <= 0 ? "disabled" : ""}>決定</button>
        ${existing ? `<button class="danger" id="delete-bet">削除</button>` : ""}
        <button class="secondary" id="cancel-bet">キャンセル</button>
      </div>
    </div>
  `;
}

function bindBoardEvents() {
  document.querySelectorAll("[data-card-id]").forEach((card) => {
    card.addEventListener("click", () => selectBetCard(card.dataset.cardId));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") selectBetCard(card.dataset.cardId);
    });
  });

  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => answer(button.dataset.answer));
  });

  const range = document.getElementById("bet-range");
  if (range) {
    const amount = document.getElementById("bet-amount");
    const save = document.getElementById("save-bet");
    range.addEventListener("input", () => {
      amount.textContent = range.value;
      save.disabled = Number(range.value) <= 0;
    });
  }

  document.getElementById("save-bet")?.addEventListener("click", saveBet);
  document.getElementById("delete-bet")?.addEventListener("click", deleteBet);
  document.getElementById("cancel-bet")?.addEventListener("click", () => {
    state.selectedCardId = null;
    render();
  });
}

function bindCommonControls() {
  document.getElementById("zoom-out")?.addEventListener("click", () => {
    state.zoom = Math.max(0.7, Number((state.zoom - 0.1).toFixed(1)));
    render();
  });
  document.getElementById("zoom-in")?.addEventListener("click", () => {
    state.zoom = Math.min(1.4, Number((state.zoom + 0.1).toFixed(1)));
    render();
  });
  document.getElementById("next-bettor")?.addEventListener("click", nextBettor);
  document.getElementById("undo-answer")?.addEventListener("click", undoAnswer);
  document.getElementById("to-changes")?.addEventListener("click", () => {
    state.phase = "changes";
    render();
  });
}

function drawGuideLines() {
  requestAnimationFrame(() => {
    const board = document.querySelector(".board");
    const svg = document.querySelector(".guide-layer");
    if (!board || !svg) return;

    const boardRect = board.getBoundingClientRect();
    const scale = state.zoom || 1;
    const toBoardPoint = (rect, xRatio, yRatio) => ({
      x: (rect.left - boardRect.left + rect.width * xRatio) / scale,
      y: (rect.top - boardRect.top + rect.height * yRatio) / scale
    });

    const lines = [];
    STAGES.forEach((stage, stageIndex) => {
      for (let i = 1; i <= stage.count; i += 1) {
        const fromCard = document.querySelector(`[data-node-id="${stage.key}-${i}"]`);
        if (!fromCard) continue;

        const targets = getGuideTargets(stageIndex, i);
        ["YES", "NO"].forEach((choice) => {
          const choiceEl = fromCard.querySelector(`[data-guide-choice="${choice}"]`);
          const targetCard = document.querySelector(`[data-node-id="${targets[choice]}"]`);
          if (!choiceEl || !targetCard) return;

          const start = toBoardPoint(choiceEl.getBoundingClientRect(), 1, 0.5);
          const end = toBoardPoint(targetCard.getBoundingClientRect(), 0, 0.5);
          const midX = start.x + Math.max(18, (end.x - start.x) * 0.48);
          lines.push({ choice, start, end, midX });
        });
      }
    });

    const width = board.scrollWidth;
    const height = board.scrollHeight;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = lines.map((line) => {
      const path = `M ${line.start.x.toFixed(1)} ${line.start.y.toFixed(1)} C ${line.midX.toFixed(1)} ${line.start.y.toFixed(1)}, ${line.midX.toFixed(1)} ${line.end.y.toFixed(1)}, ${line.end.x.toFixed(1)} ${line.end.y.toFixed(1)}`;
      return `<path class="guide-line guide-${line.choice.toLowerCase()}" d="${path}"></path>`;
    }).join("");
  });
}

function getGuideTargets(stageIndex, oneBasedIndex) {
  if (stageIndex === 4) {
    return {
      YES: `Y-${oneBasedIndex}`,
      NO: `N-${oneBasedIndex}`
    };
  }
  const nextStage = STAGES[stageIndex + 1];
  return {
    YES: `${nextStage.key}-${oneBasedIndex}`,
    NO: `${nextStage.key}-${oneBasedIndex + 1}`
  };
}

function selectBetCard(cardId) {
  const playerIndex = state.betOrder[state.betTurn];
  const bets = state.bets[playerIndex] || [];
  const already = bets.some((bet) => bet.cardId === cardId);
  if (!already && bets.length >= 2) return;
  state.betMessage = "";
  state.selectedCardId = cardId;
  render();
}

function saveBet() {
  const amount = Number(document.getElementById("bet-range").value);
  if (amount <= 0) return;
  const playerIndex = state.betOrder[state.betTurn];
  const bets = state.bets[playerIndex] || [];
  const existing = bets.find((bet) => bet.cardId === state.selectedCardId);
  if (existing) {
    existing.amount = amount;
  } else {
    bets.push({ cardId: state.selectedCardId, amount });
  }
  state.bets[playerIndex] = bets;
  state.betMessage = "";
  state.selectedCardId = null;
  render();
}

function deleteBet() {
  const playerIndex = state.betOrder[state.betTurn];
  state.bets[playerIndex] = (state.bets[playerIndex] || []).filter((bet) => bet.cardId !== state.selectedCardId);
  state.selectedCardId = null;
  render();
}

function nextBettor() {
  if (getCurrentBetCount() === 0) {
    state.betMessage = "最低1か所BETしてください";
    render();
    return;
  }
  state.selectedCardId = null;
  state.betMessage = "";
  if (state.betTurn < state.betOrder.length - 1) {
    state.betTurn += 1;
    render();
    return;
  }
  state.phase = "answer";
  state.currentStage = 0;
  state.route = ["A-1"];
  render();
}

function getCurrentBetCount() {
  if (state.phase !== "bet") return 0;
  const playerIndex = state.betOrder[state.betTurn];
  return (state.bets[playerIndex] || []).length;
}

function answer(choice) {
  const activeId = getActiveAnswerCardId();
  if (!activeId) return;
  state.answers.push(choice);

  if (state.currentStage < 4) {
    const nextStage = STAGES[state.currentStage + 1];
    const noCount = state.answers.reduce((sum, item) => sum + (item === "NO" ? 1 : 0), 0);
    state.route.push(`${nextStage.key}-${noCount + 1}`);
    state.currentStage += 1;
    render();
    return;
  }

  const eIndex = Number(activeId.split("-")[1]);
  const finalId = `${choice === "YES" ? "Y" : "N"}-${eIndex}`;
  state.route.push(finalId);
  state.currentStage = 5;
  renderFinalConfirm(finalId);
}

function renderFinalConfirm(finalId) {
  renderGame();
  const topbar = document.querySelector(".topbar .row");
  const button = document.createElement("button");
  button.textContent = `最終地点 ${finalId} で決定`;
  button.addEventListener("click", resolveRound);
  topbar.prepend(button);
}

function undoAnswer() {
  if (state.answers.length === 0) return;
  state.answers.pop();
  state.currentStage = Math.max(0, state.currentStage - 1);
  rebuildRoute();
  render();
}

function rebuildRoute() {
  state.route = ["A-1"];
  let noCount = 0;
  for (let i = 0; i < state.answers.length; i += 1) {
    if (state.answers[i] === "NO") noCount += 1;
    if (i < 4) {
      const stage = STAGES[i + 1];
      state.route.push(`${stage.key}-${noCount + 1}`);
    }
  }
}

function resolveRound() {
  const changes = [];

  state.betOrder.forEach((playerIndex) => {
    const player = state.players[playerIndex];
    const beforePoints = player.points;
    const beforeDebt = player.debt;
    const bets = state.bets[playerIndex] || [];

    bets.forEach((bet) => {
      if (state.route.includes(bet.cardId)) {
        player.points += bet.amount * (cardMultiplier(bet.cardId) - 1);
      } else {
        player.points -= bet.amount;
      }
    });

    if (player.points <= 0) {
      player.points = 100;
      player.debt += 100;
    }

    if (player.debt > 0) {
      player.debt += 50;
    }

    changes.push({
      playerIndex,
      beforePoints,
      afterPoints: player.points,
      beforeDebt,
      afterDebt: player.debt
    });
  });

  state.changes = changes;
  state.phase = "roundResult";
  render();
}

function renderChanges() {
  const rows = state.changes.map((change) => {
    const player = state.players[change.playerIndex];
    const debtChanged = change.beforeDebt !== 0 || change.afterDebt !== 0;
    return html`
      <div class="result-row">
        <div class="result-name"><span class="dot" style="background:${player.color.value}"></span> ${escapeHtml(player.name)}</div>
        <div class="result-line">所持 ${change.beforePoints}pt → ${change.afterPoints}pt</div>
        ${debtChanged ? `<div class="result-line debt-line">借り ${change.beforeDebt}pt → ${change.afterDebt}pt</div>` : ""}
      </div>
    `;
  }).join("");

  app.innerHTML = html`
    <section class="screen center-screen">
      <div class="panel">
        <h2>ポイント変化</h2>
        <div class="tables">${rows || "<p>このラウンドのBETはありません。</p>"}</div>
        <button id="next-round">次へ</button>
      </div>
    </section>
  `;

  document.getElementById("next-round").addEventListener("click", () => {
    state.round += 1;
    if (state.round >= state.players.length) {
      state.phase = "final";
      render();
      return;
    }
    state.parentIndex = state.round;
    startRound();
  });
}

function renderFinal() {
  const ranking = state.players
    .map((player, index) => ({ player, index, score: player.points - player.debt }))
    .sort((a, b) => b.score - a.score);

  const rows = ranking.map((entry, rank) => html`
    <div class="ranking-row">
      <div>${rank + 1}位</div>
      <div><span class="dot" style="background:${entry.player.color.value}"></span> ${escapeHtml(entry.player.name)}（${entry.player.color.name}）</div>
      <div>所持 ${entry.player.points}pt</div>
      <div>借り ${entry.player.debt}pt</div>
      <div>最終 ${entry.score}pt</div>
    </div>
  `).join("");

  app.innerHTML = html`
    <section class="screen center-screen">
      <div class="panel">
        <h2>最終ランキング</h2>
        <div class="tables">${rows}</div>
        <button id="restart">タイトルへ</button>
      </div>
    </section>
  `;
  document.getElementById("restart").addEventListener("click", () => {
    clearSavedGame();
    state.phase = "title";
    render();
  });
}

render();
