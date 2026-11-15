/* Cake by LK — script réécrit le 14/11/2026 (séance 9).
   Aucune donnée n'est envoyée : le message final est copié puis collé par la cliente dans Instagram.
   Les gâteaux du mur et la carte sont écrits en dur dans index.html ; ce script les lit là, il ne les répète pas.
   Règles validées par YKM le 14/11 : number cake pour l'anniversaire seulement ; wedding cake pour le mariage seulement ;
   layer cake pour les autres fêtes ; la taille se choisit parmi celles de la carte ; les douceurs sont un complément. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const racine = document.documentElement;
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fleche = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const plus = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const moins = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14"/></svg>';
  const pluriel = (n, un, plusieurs) => `${n}\u00a0${n > 1 ? plusieurs : un}`;
  const euros = (n) => n.toLocaleString('fr-FR') + ' €';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const defiler = (el, block = 'start') => el && el.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block });
  const borne = (x) => Math.max(0, Math.min(1, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const lisse = (x) => { x = borne(x); return x * x * (3 - 2 * x); };

  /* ---------- La carte de LK : seule source des prix ---------- */
  const LAYER = { 15: 75, 20: 95, 25: 120 };
  const NUMBER = { '6': 30, '8 à 10': 35 };
  const DOUCEUR = 3;
  const PART_MARIAGE = 5;
  const SAVEURS = [
    { nom: 'Le 3 chocolat', img: 'img/coupe-3-chocolat-160.webp', desc: 'Génoise chocolat, ganache chocolat au lait, croustillant praliné, ganache chocolat blanc' },
    { nom: 'Le Bueno', img: 'img/coupe-bueno-160.webp', desc: 'Génoise chocolat, ganache chocolat au lait, crème de noisette maison, morceaux de Kinder Bueno' },
    { nom: 'Le Fraisier', img: 'img/coupe-fraisier-160.webp', desc: 'Génoise vanille, coulis fraise, morceaux de fraises fraîches' },
    { nom: 'Le Framboisier', img: 'img/coupe-framboisier-160.webp', desc: 'Génoise vanille, ganache chocolat blanc vanille, coulis framboise, morceaux de framboises fraîches' },
    { nom: 'Le Specaramel', img: 'img/coupe-specaramel-160.webp', desc: 'Génoise vanille, ganache vanille, coulis de caramel beurre salé, éclats de speculos' },
  ];
  /* HYPOTHÈSE à faire confirmer par LK (accord de YKM le 14/11) : la carte ne dit pas quelles saveurs existent en number cake.
     Ces deux garnitures sont celles que l'on voit sur ses number cakes publiés (le 18 et le 50). */
  const GARNITURES = [
    { nom: 'Fruits rouges', img: 'img/number-fruits-rouges-160.webp', desc: 'Biscuit, crème à la vanille, fraises et framboises' },
    { nom: 'Chocolat', img: 'img/number-chocolat-160.webp', desc: 'Biscuit, crème au chocolat, chocolats' },
  ];
  const FETES = ['Anniversaire', 'Mariage', 'Baby shower ou gender reveal', 'Autre fête'];
  const gateauxPour = (fete) => fete === 'Anniversaire' ? ['layer', 'number'] : fete === 'Mariage' ? ['wedding'] : fete ? ['layer'] : [];
  const saveursPour = (gateau) => gateau === 'number' ? GARNITURES : SAVEURS;

  /* ---------- Écriture dorée : la taille s'adapte aux prénoms longs ---------- */
  const ajuster = (el) => {
    if (!el) return;
    el.style.fontSize = '';
    const w = el.clientWidth; if (!w) return;
    if (el.scrollWidth > w + 1) el.style.fontSize = Math.max(26, Math.floor(parseFloat(getComputedStyle(el).fontSize) * w / el.scrollWidth)) + 'px';
  };
  const ajusterTout = () => ['#apercuDecor', '.prenom-fin', '#rPrenom'].forEach(s => ajuster($(s)));
  addEventListener('resize', ajusterTout);

  /* ---------- En-tête et menu ---------- */
  const entete = $('#entete'), menuBtn = $('#menuBtn'), nav = $('#nav');
  let yOuverture = 0;
  const fermerMenu = (rendreFocus) => {
    if (!nav.classList.contains('ouvert')) return;
    nav.classList.remove('ouvert'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu';
    if (rendreFocus) menuBtn.focus();
  };
  menuBtn.addEventListener('click', () => {
    const ouvert = nav.classList.toggle('ouvert');
    menuBtn.setAttribute('aria-expanded', ouvert);
    menuBtn.textContent = ouvert ? 'Fermer' : 'Menu';
    if (ouvert) { yOuverture = scrollY; $('#nav a').focus(); }
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => fermerMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fermerMenu(true); });
  document.addEventListener('click', (e) => { if (!entete.contains(e.target)) fermerMenu(false); });
  addEventListener('scroll', () => {
    entete.classList.toggle('defile', scrollY > 8);
    if (Math.abs(scrollY - yOuverture) > 80) fermerMenu(false);
  }, { passive: true });

  /* ---------- Barre fixe (téléphone) : cachée quand le bouton doré, la commande ou le pied sont à l'écran, et pendant une saisie ---------- */
  const barre = $('#barre');
  const vus = { bouton: false, commander: false, pied: false, saisie: false, couvert: false };
  // le bouton doré compte comme visible seulement s'il n'est pas recouvert par la section Créations (il reste collé dans l'accueil)
  const majBarre = () => {
    const dore = vus.bouton && !vus.couvert;
    barre.classList.toggle('cachee', dore || vus.commander || vus.pied || vus.saisie);
    // ordinateur et tablette : le bouton de l'en-tête attend que le bouton doré quitte l'écran, pour ne jamais en montrer deux
    entete.classList.toggle('cta-cache', dore);
  };
  const observer = (el, cle, seuil) => new IntersectionObserver(([e]) => { vus[cle] = e.isIntersecting; majBarre(); }, { threshold: seuil }).observe(el);
  observer($('#commander'), 'commander', 0.05);
  observer($('#heroBtn'), 'bouton', 0.5);
  observer($('.pied'), 'pied', 0);
  document.addEventListener('focusin', (e) => { vus.saisie = e.target.matches('input, textarea'); majBarre(); });
  document.addEventListener('focusout', () => { vus.saisie = false; majBarre(); });
  majBarre();

  /* ---------- Le gâteau qui tourne ----------
     48 vues d'un même gâteau. Avec la scène : l'accueil reste collé, le défilement fait faire au gâteau un tour exact (il repart de face
     et arrive de face), puis il rétrécit et va prendre sa case dans le mur, qui monte par-dessus l'accueil. Remonter rejoue tout à l'envers.
     Sans la scène (mouvement réduit, écran très bas) : le gâteau reste dans l'accueil et se tourne à la main. */
  /* Le mur rangé par occasion (choix de YKM du 15/11) : deux groupes, un gâteau en vedette chacun, le reste à la demande.
     Le script construit les groupes à partir de la grille écrite dans index.html, qui reste telle quelle sans JavaScript. */
  if (racine.classList.contains('mur-occasion')) {
    const ancien = $('#mur'), tuiles = $$('.tuile', ancien);
    const GROUPES = [
      { titre: 'Anniversaires et fêtes', texte: 'Layer cakes dès 75 €, number cakes dès 30 €.', f: ['anniversaire', 'baby'], vedette: (t) => t.classList.contains('place') },
      { titre: 'Mariages', texte: 'Wedding cakes sur devis, dès 5 € la part.', f: ['mariage'], vedette: (t) => t.querySelector('[data-vignette*="mariage-agrumes"]') },
    ];
    const bloc = document.createElement('div'); bloc.className = 'occasions'; bloc.id = 'mur';
    GROUPES.forEach((g, i) => {
      const liste = tuiles.filter((t) => g.f.includes(t.dataset.f));
      const v = liste.find(g.vedette); if (v) { v.classList.add('vedette'); liste.splice(liste.indexOf(v), 1); liste.unshift(v); }
      const sec = document.createElement('section'); sec.className = 'occasion'; sec.setAttribute('aria-labelledby', 'occ-' + i);
      sec.innerHTML = `<div class="occasion-tete"><h3 id="occ-${i}">${g.titre}</h3><p>${g.texte}</p></div><ul class="occasion-grille"></ul><button class="btn btn-clair voir-plus" type="button" aria-expanded="false">Voir les ${liste.length} gâteaux</button>`;
      liste.forEach((t) => $('.occasion-grille', sec).appendChild(t));
      $('.voir-plus', sec).addEventListener('click', (e) => { sec.classList.add('ouverte'); e.currentTarget.hidden = true; });
      bloc.appendChild(sec);
    });
    const note = $('#murNote'); if (note) { note.hidden = true; bloc.appendChild(note); }
    ancien.replaceWith(bloc);
  }
  const mur = $('#mur');
  /* L'ordre du clavier suit l'ordre visuel : la case du gâteau qui tourne est déplacée dans le code (2e case sous 1000 px, 5e au-dessus) */
  (() => {
    const place = $('.tuile.place', mur); if (!place || !mur.classList.contains('mur')) return;
    const large = matchMedia('(min-width:1000px)');
    const placer = () => {
      const autres = $$('.tuile', mur).filter((t) => t !== place);
      const avant = autres[large.matches ? 4 : 1];
      if (avant && place.nextElementSibling !== avant) mur.insertBefore(place, avant);
    };
    placer(); mur.classList.add('ordre-js');
    large.addEventListener('change', placer);
  })();
  (() => {
    const sceneEl = $('.scene'), colle = $('.scene-colle'), niche = $('#niche'), boite = $('#tourne'), toile = $('#tourneToile');
    const place = $('.tuile.place'), mini = $('.tourne-mini'), indice = $('#tourneIndice span'), creations = $('#creations'), blocsTete = [...$('.creations .section-tete').children];
    if (!boite || !toile || !place) return;
    // 720 px dès que l'écran est large ou à haute densité (téléphones récents) : en 480, l'arche était agrandie presque deux fois et floue
    const N = +boite.dataset.n, base = boite.dataset.base, taille = innerWidth >= 600 || devicePixelRatio >= 2 ? 720 : 480;
    const toiles = [toile, mini].map((t) => [t, t.getContext('2d')]);
    const eco = navigator.connection && navigator.connection.saveData;
    const imgs = new Array(N), prete = new Array(N).fill(false);
    let angle = 0, main = 0, glisse = null, dernierDessin = -1, resteCharge = false;
    let sceneOn = false, home = { x: 0, y: 0, w: 1, h: 1 }, rayonTuile = 18, rayonBas = 36;

    const dessiner = () => {
      const i = ((Math.round(angle) % N) + N) % N;
      let k = 0; while (k < N && !prete[(i + k) % N] && !prete[(i - k + N) % N]) k++;
      if (k >= N) return;
      const j = prete[(i + k) % N] ? (i + k) % N : (i - k + N) % N;
      if (j === dernierDessin) return; dernierDessin = j;
      toiles.forEach(([t, ctx]) => ctx.drawImage(imgs[j], 0, 0, t.width, t.height));
    };
    const charger = (i) => new Promise((r) => { const im = new Image(); im.decoding = 'async'; im.onload = () => { imgs[i] = im; prete[i] = true; dernierDessin = -1; dessiner(); r(); }; im.onerror = r; im.src = `${base}-${taille}/${String(i).padStart(2, '0')}.webp`; });
    const chargerReste = () => { if (resteCharge) return; resteCharge = true; for (let i = 0; i < N; i++) if (!prete[i]) charger(i); };
    // huit vues tout de suite (une sur six), les autres une fois la page chargée ; en économie de données, au premier geste
    (async () => { for (let i = 0; i < N; i += 6) await charger(i); if (!eco) { if (document.readyState === 'complete') chargerReste(); else addEventListener('load', () => setTimeout(chargerReste, 300)); } })();

    function installer() {
      sceneOn = !reduit && innerHeight >= 600;
      racine.classList.toggle('scene-on', sceneOn);
      if (sceneOn) {
        if (boite.parentElement !== sceneEl) sceneEl.appendChild(boite);
        const c = colle.getBoundingClientRect(), n = niche.getBoundingClientRect();
        home = { x: n.left - c.left, y: n.top - c.top, w: n.width, h: n.height };
        boite.style.width = home.w + 'px'; boite.style.height = home.h + 'px';
        rayonTuile = parseFloat(getComputedStyle($('.tuile-photo', place) || place.firstElementChild).borderTopLeftRadius) || 18;
        rayonBas = innerWidth < 768 ? 28 : 36;
        boite.classList.add('pret');
        indice.textContent = 'Défilez, je tourne';
      } else {
        if (boite.parentElement !== niche) niche.appendChild(boite);
        boite.removeAttribute('style'); boite.classList.remove('pret', 'range'); place.classList.remove('visible'); blocsTete.forEach((b) => { b.style.opacity = ''; });
        racine.classList.remove('recit-actif');
        indice.textContent = 'Glissez, je tourne';
      }
    }
    installer();
    addEventListener('resize', installer);
    addEventListener('load', installer);
    if (document.fonts) document.fonts.ready.then(installer);

    /* Le récit du tour : une phrase par tiers de tour, tirée de la fiche du gâteau et de la carte ; les trois traits se remplissent */
    const recit = $('#recit'), recitTexte = $('#recitTexte'), traits = recit ? $$('.recit-barre i', recit) : [];
    const RECIT = [
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16M6 14l6 6 6-6"/></svg>Défilez, je tourne`,
      'Layer cake, géodes roses et prénom doré',
      '15, 20 ou 25 parts',
      'Votre prénom, écrit en lettres d’or',
    ];
    const BORNES = [0.04, 0.4, 0.75, 1];
    let etapeRecit = -1, opaRecit = '', remplis = '';
    const raconter = (q, e) => {
      if (!recit) return;
      const k = q < BORNES[0] ? 0 : q < BORNES[1] ? 1 : q < BORNES[2] ? 2 : 3;
      if (k !== etapeRecit) {
        etapeRecit = k; recitTexte.innerHTML = RECIT[k];
        recitTexte.classList.remove('change'); void recitTexte.offsetWidth; recitTexte.classList.add('change');
        racine.classList.toggle('recit-actif', k > 0);
      }
      const r = [0, 1, 2].map((i) => borne((q - BORNES[i]) / (BORNES[i + 1] - BORNES[i])).toFixed(3));
      if (r.join() !== remplis) { remplis = r.join(); traits.forEach((t, i) => t.style.setProperty('--r', r[i])); }
      const o = e > 0 ? String(1 - borne(e * 3)) : '';
      if (o !== opaRecit) { opaRecit = o; recit.style.opacity = o; }
    };
    // le clavier saute la scène : un focus dans la section Créations amène directement au mur rangé (jamais un filtre caché sous le gâteau)
    document.addEventListener('focusin', (ev) => {
      if (!sceneOn || !creations.contains(ev.target) || !ev.target.matches(':focus-visible')) return;
      requestAnimationFrame(() => { if (scrollY < finConnue - 1) scrollTo({ top: finConnue, behavior: 'instant' }); });
    });

    let finConnue = Infinity, fonduAccueil = '', decalAccueil = '';
    const accueilEl = $('.accueil'), texteAccueil = $$('.accueil-texte > *');
    function cadre() {
      let p = 0, e = 0;
      if (sceneOn && scrollY > finConnue + innerHeight) {
        // loin sous la scène : le gâteau est rangé, rien à recalculer
        p = 1; e = 1;
        if (!vus.couvert) { vus.couvert = true; majBarre(); }
        if (!boite.classList.contains('range')) { boite.classList.add('range'); place.classList.add('visible'); blocsTete.forEach((b) => { b.style.opacity = ''; }); }
      } else if (sceneOn) {
        const libre = !place.hidden; // un filtre peut cacher la case : le gâteau vise alors la première tuile visible et s'efface
        const caseCible = libre ? place : $('.tuile:not([hidden])', mur) || place;
        const cible = ($('.tuile-photo', caseCible) || caseCible).getBoundingClientRect();
        const haut = cible.top + scrollY;
        // le gâteau est rangé quand sa case arrive un peu sous le milieu de l'écran, et au plus tard là où mène le lien « Créations »
        const ancre = creations.getBoundingClientRect().top + scrollY - entete.offsetHeight - 8;
        const fin = Math.max(1, Math.min(haut + cible.height / 2 - innerHeight * 0.55, ancre));
        const debut = Math.min(haut - innerHeight, fin - innerHeight * 0.3); // défilement auquel le gâteau quitte l'accueil
        finConnue = fin;
        // le tour se fait avant que la galerie ne monte : il se termine de face au moment où le rideau entre à l'écran
        const finTour = Math.max(1, Math.min(creations.getBoundingClientRect().top + scrollY - innerHeight, debut));
        p = borne(scrollY / finTour);
        const brut = (scrollY - debut) / (fin - debut);
        e = lisse(brut);
        // la taille arrive avant la position : le gâteau est déjà petit quand il passe devant le titre de la section
        const s = lerp(1, cible.width / home.w, lisse(brut * 1.6));
        // le texte de l'accueil défile normalement ; le gâteau, lui, reste à l'écran et glisse vers le milieu pendant qu'il tourne
        const d = String(Math.round(scrollY));
        if (d !== decalAccueil) { decalAccueil = d; accueilEl.style.setProperty('--decal', d); }
        const haut0 = entete.offsetHeight, milieu = haut0 + (innerHeight - haut0 - home.h) / 2 - 24;
        const y0 = lerp(home.y, Math.max(haut0 + 12, milieu), lisse(scrollY / (innerHeight * 0.5)));
        if (recit) recit.style.translate = `0 ${Math.round(y0 - home.y)}px`;
        const x = lerp(home.x, cible.left, e), y = lerp(y0, cible.top, e), w = home.w * s, h = home.h * s;
        boite.style.transform = `translate(${x}px,${y}px) scale(${s})`;
        const es = lisse(brut * 1.6);
        const rh = lerp(home.w / 2, rayonTuile / s, es), rb = lerp(rayonBas, rayonTuile / s, es);
        boite.style.borderRadius = `${rh}px ${rh}px ${rb}px ${rb}px`;
        boite.style.opacity = libre ? '' : String(1 - borne((e - 0.7) / 0.3));
        const range = scrollY >= fin - 1;
        // le titre et les filtres de la section ne s'effacent que là où le gâteau passe réellement devant eux
        blocsTete.forEach((b) => {
          const r = b.getBoundingClientRect();
          const dx = Math.min(x + w, r.right) - Math.max(x, r.left), dy = Math.min(y + h, r.bottom) - Math.max(y, r.top);
          b.style.opacity = range || dx <= 0 || dy <= 0 || b.contains(document.activeElement) ? '' : String(1 - borne(dy / 40));
        });
        boite.classList.toggle('range', range);
        place.classList.toggle('visible', range);
        if (p > 0.02) boite.classList.add('touche');
        raconter(p, e);
        // le texte de l'accueil s'efface pendant que la section Créations monte : jamais un titre coupé à moitié derrière elle
        const rideau = creations.getBoundingClientRect().top;
        // fondu calé sur le bas du texte encore visible (la ligne des prix, sauf quand le récit l'a remplacée) : fini avant que le panneau ne le touche
        const bas = Math.max(...texteAccueil.filter((el) => !(el.matches('.tarifs-ligne') && racine.classList.contains('recit-actif') && getComputedStyle(el).opacity === '0')).map((el) => el.getBoundingClientRect().bottom));
        const f = borne((rideau - bas - 12) / (innerHeight * 0.25));
        const fs = f > 0.995 ? '' : f.toFixed(3);
        if (fs !== fonduAccueil) { fonduAccueil = fs; accueilEl.style.setProperty('--fondu', fs || 1); }
        const couvert = f < 0.5;
        if (couvert !== vus.couvert) { vus.couvert = couvert; majBarre(); }
      }
      // un tour exact sur le trajet ; ce que la main a ajouté s'efface à l'approche du mur pour que le gâteau arrive de face
      const cibleAngle = sceneOn ? main * (1 - e) + N * p : main;
      angle += (cibleAngle - angle) * 0.2; if (Math.abs(cibleAngle - angle) < 0.01) angle = cibleAngle;
      dessiner();
      requestAnimationFrame(cadre);
    }
    // la souris ou le doigt (glisser horizontal, le défilement vertical reste libre) et les flèches du clavier
    const pas = () => boite.clientWidth / N * 1.6;
    const toucher = () => { boite.classList.add('touche'); chargerReste(); };
    boite.addEventListener('pointerdown', (ev) => { glisse = { x: ev.clientX, m: main }; toucher(); boite.setPointerCapture(ev.pointerId); });
    boite.addEventListener('pointermove', (ev) => { if (glisse) main = glisse.m - (ev.clientX - glisse.x) / pas(); });
    const lacher = () => { glisse = null; };
    boite.addEventListener('pointerup', lacher); boite.addEventListener('pointercancel', lacher);
    boite.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowLeft') { main -= 2; toucher(); } if (ev.key === 'ArrowRight') { main += 2; toucher(); } });
    requestAnimationFrame(cadre);
  })();

  /* ---------- La demande ---------- */
  const demande = { occasion: '', gateau: '', parts: '', partsPlus: 0, partsNumber: '', chiffre: '', invites: 0, saveur: '', texte: '', couleurs: '', idees: '', sables: 0, cupcakes: 0, popcakes: 0, date: '', ville: '', nom: '', tel: '', allergies: '', mot: '', modele: '', modeleImg: '', modeleFete: '' };
  const DEFAUTS = JSON.parse(JSON.stringify(demande));
  const NOMS = ['Fête', 'Gâteau', 'Saveur', 'Décor', 'Date', 'Coordonnées'];
  const DOUCEURS = [['sables', 'Sablés', 'Un sablé', 'sablé'], ['cupcakes', 'Cupcakes', 'Un cupcake', 'cupcake'], ['popcakes', 'Popcakes', 'Un popcake', 'popcake']];
  const nbDouceurs = () => demande.sables + demande.cupcakes + demande.popcakes;
  const formulaire = $('#formulaire'), zone = $('#etapes'), progression = $('#progression'), navEtapes = $('#navEtapes');
  const btnRetour = $('#retour'), btnSuivant = $('#suivant');
  let etape = 0, refFinale = '';

  /* ---------- Aller au formulaire : la première question, pas l'introduction ---------- */
  const focusTitre = () => { const t = zone.querySelector('h3'); if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); } };
  const versFormulaire = () => { defiler(formulaire); focusTitre(); };
  $$('a[href="#formulaire"]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); versFormulaire(); }));

  /* ---------- Le mur : filtres et fiche d'un gâteau ---------- */
  const FETE_TUILE = { anniversaire: 'Anniversaire', mariage: 'Mariage', baby: 'Baby shower' };
  const FETE_DEMANDE = { anniversaire: 'Anniversaire', mariage: 'Mariage', baby: 'Baby shower ou gender reveal' };
  const PRIX_TYPE = { layer: 'à partir de 75 €', number: 'à partir de 30 €', wedding: 'sur devis, à partir de 5 € la part' };
  /* Un filtre : le chapô compte les gâteaux montrés, et une case dit ce que je fais pour cette fête, avec un bouton qui ouvre
     le formulaire la fête déjà choisie (utile surtout pour le baby shower, qui n'a encore qu'une photo) */
  const chapoCreations = $('#chapoCreations'), chapoTous = chapoCreations.textContent;
  const NOMBRES = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-sept', 'Dix-huit', 'Dix-neuf', 'Vingt'];
  const SUITE = ' Choisissez celui qui vous plaît : je l’adapte à votre fête.';
  const CHAPO = {
    anniversaire: (n) => `${NOMBRES[n] || n} gâteaux d’anniversaire que j’ai faits.${SUITE}`,
    mariage: (n) => `${NOMBRES[n] || n} wedding cakes que j’ai faits.${SUITE}`,
    baby: (n) => n === 1 ? 'Un gâteau de baby shower que j’ai fait : je l’adapte à votre fête.' : `${NOMBRES[n] || n} gâteaux de baby shower que j’ai faits.${SUITE}`,
  };
  const NOTE = {
    anniversaire: 'Pour un anniversaire, je fais un layer cake ou un number cake.',
    mariage: 'Pour un mariage, je fais un wedding cake, sur devis.',
    baby: 'Pour un baby shower ou un gender reveal, je fais un layer cake.',
  };
  const murNote = $('#murNote');
  let filtreActif = 'tous';
  $$('.filtre').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.f; filtreActif = f;
    $$('.filtre').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.tuile', mur).forEach(t => { t.hidden = !(f === 'tous' || t.dataset.f === f); });
    const n = $$('.tuile:not([hidden])', mur).length;
    chapoCreations.textContent = CHAPO[f] ? CHAPO[f](n) : chapoTous;
    murNote.hidden = !NOTE[f];
    if (NOTE[f]) $('#murNoteTexte').textContent = NOTE[f];
  }));
  $('#murNoteBtn').addEventListener('click', () => {
    demande.occasion = FETE_DEMANDE[filtreActif]; refFinale = '';
    allerA(1); versFormulaire();
  });
  const fiche = $('#fiche');
  let tuileOuverte = null;
  mur.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-type]'); if (!b) return;
    tuileOuverte = b;
    const photo = b.querySelector('img');
    $('#ficheImg').src = b.dataset.grand;
    $('#ficheImg').alt = (photo && photo.alt) || b.dataset.titre;
    $('#ficheTitre').textContent = b.dataset.titre;
    $('#ficheDetail').textContent = `${FETE_TUILE[b.closest('.tuile').dataset.f]}, ${PRIX_TYPE[b.dataset.type]}`;
    fiche.showModal();
  });
  $('#ficheFermer').addEventListener('click', () => fiche.close());
  fiche.addEventListener('click', (e) => { if (e.target === fiche) fiche.close(); }); // clic sur le voile
  $('#ficheChoisir').addEventListener('click', () => {
    const b = tuileOuverte; fiche.close(); if (!b) return;
    demande.occasion = FETE_DEMANDE[b.closest('.tuile').dataset.f];
    demande.gateau = b.dataset.type;
    if (b.dataset.chiffre) demande.chiffre = b.dataset.chiffre;
    demande.modele = b.dataset.titre; demande.modeleImg = b.dataset.vignette; demande.modeleFete = demande.occasion;
    refFinale = '';
    allerA(1); versFormulaire();
  });

  /* ---------- Ma carte : onglets par gâteau et saveurs à cliquer ---------- */
  const ongletsClavier = (liste, activer) => liste.forEach((b, i) => b.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!k) return;
    e.preventDefault(); const n = liste[(i + k + liste.length) % liste.length]; activer(n); n.focus();
  }));
  const onglets = $$('.carte-onglets [role="tab"]'), cartePhoto = $('#cartePhoto');
  const choisirOnglet = (o) => {
    onglets.forEach((x) => { const oui = x === o; x.setAttribute('aria-selected', oui); x.tabIndex = oui ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !oui; });
    if (cartePhoto && !cartePhoto.src.includes(o.dataset.photo)) {
      cartePhoto.classList.add('change');
      setTimeout(() => {
        cartePhoto.srcset = `${o.dataset.photo}-480.webp 480w, ${o.dataset.photo}-${o.dataset.grand}.webp ${o.dataset.grand}w`;
        cartePhoto.src = `${o.dataset.photo}-480.webp`; cartePhoto.alt = o.dataset.alt;
        cartePhoto.onload = () => cartePhoto.classList.remove('change');
      }, reduit ? 0 : 180);
    }
  };
  onglets.forEach((o) => o.addEventListener('click', () => choisirOnglet(o)));
  ongletsClavier(onglets, choisirOnglet);
  $$('[data-composer]').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.composer;
    demande.gateau = t; demande.occasion = t === 'number' ? 'Anniversaire' : t === 'wedding' ? 'Mariage' : demande.occasion;
    refFinale = ''; allerA(demande.occasion ? 1 : 0); versFormulaire();
  }));
  const saveursBtns = $$('.saveurs-liste [role="tab"]');
  const choisirSaveur = (b) => {
    saveursBtns.forEach((x) => { const oui = x === b; x.setAttribute('aria-selected', oui); x.tabIndex = oui ? 0 : -1; });
    $('#saveurDetail').setAttribute('aria-labelledby', b.id);
    const img = $('#saveurImg'); img.src = `${b.dataset.img}-480.webp`; img.alt = b.dataset.alt;
    $('#saveurNom').textContent = b.textContent.trim(); $('#saveurDesc').textContent = b.dataset.desc;
  };
  saveursBtns.forEach((b) => b.addEventListener('click', () => choisirSaveur(b)));
  ongletsClavier(saveursBtns, choisirSaveur);

  /* ---------- Les écrans du formulaire ---------- */
  const option = (name, val, o) => {
    const coche = String(val) === String(o.v);
    return `<label class="option${o.cls ? ' ' + o.cls : ''}${coche ? ' choisi' : ''}">${o.img ? `<img src="${o.img}" alt="" width="${o.iw || 56}" height="${o.ih || 56}" loading="lazy">` : ''}<input type="radio" name="${name}" value="${esc(o.v)}"${coche ? ' checked' : ''}><span class="option-texte">${o.l}${o.s ? `<small>${o.s}</small>` : ''}</span>${o.d ? `<span class="option-droite">${o.d}</span>` : ''}</label>`;
  };
  const groupe = (name, items, val, cls = '', titre = 'q-etape') => `<div class="options${cls ? ' ' + cls : ''}" role="radiogroup" aria-labelledby="${titre}" data-groupe="${name}">${items.map(o => option(name, val, o)).join('')}</div>`;
  const compteur = (k, un, val, max = 400) => `<div class="qte"><button type="button" data-qte="${k}" data-pas="-1" aria-label="${un} de moins">${moins}</button><input id="f-${k}" name="${k}" type="number" inputmode="numeric" min="0" max="${max}" step="1" value="${val}"><button type="button" data-qte="${k}" data-pas="1" aria-label="${un} de plus">${plus}</button></div>`;
  const aujourdhui = new Date(); aujourdhui.setMinutes(aujourdhui.getMinutes() - aujourdhui.getTimezoneOffset());
  const MIN_DATE = aujourdhui.toISOString().slice(0, 10);
  const noteMariage = () => demande.invites ? `<b>${pluriel(demande.invites, 'invité', 'invités')}, ${pluriel(demande.invites, 'part', 'parts')}.</b> Je vous propose la pièce et le prix exact dans ma réponse.` : 'Une part par invité, à partir de 5 € la part.';

  function tailles() {
    const g = demande.gateau;
    if (g === 'layer') return `<fieldset class="champ groupe"><legend class="legende" id="q-parts">Combien de parts ?</legend>
      ${groupe('parts', [15, 20, 25].map(t => ({ v: t, l: `${t} parts`, d: euros(LAYER[t]) })).concat([{ v: 'plus', l: 'Plus de 25 parts', s: 'Prix dans ma réponse' }]), demande.parts, '', 'q-parts')}
      <small class="erreur" id="e-parts" role="alert" hidden>Choisissez le nombre de parts.</small></fieldset>
      <div class="champ" id="champPlus"${demande.parts === 'plus' ? '' : ' hidden'}><label for="f-partsPlus">Combien de parts vous faut-il ?</label>${compteur('partsPlus', 'Une part', demande.partsPlus || '')}<small>Ma carte s’arrête à 25 parts : je vous dis ce qui est possible dans ma réponse.</small><small class="erreur" id="e-plus" role="alert" hidden>Indiquez le nombre de parts, à partir de 26.</small></div>`;
    if (g === 'number') return `<fieldset class="champ groupe"><legend class="legende" id="q-parts">Combien de parts ?</legend>
      ${groupe('partsNumber', Object.keys(NUMBER).map(t => ({ v: t, l: `${t} parts`, d: euros(NUMBER[t]) })), demande.partsNumber, '', 'q-parts')}
      <small class="erreur" id="e-parts" role="alert" hidden>Choisissez le nombre de parts.</small></fieldset>
      <div class="champ court"><label for="f-chiffre">Quel chiffre ou quel nombre ?</label><input id="f-chiffre" name="chiffre" inputmode="numeric" maxlength="2" value="${esc(demande.chiffre)}" placeholder="6" aria-describedby="e-chiffre"><small class="erreur" id="e-chiffre" role="alert" hidden>Indiquez le chiffre du gâteau, de 1 à 99.</small></div>`;
    if (g === 'wedding') return `<div class="champ"><label for="f-invites">Combien d’invités ?</label>${compteur('invites', 'Un invité', demande.invites || '', 1000)}<small class="erreur" id="e-invites" role="alert" hidden>Indiquez le nombre d’invités.</small></div>
      <p class="note-taille" id="noteMariage" aria-live="polite">${noteMariage()}</p>`;
    return '';
  }
  /* Le texte écrit sur le gâteau : libellé, exemple et aperçu selon le gâteau */
  const decorPour = () => demande.gateau === 'wedding'
    ? { aide: 'Les prénoms ou les initiales s’écrivent en lettres dorées. Vous pourrez m’envoyer une photo modèle sur Instagram.', label: 'Prénoms, initiales ou texte sur le gâteau', exemple: 'Vos prénoms, vos initiales, la date', vide: 'Vos prénoms' }
    : demande.gateau === 'number'
      ? { aide: 'Vous pourrez m’envoyer une photo modèle sur Instagram.', label: 'Prénom ou texte à écrire', exemple: 'Le prénom de la personne fêtée', vide: 'Votre prénom' }
      : { aide: 'Le prénom s’écrit en lettres dorées. Vous pourrez m’envoyer une photo modèle sur Instagram.', label: 'Prénom ou texte sur le gâteau', exemple: 'Le prénom de la personne fêtée', vide: 'Votre prénom' };
  function couleursEtIdees() {
    return `<fieldset class="champ groupe"><legend class="legende">Couleurs</legend><div class="pastilles">
      ${[['Blanc et or', '#FFFFFF', '#B08532'], ['Rose poudré', '#F3CBD1'], ['Rouge et rose', '#C8435F'], ['Pastel', '#CFE6D8'], ['Couleurs vives', '#F2A33A'], ['Conseillez-moi', '#E8DDD0']].map(([l, a, b]) => `<label${demande.couleurs === l ? ' class="choisi"' : ''}><input type="radio" name="couleurs" value="${l}"${demande.couleurs === l ? ' checked' : ''}><i style="background:${b ? `linear-gradient(90deg,${a} 50%,${b} 50%)` : a}"></i>${l}</label>`).join('')}
      </div></fieldset>
      <div class="champ"><label for="f-idees">Vos idées de décor</label><textarea id="f-idees" name="idees" rows="3" placeholder="Fleurs fraîches, thème, couleur précise, personnage…">${esc(demande.idees)}</textarea></div>`;
  }
  const VUES = [
    () => `<div class="etape"><h3 id="q-etape">Que fêtez-vous ?</h3>${groupe('occasion', FETES.map(f => ({ v: f, l: f })), demande.occasion, 'deux')}</div>`,
    () => {
      const g = gateauxPour(demande.occasion);
      if (g.length > 1) return `<div class="etape"><h3 id="q-etape">Quel gâteau ?</h3><p class="aide">Pour un anniversaire, je fais l’un ou l’autre.</p>
        ${groupe('gateau', [
          { v: 'layer', cls: 'type', l: 'Layer cake', s: '15, 20 ou 25 parts, à partir de 75 €', img: 'img/hero/anniv-oceane-450.webp', iw: 450, ih: 562 },
          { v: 'number', cls: 'type', l: 'Number cake', s: '6 ou 8 à 10 parts, à partir de 30 €', img: 'img/hero/number-18-450.webp', iw: 450, ih: 562 },
        ], demande.gateau, 'types')}<div id="tailles">${tailles()}</div></div>`;
      if (g[0] === 'wedding') return `<div class="etape"><h3 id="q-etape">Votre wedding cake</h3><p class="aide">Pour un mariage, je fais un wedding cake, sur devis.</p><div id="tailles">${tailles()}</div></div>`;
      return `<div class="etape"><h3 id="q-etape">Votre layer cake</h3><p class="aide">Pour cette fête, je fais un layer cake. Choisissez sa taille.</p><div id="tailles">${tailles()}</div></div>`;
    },
    () => `<div class="etape"><h3 id="q-etape">Quelle saveur ?</h3>${demande.gateau === 'number' ? '<p class="aide">Je vous confirme la garniture dans ma réponse.</p>' : ''}${groupe('saveur', saveursPour(demande.gateau).map(s => ({ v: s.nom, l: s.nom, s: s.desc, img: s.img })), demande.saveur)}</div>`,
    () => { const d = decorPour(); return `<div class="etape"><h3 id="q-etape">Quel décor ?</h3><p class="aide">${d.aide}</p>
      <div class="champ"><label for="f-texte">${d.label}</label><input id="f-texte" name="texte" maxlength="40" value="${esc(demande.texte)}" placeholder="${d.exemple}"><p class="apercu-decor" id="apercuDecor" aria-hidden="true">${esc(demande.texte) || d.vide}</p></div>
      ${couleursEtIdees()}
      <fieldset class="champ groupe"><legend class="legende">Douceurs en plus, 3 € pièce</legend><div class="douceurs">${DOUCEURS.map(([k, l, un]) => `<div class="douceur"><label for="f-${k}">${l}</label>${compteur(k, un, demande[k], 200)}</div>`).join('')}</div></fieldset></div>`; },
    () => `<div class="etape"><h3 id="q-etape">Pour quand et où ?</h3><p class="aide">Indiquez la date de la fête : je vous dis si elle est possible.</p>
      <div class="champ"><label for="f-date">Date de la fête</label><input id="f-date" name="date" type="date" aria-describedby="e-date" min="${MIN_DATE}" value="${demande.date}" required><small class="erreur" id="e-date" role="alert" hidden></small></div>
      <div class="champ"><label for="f-ville">Ville de la fête</label><input id="f-ville" name="ville" value="${esc(demande.ville)}" autocomplete="address-level2" aria-describedby="a-ville"><small id="a-ville">Retrait ou livraison : je vous dis ce qui est possible dans ma réponse.</small></div></div>`,
    () => `<div class="etape"><h3 id="q-etape">Vos coordonnées</h3><p class="aide">Pour que je sache à qui je réponds.</p>
      <div class="champ"><label for="f-nom">Votre prénom</label><input id="f-nom" name="nom" aria-describedby="e-nom" value="${esc(demande.nom)}" autocomplete="given-name" required><small class="erreur" id="e-nom" role="alert" hidden>Indiquez votre prénom.</small></div>
      <div class="champ"><label for="f-tel">Votre téléphone (facultatif)</label><input id="f-tel" name="tel" type="tel" value="${esc(demande.tel)}" autocomplete="tel"></div>
      <div class="champ"><label for="f-allergies">Allergies ou régime (facultatif)</label><input id="f-allergies" name="allergies" value="${esc(demande.allergies)}" placeholder="Par exemple : fruits à coque, sans alcool"></div>
      <div class="champ"><label for="f-mot">Un mot pour moi (facultatif)</label><textarea id="f-mot" name="mot" rows="3">${esc(demande.mot)}</textarea></div>
      <p class="rgpd">Ces informations restent sur votre appareil le temps de votre visite : rien n’est enregistré ni envoyé par ce site. Elles servent seulement à préparer le message que vous m’enverrez sur Instagram.</p></div>`,
  ];

  /* Ce que la fête autorise : le gâteau, puis la saveur ; un modèle choisi dans le mur disparaît si la fête change */
  function accorder() {
    const g = gateauxPour(demande.occasion);
    if (!g.includes(demande.gateau)) demande.gateau = g.length === 1 ? g[0] : '';
    if (demande.saveur && !saveursPour(demande.gateau).some(s => s.nom === demande.saveur)) demande.saveur = '';
    if (demande.modele && demande.modeleFete !== demande.occasion) { demande.modele = ''; demande.modeleImg = ''; demande.modeleFete = ''; }
  }
  function allerA(i) {
    etape = Math.max(0, Math.min(i, 6));
    if (etape >= 1) accorder();
    if (etape === 6) return finir();
    navEtapes.hidden = false;
    progression.innerHTML = NOMS.map((n, j) => `<li ${j === etape ? 'aria-current="step"' : ''} class="${j < etape ? 'fait' : ''}"><span>${j + 1}. ${n}</span></li>`).join('');
    zone.innerHTML = VUES[etape]();
    btnRetour.style.visibility = etape === 0 ? 'hidden' : 'visible';
    btnSuivant.innerHTML = etape === 5 ? 'Terminer ' + fleche : 'Continuer ' + fleche;
    ajuster($('#apercuDecor'));
    majRecap();
    surveillerQuestion();
  }
  /* Sur téléphone, la barre « Continuer » ne se colle en bas qu'une fois la question montée à l'écran, pour ne jamais la couvrir */
  const obsQuestion = new IntersectionObserver(([e]) => navEtapes.classList.toggle('libre', !e.isIntersecting && e.boundingClientRect.top > 0), { rootMargin: '0px 0px -170px 0px', threshold: 0 });
  function surveillerQuestion() { obsQuestion.disconnect(); const q = $('#q-etape'); if (q) obsQuestion.observe(q); else navEtapes.classList.remove('libre'); }

  /* ---------- Erreurs : affichées au clic sur Continuer, retirées dès que la saisie est corrigée ---------- */
  const montrerErreur = (id, champ, texte) => {
    const e = $('#' + id); if (texte) e.textContent = texte; e.hidden = false;
    if (champ) { if (champ.type !== 'radio') champ.setAttribute('aria-invalid', 'true'); champ.focus({ preventScroll: true }); }
    defiler(e, 'center');
    return false;
  };
  const cacherErreur = (id, champ) => { const e = $('#' + id); if (e) e.hidden = true; if (champ) champ.removeAttribute('aria-invalid'); };
  function choixManquant(nom) {
    const g = zone.querySelector(`[data-groupe="${nom}"]`);
    if (!$('#e-choix')) g.insertAdjacentHTML('afterend', '<small class="erreur" id="e-choix" role="alert">Faites un choix pour continuer.</small>');
    g.setAttribute('aria-describedby', 'e-choix');
    const p = g.querySelector('input'); if (p) p.focus({ preventScroll: true });
    defiler($('#e-choix'), 'center');
    return false;
  }
  const CHIFFRE = /^[1-9]\d?$/; // number cake : de 1 à 99
  const dateValide = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + 'T12:00')) && v >= MIN_DATE;
  const valider = () => {
    if (etape === 0 && !demande.occasion) return choixManquant('occasion');
    if (etape === 1) {
      const g = demande.gateau;
      if (!g) return choixManquant('gateau');
      if (g === 'layer') {
        if (!demande.parts) return montrerErreur('e-parts', zone.querySelector('input[name="parts"]'));
        if (demande.parts === 'plus' && !(demande.partsPlus > 25)) return montrerErreur('e-plus', $('#f-partsPlus'));
      }
      if (g === 'number') {
        if (!demande.partsNumber) return montrerErreur('e-parts', zone.querySelector('input[name="partsNumber"]'));
        if (!CHIFFRE.test(demande.chiffre)) return montrerErreur('e-chiffre', $('#f-chiffre'));
      }
      if (g === 'wedding' && !(demande.invites >= 1)) return montrerErreur('e-invites', $('#f-invites'));
    }
    if (etape === 2 && !demande.saveur) return choixManquant('saveur');
    if (etape === 4) {
      if (!demande.date) return montrerErreur('e-date', $('#f-date'), 'Choisissez la date de la fête.');
      if (!dateValide(demande.date)) return montrerErreur('e-date', $('#f-date'), 'Choisissez une date à venir, au format jour, mois, année.');
    }
    if (etape === 5 && !demande.nom.trim()) return montrerErreur('e-nom', $('#f-nom'));
    return true;
  };

  /* ---------- Saisie ---------- */
  const lireNombre = (v, max = 400) => Math.min(max, Math.max(0, Math.floor(+v) || 0));
  formulaire.addEventListener('input', (e) => {
    const t = e.target; if (!t.name) return;
    if (t.name === 'chiffre') t.value = t.value.replace(/\D/g, '');
    demande[t.name] = t.type === 'number' ? lireNombre(t.value, +t.max || 400) : t.value;
    repriseEnAttente = false;
    if (t.type === 'radio') {
      $$(`input[name="${t.name}"]`, formulaire).forEach(i => i.parentElement.classList.toggle('choisi', i.checked));
      const g = t.closest('.options'); if (g && g.getAttribute('aria-describedby') === 'e-choix') { $('#e-choix')?.remove(); g.removeAttribute('aria-describedby'); }
    }
    if (t.name === 'occasion') accorder();
    if (t.name === 'gateau') { accorder(); $('#tailles').innerHTML = tailles(); }
    if (t.name === 'parts') { $('#champPlus').hidden = t.value !== 'plus'; cacherErreur('e-parts'); }
    if (t.name === 'partsNumber') cacherErreur('e-parts');
    if (t.name === 'partsPlus' && demande.partsPlus > 25) cacherErreur('e-plus', t);
    if (t.name === 'chiffre' && CHIFFRE.test(t.value)) cacherErreur('e-chiffre', t);
    if (t.name === 'invites') { if (demande.invites >= 1) cacherErreur('e-invites', t); $('#noteMariage').innerHTML = noteMariage(); }
    if (t.name === 'texte') { const ad = $('#apercuDecor'); ad.textContent = t.value.trim() || decorPour().vide; ajuster(ad); }
    if (t.name === 'date' && dateValide(t.value)) cacherErreur('e-date', t);
    if (t.name === 'nom' && t.value.trim()) cacherErreur('e-nom', t);
    majRecap();
  });
  /* Quantités : la valeur nettoyée est réécrite (pas de 2,5 cupcakes) ; boutons − et + */
  const VIDE_SI_ZERO = ['invites', 'partsPlus'];
  formulaire.addEventListener('change', (e) => { const t = e.target; if (t.type === 'number') t.value = demande[t.name] || (VIDE_SI_ZERO.includes(t.name) ? '' : 0); });
  formulaire.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qte]'); if (!b) return;
    const champ = $('#f-' + b.dataset.qte), k = b.dataset.qte;
    let v = lireNombre(+champ.value + +b.dataset.pas, +champ.max || 400);
    if (k === 'partsPlus') v = Math.max(26, v);
    if (k === 'invites') v = Math.max(1, v);
    champ.value = v;
    champ.dispatchEvent(new Event('input', { bubbles: true }));
  });
  formulaire.addEventListener('submit', (e) => { e.preventDefault(); if (!navEtapes.hidden) btnSuivant.click(); });
  const montrerHaut = () => { const top = formulaire.getBoundingClientRect().top; if (top < 0 || top > innerHeight * 0.25) defiler(formulaire); };
  btnSuivant.addEventListener('click', () => { if (valider()) { allerA(etape + 1); if (etape < 6) focusTitre(); montrerHaut(); } });
  btnRetour.addEventListener('click', () => { allerA(etape - 1); focusTitre(); montrerHaut(); });
  $('#retirerModele').addEventListener('click', () => { demande.modele = ''; demande.modeleImg = ''; demande.modeleFete = ''; majRecap(); focusTitre(); });

  /* ---------- Prix : toujours ceux de la carte, « à partir de » ---------- */
  function prix() {
    const g = demande.gateau;
    let base = 0, surDevis = false, note = 'Je vous confirme le prix final selon le décor.';
    if (g === 'layer') { if (demande.parts === 'plus') { surDevis = true; note = 'Plus de 25 parts : je vous confirme le prix dans ma réponse.'; } else base = LAYER[demande.parts] || 0; }
    if (g === 'number') base = NUMBER[demande.partsNumber] || 0;
    if (g === 'wedding') { base = PART_MARIAGE * (demande.invites || 0); note = 'Wedding cake sur devis : je vous propose la pièce et le prix exact.'; }
    const d = nbDouceurs() * DOUCEUR;
    return { base, d, total: base + d, surDevis, note };
  }
  /* Texte du prix, partagé par le récapitulatif, la barre du formulaire (téléphone) et le message */
  function textePrix() {
    const p = prix();
    if (!demande.gateau) return { court: '', grand: '', note: 'Choisissez un gâteau pour voir le prix de départ.' };
    if (p.surDevis) return { court: 'Prix confirmé dans ma réponse', grand: 'Prix dans ma réponse', note: p.note + (p.d ? ` Douceurs : ${euros(p.d)}.` : '') };
    if (!p.base) return { court: '', grand: '', note: demande.gateau === 'wedding' ? 'Indiquez le nombre d’invités pour voir le prix de départ.' : 'Choisissez le nombre de parts pour voir le prix de départ.' };
    return { court: `À partir de ${euros(p.total)}`, grand: euros(p.total), apartir: true, note: p.note };
  }
  function descGateau() {
    const g = demande.gateau;
    if (g === 'layer') return demande.parts === 'plus' ? `Layer cake, ${demande.partsPlus > 25 ? demande.partsPlus : 'plus de 25'} parts` : demande.parts ? `Layer cake ${demande.parts} parts` : 'Layer cake';
    if (g === 'number') return `Number cake${demande.partsNumber ? ' ' + demande.partsNumber + ' parts' : ''}${demande.chiffre ? ', chiffre ' + demande.chiffre : ''}`;
    if (g === 'wedding') return demande.invites ? `Wedding cake, ${pluriel(demande.invites, 'part', 'parts')}` : 'Wedding cake';
    return '';
  }
  const listeDouceurs = () => DOUCEURS.filter(([k]) => demande[k] > 0).map(([k, , , mot]) => pluriel(demande[k], mot, mot + 's')).join(', ');
  const dateLongue = () => demande.date && dateValide(demande.date) ? new Date(demande.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  function majRecap() {
    const prenom = demande.texte.trim();
    const r = $('#rPrenom');
    r.textContent = prenom || 'Votre gâteau'; r.classList.toggle('vide', !prenom); ajuster(r);
    const lignes = [['Modèle', demande.modele], ['Fête', demande.occasion], ['Gâteau', descGateau()], ['Saveur', demande.saveur], ['Couleurs', demande.couleurs], ['Douceurs', listeDouceurs()], ['Date', dateLongue()], ['Lieu de la fête', demande.ville]].filter(l => l[1]);
    $('#rListe').innerHTML = lignes.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join('');
    const t = textePrix();
    $('#rTotal').innerHTML = `${t.apartir ? '<small>à partir de</small>' : ''}${t.grand ? `<b>${t.grand}</b>` : ''}<small>${t.note}</small>`;
    const np = $('#navPrix'), ancien = np.textContent;
    np.textContent = t.court;
    if (t.court !== ancien) { np.classList.remove('maj'); void np.offsetWidth; np.classList.add('maj'); const gb = $('#rTotal b'); if (gb) gb.classList.add('maj'); }
    $('#modeleChoisi').hidden = !demande.modele; $('#modeleNom').textContent = demande.modele;
    const src = demande.modeleImg;
    $('#modeleVignette').innerHTML = src ? `<img src="${src}" alt="" width="56" height="56">` : '';
    const rm = $('#rModele'); rm.hidden = !src; rm.innerHTML = src ? `<img src="${src}" alt="${esc(demande.modele)}" width="450" height="562" loading="lazy">` : '';
    sauver();
  }

  /* ---------- Fin : le message prêt à coller dans Instagram ---------- */
  function message(ref) {
    const t = textePrix(), L = [];
    L.push('Bonjour,', `Voici ma demande ${ref} :`, '');
    if (demande.modele) L.push(`Modèle vu sur le site : ${demande.modele}`);
    L.push(`Fête : ${demande.occasion}`, `Gâteau : ${descGateau()}`);
    if (demande.saveur) L.push(`Saveur : ${demande.saveur}`);
    if (demande.texte.trim()) L.push(`Prénom ou texte sur le gâteau : ${demande.texte.trim()}`);
    if (demande.couleurs) L.push(`Couleurs : ${demande.couleurs}`);
    if (demande.idees.trim()) L.push(`Idées de décor : ${demande.idees.trim()}`);
    if (listeDouceurs()) L.push(`Douceurs : ${listeDouceurs()}`);
    L.push(`Date de la fête : ${dateLongue()}`);
    if (demande.ville.trim()) L.push(`Lieu de la fête : ${demande.ville.trim()}`);
    if (demande.allergies.trim()) L.push(`Allergies ou régime : ${demande.allergies.trim()}`);
    if (t.apartir) L.push(`Prix de départ indiqué sur le site : à partir de ${t.grand}`);
    else if (t.grand) L.push(`Prix : ${t.note}`);
    L.push('', `De la part de : ${demande.nom.trim()}${demande.tel.trim() ? ' · Téléphone : ' + demande.tel.trim() : ''}`);
    if (demande.mot.trim()) L.push(`Message : ${demande.mot.trim()}`);
    L.push('', 'Merci !');
    return L.join('\n');
  }
  async function copier(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} a.remove(); return ok; }
  }
  async function finir(refExistante) {
    if (!demande.occasion) return allerA(0);
    if (!demande.gateau) return allerA(1);
    const ref = refExistante || 'LK-' + Date.now().toString(36).slice(-5).toUpperCase();
    refFinale = ref; sauver();
    const m = message(ref), ok = await copier(m);
    progression.innerHTML = NOMS.map((n, j) => `<li class="fait"><span>${j + 1}. ${n}</span></li>`).join('');
    navEtapes.hidden = true;
    const prenom = demande.texte.trim();
    zone.innerHTML = `<div class="etape fin">${prenom ? `<p class="prenom-fin" aria-hidden="true">${esc(prenom)}</p>` : ''}<h3 tabindex="-1" id="finTitre">Votre demande est prête.</h3>
      <p class="aide">${ok ? 'Le message est copié. Ouvrez Instagram, collez-le dans votre message pour moi et envoyez.' : 'Copiez le message ci-dessous, ouvrez Instagram, collez-le dans votre message pour moi et envoyez.'} Pensez à joindre votre photo modèle si vous en avez une.</p>
      <div class="actions"><a class="btn" href="https://ig.me/m/cakeby_lk" target="_blank" rel="noopener">Ouvrir Instagram ${fleche}<span class="vh"> (nouvel onglet)</span></a><button class="btn btn-clair" type="button" id="recopier">${ok ? 'Copier à nouveau' : 'Copier le message'}</button><button class="btn btn-clair" type="button" id="modifier">Modifier</button></div>
      <p class="vh" role="status" id="copieStatut"></p>
      <p class="numero">Référence de la demande : ${ref}</p>
      <pre>${esc(m)}</pre></div>`;
    ajuster($('.prenom-fin'));
    $('#finTitre').focus({ preventScroll: true }); montrerHaut();
    $('#recopier').addEventListener('click', async (e) => {
      const b = e.currentTarget, r = await copier(m);
      b.textContent = r ? 'Copié' : 'Copie impossible : sélectionnez le texte';
      $('#copieStatut').textContent = r ? 'Message copié.' : 'Copie impossible : sélectionnez le texte du message.';
    });
    $('#modifier').addEventListener('click', () => { refFinale = ''; allerA(0); focusTitre(); });
  }

  /* ---------- Reprise : la demande reste sur l'appareil le temps de la visite ---------- */
  const CLE = 'cakebylk-demande-2';
  let repriseEnAttente = false;
  function sauver() { if (repriseEnAttente) return; try { sessionStorage.setItem(CLE, JSON.stringify({ demande, etape, ref: refFinale })); } catch {} }
  function reprendre() {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(CLE) || 'null'); } catch {}
    if (!s || !s.demande || !s.demande.occasion) return;
    Object.keys(DEFAUTS).forEach(k => { if (typeof s.demande[k] === typeof DEFAUTS[k]) demande[k] = s.demande[k]; });
    refFinale = s.ref || '';
    const r = $('#reprise'); r.hidden = false; repriseEnAttente = true;
    $('#repriseTexte').textContent = s.etape >= 6 ? 'Votre demande est prête, vous pouvez la retrouver.' : `Vous aviez commencé une demande (étape ${Math.min(s.etape, 5) + 1} sur 6).`;
    $('#reprendre').textContent = s.etape >= 6 ? 'Retrouver ma demande' : 'Reprendre';
    $('#reprendre').addEventListener('click', () => { r.hidden = true; repriseEnAttente = false; if (s.etape >= 6) { etape = 6; finir(refFinale); } else allerA(s.etape); versFormulaire(); });
    $('#recommencer').addEventListener('click', () => {
      r.hidden = true; repriseEnAttente = false; try { sessionStorage.removeItem(CLE); } catch {}
      Object.assign(demande, JSON.parse(JSON.stringify(DEFAUTS))); refFinale = '';
      allerA(0); focusTitre();
    });
  }
  reprendre();
  allerA(0);
  if (document.fonts) document.fonts.ready.then(ajusterTout);
})();
