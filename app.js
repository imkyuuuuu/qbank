// --- IMPORT FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, serverTimestamp, 
  doc, setDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- FONCTION PRINCIPALE ---
(function () {
  
  // On cache l'interface tant que Firebase ne nous a pas authentifié
  const selectionCard = document.getElementById("selectionCard");

  // Sécurité Auth : on attend que Firebase confirme la connexion
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Utilisateur authentifié.");
      // L'utilisateur est connecté, on affiche l'interface
      if(selectionCard) {
          selectionCard.style.opacity = "1";
      }
      initApp();
    } else {
      // Pas connecté -> Redirection
      window.location.href = 'login.html';
    }
  });

  // Logique de l'application
  async function initApp() {
    
    // --- VARIABLES DOM ---
    const els = {
      banksList: document.getElementById("banksList"),
      totalPill: document.getElementById("totalPill"),
      startBtn: document.getElementById("startBtn"),
      selectAllBtn: document.getElementById("selectAllBtn"),
      clearBtn: document.getElementById("clearBtn"),
      selectionCard: document.getElementById("selectionCard"),
      examModeToggle: document.getElementById("examModeToggle"), // Toggle Examen
      
      quizCard: document.getElementById("quizCard"),
      questionText: document.getElementById("questionText"),
      choices: document.getElementById("choices"),
      feedbackText: document.getElementById("feedbackText"),
      explainText: document.getElementById("explainText"),
      progressPill: document.getElementById("progressPill"),
      scorePill: document.getElementById("scorePill"),
      progressBar: document.getElementById("progressBar"), // Barre de progression
      nextBtn: document.getElementById("nextBtn"),
      backHomeBtn: document.getElementById("backHomeBtn"),

      openReportBtn: document.getElementById("openReportBtn"),
      reportModal: document.getElementById("reportModal"),
      cancelReportBtn: document.getElementById("cancelReportBtn"),
      submitReportBtn: document.getElementById("submitReportBtn"),
      reportReason: document.getElementById("reportReason"),
      reportContext: document.getElementById("reportContext")
    };

    // --- DONNÉES ---
    const banks = window.QUIZ_BANKS || {};
    const bankKeys = Object.keys(banks);
    const selectedBanks = new Set();
    
    let quizQuestions = [];
    let current = 0;
    let scoreCorrect = 0;
    let scoreAnswered = 0;
    let locked = false;
    let isExamMode = false; // Variable pour le mode examen

    // --- CHARGEMENT DES CORRECTIONS (Arrière-plan) ---
    try {
      if(db) {
        const snapshot = await getDocs(collection(db, "corrections"));
        snapshot.forEach(doc => {
          const qId = doc.id;
          const newIndex = doc.data().answerIndex;
          for (const key in banks) {
            const q = banks[key].questions.find(q => q.id === qId);
            if (q) q.answerIndex = newIndex;
          }
        });
        console.log("Corrections appliquées.");
      }
    } catch (e) { console.warn("Corrections non chargées (hors ligne ?)"); }

    // --- UTILS ---
    function shuffle(a) { return a.sort(() => Math.random() - 0.5); }
    function plural(n, w) { return n === 1 ? `${n} ${w}` : `${n} ${w}s`; }

    // --- INTERFACE DE SÉLECTION ---
    function renderBanks() {
      els.banksList.innerHTML = "";
      if(bankKeys.length === 0) {
          els.banksList.innerHTML = "<div style='padding:20px; color:#e74c3c'>Aucune banque chargée. Vérifiez index.html</div>";
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
      selectedBanks.forEach(k => total += banks[k].questions.length);
      els.totalPill.textContent = `Total sélectionné: ${total}`;
      els.startBtn.disabled = total === 0;
    }

    els.selectAllBtn.onclick = () => { els.banksList.querySelectorAll("input").forEach(cb=>{cb.checked=true; selectedBanks.add(cb.dataset.key)}); updateTotal(); };
    els.clearBtn.onclick = () => { els.banksList.querySelectorAll("input").forEach(cb=>cb.checked=false); selectedBanks.clear(); updateTotal(); };

    // --- LOGIQUE DU QUIZ ---
    els.startBtn.addEventListener("click", () => {
      // 1. Configuration
      isExamMode = els.examModeToggle.checked; // On regarde l'état de l'interrupteur
      buildQuiz();
      current = 0; scoreCorrect = 0; scoreAnswered = 0;
      
      // 2. Générer la barre de progression (segments vides)
      els.progressBar.innerHTML = "";
      quizQuestions.forEach((_, idx) => {
        const seg = document.createElement("div");
        seg.className = "progress-segment";
        seg.id = `seg-${idx}`;
        els.progressBar.appendChild(seg);
      });

      // 3. Affichage
      els.selectionCard.style.display = "none";
      els.quizCard.style.display = "block";
      renderQuestion();
    });

    function buildQuiz() {
      quizQuestions = [];
      selectedBanks.forEach(k => quizQuestions.push(...banks[k].questions));
      quizQuestions = shuffle(quizQuestions);
    }

    function renderQuestion() {
      locked = false;
      els.nextBtn.disabled = true;
      els.feedbackText.textContent = isExamMode ? "Mode Examen" : "Choisissez une réponse.";
      els.feedbackText.style.color = "var(--primary-blue)";
      els.explainText.textContent = "";

      if(els.openReportBtn) {
          els.openReportBtn.style.display = "inline-block";
          els.openReportBtn.disabled = false;
          els.openReportBtn.innerHTML = "🚩 Signaler";
      }

      const q = quizQuestions[current];
      els.progressPill.textContent = `Question ${current + 1} / ${quizQuestions.length}`;
      
      // En mode examen, on cache le score actuel
      if(isExamMode) els.scorePill.textContent = "Score masqué";
      else els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;

      els.questionText.textContent = q.stem;
      if(els.reportContext) els.reportContext.textContent = `ID: ${q.id}`;

      els.choices.innerHTML = "";
      q.choices.forEach((choice, idx) => {
        const btn = document.createElement("button");
        btn.textContent = `${String.fromCharCode(65 + idx)}. ${choice}`;
        btn.style.opacity = "1";
        btn.onclick = () => handleAnswer(idx);
        els.choices.appendChild(btn);
      });

      // Mettre le segment de la barre en surbrillance (bleu)
      const curSeg = document.getElementById(`seg-${current}`);
      if(curSeg) curSeg.classList.add("active");
    }

    function handleAnswer(idx) {
      if (locked) return;
      locked = true;

      const q = quizQuestions[current];
      const correct = q.answerIndex;
      const buttons = els.choices.querySelectorAll("button");
      
      // On retire le focus "actif" du segment de la barre
      const curSeg = document.getElementById(`seg-${current}`);
      if(curSeg) curSeg.classList.remove("active");

      // Gestion de l'affichage des boutons
      buttons.forEach((b, i) => {
        b.disabled = true;
        
        if (isExamMode) {
            // --- MODE EXAMEN : On ne montre pas la réponse ---
            if (i === idx) {
                // Juste indiquer ce qu'on a cliqué (Bleu)
                b.style.background = "#3498db"; 
                b.style.borderColor = "#3498db";
                b.style.color = "#fff";
                b.style.opacity = "1";
            } else {
                b.style.opacity = "0.5";
            }
        } else {
            // --- MODE ÉTUDE : Vert / Rouge ---
            if (i === correct) {
                b.style.background = "#2ecc71";
                b.style.borderColor = "#2ecc71";
                b.style.color = "#fff"; b.style.fontWeight = "bold"; b.style.opacity = "1";
            } else if (i === idx) {
                b.style.background = "#e74c3c";
                b.style.borderColor = "#e74c3c";
                b.style.color = "#fff"; b.style.opacity = "1";
            } else {
                b.style.opacity = "0.4";
            }
        }
      });

      // Calcul des points
      if (idx === correct) scoreCorrect++;
      scoreAnswered++;

      // Feedback Textuel et Barre de progression
      if (isExamMode) {
          // Mode Examen
          els.feedbackText.textContent = "Réponse enregistrée.";
          els.feedbackText.style.color = "#a0aec0"; // Gris
          if(curSeg) curSeg.classList.add("answered"); // Gris
      } else {
          // Mode Étude
          if(idx !== correct) {
              els.feedbackText.textContent = "Incorrect.";
              els.feedbackText.style.color = "#e74c3c";
              if(curSeg) curSeg.classList.add("wrong"); // Rouge
          } else {
              els.feedbackText.textContent = "Correct !";
              els.feedbackText.style.color = "#2ecc71";
              if(curSeg) curSeg.classList.add("correct"); // Vert
          }
          els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;
          if (q.explain) els.explainText.textContent = q.explain;
      }

      els.nextBtn.disabled = false;

      // Envoi des statistiques (Anonyme)
      if (db && q.id) {
          const statsRef = doc(db, "stats", q.id);
          const u = { total: increment(1) }; u[idx] = increment(1);
          setDoc(statsRef, u, { merge: true }).catch(()=>{});
      }
    }

    function nextQuestion() {
      if (current < quizQuestions.length - 1) {
        current++;
        renderQuestion();
      } else {
        // Fin du quiz
        els.questionText.textContent = isExamMode ? "Examen terminé !" : "Quiz terminé !";
        els.choices.innerHTML = "";
        
        let msg = `Résultat final : ${scoreCorrect} / ${quizQuestions.length}`;
        if(isExamMode) msg += ` (${Math.round(scoreCorrect/quizQuestions.length*100)}%)`;
        
        els.feedbackText.textContent = msg;
        els.feedbackText.style.color = "var(--primary-blue)";
        els.scorePill.textContent = `Fin: ${scoreCorrect} / ${quizQuestions.length}`;
        els.nextBtn.disabled = true;
        if(els.openReportBtn) els.openReportBtn.style.display = "none";
      }
    }

    // --- LISTENERS ---
    els.nextBtn.onclick = nextQuestion;
    els.backHomeBtn.onclick = () => { if(confirm("Quitter ?")) location.reload(); };

    // Signalement
    if(els.openReportBtn) {
        els.openReportBtn.onclick = () => { els.reportModal.style.display="flex"; els.reportReason.value=""; els.reportReason.focus(); };
        els.cancelReportBtn.onclick = () => els.reportModal.style.display="none";
        els.submitReportBtn.onclick = async () => {
            const r = els.reportReason.value.trim();
            if(!r) return;
            const q = quizQuestions[current];
            els.submitReportBtn.disabled = true;
            try {
                await addDoc(collection(db, "reports"), {
                    questionId: q.id||"?", questionStem: q.stem.substring(0,50)+"...",
                    reason: r, timestamp: serverTimestamp(), user: sessionStorage.getItem('auth_token')||"?"
                });
                els.reportModal.style.display="none"; alert("Envoyé!");
            } catch(e) { console.error(e); } 
            els.submitReportBtn.disabled = false;
        };
        window.onclick = (e) => { if(e.target === els.reportModal) els.reportModal.style.display="none"; };
    }

    renderBanks();
  }
})();
