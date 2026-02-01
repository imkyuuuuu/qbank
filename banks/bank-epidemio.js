window.QUIZ_BANKS = window.QUIZ_BANKS || {};

window.QUIZ_BANKS["bank-epidemio"] = {
  label: "Épidémiologie & Lecture Critique (2021-2025)",
  questions: [
    // ===================== 2025 =====================
    {
      id: "epi_2025_01",
      stem: "Que signifie une valeur p de 0,14 ?",
      choices: [
        "Qu’il y a 14% de différence entre les exposés et non exposés",
        "Qu’il y a 14% de chances que l’association trouvée soit due au hasard"
      ],
      answerIndex: 1,
      tags: ["2025", "épidémiologie"]
    },
    {
      id: "epi_2025_02",
      stem: "Que veut dire une hypothèse nulle ?",
      choices: [
        "La probabilité que l’association soit due à une erreur ou au hasard",
        "La probabilité de se tromper dans le diagnostic"
      ],
      answerIndex: 0,
      tags: ["2025", "épidémiologie"]
    },
    {
      id: "epi_2025_03",
      stem: "Qu’est-ce qu’un NNT (Number Needed to Treat) ?",
      choices: [
        "Nombre de patients à traiter pour avoir un patient qui bénéficie du traitement",
        "Nombre de patients à traiter pour observer un effet secondaire grave"
      ],
      answerIndex: 0,
      tags: ["2025", "épidémiologie"]
    },

    // ===================== 2024 =====================
    {
      id: "epi_2024_01",
      stem: "Comment est calculé le facteur d’impact d’une revue scientifique ?",
      choices: [
        "Nombre de citations divisé par le nombre d’articles publiés en 2 ans",
        "Nombre de citations en rapport avec le prestige de la revue"
      ],
      answerIndex: 0,
      tags: ["2024", "épidémiologie"]
    },
    {
      id: "epi_2024_02",
      stem: "Quel est le meilleur moyen de calculer le nombre de nouveaux cas dans une population ?",
      choices: ["Incidence", "Prévalence", "Risque relatif"],
      answerIndex: 0,
      tags: ["2024", "épidémiologie"]
    },

    // ===================== 2023 =====================
    {
      id: "epi_2023_01",
      stem: "Lequel de ces troubles est le plus prévalent en Amérique du Nord ?",
      choices: ["Troubles anxieux", "Trouble d’usage de substances", "Trouble de l’humeur", "Troubles psychotiques"],
      answerIndex: 0,
      tags: ["2023", "épidémiologie"]
    },
    {
      id: "epi_2023_02",
      stem: "Quel trouble est le plus fréquemment comorbide avec l'anorexie mentale ?",
      choices: ["TOC", "Trouble d'usage de substances", "Trouble dépressif", "TPL"],
      answerIndex: 2,
      tags: ["2023", "épidémiologie"]
    },
    {
      id: "epi_2023_03",
      stem: "Vous voulez évaluer l’efficacité de diverses doses d’un médicament. Quel type d’étude allez-vous favoriser ?",
      choices: ["Étude expérimentale", "Étude analytique", "Étude observationnelle", "Étude de cohorte"],
      answerIndex: 0,
      tags: ["2023", "épidémiologie"]
    },
    {
      id: "epi_2023_04",
      stem: "Dans une clinique de 100 patients, 10 ont une dépression. 6 mois plus tard, ces 10 patients sont toujours déprimés et 10 nouveaux cas sont apparus (total de 20/100). Quelle est la prévalence actuelle ?",
      choices: ["20%", "10%", "5%", "30%"],
      answerIndex: 0,
      tags: ["2023", "épidémiologie"]
    },
    {
      id: "epi_2023_05",
      stem: "Une étude sur la psilocybine utilise des patients caucasiens avec 4 ans d'études post-secondaires et sans comorbidité. Un collègue doute de pouvoir appliquer ces résultats à sa pratique diversifiée. Quelle composante est limitante ?",
      choices: ["Validité externe", "Fiabilité externe", "Fiabilité interne"],
      answerIndex: 0,
      tags: ["2023", "épidémiologie"]
    },
    {
      id: "epi_2023_06",
      stem: "Un patient remplit une échelle de dépression le Jour 1 (indiquant un épisode actif) et la refait le Jour 2 (indiquant l'absence de dépression). Quelle composante du test fait défaut ?",
      choices: ["Fiabilité", "Validité", "Convergence", "Cohérence interne"],
      answerIndex: 0,
      tags: ["2023", "épidémiologie"]
    },
    {
      id: "epi_2023_07",
      stem: "Quel diagnostic les personnes de couleur sont-elles plus à risque de recevoir à tort ?",
      choices: ["Trouble psychotique", "Trouble dépressif", "Trouble bipolaire", "Trouble anxieux"],
      answerIndex: 0,
      tags: ["2023", "épidémiologie"]
    },

    // ===================== 2022 =====================
    {
      id: "epi_2022_01",
      stem: "Calcul d'Odds Ratio : Nouveau Rx TDAH (100 perte poids / 100 pas perte) vs Ancien Rx (150 perte poids / 50 pas perte). Quel est le rapport de cote de perte de poids du nouveau Rx vs l'ancien ?",
      choices: ["0,33", "3,0", "1,5", "0,5"],
      answerIndex: 0,
      tags: ["2022", "épidémiologie"]
    },
    {
      id: "epi_2022_02",
      stem: "Une étude évalue une nouvelle psychothérapie sur 50 patients vs 50 patients sans traitement. La réponse est statistiquement significative. Quelle est la limitation majeure ?",
      choices: ["Absence de groupe contrôle actif", "Taille d'échantillon trop petite", "Un seul thérapeute fournit le soin"],
      answerIndex: 0,
      tags: ["2022", "épidémiologie"]
    },

    // ===================== 2021 =====================
    {
      id: "epi_2021_01",
      stem: "Quels groupes représentent les peuples autochtones au Canada ?",
      choices: [
        "Premières nations, Inuit, Métis",
        "Bandes des Premières nations seulement",
        "Indiens inscrits et non inscrits seulement"
      ],
      answerIndex: 0,
      tags: ["2021", "épidémiologie"]
    },
    {
      id: "epi_2021_02",
      stem: "Dans une clinique de 100 patients, 10 ont une dépression. 6 mois plus tard, il y a maintenant 20 patients en dépression sur 100. Quelle est l’incidence de la dépression dans les six derniers mois ?",
      choices: ["10", "20", "5", "100"],
      answerIndex: 0,
      tags: ["2021", "épidémiologie"]
    },
    {
      id: "epi_2021_03",
      stem: "Calcul du NNT : 80% de réponse avec le nouveau médicament vs 60% avec l'ancien. Quel est le NNT ?",
      choices: ["5", "10", "1"],
      answerIndex: 0,
      tags: ["2021", "épidémiologie"]
    },
    {
      id: "epi_2021_04",
      stem: "Quelle étude privilégier pour vérifier l’effet de plusieurs doses de médicaments ?",
      choices: ["Expérimentale", "Observationnelle", "Analytique", "Descriptive"],
      answerIndex: 0,
      tags: ["2021", "épidémiologie"]
    },
    {
      id: "epi_2021_05",
      stem: "Calcul d'Odds Ratio : Nouveau Rx (20 rechutes / 80 pas rechute) vs Placebo (50 rechutes / 50 pas rechute). Quel est l'Odds Ratio ?",
      choices: ["0,25", "0,4", "0,2", "1"],
      answerIndex: 0,
      tags: ["2021", "épidémiologie"]
    },
    {
      id: "epi_2021_06",
      stem: "Une étude cherche à évaluer la dépression chez les jeunes, mais le questionnaire évalue en fait les symptômes anxieux. Quel est le problème ?",
      choices: ["Validité", "Fiabilité", "Reproductibilité", "Acceptabilité"],
      answerIndex: 0,
      tags: ["2021", "épidémiologie"]
    }
  ]
};
