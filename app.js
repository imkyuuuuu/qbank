// app.js
(function () {
  const banks = (window.QUIZ_BANKS || {});
  const bankKeys = Object.keys(banks);

  const els = {
    banksList: document.getElementById("banksList"),
    totalPill: document.getElementById("totalPill"),
    startBtn: document.getElementById("startBtn"),
    selectAllBtn: document.getElementById("selectAllBtn"),
    clearBtn: document.getElementById("clearBtn"),
    quizCard: document.getElementById("quizCard"),
    questionText: document.getElementById("questionText"),
    choices: document.getElementById("choices"),
    feedbackText: document.getElementById("feedbackText"),
    nextBtn: document.getElementById("nextBtn"),
    scorePill: document.getElementById("scorePill"),
    progressPill: document.getElementById("progressPill"),
    backHomeBtn: document.getElementById("backHomeBtn"),
    explainText: document.getElementById("explainText")
  };

  // --- Utilitaires ---
  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function plural(n, word) {
    return n === 1 ? `${n} ${word}` : `${n} ${word}s`;
  }

  // --- UI sélection des banques ---
  const selected = new Set();

  function renderBanks() {
    if (bankKeys.length === 0) {
      els.banksList.innerHTML = `<div class="muted">Aucune banque chargée.</div>`;
      return;
    }

    els.banksList.innerHTML = "";
    bankKeys.forEach((key) => {
      const bank = banks[key];
      const count = (bank.questions || []).length;

      const row = document.createElement("label");
      row.className = "bank";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.dataset.bankKey = key;
      cb.addEventListener("change", () => {
        if (cb.checked) selected.add(key);
        else selected.delete(key);
        updateTotal();
      });

      const text = document.createElement("div");
      text.innerHTML = `<div style="font-weight:800">${bank.label || key}</div>
                        <div class="muted" style="font-size:13px">${plural(count, "question")}</div>`;

      row.appendChild(cb);
      row.appendChild(text);
      els.banksList.appendChild(row);
    });

    updateTotal();
  }

  function updateTotal() {
    let total = 0;
    selected.forEach((key) => {
      total += (banks[key]?.questions?.length || 0);
    });

    els.totalPill.textContent = `Total sélectionné: ${plural(total, "question")}`;
    els.startBtn.disabled = total === 0;
  }

  els.selectAllBtn.addEventListener("click", () => {
    selected.clear();
    document.querySelectorAll('input[type="checkbox"][data-bank-key]').forEach(cb => {
      cb.checked = true;
      selected.add(cb.dataset.bankKey);
    });
    updateTotal();
  });

  els.clearBtn.addEventListener("click", () => {
    selected.clear();
    document.querySelectorAll('input[type="checkbox"][data-bank-key]').forEach(cb => {
      cb.checked = false;
    });
    updateTotal();
  });

  // --- Quiz ---
  let quizQuestions = [];
  let current = 0;
  let locked = false;
  let scoreCorrect = 0;
  let scoreAnswered = 0;

  function buildQuizFromSelectedBanks() {
    const all = [];
    selected.forEach((key) => {
      const q = (banks[key]?.questions || []);
      all.push(...q);
    });

    // Contrôles minimaux (sécurité logique)
    const clean = all.filter(q =>
      q &&
      typeof q.stem === "string" &&
      Array.isArray(q.choices) &&
      q.choices.length >= 2 &&
      Number.isInteger(q.answerIndex) &&
      q.answerIndex >= 0 &&
      q.answerIndex < q.choices.length
    );

    quizQuestions = shuffle(clean);
  }

  function showHome() {
    document.querySelector(".card").style.display = ""; // première card (sélection)
    els.quizCard.style.display = "none";
  }

  function showQuiz() {
    document.querySelector(".card").style.display = "none";
    els.quizCard.style.display = "";
  }

  function renderQuestion() {
    locked = false;
    els.nextBtn.disabled = true;
    els.feedbackText.textContent = "Clique une réponse pour voir la correction.";
    els.explainText.textContent = "";

    const q = quizQuestions[current];
    els.progressPill.textContent = `Case ${current + 1} (${current + 1}/${quizQuestions.length})`;
    els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;
    els.questionText.textContent = q.stem;

    els.choices.innerHTML = "";
    q.choices.forEach((choiceText, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.style.width = "100%";
      btn.style.textAlign = "left";
      btn.style.margin = "6px 0";
      btn.style.padding = "12px 14px";
      btn.style.borderRadius = "12px";
      btn.style.border = "1px solid rgba(255,255,255,.1)";
      btn.style.background = "rgba(0,0,0,.18)";
      btn.style.cursor = "pointer";
      btn.textContent = `${String.fromCharCode(65 + idx)}. ${choiceText}`;

      btn.addEventListener("click", () => handleAnswer(idx));
      els.choices.appendChild(btn);
    });
  }

  function handleAnswer(selectedIdx) {
    if (locked) return;
    locked = true;

    const q = quizQuestions[current];
    const correctIdx = q.answerIndex;

    const buttons = Array.from(els.choices.querySelectorAll("button"));

    // Coloration
    buttons.forEach((b, idx) => {
      b.disabled = true;
      if (idx === correctIdx) {
        b.style.borderColor = "rgba(46, 204, 113, .85)";
        b.style.background = "rgba(46, 204, 113, .16)";
      }
    });

    if (selectedIdx !== correctIdx) {
      const b = buttons[selectedIdx];
      b.style.borderColor = "rgba(231, 76, 60, .85)";
      b.style.background = "rgba(231, 76, 60, .16)";
      els.feedbackText.textContent = "Réponse incorrecte. La bonne réponse est en vert.";
    } else {
      els.feedbackText.textContent = "Réponse correcte.";
    }

    scoreAnswered += 1;
    if (selectedIdx === correctIdx) scoreCorrect += 1;
    els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;

    if (q.explanation) {
      els.explainText.textContent = `Explication: ${q.explanation}`;
    }

    els.nextBtn.disabled = false;
  }

  function nextQuestion() {
    if (current < quizQuestions.length - 1) {
      current += 1;
      renderQuestion();
    } else {
      els.progressPill.textContent = "Terminé";
      els.questionText.textContent = "Fin du quiz.";
      els.choices.innerHTML = "";
      els.feedbackText.textContent = `Score final: ${scoreCorrect} / ${scoreAnswered}.`;
      els.explainText.textContent = "";
      els.nextBtn.disabled = true;
    }
  }

  els.startBtn.addEventListener("click", () => {
    buildQuizFromSelectedBanks();
    current = 0;
    locked = false;
    scoreCorrect = 0;
    scoreAnswered = 0;

    showQuiz();

    if (quizQuestions.length === 0) {
      els.progressPill.textContent = "Erreur";
      els.questionText.textContent = "Aucune question valide dans les banques sélectionnées.";
      els.choices.innerHTML = "";
      els.feedbackText.textContent = "Vérifie le format des questions (choices/answerIndex).";
      els.nextBtn.disabled = true;
      return;
    }
    renderQuestion();
  });

  els.nextBtn.addEventListener("click", nextQuestion);

  els.backHomeBtn.addEventListener("click", () => {
    showHome();
  });

  renderBanks();
})();
