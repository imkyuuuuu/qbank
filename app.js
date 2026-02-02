// --- IMPORT FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, 
  doc, setDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAYVxT8Le90OB0XFfqxinI1bYnwWBMqAGY",
  authDomain: "qbank-c06a6.firebaseapp.com",
  projectId: "qbank-c06a6",
  storageBucket: "qbank-c06a6.firebasestorage.app",
  messagingSenderId: "872766547331",
  appId: "1:872766547331:web:bd270985956702c99142b6",
  measurementId: "G-KBMXFQ96HH"
};

// Initialisation de Firebase
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase initialisé.");
} catch (e) {
  console.error("Erreur init Firebase:", e);
}

// --- FONCTION PRINCIPALE ---
(function () {
  
  // 1. RÉFÉRENCES DOM
  const els = {
    // Sélection
    banksList: document.getElementById("banksList"),
    totalPill: document.getElementById("totalPill"),
    startBtn: document.getElementById("startBtn"),
    selectAllBtn: document.getElementById("selectAllBtn"),
    clearBtn: document.getElementById("clearBtn"),
    selectionCard: document.getElementById("selectionCard"),
    
    // Quiz
    quizCard: document.getElementById("quizCard"),
    questionText: document.getElementById("questionText"),
    choices: document.getElementById("choices"),
    feedbackText: document.getElementById("feedbackText"),
    explainText: document.getElementById("explainText"),
    progressPill: document.getElementById("progressPill"),
    scorePill: document.getElementById("scorePill"),
    nextBtn: document.getElementById("nextBtn"),
    backHomeBtn: document.getElementById("backHomeBtn"),

    // Signalement
    openReportBtn: document.getElementById("openReportBtn"),
    reportModal: document.getElementById("reportModal"),
    cancelReportBtn: document.getElementById("cancelReportBtn"),
    submitReportBtn: document.getElementById("submitReportBtn"),
    reportReason: document.getElementById("reportReason"),
    reportContext: document.getElementById("reportContext")
  };

  // 2. DONNÉES
  const banks = window.QUIZ_BANKS || {};
  const bankKeys = Object.keys(banks);
  const selectedBanks = new Set();
  
  let quizQuestions = [];
  let current = 0;
  let scoreCorrect = 0;
  let scoreAnswered = 0;
  let locked = false;

  // ===================== CHARGEMENT CORRECTIONS (Arrière-plan) =====================
  async function loadCorrectionsBackground() {
    if (!db) return;
    try {
      const snapshot = await getDocs(collection(db, "corrections"));
      if (!snapshot.empty) {
        let count = 0;
        snapshot.forEach(doc => {
          const qId = doc.id;
          const newIndex = doc.data().answerIndex;
          for (const key in banks) {
            const question = banks[key].questions.find(q => q.id === qId);
            if (question) {
              question.answerIndex = newIndex;
              count++;
            }
          }
        });
        console.log(`${count} corrections chargées.`);
      }
    } catch (e) {
      console.warn("Mode hors ligne : corrections non chargées.");
    }
  }

  // ===================== UTILITAIRES =====================
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

  // ===================== INTERFACE DE SÉLECTION =====================
  function renderBanks() {
    els.banksList.innerHTML = "";
    
    if (bankKeys.length === 0) {
      els.banksList.innerHTML = "<div style='color:#e74c3c; padding:20px;'>Aucune banque trouvée.</div>";
      return;
    }

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
    els.totalPill.textContent = `Total sélectionné: ${total}`;
    els.startBtn.disabled = total === 0;
  }

  // Boutons de sélection de masse
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

  // ===================== LOGIQUE QUIZ =====================
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
    els.feedbackText.style.color = "var(--primary-blue)";
    els.explainText.textContent = "";

    // Reset bouton signaler
    if(els.openReportBtn) {
        els.openReportBtn.style.display = "inline-block";
        els.openReportBtn.disabled = false;
        els.openReportBtn.innerHTML = "🚩 Signaler";
    }

    const q = quizQuestions[current];
    els.progressPill.textContent = `Question ${current + 1} / ${quizQuestions.length}`;
    els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;
    els.questionText.textContent = q.stem;
    
    if(els.reportContext) els.reportContext.textContent = `ID Question : ${q.id || "Inconnu"}`;

    els.choices.innerHTML = "";
    q.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `${String.fromCharCode(65 + idx)}. ${choice}`;
      btn.style.opacity = "1"; // Opacité normale au début
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
      
      if (i === correct) {
        // BONNE RÉPONSE (Vert + Opaque)
        b.style.background = "#2ecc71";
        b.style.borderColor = "#2ecc71";
        b.style.color = "#ffffff";
        b.style.fontWeight = "bold";
        b.style.opacity = "1";
      } else if (i === idx) {
        // MAUVAISE RÉPONSE CHOISIE (Rouge + Opaque)
        b.style.background = "#e74c3c";
        b.style.borderColor = "#e74c3c";
        b.style.color = "#ffffff";
        b.style.opacity = "1";
      } else {
        // AUTRES RÉPONSES (Transparentes / Fade out)
        b.style.opacity = "0.4";
      }
    });

    // Feedback texte
    if (idx !== correct) {
      els.feedbackText.textContent = "Incorrect.";
      els.feedbackText.style.color = "#e74c3c";
    } else {
      els.feedbackText.textContent = "Correct !";
      els.feedbackText.style.color = "#2ecc71";
      scoreCorrect++;
    }

    scoreAnswered++;
    els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;
    els.nextBtn.disabled = false;
    
    if (q.explain) els.explainText.textContent = q.explain;

    // --- ENVOI DES STATISTIQUES ---
    if (db && q.id) {
        try {
            const statsRef = doc(db, "stats", q.id);
            const updateData = { total: increment(1) };
            updateData[idx] = increment(1); // Incrémente le choix spécifique (0, 1, 2 ou 3)
            setDoc(statsRef, updateData, { merge: true }).catch(e => console.error(e));
        } catch(e) { /* Ignorer erreur stats */ }
    }
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
      if(els.openReportBtn) els.openReportBtn.style.display = "none";
    }
  }

  // ===================== LOGIQUE DE SIGNALEMENT =====================
  if(els.openReportBtn) {
      // Ouvrir
      els.openReportBtn.addEventListener("click", () => {
        els.reportModal.style.display = "flex";
        els.reportReason.value = "";
        els.reportReason.focus();
      });

      // Annuler
      els.cancelReportBtn.addEventListener("click", () => els.reportModal.style.display = "none");

      // Envoyer
      els.submitReportBtn.addEventListener("click", async () => {
        const reason = els.reportReason.value.trim();
        if (!reason) return alert("Veuillez décrire le problème.");
        
        const q = quizQuestions[current];
        els.submitReportBtn.innerText = "Envoi...";
        els.submitReportBtn.disabled = true;

        try {
          if (!db) throw new Error("Erreur DB");
          
          await addDoc(collection(db, "reports"), {
            questionId: q.id || "unknown",
            questionStem: q.stem.substring(0, 100) + "...",
            reason: reason,
            timestamp: serverTimestamp(),
            user: sessionStorage.getItem('auth_token') || "anonyme"
          });

          els.reportModal.style.display = "none";
          els.openReportBtn.innerHTML = "✅ Signalé";
          els.openReportBtn.disabled = true;
          alert("Signalement envoyé !");

        } catch (e) {
          console.error(e);
          alert("Erreur lors de l'envoi.");
        } finally {
          els.submitReportBtn.innerText = "Envoyer";
          els.submitReportBtn.disabled = false;
        }
      });
      
      // Fermer au clic dehors
      window.addEventListener("click", (e) => {
        if (e.target === els.reportModal) els.reportModal.style.display = "none";
      });
  }

  // ===================== NAVIGATION =====================
  els.startBtn.addEventListener("click", () => {
    buildQuiz();
    current = 0; scoreCorrect = 0; scoreAnswered = 0;
    els.selectionCard.style.display = "none";
    els.quizCard.style.display = "block";
    renderQuestion();
  });

  els.nextBtn.addEventListener("click", nextQuestion);
  
  els.backHomeBtn.addEventListener("click", () => {
    if(confirm("Quitter le quiz ?")) location.reload();
  });

  // ===================== DÉMARRAGE =====================
  renderBanks();
  loadCorrectionsBackground();

})();
