(function () {
  // ===================== RÉFÉRENCES DOM =====================
  const els = {
    banksList: document.getElementById("banksList"),
    totalPill: document.getElementById("totalPill"),
    startBtn: document.getElementById("startBtn"),
    selectAllBtn: document.getElementById("selectAllBtn"),
    clearBtn: document.getElementById("clearBtn"),
    quizCard: document.getElementById("quizCard"),
    selectionCard: document.getElementById("selectionCard"),
    questionText: document.getElementById("questionText"),
    choices: document.getElementById("choices"),
    feedbackText: document.getElementById("feedbackText"),
    explainText: document.getElementById("explainText"),
    progressPill: document.getElementById("progressPill"),
    scorePill: document.getElementById("scorePill"),
    nextBtn: document.getElementById("nextBtn"),
    backHomeBtn: document.getElementById("backHomeBtn"),
  };

  // ===================== DONNÉES =====================
  const banks = window.QUIZ_BANKS || {};
  const bankKeys = Object.keys(banks);
  const selectedBanks = new Set();

  // ===================== UTILS =====================
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

  // ===================== UI BANQUES =====================
  function renderBanks() {
    els.banksList.innerHTML = "";
    bankKeys.forEach(key => {
      const bank = banks[key];
      const count = bank.questions.length;
      const row = document.createElement("label");
      row.className = "bank";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.dataset.key = key;

      cb.addEventListener("change", () => {
        if (cb.checked) selectedBanks.add(key);
        else selectedBanks.delete(key);
        updateTotal();
      });

      const text = document.createElement("div");
      text.innerHTML = `<div style="font-weight:800">${bank.label}</div>
                        <div class="muted">${plural(count, "question")}</div>`;

      row.appendChild(cb);
      row.appendChild(text);
      els.banksList.appendChild(row);
    });
  }

  function updateTotal() {
    let total = 0;
    selectedBanks.forEach(key => {
      total += banks[key].questions.length;
    });
    els.totalPill.textContent = `Total sélectionné: ${plural(total, "question")}`;
    els.startBtn.disabled = total === 0;
  }

  // ===================== BOUTONS GLOBAUX =====================
  els.selectAllBtn.addEventListener("click", () => {
    els.banksList.querySelectorAll("input").forEach(cb => {
      cb.checked = true;
      selectedBanks.add(cb.dataset.key);
    });
    updateTotal();
  });

  els.clearBtn.addEventListener("click", () => {
    els.banksList.querySelectorAll("input").forEach(cb => cb.checked = false);
    selectedBanks.clear();
    updateTotal();
  });

  // ===================== QUIZ LOGIQUE =====================
  let quizQuestions = [];
  let current = 0;
  let scoreCorrect = 0;
  let scoreAnswered = 0;
  let locked = false;

  function buildQuiz() {
    quizQuestions = [];
    selectedBanks.forEach(key => {
      quizQuestions.push(...banks[key].questions);
    });
    quizQuestions = shuffle(quizQuestions);
  }

  function renderQuestion() {
    locked = false;
    els.nextBtn.disabled = true;
    els.feedbackText.textContent = "Choisissez une réponse.";
    els.explainText.textContent = "";

    const q = quizQuestions[current];
    els.progressPill.textContent = `Question ${current + 1} / ${quizQuestions.length}`;
    els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;
    els.questionText.textContent = q.stem;
    els.choices.innerHTML = "";

    q.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `${String.fromCharCode(65 + idx)}. ${choice}`;
      btn.style.opacity = "1"; // Réinitialisation de l'opacité
      btn.addEventListener("click", () => handleAnswer(idx));
      els.choices.appendChild(btn);
    });
  }

  function handleAnswer(idx) {
    if (locked) return;
    locked = true;

    const q = quizQuestions[current];
    const correct = q.answerIndex;
    const buttons = els.choices.querySelectorAll("button");

    buttons.forEach((b, i) => {
      b.disabled = true; // Désactive tous les boutons
      
      if (i === correct) {
        // STYLE POUR LA BONNE RÉPONSE : Vert vif, totalement opaque, texte blanc
        b.style.background = "#2ecc71"; // Vert vif
        b.style.borderColor = "#2ecc71";
        b.style.color = "#ffffff"; // Texte blanc pour contraste
        b.style.fontWeight = "bold";
        b.style.opacity = "1";
      } else if (i === idx) {
        // STYLE POUR LA MAUVAISE RÉPONSE SÉLECTIONNÉE : Rouge, opaque
        b.style.background = "#e74c3c"; // Rouge
        b.style.borderColor = "#e74c3c";
        b.style.color = "#ffffff";
        b.style.opacity = "1";
      } else {
        // STYLE POUR LES AUTRES RÉPONSES : Grisé et semi-transparent
        b.style.opacity = "0.4"; // Plus transparent pour les mettre en retrait
      }
    });

    if (idx !== correct) {
      els.feedbackText.textContent = "Incorrect.";
      els.feedbackText.style.color = "#e74c3c"; // Rouge pour le texte de feedback
    } else {
      els.feedbackText.textContent = "Correct !";
      scoreCorrect++;
      els.feedbackText.style.color = "#2ecc71"; // Vert pour le texte de feedback
    }

    scoreAnswered++;
    els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;
    els.nextBtn.disabled = false;
    if (q.explain) els.explainText.textContent = q.explain;
  }

  function nextQuestion() {
    if (current < quizQuestions.length - 1) {
      current++;
      renderQuestion();
    } else {
      els.questionText.textContent = "Quiz terminé !";
      els.choices.innerHTML = "";
      els.feedbackText.textContent = `Résultat final : ${scoreCorrect} / ${quizQuestions.length}`;
      els.feedbackText.style.color = "var(--primary-blue)";
      els.nextBtn.disabled = true;
    }
  }

  // ===================== NAVIGATION =====================
  els.startBtn.addEventListener("click", () => {
    buildQuiz();
    current = 0;
    scoreCorrect = 0;
    scoreAnswered = 0;
    els.selectionCard.style.display = "none";
    els.quizCard.style.display = "block";
    renderQuestion();
  });

  els.nextBtn.addEventListener("click", nextQuestion);
  els.backHomeBtn.addEventListener("click", () => location.reload());

  // ===================== INIT =====================
  renderBanks();
})();
