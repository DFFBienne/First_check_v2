/* ============================================================================
 * profil.js — Page « Mon profil » et compte de signature
 * ----------------------------------------------------------------------------
 * Profil (enregistré sur l'appareil) :
 *   nom, prénom, e-mail, appareils de mesure (instrument + n° d'inventaire),
 *   signature tactile.
 *   → repris dans le protocole : « Nom et prénom », liste déroulante
 *     « Instrument » qui complète « N° inventaire », champ « Signature ».
 * Compte de signature (nécessaire uniquement pour signer électroniquement) :
 *   inscription avec mot de passe → code envoyé par e-mail au responsable ;
 *   connexion sur n'importe quel appareil avec nom + mot de passe.
 * À charger APRÈS signature-avancee-ui.js.
 * ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------- RÉGLAGES */
  const CONFIG = {
    responsableEmail: 'cedric.pedroza@sbb.ch',   // destinataire des inscriptions
    storageKey: 'sbb_profil_v2',
    defaultInstrument: 'Metrel',                 // valeur par défaut de index.html
  };

  const SA = window.SignatureAvancee;
  const wasNewProtocol = !localStorage.getItem(SKEY); // évalué avant loadData()

  /* ----------------------------------------------------------------- I18N */
  const TXT = {
    fr: {
      title: 'Mon profil', back: '‹ Retour', autosave: 'Enregistrement automatique sur cet appareil',
      account: 'Compte de signature', accountInfo: 'Le compte n’est nécessaire que pour signer électroniquement.',
      notConnected: 'Non connecté', login: 'Se connecter', logout: 'Se déconnecter', create: 'Créer mon compte',
      authorized: '✓ Autorisé à signer', pending: '⏳ Inscription en attente de validation', revoked: '⛔ Autorisation révoquée',
      resend: '✉️ Renvoyer l’e-mail d’inscription', copyCode: 'Copier le bloc d’inscription', copied: 'Bloc copié ✓',
      infos: 'Informations personnelles', nom: 'Nom', prenom: 'Prénom', email: 'E-mail',
      devices: 'Appareils de mesure', instrument: 'Instrument', inventaire: 'N° d’inventaire', addDevice: '+ Ajouter un appareil',
      devicesHint: 'Proposés dans une liste déroulante au champ « Instrument » des paramètres de mesure.',
      mySig: 'Ma signature', drawSig: '✍️ Dessiner ma signature', redrawSig: '✍️ Modifier ma signature', noSig: 'Aucune signature',
      sigHint: 'Reprise dans le champ « Signature » du protocole et dans les signatures électroniques (bas de page et lignes).',
      padTitle: 'Ma signature', padHint: 'Signez dans le cadre', clear: 'Effacer', ok: 'Valider', cancel: 'Annuler', drawFirst: 'Signez d’abord dans le cadre.',
      loginTitle: 'Connexion', user: 'Utilisateur', password: 'Mot de passe', password2: 'Confirmer le mot de passe',
      remember: 'Rester connecté sur cet appareil (à décocher sur un PC partagé)', badPassword: 'Mot de passe incorrect.',
      noUsers: 'Aucun utilisateur validé pour l’instant. Créez votre compte et attendez sa validation.',
      noRegistry: 'Liste des utilisateurs inaccessible. Connectez-vous à Internet puis réessayez.',
      badRegistry: 'utilisateurs.txt contient {n} code(s) illisible(s) : vérifiez que le bloc reçu par e-mail a été copié en entier.',
      regTitle: 'Créer mon compte de signature',
      regInfo: 'Choisissez un mot de passe d’au moins 12 caractères. Il protège votre signature : sans lui, personne (pas même le responsable) ne peut signer à votre nom. <b>Il ne peut pas être récupéré</b> en cas d’oubli.',
      regSend: 'Valider l’inscription', pwShort: 'Le mot de passe doit contenir au moins 12 caractères.', pwDiff: 'Les deux mots de passe sont différents.',
      fillFirst: 'Complétez d’abord nom, prénom, e-mail valide et votre signature.',
      created: 'Compte créé — l’e-mail s’ouvre, il ne reste qu’à l’envoyer.',
      sendTitle: 'Dernière étape : envoyer l’e-mail',
      sendWhy: 'Votre compte est créé sur cet appareil, mais vous <b>ne pouvez pas encore signer</b>.',
      sendStep1: 'Ouvrez l’e-mail avec l’un des boutons ci-dessous : un message prérempli s’ouvre.',
      sendStep2: '<b>Envoyez-le sans le modifier</b>, depuis votre adresse professionnelle.',
      sendStep3: 'Le responsable vérifie votre identité et ajoute votre code à l’application. Vous pourrez alors signer après la prochaine mise à jour.',
      sendReason: '<b>Pourquoi ?</b> Seules les personnes autorisées à signer selon l’OIBT peuvent apposer une signature électronique. Le responsable doit donc valider chaque nouveau signataire.',
      sendSafe: 'Le code contient votre clé de signature <b>chiffrée par votre mot de passe</b>. Le responsable ne peut pas signer à votre place, et votre mot de passe n’est jamais envoyé.',
      sendOpen: '✉️ Application e-mail de l’appareil', sendOwa: '✉️ Outlook sur le web (Microsoft 365)', sendLater: 'Plus tard',
      sendFallback: 'L’e-mail ne s’ouvre pas ? Copiez le bloc et envoyez-le à',
      sendLaterInfo: 'Vous pourrez envoyer l’e-mail plus tard depuis « Mon profil ».',
      mailTo: 'L’inscription est envoyée à', nameDiff: 'Le nom du profil diffère de celui du compte de signature. Les signatures utilisent le nom du compte.',
      confirmLogout: 'Se déconnecter de cet appareil ?', other: 'Autre…', current: 'actuel',
      wait: '⏳ Vérification…',
      subject: 'Inscription signature électronique – ',
      mailIntro: 'Bonjour,\n\nMerci d’ajouter mon compte de signature à l’application « Premières vérifications ».\n\n',
      mailBlock: 'Bloc à copier dans utilisateurs.txt :', mailEnd: '\nMeilleures salutations\n',
    },
    de: {
      title: 'Mein Profil', back: '‹ Zurück', autosave: 'Automatisch auf diesem Gerät gespeichert',
      account: 'Signaturkonto', accountInfo: 'Das Konto wird nur für die elektronische Unterschrift benötigt.',
      notConnected: 'Nicht angemeldet', login: 'Anmelden', logout: 'Abmelden', create: 'Konto erstellen',
      authorized: '✓ Unterschriftsberechtigt', pending: '⏳ Registrierung wartet auf Freigabe', revoked: '⛔ Berechtigung widerrufen',
      resend: '✉️ Registrierungs-E-Mail erneut senden', copyCode: 'Registrierungsblock kopieren', copied: 'Block kopiert ✓',
      infos: 'Persönliche Angaben', nom: 'Name', prenom: 'Vorname', email: 'E-Mail',
      devices: 'Messgeräte', instrument: 'Messgerät', inventaire: 'Inventar-Nr.', addDevice: '+ Messgerät hinzufügen',
      devicesHint: 'Werden im Feld «Messgerät» der Messparameter als Auswahlliste angeboten.',
      mySig: 'Meine Unterschrift', drawSig: '✍️ Unterschrift zeichnen', redrawSig: '✍️ Unterschrift ändern', noSig: 'Keine Unterschrift',
      sigHint: 'Wird im Feld «Unterschrift» und in den elektronischen Unterschriften (unten und pro Zeile) verwendet.',
      padTitle: 'Meine Unterschrift', padHint: 'Im Rahmen unterschreiben', clear: 'Löschen', ok: 'Bestätigen', cancel: 'Abbrechen', drawFirst: 'Bitte zuerst im Rahmen unterschreiben.',
      loginTitle: 'Anmeldung', user: 'Benutzer', password: 'Passwort', password2: 'Passwort bestätigen',
      remember: 'Auf diesem Gerät angemeldet bleiben (auf gemeinsamen PCs deaktivieren)', badPassword: 'Falsches Passwort.',
      noUsers: 'Noch kein Benutzer freigegeben. Konto erstellen und Freigabe abwarten.',
      noRegistry: 'Benutzerliste nicht erreichbar. Mit dem Internet verbinden und erneut versuchen.',
      badRegistry: 'utilisateurs.txt enthält {n} unlesbare(n) Code(s): prüfen, ob der Block aus der E-Mail vollständig kopiert wurde.',
      regTitle: 'Signaturkonto erstellen',
      regInfo: 'Wählen Sie ein Passwort mit mindestens 12 Zeichen. Es schützt Ihre Unterschrift: ohne es kann niemand (auch nicht der Verantwortliche) in Ihrem Namen unterschreiben. <b>Es kann nicht wiederhergestellt werden.</b>',
      regSend: 'Registrierung absenden', pwShort: 'Das Passwort muss mindestens 12 Zeichen haben.', pwDiff: 'Die Passwörter stimmen nicht überein.',
      fillFirst: 'Bitte zuerst Name, Vorname, gültige E-Mail und Unterschrift erfassen.',
      created: 'Konto erstellt — die E-Mail öffnet sich, nur noch senden.',
      sendTitle: 'Letzter Schritt: E-Mail senden',
      sendWhy: 'Ihr Konto ist auf diesem Gerät erstellt, aber Sie <b>können noch nicht unterschreiben</b>.',
      sendStep1: 'Öffnen Sie die E-Mail mit einer der Schaltflächen unten: eine vorausgefüllte Nachricht öffnet sich.',
      sendStep2: '<b>Senden Sie sie unverändert</b> von Ihrer geschäftlichen Adresse.',
      sendStep3: 'Der Verantwortliche prüft Ihre Identität und fügt Ihren Code der App hinzu. Nach dem nächsten Update können Sie unterschreiben.',
      sendReason: '<b>Warum?</b> Nur gemäss NIV berechtigte Personen dürfen elektronisch unterschreiben. Der Verantwortliche muss deshalb jeden neuen Unterzeichner freigeben.',
      sendSafe: 'Der Code enthält Ihren Signaturschlüssel, <b>mit Ihrem Passwort verschlüsselt</b>. Der Verantwortliche kann nicht für Sie unterschreiben; Ihr Passwort wird nie gesendet.',
      sendOpen: '✉️ E-Mail-App des Geräts', sendOwa: '✉️ Outlook im Web (Microsoft 365)', sendLater: 'Später',
      sendFallback: 'Öffnet sich die E-Mail nicht? Block kopieren und senden an',
      sendLaterInfo: 'Sie können die E-Mail später unter «Mein Profil» senden.',
      mailTo: 'Die Registrierung wird gesendet an', nameDiff: 'Der Profilname unterscheidet sich vom Signaturkonto. Unterschriften verwenden den Kontonamen.',
      confirmLogout: 'Auf diesem Gerät abmelden?', other: 'Andere…', current: 'aktuell',
      wait: '⏳ Prüfung…',
      subject: 'Registrierung elektronische Unterschrift – ',
      mailIntro: 'Guten Tag\n\nBitte mein Signaturkonto in der App «Erstprüfungen» freigeben.\n\n',
      mailBlock: 'Block zum Kopieren in utilisateurs.txt:', mailEnd: '\nFreundliche Grüsse\n',
    },
    it: {
      title: 'Il mio profilo', back: '‹ Indietro', autosave: 'Salvataggio automatico su questo dispositivo',
      account: 'Account di firma', accountInfo: 'L’account serve solo per firmare elettronicamente.',
      notConnected: 'Non connesso', login: 'Accedere', logout: 'Disconnettersi', create: 'Creare il mio account',
      authorized: '✓ Autorizzato a firmare', pending: '⏳ Iscrizione in attesa di convalida', revoked: '⛔ Autorizzazione revocata',
      resend: '✉️ Reinviare l’e-mail di iscrizione', copyCode: 'Copiare il blocco di iscrizione', copied: 'Blocco copiato ✓',
      infos: 'Dati personali', nom: 'Cognome', prenom: 'Nome', email: 'E-mail',
      devices: 'Strumenti di misura', instrument: 'Strumento', inventaire: 'N° inventario', addDevice: '+ Aggiungere uno strumento',
      devicesHint: 'Proposti in un elenco a discesa nel campo «Strumento» dei parametri di misura.',
      mySig: 'La mia firma', drawSig: '✍️ Disegnare la firma', redrawSig: '✍️ Modificare la firma', noSig: 'Nessuna firma',
      sigHint: 'Ripresa nel campo «Firma» e nelle firme elettroniche (in basso e per riga).',
      padTitle: 'La mia firma', padHint: 'Firmare nel riquadro', clear: 'Cancellare', ok: 'Confermare', cancel: 'Annullare', drawFirst: 'Firmare prima nel riquadro.',
      loginTitle: 'Accesso', user: 'Utente', password: 'Password', password2: 'Confermare la password',
      remember: 'Restare connesso su questo dispositivo (deselezionare su PC condivisi)', badPassword: 'Password errata.',
      noUsers: 'Nessun utente ancora convalidato. Creare l’account e attendere la convalida.',
      noRegistry: 'Elenco utenti non raggiungibile. Connettersi a Internet e riprovare.',
      badRegistry: 'utilisateurs.txt contiene {n} codice/i illeggibile/i: verificare che il blocco ricevuto per e-mail sia stato copiato per intero.',
      regTitle: 'Creare l’account di firma',
      regInfo: 'Scegliere una password di almeno 12 caratteri. Protegge la sua firma: senza di essa nessuno (nemmeno il responsabile) può firmare a suo nome. <b>Non può essere recuperata.</b>',
      regSend: 'Convalidare l’iscrizione', pwShort: 'La password deve contenere almeno 12 caratteri.', pwDiff: 'Le password non corrispondono.',
      fillFirst: 'Completare prima cognome, nome, e-mail valida e firma.',
      created: 'Account creato — l’e-mail si apre, basta inviarla.',
      sendTitle: 'Ultimo passo: inviare l’e-mail',
      sendWhy: 'Il suo account è creato su questo dispositivo, ma <b>non può ancora firmare</b>.',
      sendStep1: 'Aprire l’e-mail con uno dei pulsanti qui sotto: si apre un messaggio precompilato.',
      sendStep2: '<b>Inviarlo senza modificarlo</b>, dal suo indirizzo professionale.',
      sendStep3: 'Il responsabile verifica la sua identità e aggiunge il codice all’applicazione. Potrà firmare dopo il prossimo aggiornamento.',
      sendReason: '<b>Perché?</b> Solo le persone autorizzate secondo l’OIBT possono apporre una firma elettronica. Il responsabile deve quindi convalidare ogni nuovo firmatario.',
      sendSafe: 'Il codice contiene la sua chiave di firma <b>cifrata con la sua password</b>. Il responsabile non può firmare al suo posto e la password non viene mai inviata.',
      sendOpen: '✉️ App e-mail del dispositivo', sendOwa: '✉️ Outlook sul web (Microsoft 365)', sendLater: 'Più tardi',
      sendFallback: 'L’e-mail non si apre? Copiare il blocco e inviarlo a',
      sendLaterInfo: 'Potrà inviare l’e-mail più tardi da «Il mio profilo».',
      mailTo: 'L’iscrizione è inviata a', nameDiff: 'Il nome del profilo differisce da quello dell’account. Le firme usano il nome dell’account.',
      confirmLogout: 'Disconnettersi da questo dispositivo?', other: 'Altro…', current: 'attuale',
      wait: '⏳ Verifica…',
      subject: 'Iscrizione firma elettronica – ',
      mailIntro: 'Buongiorno,\n\nLa prego di aggiungere il mio account di firma all’applicazione «Prime verifiche».\n\n',
      mailBlock: 'Blocco da copiare in utilisateurs.txt:', mailEnd: '\nCordiali saluti\n',
    },
  };
  const t = k => (TXT[currentLang] || TXT.fr)[k];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

  /* -------------------------------------------------------------- PROFIL */
  function load() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {}; } catch (e) { }
    return { nom: p.nom || '', prenom: p.prenom || '', email: p.email || '', appareils: Array.isArray(p.appareils) ? p.appareils : [], signature: p.signature || null };
  }
  function store(p) { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(p)); } catch (e) { showToast('Erreur sauvegarde profil'); } }
  const fullName = p => [p.nom, p.prenom].filter(Boolean).join(' ').trim(); // ordre du formulaire : Nom Prénom
  const devices = p => (p || load()).appareils.filter(d => d.instrument || d.inventaire);

  /* ---------------------------------------- SIGNATURE DU FORMULAIRE (sigData) */
  function setFormSignature(dataUrl) {
    sigData = dataUrl;
    const prev = $('sig-preview'); if (!prev) return;
    const dpr = window.devicePixelRatio || 1, ctx = prev.getContext('2d');
    prev.width = prev.offsetWidth * dpr; prev.height = prev.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const img = new Image();
    img.onload = () => {
      const W = prev.offsetWidth, H = prev.offsetHeight, r = Math.min(W / img.width, H / img.height);
      ctx.clearRect(0, 0, W, H); ctx.drawImage(img, (W - img.width * r) / 2, (H - img.height * r) / 2, img.width * r, img.height * r);
    };
    img.src = dataUrl;
    const ph = $('sig-placeholder'); if (ph) ph.style.display = 'none';
    const cb = $('sig-clear-btn'); if (cb) cb.style.display = 'block';
  }

  /* --------------------------------------------- REPRISE DANS LE PROTOCOLE */
  function prefill(force) {
    const p = load(); let changed = false;
    const set = (id, val, isDefault) => {
      const el = $(id); if (!el || !val || el.readOnly || el.disabled) return;
      if (force || !el.value || isDefault(el.value)) { if (el.value !== val) { el.value = val; changed = true; } }
    };
    set('nom_prenom', fullName(p), () => false);
    const d0 = devices(p)[0];
    if (d0) {
      const instr = $('instrument');
      const isDefaultInstr = v => v === CONFIG.defaultInstrument;
      if (instr && !instr.readOnly && (force || !instr.value || isDefaultInstr(instr.value))) {
        set('instrument', d0.instrument, isDefaultInstr);
        const inv = $('num_inventaire'); if (inv && !inv.readOnly) { inv.value = d0.inventaire || ''; changed = true; }
      }
    }
    if (p.signature && (!sigData || force)) { setFormSignature(p.signature); changed = true; }
    if (changed) saveData();
    buildInstrumentSelect();
  }

  /* ------------------------------------- LISTE DÉROULANTE « INSTRUMENT » */
  let instrObserver = null;
  function buildInstrumentSelect() {
    const inp = $('instrument'), inv = $('num_inventaire');
    if (!inp) return;
    let sel = $('instrument-select');
    const devs = devices();
    if (!devs.length) { if (sel) sel.remove(); inp.style.display = ''; return; }
    if (!sel) {
      sel = document.createElement('select');
      sel.id = 'instrument-select';
      inp.parentNode.insertBefore(sel, inp);
      sel.addEventListener('change', () => {
        const v = sel.value;
        if (v === 'other') { inp.style.display = ''; inp.value = ''; if (inv) inv.value = ''; inp.focus(); return; }
        if (v === 'current') return;
        const d = devices()[+v]; if (!d) return;
        inp.value = d.instrument || ''; if (inv) inv.value = d.inventaire || '';
        inp.style.display = 'none';
      });
      instrObserver = new MutationObserver(() => { sel.disabled = inp.readOnly || inp.disabled; });
      instrObserver.observe(inp, { attributes: true, attributeFilter: ['readonly', 'disabled', 'style'] });
    }
    const curI = inp.value || '', curN = inv ? inv.value || '' : '';
    let idx = devs.findIndex(d => d.instrument === curI && (d.inventaire || '') === curN);
    if (idx < 0) idx = devs.findIndex(d => d.instrument === curI && !curN);
    const label = d => esc(d.instrument || '—') + (d.inventaire ? ' – ' + esc(d.inventaire) : '');
    let html = devs.map((d, i) => `<option value="${i}">${label(d)}</option>`).join('');
    if (idx < 0 && curI) html = `<option value="current">${label({ instrument: curI, inventaire: curN })} (${t('current')})</option>` + html;
    html += `<option value="other">${t('other')}</option>`;
    sel.innerHTML = html;
    sel.value = idx >= 0 ? String(idx) : (curI ? 'current' : 'other');
    inp.style.display = sel.value === 'other' ? '' : 'none';
    sel.disabled = inp.readOnly || inp.disabled;
  }

  /* ---------------------------------------------------------- UTILITAIRES UI */
  const btn = (bg, fg = '#fff', extra = '') => `width:100%;background:${bg};color:${fg};border:${bg === '#fff' ? '1px solid var(--border)' : 'none'};border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;${extra}`;
  const inputCss = 'border:1px solid var(--border);border-radius:8px;padding:9px 11px;font-size:14px;background:var(--input-bg,#f8f9fc);color:var(--text);width:100%;outline:none;';
  const lblCss = 'font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;margin-bottom:4px;display:block;';
  const hint = s => `<p style="font-size:11.5px;color:var(--muted);line-height:1.45;margin:6px 0 0;">${s}</p>`;

  function modal(html, onAct) {
    const m = document.createElement('div');
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:flex-end;justify-content:center;';
    m.innerHTML = `<div style="background:#fff;border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:520px;max-height:92vh;overflow:auto;">${html}</div>`;
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (b) onAct(b.dataset.act, m, b); else if (e.target === m) onAct('close', m);
    });
    document.body.appendChild(m);
    return m;
  }

  /* -------------------------------------------------- PAD DE SIGNATURE */
  function cropCanvas(c) {
    const ctx = c.getContext('2d'), { width: W, height: H } = c, px = ctx.getImageData(0, 0, W, H).data;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const pad = Math.round(6 * (window.devicePixelRatio || 1));
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
    const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  }

  function drawSignature() {
    return new Promise(resolve => {
      const m = modal(`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h3 style="font-size:15px;color:var(--navy);">${t('padTitle')}</h3><span style="font-size:12px;color:var(--muted);">${t('padHint')}</span></div>
        <canvas id="pf-pad" style="width:100%;height:210px;border:1.5px solid var(--border);border-radius:10px;background:#f9f9f9;touch-action:none;display:block;cursor:crosshair;"></canvas>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button data-act="clear" style="${btn('#fff', 'var(--muted)', 'flex:1;font-weight:400;')}">${t('clear')}</button>
          <button data-act="close" style="${btn('#fff', 'var(--muted)', 'flex:1;font-weight:400;')}">${t('cancel')}</button>
          <button data-act="ok" style="${btn('var(--red)', '#fff', 'flex:2;')}">${t('ok')}</button></div>`,
        (act, mm) => {
          if (act === 'clear') { ctx.clearRect(0, 0, c.width, c.height); drawn = false; return; }
          if (act === 'ok') { const url = drawn ? cropCanvas(c) : null; if (!url) return showToast(t('drawFirst')); mm.remove(); return resolve(url); }
          if (act === 'close') { mm.remove(); resolve(null); }
        });
      const c = m.querySelector('#pf-pad'), dpr = window.devicePixelRatio || 1, r = c.getBoundingClientRect();
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      const ctx = c.getContext('2d');
      ctx.scale(dpr, dpr); ctx.strokeStyle = '#1a1a2e'; ctx.fillStyle = '#1a1a2e'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      let down = false, last = null, drawn = false;
      const pos = e => { const b = c.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
      c.addEventListener('pointerdown', e => { e.preventDefault(); c.setPointerCapture(e.pointerId); down = true; last = pos(e); ctx.beginPath(); ctx.arc(last.x, last.y, 1.2, 0, 2 * Math.PI); ctx.fill(); drawn = true; });
      c.addEventListener('pointermove', e => { if (!down) return; e.preventDefault(); const p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; });
      const up = () => { down = false; };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    });
  }

  /* ------------------------------------------------------------- CONNEXION */
  // Ouvre la fenêtre de connexion ; résout la session ou null
  async function login() {
    const reg = (await SA.loadRegistry(true)).filter(u => !u.validUntil);
    if (!reg.length) {
      const info = SA.registryInfo();
      alert(!info.loaded ? t('noRegistry') : info.errors ? t('badRegistry').replace('{n}', info.errors) : t('noUsers'));
      return null;
    }
    const p = load();
    const pre = reg.find(u => p.email && u.email.toLowerCase() === p.email.toLowerCase()) || reg.find(u => u.name === fullName(p));
    return new Promise(resolve => {
      const m = modal(`
        <h3 style="font-size:15px;color:var(--navy);margin-bottom:14px;">🔑 ${t('loginTitle')}</h3>
        <label style="${lblCss}">${t('user')}</label>
        <select id="pf-user" style="${inputCss}margin-bottom:11px;">${reg.map(u => `<option value="${u.id}" ${pre && pre.id === u.id ? 'selected' : ''}>${esc(u.name)}${u.email ? ' – ' + esc(u.email) : ''}</option>`).join('')}</select>
        <label style="${lblCss}">${t('password')}</label>
        <input id="pf-pw" type="password" autocomplete="current-password" style="${inputCss}margin-bottom:11px;"/>
        <label style="display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--text);margin-bottom:8px;"><input id="pf-remember" type="checkbox" checked style="margin-top:2px;"/>${t('remember')}</label>
        <p id="pf-err" style="color:#c62828;font-size:12.5px;font-weight:700;min-height:16px;margin-bottom:6px;"></p>
        <div style="display:flex;gap:8px;">
          <button data-act="close" style="${btn('#fff', 'var(--muted)', 'flex:1;font-weight:400;')}">${t('cancel')}</button>
          <button data-act="ok" style="${btn('var(--navy)', '#fff', 'flex:2;')}">${t('login')}</button></div>`,
        async (act, mm, b) => {
          if (act === 'close') { mm.remove(); return resolve(null); }
          if (act !== 'ok' || b.disabled) return;
          const u = reg.find(x => x.id === mm.querySelector('#pf-user').value);
          b.disabled = true; b.textContent = t('wait');
          try {
            const s = await SA.login(u, mm.querySelector('#pf-pw').value, mm.querySelector('#pf-remember').checked);
            fillFromAccount(u); mm.remove(); refreshAll(); resolve(s);
          } catch (e) {
            mm.querySelector('#pf-err').textContent = e.message === 'BAD_PASSWORD' ? t('badPassword') : e.message;
            b.disabled = false; b.textContent = t('login');
          }
        });
      const pw = m.querySelector('#pf-pw');
      pw.addEventListener('keydown', e => { if (e.key === 'Enter') m.querySelector('[data-act=ok]').click(); });
      setTimeout(() => pw.focus(), 50);
    });
  }
  function fillFromAccount(u) {
    const p = load(); let ch = false;
    if (!p.nom && u.nom) { p.nom = u.nom; ch = true; }
    if (!p.prenom && u.prenom) { p.prenom = u.prenom; ch = true; }
    if (!p.email && u.email) { p.email = u.email; ch = true; }
    if (ch) { store(p); prefill(false); }
  }
  async function logout() {
    if (!confirm(t('confirmLogout'))) return;
    await SA.logout(); refreshAll();
  }

  /* ------------------------------------------------------------ INSCRIPTION */
  function register() {
    const p = readForm(); store(p);
    if (!p.nom || !p.prenom || !validEmail(p.email) || !p.signature) { alert(t('fillFirst')); return; }
    modal(`
      <h3 style="font-size:15px;color:var(--navy);margin-bottom:6px;">${t('regTitle')}</h3>
      <p style="font-size:13px;margin-bottom:10px;"><b>${esc(fullName(p))}</b> · ${esc(p.email)}</p>
      <p style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px;">${t('regInfo')}</p>
      <label style="${lblCss}">${t('password')}</label>
      <input id="pf-pw1" type="password" autocomplete="new-password" style="${inputCss}margin-bottom:11px;"/>
      <label style="${lblCss}">${t('password2')}</label>
      <input id="pf-pw2" type="password" autocomplete="new-password" style="${inputCss}margin-bottom:8px;"/>
      <p id="pf-err" style="color:#c62828;font-size:12.5px;font-weight:700;min-height:16px;margin-bottom:6px;"></p>
      <div style="display:flex;gap:8px;">
        <button data-act="close" style="${btn('#fff', 'var(--muted)', 'flex:1;font-weight:400;')}">${t('cancel')}</button>
        <button data-act="ok" style="${btn('var(--red)', '#fff', 'flex:2;')}">${t('regSend')}</button></div>
      ${hint(t('mailTo') + ' ' + esc(CONFIG.responsableEmail))}`,
      async (act, mm, b) => {
        if (act === 'close') return mm.remove();
        if (act !== 'ok' || b.disabled) return;
        const pw1 = mm.querySelector('#pf-pw1').value, pw2 = mm.querySelector('#pf-pw2').value, err = mm.querySelector('#pf-err');
        if (pw1.length < SA.CONFIG.minPasswordLength) return (err.textContent = t('pwShort'));
        if (pw1 !== pw2) return (err.textContent = t('pwDiff'));
        b.disabled = true; b.textContent = t('wait');
        try {
          const acc = await SA.createAccount({ nom: p.nom, prenom: p.prenom, email: p.email, password: pw1 });
          await SA.openSession(acc.entry, acc.privateKey, true);
          mm.remove(); refreshAll();
          explainMail(acc.entry);
        } catch (e) { err.textContent = e.message; b.disabled = false; b.textContent = t('regSend'); }
      });
  }

  // Fenêtre explicative avant l'envoi de l'e-mail d'inscription
  function explainMail(entry) {
    const step = (n, html) => `<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:9px;">
      <span style="flex-shrink:0;width:22px;height:22px;border-radius:50%;background:var(--navy);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;">${n}</span>
      <span style="font-size:13px;line-height:1.45;">${html}</span></div>`;
    const box = (bg, html) => `<p style="font-size:12px;line-height:1.5;background:${bg};border-radius:8px;padding:9px 11px;margin-bottom:8px;">${html}</p>`;
    modal(`
      <h3 style="font-size:16px;color:var(--navy);margin-bottom:6px;">📨 ${t('sendTitle')}</h3>
      <p style="font-size:13px;color:#e65100;margin-bottom:14px;line-height:1.45;">${t('sendWhy')}</p>
      ${step(1, t('sendStep1'))}${step(2, t('sendStep2'))}${step(3, t('sendStep3'))}
      <div style="margin-top:12px;">${box('#eef1f8', t('sendReason'))}${box('#e8f5e9', '🔒 ' + t('sendSafe'))}</div>
      ${(() => { // PC : Outlook web en premier ; téléphone : application e-mail en premier
        const pc = !(window.matchMedia && matchMedia('(pointer:coarse)').matches);
        const owa = `<button data-act="owa" style="${btn(pc ? 'var(--red)' : '#fff', pc ? '#fff' : 'var(--navy)', 'margin-top:6px;')}">${t('sendOwa')}</button>`;
        const app = `<button data-act="ok" style="${btn(pc ? '#fff' : 'var(--red)', pc ? 'var(--navy)' : '#fff', 'margin-top:6px;')}">${t('sendOpen')}</button>`;
        return pc ? owa + app : app + owa;
      })()}
      <button data-act="close" style="background:none;border:none;color:var(--muted);font-size:13px;text-decoration:underline;cursor:pointer;width:100%;padding:10px;">${t('sendLater')}</button>
      ${hint(t('sendFallback') + ' <b>' + esc(CONFIG.responsableEmail) + '</b> — <button data-act="copy" style="background:none;border:none;padding:0;color:var(--navy);text-decoration:underline;cursor:pointer;font-size:inherit;">' + t('copyCode') + '</button>')}`,
      async (act, mm) => {
        if (act === 'ok') { mm.remove(); return mailCode(entry); }
        if (act === 'owa') { mm.remove(); return mailCode(entry, 'owa'); }
        if (act === 'copy') {
          const block = codeBlock(entry);
          try { await navigator.clipboard.writeText(block); showToast(t('copied')); } catch (e) { prompt(t('copyCode'), block); }
          return;
        }
        if (act === 'close') { mm.remove(); showToast(t('sendLaterInfo'), 3500); }
      });
  }

  // Bloc prêt à coller dans utilisateurs.txt
  function codeBlock(entry) {
    return '# ' + entry.name + ' – ' + entry.email + ' – ' + (entry.validFrom || '') + '\n' + entry.code.match(/.{1,64}/g).join('\n');
  }
  function mailCode(entry, via) {
    const sep = '------------------------------------------------------------';
    const body = t('mailIntro') +
      `${t('nom')} : ${entry.nom}\n${t('prenom')} : ${entry.prenom}\n${t('email')} : ${entry.email}\n\n` +
      `${t('mailBlock')}\n${sep}\n${codeBlock(entry)}\n${sep}\n` + t('mailEnd') + entry.prenom + ' ' + entry.nom;
    const subject = encodeURIComponent(t('subject') + entry.name);
    if (via === 'owa') {
      return window.Profil.openWeb('https://outlook.office.com/mail/deeplink/compose?to=' + encodeURIComponent(CONFIG.responsableEmail) +
        '&subject=' + subject + '&body=' + encodeURIComponent(body));
    }
    window.Profil.openMail('mailto:' + CONFIG.responsableEmail + '?subject=' + subject + '&body=' + encodeURIComponent(body));
  }

  /* ------------------------------------------------------------------ PAGE */
  let page = null;
  const field = (id, label, val, type = 'text', ph = '') => `<div style="margin-bottom:11px;"><label style="${lblCss}" for="pf_${id}">${label}</label><input id="pf_${id}" type="${type}" value="${esc(val)}" placeholder="${esc(ph)}" style="${inputCss}" autocomplete="off"/></div>`;

  function readForm() {
    const p = load();
    if (!page || page.style.display === 'none' || !$('pf_nom')) return p;
    const v = id => (($('pf_' + id) || {}).value || '').trim();
    p.nom = v('nom'); p.prenom = v('prenom'); p.email = v('email');
    p.appareils = [...page.querySelectorAll('[data-dev]')].map(row => ({
      instrument: row.querySelector('[data-k=instrument]').value.trim(),
      inventaire: row.querySelector('[data-k=inventaire]').value.trim(),
    }));
    return p;
  }

  async function accountCard() {
    const s = await SA.getSession();
    if (!s) return `
      <p style="font-size:13px;font-weight:700;margin-bottom:4px;">${t('notConnected')}</p>
      ${hint(t('accountInfo'))}
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button data-pf="login" style="${btn('var(--navy)', '#fff', 'flex:1;')}">${t('login')}</button>
        <button data-pf="register" style="${btn('#fff', 'var(--navy)', 'flex:1;')}">${t('create')}</button></div>`;
    const st = await SA.accountStatus(s.id);
    const color = { authorized: '#2e7d32', pending: '#e65100', revoked: '#c62828' }[st];
    const p = load();
    return `
      <p style="font-size:14px;"><b>${esc(s.name)}</b></p>
      <p style="font-size:12px;color:var(--muted);">${esc(s.email || '')}</p>
      <p style="font-size:13px;font-weight:700;color:${color};margin:6px 0 10px;">${t(st)}</p>
      ${fullName(p) && fullName(p) !== s.name ? `<p style="font-size:11.5px;color:#e65100;margin-bottom:10px;">${t('nameDiff')}</p>` : ''}
      ${st === 'pending' && s.code ? `<button data-pf="resend" style="${btn('var(--red)', '#fff', 'margin-bottom:8px;')}">${t('resend')}</button>
        <button data-pf="copy" style="${btn('#fff', 'var(--navy)', 'margin-bottom:8px;')}">${t('copyCode')}</button>` : ''}
      <button data-pf="logout" style="background:none;border:none;color:var(--muted);font-size:12.5px;text-decoration:underline;cursor:pointer;width:100%;padding:6px;">${t('logout')}</button>`;
  }

  async function renderPage() {
    const p = load();
    const devs = p.appareils.length ? p.appareils : [{ instrument: '', inventaire: '' }];
    page.innerHTML = `
      <div style="background:var(--red);color:#fff;position:sticky;top:0;z-index:2;display:flex;align-items:center;padding:13px 14px;box-shadow:0 2px 6px rgba(0,0,0,.3);">
        <button data-pf="close" style="background:none;border:none;color:#fff;font-size:15px;font-weight:700;cursor:pointer;padding:0;width:80px;text-align:left;">${t('back')}</button>
        <div style="flex:1;text-align:center;font-weight:700;font-size:15px;">${t('title')}</div><div style="width:80px;"></div>
      </div>
      <div class="sec"><div class="sec-hd">${t('account')}</div><div class="sec-bd" id="pf-account">${await accountCard()}</div></div>
      <div class="sec" style="margin-top:10px;"><div class="sec-hd">${t('infos')}</div><div class="sec-bd">
        <div class="row2">${field('nom', t('nom'), p.nom)}${field('prenom', t('prenom'), p.prenom)}</div>
        ${field('email', t('email'), p.email, 'email', 'prenom.nom@sbb.ch')}
      </div></div>
      <div class="sec" style="margin-top:10px;"><div class="sec-hd">${t('devices')} <span class="cnt">${devices(p).length}</span></div><div class="sec-bd">
        <div style="display:grid;grid-template-columns:1fr 1fr 28px;gap:7px;margin-bottom:4px;">
          <span style="${lblCss}">${t('instrument')}</span><span style="${lblCss}">${t('inventaire')}</span><span></span></div>
        ${devs.map((d, i) => `<div data-dev="${i}" style="display:grid;grid-template-columns:1fr 1fr 28px;gap:7px;margin-bottom:7px;align-items:center;">
          <input data-k="instrument" value="${esc(d.instrument)}" placeholder="Metrel MI 3152" style="${inputCss}"/>
          <input data-k="inventaire" value="${esc(d.inventaire)}" placeholder="I-68266" style="${inputCss}"/>
          <button data-pf="deldev" data-i="${i}" style="background:none;border:none;color:#aaa;font-size:22px;cursor:pointer;line-height:1;">×</button></div>`).join('')}
        <button data-pf="adddev" style="${btn('#fff', 'var(--navy)', 'border-style:dashed;font-weight:600;margin-top:4px;')}">${t('addDevice')}</button>
        ${hint(t('devicesHint'))}
      </div></div>
      <div class="sec" style="margin-top:10px;margin-bottom:30px;"><div class="sec-hd">${t('mySig')}</div><div class="sec-bd">
        <div style="height:90px;border:1px solid var(--border);border-radius:8px;background:#f9f9f9;display:flex;align-items:center;justify-content:center;margin-bottom:10px;">
          ${p.signature ? `<img src="${p.signature}" style="max-width:90%;max-height:80px;"/>` : `<span style="color:var(--muted);font-size:13px;">${t('noSig')}</span>`}</div>
        <button data-pf="sig" style="${btn('var(--navy)')}">${p.signature ? t('redrawSig') : t('drawSig')}</button>
        ${hint(t('sigHint'))}
      </div></div>
      <p style="text-align:center;font-size:11px;color:var(--muted);margin:-18px 0 30px;">${t('autosave')}</p>`;
  }

  let saveTimer = null;
  function onInput() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { store(readForm()); prefill(false); }, 400);
  }

  async function onAction(act, el) {
    if (act === 'close') return close();
    if (act === 'adddev') { const p = readForm(); p.appareils.push({ instrument: '', inventaire: '' }); store(p); await renderPage(); const rows = page.querySelectorAll('[data-dev] [data-k=instrument]'); rows[rows.length - 1].focus(); return; }
    if (act === 'deldev') { const p = readForm(); p.appareils.splice(+el.dataset.i, 1); store(p); prefill(false); return renderPage(); }
    if (act === 'sig') {
      const url = await drawSignature(); if (!url) return;
      const p = readForm(), old = p.signature; p.signature = url; store(p);
      if (!sigData || sigData === old) setFormSignature(url), saveData();
      return renderPage();
    }
    if (act === 'login') return login();
    if (act === 'register') return register();
    if (act === 'logout') return logout();
    const s = await SA.getSession(); if (!s || !s.code) return;
    const entry = await SA.parseCode(s.code);
    if (act === 'resend') return explainMail(entry);
    if (act === 'copy') {
      const block = codeBlock(entry);
      try { await navigator.clipboard.writeText(block); showToast(t('copied')); } catch (e) { prompt(t('copyCode'), block); }
    }
  }

  function open() {
    if (!page) {
      page = document.createElement('div');
      page.id = 'profil-page';
      page.style.cssText = 'position:fixed;inset:0;background:var(--bg,#eef0f5);z-index:600;overflow-y:auto;';
      page.addEventListener('click', e => { const b = e.target.closest('[data-pf]'); if (b) onAction(b.dataset.pf, b); });
      page.addEventListener('input', onInput);
      document.body.appendChild(page);
    }
    page.style.display = 'block';
    document.body.style.overflow = 'hidden';
    if (!(history.state && history.state.profil)) history.pushState({ profil: true }, '');
    return renderPage();
  }
  function close(fromPop) {
    if (!page || page.style.display === 'none') return;
    clearTimeout(saveTimer); store(readForm()); prefill(false);
    page.style.display = 'none';
    document.body.style.overflow = '';
    if (!fromPop && history.state && history.state.profil) history.back();
  }
  window.addEventListener('popstate', () => close(true));

  function refreshAll() {
    if (page && page.style.display !== 'none') renderPage();
    if (window.SignatureUI) SignatureUI.refresh();
  }

  /* ---------------------------------------------- BOUTON DANS L'EN-TÊTE */
  function addHeaderButton() {
    const row = document.querySelector('.hdr-logo-row') || document.querySelector('.hdr-top');
    if (!row || $('profil-btn')) return;
    const b = document.createElement('button');
    b.id = 'profil-btn'; b.title = 'Profil';
    b.style.cssText = 'position:absolute;right:0;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.4);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;color:#fff;';
    b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
    b.onclick = open;
    if (getComputedStyle(row).position === 'static') row.style.position = 'relative';
    row.appendChild(b);
  }

  /* ------------------------------------------------------------- CROCHETS */
  const _applyLang = window.applyLang;
  window.applyLang = function () {
    const r = _applyLang.apply(this, arguments);
    if (page && page.style.display !== 'none') renderPage();
    buildInstrumentSelect();
    return r;
  };
  const _doImport = window.doImport;
  if (_doImport) window.doImport = function () { const r = _doImport.apply(this, arguments); buildInstrumentSelect(); return r; };

  window.addEventListener('DOMContentLoaded', () => {
    addHeaderButton();
    prefill(wasNewProtocol); // nouveau protocole : tout le profil ; sinon seulement les champs vides
  });

  window.Profil = {
    open, close, login, load, CONFIG,
    getSignature: () => load().signature,
    openMail: url => { location.href = url; },
    openWeb: url => { window.open(url, '_blank', 'noopener'); },
  };
})();
