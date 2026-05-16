'use strict';

/* ── Constantes ──────────────────────────────────────────────── */
const CLE_STORAGE = 'monBudget_transactions';

const CATEGORIES = {
  alimentation: { label: 'Alimentation', icone: '🛒' },
  logement:     { label: 'Logement',     icone: '🏠' },
  transport:    { label: 'Transport',    icone: '🚗' },
  loisirs:      { label: 'Loisirs',      icone: '🎉' },
  santé:        { label: 'Santé',        icone: '❤️' },
  autres:       { label: 'Autres',       icone: '📦' },
};

const COULEURS_GRAPHIQUE = [
  '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#a78bfa',
];

/* ── État ────────────────────────────────────────────────────── */
let transactions = chargerTransactions();
let graphique = null;
let idASupprimer = null;

/* ── LocalStorage ─────────────────────────────────────────────── */
function chargerTransactions() {
  try {
    return JSON.parse(localStorage.getItem(CLE_STORAGE)) || [];
  } catch {
    return [];
  }
}

function sauvegarderTransactions() {
  localStorage.setItem(CLE_STORAGE, JSON.stringify(transactions));
}

/* ── UUID simple ─────────────────────────────────────────────── */
function genererID() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ── Formatage ───────────────────────────────────────────────── */
function formaterMontant(valeur) {
  return valeur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function formaterDate(iso) {
  const [annee, mois, jour] = iso.split('-');
  return `${jour}/${mois}/${annee}`;
}

/* ── Calculs ─────────────────────────────────────────────────── */
function calculerTotaux(liste) {
  return liste.reduce(
    (acc, t) => {
      if (t.type === 'revenu') acc.revenus += t.montant;
      else acc.depenses += t.montant;
      return acc;
    },
    { revenus: 0, depenses: 0 }
  );
}

/* ── Mise à jour du tableau de bord ─────────────────────────── */
function mettreAJourTableauBord() {
  const { revenus, depenses } = calculerTotaux(transactions);
  const solde = revenus - depenses;

  document.getElementById('solde').textContent = formaterMontant(solde);
  document.getElementById('totalRevenus').textContent = formaterMontant(revenus);
  document.getElementById('totalDepenses').textContent = formaterMontant(depenses);
}

/* ── Graphique ───────────────────────────────────────────────── */
function mettreAJourGraphique() {
  const depenses = transactions.filter(t => t.type === 'depense');
  const parCategorie = {};

  depenses.forEach(t => {
    parCategorie[t.categorie] = (parCategorie[t.categorie] || 0) + t.montant;
  });

  const labels = Object.keys(parCategorie).map(c => CATEGORIES[c]?.label || c);
  const donnees = Object.values(parCategorie);
  const canvas = document.getElementById('graphiqueCategories');
  const vide = document.getElementById('graphiqueVide');

  if (donnees.length === 0) {
    canvas.style.display = 'none';
    vide.hidden = false;
    if (graphique) { graphique.destroy(); graphique = null; }
    return;
  }

  canvas.style.display = 'block';
  vide.hidden = true;

  if (graphique) graphique.destroy();

  graphique = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: donnees,
        backgroundColor: COULEURS_GRAPHIQUE.slice(0, donnees.length),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 }, padding: 14 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${formaterMontant(ctx.parsed)}`,
          },
        },
      },
      cutout: '60%',
    },
  });
}

/* ── Filtres ─────────────────────────────────────────────────── */
function transactionsFiltrees() {
  const type = document.getElementById('filtreType').value;
  const categorie = document.getElementById('filtreCategorie').value;
  const mois = document.getElementById('filtreMois').value;

  return transactions.filter(t => {
    if (type !== 'tous' && t.type !== type) return false;
    if (categorie !== 'toutes' && t.categorie !== categorie) return false;
    if (mois && !t.date.startsWith(mois)) return false;
    return true;
  });
}

/* ── Rendu de l'historique ───────────────────────────────────── */
function rendreHistorique() {
  const liste = document.getElementById('listeTransactions');
  const filtrees = transactionsFiltrees();

  if (filtrees.length === 0) {
    liste.innerHTML = '<p class="liste-vide">Aucune transaction pour le moment.</p>';
    return;
  }

  const triees = [...filtrees].sort((a, b) => b.date.localeCompare(a.date));

  liste.innerHTML = triees.map(t => {
    const cat = CATEGORIES[t.categorie] || { label: t.categorie, icone: '📦' };
    const signe = t.type === 'depense' ? '−' : '+';
    const desc = t.description || cat.label;

    return `
      <div class="transaction transaction--${t.type}" data-id="${t.id}">
        <div class="transaction__icone">${cat.icone}</div>
        <div class="transaction__infos">
          <div class="transaction__description">${echapper(desc)}</div>
          <div class="transaction__meta">
            <span class="transaction__badge">${cat.label}</span>
            ${formaterDate(t.date)}
          </div>
        </div>
        <div class="transaction__montant">${signe} ${formaterMontant(t.montant)}</div>
        <button class="transaction__supprimer" data-id="${t.id}" title="Supprimer">✕</button>
      </div>
    `;
  }).join('');
}

function echapper(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Rendu global ─────────────────────────────────────────────── */
function rendreApp() {
  mettreAJourTableauBord();
  mettreAJourGraphique();
  rendreHistorique();
}

/* ── Ajout d'une transaction ─────────────────────────────────── */
function ajouterTransaction(e) {
  e.preventDefault();
  const erreurEl = document.getElementById('erreur');
  erreurEl.hidden = true;

  const type = document.querySelector('input[name="type"]:checked').value;
  const montantRaw = parseFloat(document.getElementById('montant').value);
  const categorie = document.getElementById('categorie').value;
  const date = document.getElementById('date').value;
  const description = document.getElementById('description').value.trim();

  if (!montantRaw || montantRaw <= 0) {
    afficherErreur('Le montant doit être supérieur à 0.');
    return;
  }
  if (!date) {
    afficherErreur('Veuillez sélectionner une date.');
    return;
  }

  const transaction = {
    id: genererID(),
    type,
    montant: Math.round(montantRaw * 100) / 100,
    categorie,
    date,
    description,
  };

  transactions.push(transaction);
  sauvegarderTransactions();
  rendreApp();

  document.getElementById('montant').value = '';
  document.getElementById('description').value = '';
  document.getElementById('montant').focus();
}

function afficherErreur(message) {
  const el = document.getElementById('erreur');
  el.textContent = message;
  el.hidden = false;
}

/* ── Suppression ─────────────────────────────────────────────── */
function demanderSuppression(id) {
  idASupprimer = id;
  document.getElementById('modaleFond').hidden = false;
}

function confirmerSuppression() {
  transactions = transactions.filter(t => t.id !== idASupprimer);
  idASupprimer = null;
  sauvegarderTransactions();
  fermerModale();
  rendreApp();
}

function fermerModale() {
  document.getElementById('modaleFond').hidden = true;
  idASupprimer = null;
}

/* ── En-tête : mois courant ──────────────────────────────────── */
function afficherMoisCourant() {
  const maintenant = new Date();
  const label = maintenant.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  document.getElementById('moisCourant').textContent = label.charAt(0).toUpperCase() + label.slice(1);
}

/* ── Pré-remplir la date du formulaire ───────────────────────── */
function initialiserDate() {
  const aujourd_hui = new Date().toISOString().slice(0, 10);
  document.getElementById('date').value = aujourd_hui;

  const maintenant = new Date();
  document.getElementById('filtreMois').value =
    `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
}

/* ── Événements ──────────────────────────────────────────────── */
function initialiserEvenements() {
  document.getElementById('formulaire').addEventListener('submit', ajouterTransaction);

  document.getElementById('listeTransactions').addEventListener('click', e => {
    const btn = e.target.closest('.transaction__supprimer');
    if (btn) demanderSuppression(btn.dataset.id);
  });

  ['filtreType', 'filtreCategorie', 'filtreMois'].forEach(id => {
    document.getElementById(id).addEventListener('change', rendreHistorique);
  });

  document.getElementById('modaleConfirmer').addEventListener('click', confirmerSuppression);
  document.getElementById('modaleAnnuler').addEventListener('click', fermerModale);
  document.getElementById('modaleFond').addEventListener('click', e => {
    if (e.target === e.currentTarget) fermerModale();
  });
}

/* ── Initialisation ───────────────────────────────────────────── */
function initialiser() {
  afficherMoisCourant();
  initialiserDate();
  initialiserEvenements();
  rendreApp();
}

initialiser();
