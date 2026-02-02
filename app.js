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

// --- CSS POUR LA RÉVISION (Mode Examen) ---
const reviewStyle = document.createElement('style');
reviewStyle.innerHTML = `
  .review-item { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: left; }
  .review-stem { font-weight: 700; margin-bottom: 12px; color: #e9ecf5; font-size: 1.1em; }
  .review-choice { padding: 10px 12px; margin: 4px 0; border-radius: 6px; font-size: 14px; opacity: 0.7; border: 1px solid transparent; }
  .review-choice.user-wrong { background: rgba(231, 76, 60, 0.2); border-color: #e74c3c; color: #ffadad; opacity: 1; font-weight: bold; }
  .review-choice.correct-answer { background: rgba(46, 204, 113, 0.2); border-color: #2ecc71; color: #acfcd1; opacity: 1; font-weight: bold; }
  .review-explain { margin-top: 12px; font-style: italic; font-size: 13px; color: #4dabf7; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; }
`;
document.head.appendChild(reviewStyle);

// --- FONCTION PRINCIPALE ---
(function () {
  
  const selectionCard = document.getElementById("selectionCard");

  // Auth Listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Connecté.");
      // On rend l'interface visible
      if(selectionCard) {
          selectionCard.style.transition = "opacity 0.5s";
          selectionCard.style.opacity = "1";
      }
      // On lance l'application directement (les banques sont déjà chargées par index.html)
      initApp();
    } else {
      window.location.href = 'login.html';
    }
  });

  async function initApp() {
    
    // --- VARIABLES DOM ---
    const els = {
      banksList: document.getElementById("banksList"),
      totalPill: document.getElementById("totalPill"),
      startBtn: document.getElementById("startBtn"),
      selectAllBtn: document.getElementById("selectAllBtn"),
      clearBtn: document.getElementById("clearBtn"),
      selectionCard: document.getElementById("selectionCard"),
      examModeToggle: document.getElementById("examModeToggle"),
      
      quizCard: document.getElementById("quizCard"),
      questionText: document.getElementById("questionText"),
      choices: document.getElementById("choices"),
      feedbackText: document.getElementById("feedbackText"),
      explainText: document.getElementById("explainText"),
      progressPill: document.getElementById("progressPill"),
      scorePill: document.getElementById("scorePill"),
      progressBar: document.getElementById("progressBar"),
      nextBtn: document.getElementById("nextBtn"),
      backHomeBtn: document.getElementById("backHomeBtn"),

      openReportBtn: document.getElementById("openReportBtn"),
      reportModal: document.getElementById("reportModal"),
      cancelReportBtn: document.getElementById("cancelReportBtn"),
      submitReportBtn: document.getElementById("submitReportBtn"),
      reportReason: document.getElementById("reportReason"),
      reportContext: document.getElementById("reportContext")
    };

    // --- RÉCUPÉRATION DES BANQUES ---
    // C'est ici que ça change : on lit directement la fenêtre globale
    const banks = window.QUIZ_BANKS || {};
    const bankKeys = Object.keys(banks);
    const selectedBanks = new Set();
    
    let quizQuestions = [];
    let current = 0;
    let scoreCorrect = 0;
    let scoreAnswered = 0;
    let locked = false;
    let isExamMode = false;
    let wrongAnswers = []; 

    // --- CHARGEMENT CORRECTIONS FIREBASE ---
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
    } catch (e) {
      console.warn("Corrections indisponibles (Brave Shields ou Hors Ligne ?)");
    }

    // --- UTILS ---
    function shuffle(a) { return a.sort(() => Math.random() - 0.5); }
    function plural(n, w) { return n === 1 ? `${n} ${w}` : `${n} ${w}s`; }

    // --- UI SELECTION ---
    function renderBanks() {
      els.banksList.innerHTML = "";
      
      if(bankKeys.length === 0) {
          // Si Brave ou autre bloque les scripts locaux
          els.banksList.innerHTML = "<div style='padding:20px; color:#e74c3c'>Aucune banque détectée.<br>Si vous utilisez Brave, désactivez les 'Shields' ou vérifiez que les fichiers bank-xxx.js sont bien dans le dossier /banks.</div>";
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
        text.innerHTML = `<div style="font-weight:800">${bank.label}</div><div class="muted">${plural(count, "question")}</div>`;
        row.appendChild(cb);
        row.appendChild(text);
        els.banksList.appendChild(row);
      });
    }

    function updateTotal() {
      let total = 0;
      selectedBanks.forEach(k => total += banks[k].questions.length);
      els.totalPill.textContent = `Total: ${total}`;
      els.startBtn.disabled = total === 0;
    }

    els.selectAllBtn.onclick = () => { els.banksList.querySelectorAll("input").forEach(cb=>{cb.checked=true; selectedBanks.add(cb.dataset.key)}); updateTotal(); };
    els.clearBtn.onclick = () => { els.banksList.querySelectorAll("input").forEach(cb=>cb.checked=false); selectedBanks.clear(); updateTotal(); };

    // --- LOGIQUE QUIZ ---
    els.startBtn.addEventListener("click", () => {
      isExamMode = els.examModeToggle.checked;
      buildQuiz();
      
      current = 0; scoreCorrect = 0; scoreAnswered = 0;
      wrongAnswers = [];
      
      els.progressBar.innerHTML = "";
      quizQuestions.forEach((_, idx) => {
        const seg = document.createElement("div");
        seg.className = "progress-segment";
        seg.id = `seg-${idx}`;
        els.progressBar.appendChild(seg);
      });

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
          els.openReportBtn.innerHTML = "🚩 Signaler";
          els.openReportBtn.disabled = false;
      }

      const q = quizQuestions[current];
      els.progressPill.textContent = `Question ${current + 1} / ${quizQuestions.length}`;
      els.scorePill.textContent = isExamMode ? "Score masqué" : `Score: ${scoreCorrect} / ${scoreAnswered}`;
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

      const curSeg = document.getElementById(`seg-${current}`);
      if(curSeg) curSeg.classList.add("active");
    }

    function handleAnswer(idx) {
      if (locked) return;
      locked = true;

      const q = quizQuestions[current];
      const correct = q.answerIndex;
      const buttons = els.choices.querySelectorAll("button");
      const curSeg = document.getElementById(`seg-${current}`);
      if(curSeg) curSeg.classList.remove("active");

      buttons.forEach((b, i) => {
        b.disabled = true;
        if (isExamMode) {
            if (i === idx) {
                b.style.background = "#3498db"; b.style.borderColor = "#3498db"; b.style.color = "#fff"; b.style.opacity = "1";
            } else { b.style.opacity = "0.5"; }
        } else {
            if (i === correct) {
                b.style.background = "#2ecc71"; b.style.borderColor = "#2ecc71"; b.style.color = "#fff"; b.style.fontWeight="bold"; b.style.opacity="1";
            } else if (i === idx) {
                b.style.background = "#e74c3c"; b.style.borderColor = "#e74c3c"; b.style.color = "#fff"; b.style.opacity="1";
            } else { b.style.opacity = "0.4"; }
        }
      });

      if (idx === correct) {
          scoreCorrect++;
      } else {
          wrongAnswers.push({
              question: q,
              userChoice: idx,
              correctChoice: correct
          });
      }
      scoreAnswered++;

      if (isExamMode) {
          els.feedbackText.textContent = "Réponse enregistrée.";
          els.feedbackText.style.color = "#a0aec0";
          if(curSeg) curSeg.classList.add("answered");
      } else {
          if(idx !== correct) {
              els.feedbackText.textContent = "Incorrect.";
              els.feedbackText.style.color = "#e74c3c";
              if(curSeg) curSeg.classList.add("wrong");
          } else {
              els.feedbackText.textContent = "Correct !";
              els.feedbackText.style.color = "#2ecc71";
              if(curSeg) curSeg.classList.add("correct");
          }
          els.scorePill.textContent = `Score: ${scoreCorrect} / ${scoreAnswered}`;
          if (q.explain) els.explainText.textContent = q.explain;
      }

      els.nextBtn.disabled = false;

      // Stats
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
        finishQuiz();
      }
    }

    function finishQuiz() {
        els.questionText.textContent = isExamMode ? "Examen terminé !" : "Quiz terminé !";
        
        let msg = `Résultat final : ${scoreCorrect} / ${quizQuestions.length}`;
        if(isExamMode) msg += ` (${Math.round(scoreCorrect/quizQuestions.length*100)}%)`;
        
        els.feedbackText.textContent = msg;
        els.feedbackText.style.color = "var(--primary-blue)";
        els.scorePill.textContent = `Fin: ${scoreCorrect} / ${quizQuestions.length}`;
        els.nextBtn.disabled = true;
        if(els.openReportBtn) els.openReportBtn.style.display = "none";
        
        // Nettoyage zone boutons
        els.choices.innerHTML = "";

        // Afficher bouton révision si Examen
        if (isExamMode) {
            if (wrongAnswers.length > 0) {
                const btn = document.createElement("button");
                btn.textContent = `🔍 Voir mes ${wrongAnswers.length} erreurs`;
                btn.style.background = "#f1c40f"; 
                btn.style.color = "#000";
                btn.style.border = "none";
                btn.style.padding = "15px";
                btn.style.fontSize = "18px";
                btn.style.marginTop = "20px";
                btn.style.cursor = "pointer";
                btn.onclick = () => showExamReview();
                els.choices.appendChild(btn);
            } else {
                els.choices.innerHTML = "<div style='text-align:center; color:#2ecc71; font-size:1.2em; padding:20px;'>🎉 Score parfait !</div>";
            }
        }
        
        const homeBtn = document.createElement("button");
        homeBtn.textContent = "Retour à l'accueil";
        homeBtn.style.marginTop = "10px";
        homeBtn.style.background = "transparent";
        homeBtn.style.border = "1px solid var(--border-color)";
        homeBtn.style.color = "var(--text-muted)";
        homeBtn.onclick = () => location.reload();
        els.choices.appendChild(homeBtn);
    }

    function showExamReview() {
        els.questionText.textContent = "Révision des erreurs";
        els.feedbackText.textContent = "";
        els.choices.innerHTML = "";
        
        wrongAnswers.forEach((item, index) => {
            const q = item.question;
            const card = document.createElement("div");
            card.className = "review-item";
            
            let html = `<div class="review-stem">${index + 1}. ${q.stem}</div>`;
            q.choices.forEach((choice, idx) => {
                let className = "review-choice";
                let suffix = "";
                if (idx === item.userChoice) {
                    className += " user-wrong";
                    suffix = " ❌ (Votre choix)";
                } else if (idx === item.correctChoice) {
                    className += " correct-answer";
                    suffix = " ✅ (Bonne réponse)";
                }
                html += `<div class="${className}">${String.fromCharCode(65 + idx)}. ${choice} ${suffix}</div>`;
            });
            if (q.explain) html += `<div class="review-explain">ℹ️ ${q.explain}</div>`;
            
            card.innerHTML = html;
            els.choices.appendChild(card);
        });

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Retourner à l'accueil";
        closeBtn.style.marginTop = "20px";
        closeBtn.onclick = () => location.reload();
        els.choices.appendChild(closeBtn);
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
