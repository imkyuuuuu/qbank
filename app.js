// app.js
(function () {

  // ===================== RÉFÉRENCES DOM =====================
  const els = {
    banksList: document.getElementById("banksList"),
    tagsList: document.getElementById("tagsList"),
    totalPill: document.getElementById("totalPill"),
    tagTotalPill: document.getElementById("tagTotalPill"),
    startBtn: document.getElementById("startBtn"),
    selectAllBtn: document.getElementById("selectAllBtn"),
    clearBtn: document.getElementById("clearBtn"),

    quizCard: document.getElementById("quizCard"),
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
  const selectedTags = new Set();

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

  // ===================== TAG INDEX =====================
  function buildTagIndex() {
    const map = new Map();
    for (const key of bankKeys) {
      const qs = banks[key]?.questions || [];
      for (const q of qs) {
        const tags = Array.isArray(q.tags) ? q.tags : [];
        for (let t of tags) {
          t = String(t).toLowerCase().trim();
          if (!map.has(t)) map.set(t, []);
          map.get(t).push(q);
        }
      }
    }
    return map;
  }

  const tagIndex = buildTagIndex();
  const allTags = Array.from(tagIndex.keys()).sort();

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

  // ===================== UI TAGS =====================
  function renderTags() {
    els.tagsList.innerHTML = "";

    allTags.forEach(tag => {
      const count = tagIndex.get(tag).length;

      const row = document.createElement("label");
      row.className = "bank";

      const cb = document.createElement("input");
      cb.type = "checkbox";

      cb.addEventListener("change", () => {
        if (cb.checked) selectedTags.add(tag);
        else selectedTags.delete(tag);
        updateTotal();
        updateTagTotal();
      });

      const text = document.createElement("div");
      text.innerHTML = `<div style="font-weight:800">#${tag}</div>
                        <div class="muted">${plural(count, "question")}</div>`;

      row.appendChild(cb);
      row.appendChild(text);
      els.tagsList.appendChild(row);
    });
  }

  function updateTagTotal() {
    const set = new Set();
    selectedTags.forEach(t => {
      tagIndex.get(t).forEach(q => set.add(q.id));
    });
    els.tagTotalPill.textContent = `Total tags sélectionnés: ${plural(set.size, "question")}`;
  }

  // ===================== TOTAL =====================
  function updateTotal() {
    let bankTotal = 0;
    selectedBanks.forEach(key => {
      bankTotal += banks[key].questions.length;
    });

    const tagSet = new Set();
    selectedTags.forEach(t => {
      tagIndex.get(t).forEach(q => tagSet.add(q.id));
    });

    const total = bankTotal + tagSet.size;
    els.totalPill.textContent = `Total sélectionné: ${plural(total, "question")}`;
    els.startBtn.disabled = total === 0;
  }

  // ===================== QUIZ BUILD =====================
  let quizQuestions = [];
  let current = 0;
  let scoreCorrect = 0;
  let scoreAnswered = 0;
  let locked = false;

  function buildQuiz() {
    const map = new Map();

    selectedBanks.forEach(key => {
      banks[key].questions.forEach(q => map.set(q.id, q));
    });

    selectedTags.forEach(tag => {
      tagIndex.get(tag).forEach(q => map.set(q.id, q));
    });

    quizQuestions = shuffle(Array.from(map.values()));
  }

  // ===================== QUIZ UI =====================
  function renderQuestion() {
    locked = false;
    els.nextBtn.disabled = true;
    els.feedbackText.textContent = "Clique une réponse.";
    els.explainText.textContent = "";

    const q = quizQuestions[current];

    els.progressPill.textContent = `Case ${current + 1} / ${quizQuestions.length}`;
    els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;
    els.questionText.textContent = q.stem;

    els.choices.innerHTML = "";

    q.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `${String.fromCharCode(65 + idx)}. ${choice}`;
      btn.style.display = "block";
      btn.style.margin = "8px 0";
      btn.style.width = "100%";

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
      b.disabled = true;
      if (i === correct) b.style.background = "rgba(46,204,113,.3)";
    });

    if (idx !== correct) {
      buttons[idx].style.background = "rgba(231,76,60,.3)";
      els.feedbackText.textContent = "Incorrect.";
    } else {
      els.feedbackText.textContent = "Correct.";
    }

    scoreAnswered++;
    if (idx === correct) scoreCorrect++;

    els.nextBtn.disabled = false;
  }

  function nextQuestion() {
    if (current < quizQuestions.length - 1) {
      current++;
      renderQuestion();
    } else {
      els.questionText.textContent = "Quiz terminé.";
      els.choices.innerHTML = "";
      els.feedbackText.textContent = `Score final: ${scoreCorrect}/${scoreAnswered}`;
      els.nextBtn.disabled = true;
    }
  }

  // ===================== NAVIGATION =====================
  els.startBtn.addEventListener("click", () => {
    buildQuiz();
    current = 0;
    scoreCorrect = 0;
    scoreAnswered = 0;
    document.querySelector(".card").style.display = "none";
    els.quizCard.style.display = "block";
    renderQuestion();
  });

  els.nextBtn.addEventListener("click", nextQuestion);
  els.backHomeBtn.addEventListener("click", () => location.reload());

  // ===================== INIT =====================
  renderBanks();
  renderTags();
  updateTotal();

})();
