/* ============================================================================
 * signature-avancee-ui.js — Signature électronique dans l'application
 * ----------------------------------------------------------------------------
 * Se greffe sur app.js (addCircuit, saveData, collectAll, showImportModal,
 * doImport, applyLang) et pdf-generator.js (buildPDFBlob).
 *
 *  - chaque circuit reçoit un identifiant stable « uid » (conservé dans le JSON)
 *  - « Signer électroniquement » demande la connexion (nom + mot de passe) si
 *    nécessaire, puis signe :
 *      · les données communes  → signature « bas de page »
 *      · les circuits choisis  → signature sur chaque ligne (colonne Collaborateur)
 *  - ce qui est signé est verrouillé ; toute modification est détectée
 *  - le JSON exporté contient les signatures ; le collègue l'importe
 *    (« Tout remplacer »), complète et signe ses circuits
 *  - le PDF reçoit une page « Signatures électroniques » + le JSON signé joint
 * ========================================================================== */
(function () {
  'use strict';
  const SA = window.SignatureAvancee;
  if (!SA) { console.error('signature-avancee.js manquant'); return; }

  /* ------------------------------------------------------------- RÉGLAGES */
  // Champs propres à chaque signataire → hors des « données communes »
  ['nom_prenom', 'lieu', 'date_sig'].forEach(k => { if (!SA.CONFIG.excludedKeys.includes(k)) SA.CONFIG.excludedKeys.push(k); });
  const COMMON_FIELDS = (typeof FIELDS !== 'undefined' ? FIELDS : []).filter(f => !SA.CONFIG.excludedKeys.includes(f));

  /* ----------------------------------------------------------------- I18N */
  const TXT = {
    fr: {
      title: 'Signatures électroniques', none: 'Aucune signature électronique.',
      sign: '✍️ Signer électroniquement', connected: 'Connecté', notConnected: 'Non connecté — la connexion sera demandée pour signer.',
      login: 'Se connecter', profile: 'Mon profil',
      pending: 'Votre inscription n’a pas encore été validée par le responsable. Signature impossible pour l’instant.',
      revoked: 'Votre autorisation de signer a été révoquée.',
      noSig: 'Dessinez d’abord votre signature dans « Mon profil ».',
      scopeTitle: 'Que signez-vous ?', scopeCommon: 'Données communes — signature en bas de page',
      scopeCommonHint: 'installation, paramètres de mesure, vérifications visuelles, remarques',
      commonDone: 'Déjà signées par', scopeCircuits: 'Circuits — signature sur chaque ligne',
      confirm: 'Signer', cancel: 'Annuler', noUnsigned: 'Tous les circuits sont déjà signés.', nothing: 'Rien à signer.',
      signed: 'Signé ✓', removeLast: 'Retirer ma dernière signature', confirmRemove: 'Retirer votre signature ? Les champs concernés seront déverrouillés.',
      allOk: 'Toutes les signatures sont valides', problem: 'Problème détecté sur une ou plusieurs signatures',
      common: 'bas de page', circ: 'ligne(s)', locked: '🔒 Verrouillé par signature', importWarn: 'Signatures du fichier vérifiées',
      sealed: 'PDF scellé ✓ — toute modification sera signalée par le lecteur PDF', notSealed: 'PDF NON scellé (non connecté ou compte non validé) : il reste modifiable sans trace.', sealError: 'Scellement du PDF impossible',
    },
    de: {
      title: 'Elektronische Unterschriften', none: 'Keine elektronische Unterschrift.',
      sign: '✍️ Elektronisch unterschreiben', connected: 'Angemeldet', notConnected: 'Nicht angemeldet — Anmeldung erfolgt beim Unterschreiben.',
      login: 'Anmelden', profile: 'Mein Profil',
      pending: 'Ihre Registrierung wurde noch nicht freigegeben. Unterschreiben noch nicht möglich.',
      revoked: 'Ihre Unterschriftsberechtigung wurde widerrufen.',
      noSig: 'Bitte zuerst Ihre Unterschrift in «Mein Profil» zeichnen.',
      scopeTitle: 'Was unterschreiben Sie?', scopeCommon: 'Gemeinsame Daten — Unterschrift unten',
      scopeCommonHint: 'Anlage, Messparameter, Sichtprüfungen, Bemerkungen',
      commonDone: 'Bereits unterschrieben von', scopeCircuits: 'Stromkreise — Unterschrift pro Zeile',
      confirm: 'Unterschreiben', cancel: 'Abbrechen', noUnsigned: 'Alle Stromkreise sind bereits unterschrieben.', nothing: 'Nichts zu unterschreiben.',
      signed: 'Unterschrieben ✓', removeLast: 'Meine letzte Unterschrift entfernen', confirmRemove: 'Unterschrift entfernen? Die Felder werden entsperrt.',
      allOk: 'Alle Unterschriften sind gültig', problem: 'Problem bei einer oder mehreren Unterschriften',
      common: 'unten', circ: 'Zeile(n)', locked: '🔒 Durch Unterschrift gesperrt', importWarn: 'Unterschriften der Datei geprüft',
      sealed: 'PDF versiegelt ✓ — jede Änderung wird vom PDF-Reader angezeigt', notSealed: 'PDF NICHT versiegelt (nicht angemeldet oder Konto nicht freigegeben): es bleibt spurlos änderbar.', sealError: 'PDF-Versiegelung fehlgeschlagen',
    },
    it: {
      title: 'Firme elettroniche', none: 'Nessuna firma elettronica.',
      sign: '✍️ Firmare elettronicamente', connected: 'Connesso', notConnected: 'Non connesso — l’accesso sarà richiesto per firmare.',
      login: 'Accedere', profile: 'Il mio profilo',
      pending: 'La sua iscrizione non è ancora stata convalidata. Firma non ancora possibile.',
      revoked: 'La sua autorizzazione a firmare è stata revocata.',
      noSig: 'Disegnare prima la firma in «Il mio profilo».',
      scopeTitle: 'Cosa firma?', scopeCommon: 'Dati comuni — firma in basso',
      scopeCommonHint: 'impianto, parametri di misura, verifiche visive, osservazioni',
      commonDone: 'Già firmati da', scopeCircuits: 'Circuiti — firma su ogni riga',
      confirm: 'Firmare', cancel: 'Annullare', noUnsigned: 'Tutti i circuiti sono già firmati.', nothing: 'Niente da firmare.',
      signed: 'Firmato ✓', removeLast: 'Rimuovere la mia ultima firma', confirmRemove: 'Rimuovere la firma? I campi saranno sbloccati.',
      allOk: 'Tutte le firme sono valide', problem: 'Problema su una o più firme',
      common: 'in basso', circ: 'riga/e', locked: '🔒 Bloccato da firma', importWarn: 'Firme del file verificate',
      sealed: 'PDF sigillato ✓ — ogni modifica sarà segnalata dal lettore PDF', notSealed: 'PDF NON sigillato (non connesso o account non convalidato): resta modificabile senza traccia.', sealError: 'Sigillatura del PDF impossibile',
    },
  };
  const STATUS_TXT = {
    fr: { valid: 'Valide', modified: 'Données modifiées après signature', image_replaced: 'Image de signature remplacée', unknown_signer: 'Signataire non autorisé', expired: 'Autorisation non valable à cette date', bad_signature: 'Signature falsifiée', broken_chain: 'Signatures précédentes modifiées' },
    de: { valid: 'Gültig', modified: 'Daten nach Unterschrift geändert', image_replaced: 'Unterschriftsbild ersetzt', unknown_signer: 'Nicht berechtigter Unterzeichner', expired: 'Berechtigung an diesem Datum ungültig', bad_signature: 'Unterschrift gefälscht', broken_chain: 'Frühere Unterschriften geändert' },
    it: { valid: 'Valida', modified: 'Dati modificati dopo la firma', image_replaced: 'Immagine della firma sostituita', unknown_signer: 'Firmatario non autorizzato', expired: 'Autorizzazione non valida a questa data', bad_signature: 'Firma falsificata', broken_chain: 'Firme precedenti modificate' },
  };
  const t = k => (TXT[currentLang] || TXT.fr)[k];
  const st = k => (STATUS_TXT[currentLang] || STATUS_TXT.fr)[k] || k;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------------------------------------------------------- ÉTAT */
  let signatures = [];     // signatures du protocole en cours
  let session = null;      // utilisateur connecté (ou null)
  let accStatus = null;    // authorized | pending | revoked
  let lastVerify = null;

  const newUid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 12) : Math.random().toString(36).slice(2, 14));

  /* -------------------------------------------------- 1. UID DES CIRCUITS */
  const _addCircuit = window.addCircuit;
  window.addCircuit = function (data) {
    const before = nextId;
    const r = _addCircuit.apply(this, arguments);
    if (nextId > before) {
      const el = $('cc-' + (nextId - 1));
      if (el) el.dataset.uid = (data && data.uid) || newUid();
      applyLocks();
    }
    return r;
  };
  const domUids = () => circuitIds.filter(id => !!$('cc-' + id)).map(id => $('cc-' + id).dataset.uid || ($('cc-' + id).dataset.uid = newUid()));
  function enrich(d) {
    const uids = domUids();
    (d.circuits || []).forEach((c, i) => { if (uids[i]) c.uid = uids[i]; });
    d.signatures = signatures;
    return d;
  }

  /* ------------------------------------------- 2. SAUVEGARDE / EXPORT JSON */
  const _collectAll = window.collectAll;
  window.collectAll = function () { return enrich(_collectAll.apply(this, arguments)); };
  const _saveData = window.saveData;
  window.saveData = function () {
    const r = _saveData.apply(this, arguments);
    try { const raw = localStorage.getItem(SKEY); if (raw) localStorage.setItem(SKEY, JSON.stringify(enrich(JSON.parse(raw)))); } catch (e) { console.error(e); }
    scheduleVerify();
    return r;
  };

  /* --------------------------------------------------------- 3. IMPORT */
  let _pendingImport = null;
  const _showImportModal = window.showImportModal;
  if (_showImportModal) window.showImportModal = function (d) { _pendingImport = d; return _showImportModal.apply(this, arguments); };
  const _doImport = window.doImport;
  if (_doImport) window.doImport = function (mode) {
    const d = _pendingImport;
    if (mode === 'replace') signatures = [];
    unlockAll();
    const r = _doImport.apply(this, arguments);
    if (mode === 'replace' && d) {
      signatures = Array.isArray(d.signatures) ? d.signatures : [];
      saveData(); applyLocks();
      verifyNow().then(() => { if (signatures.length) showToast(t('importWarn') + ' : ' + (lastVerify.allValid ? '✓' : '⚠️'), 3500); });
    } else applyLocks(); // fusion : les signatures du fichier importé ne sont pas reprises
    return r;
  };

  /* ------------------------------------------------- 4. VERROUILLAGE */
  function setLocked(el, locked) {
    if (!el) return;
    if (el.type === 'checkbox' || el.tagName === 'SELECT') el.disabled = locked; else el.readOnly = locked;
    el.style.opacity = locked ? '.75' : '';
  }
  function unlockAll() {
    COMMON_FIELDS.forEach(f => setLocked($(f), false));
    document.querySelectorAll('.cc').forEach(cc => {
      cc.querySelectorAll('input,select,textarea').forEach(el => setLocked(el, false));
      const del = cc.querySelector('.btn-del'); if (del) del.style.visibility = '';
      const b = cc.querySelector('.sa-lock'); if (b) b.remove();
    });
  }
  function applyLocks() {
    const locked = SA.lockedScope({ signatures });
    COMMON_FIELDS.forEach(f => setLocked($(f), locked.common));
    document.querySelectorAll('.cc').forEach(cc => {
      const isL = locked.circuits.has(cc.dataset.uid);
      cc.querySelectorAll('input,select,textarea').forEach(el => setLocked(el, isL));
      const del = cc.querySelector('.btn-del'); if (del) del.style.visibility = isL ? 'hidden' : '';
      let b = cc.querySelector('.sa-lock');
      if (isL && !b) { b = document.createElement('div'); b.className = 'sa-lock'; b.style.cssText = 'font-size:10.5px;color:var(--navy);font-weight:700;margin:-4px 0 6px;'; cc.insertBefore(b, cc.children[1]); }
      if (b) { if (isL) { const s = signerForCircuit(cc.dataset.uid); b.textContent = t('locked') + (s ? ' — ' + s.payload.name : ''); } else b.remove(); }
    });
  }

  /* --------------------------------------------------- 5. VÉRIFICATION */
  let vTimer = null;
  function scheduleVerify() { clearTimeout(vTimer); vTimer = setTimeout(verifyNow, 400); }
  async function verifyNow() {
    lastVerify = await SA.verify(collectAll());
    render();
    return lastVerify;
  }
  const isValid = i => !lastVerify || !lastVerify.results[i] || lastVerify.results[i].status === 'valid';
  function signerForCircuit(uid) {
    const i = signatures.findIndex(s => (s.payload.scope.circuits || []).includes(String(uid)));
    return i < 0 ? null : { ...signatures[i], valid: isValid(i) };
  }
  function commonSigner() {
    const i = signatures.findIndex(s => s.payload.scope.common);
    return i < 0 ? null : { ...signatures[i], valid: isValid(i) };
  }

  /* ------------------------------------------------------- 6. SESSION */
  async function refresh() {
    session = await SA.getSession();
    accStatus = session ? await SA.accountStatus(session.id) : null;
    render();
  }

  /* -------------------------------------------------------- 7. SIGNER */
  async function startSign() {
    session = await SA.getSession();
    if (!session) { session = window.Profil ? await Profil.login() : null; if (!session) return; }
    accStatus = await SA.accountStatus(session.id);
    if (accStatus === 'pending') { alert(t('pending')); return render(); }
    if (accStatus === 'revoked') { alert(t('revoked')); return render(); }
    const image = (window.Profil && Profil.getSignature()) || null;
    if (!image) { showToast(t('noSig'), 3500); if (window.Profil) Profil.open(); return; }

    saveData();
    const data = collectAll();
    const locked = SA.lockedScope(data);
    const unsigned = SA.unsignedCircuits(data);
    const common = commonSigner();
    const labels = {};
    (data.circuits || []).forEach((c, i) => labels[c.uid] = (c.groupe || (i + 1)) + (c.desig ? ' – ' + c.desig : ''));

    const rows = unsigned.length
      ? unsigned.map(u => `<label style="display:flex;gap:8px;align-items:center;padding:7px 0;font-size:13px;border-bottom:1px solid #f0f0f5;"><input type="checkbox" data-uid="${esc(u)}" checked/>${esc(labels[u] || u)}</label>`).join('')
      : `<p style="font-size:12.5px;color:var(--muted);padding:6px 0;">${t('noUnsigned')}</p>`;
    const commonRow = locked.common
      ? `<p style="font-size:12.5px;color:var(--muted);margin-bottom:12px;">🔒 ${t('scopeCommon')} — ${t('commonDone')} ${esc(common ? common.payload.name : '')}</p>`
      : `<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;margin-bottom:12px;"><input type="checkbox" id="sa-common" checked style="margin-top:2px;"/><span><b>${t('scopeCommon')}</b><br><span style="font-size:11.5px;color:var(--muted);">${t('scopeCommonHint')}</span></span></label>`;

    modal(`<h3 style="font-size:15px;color:var(--navy);margin-bottom:4px;">${t('scopeTitle')}</h3>
      <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">${t('connected')} : <b>${esc(session.name)}</b></p>
      ${commonRow}
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:2px;">${t('scopeCircuits')}</div>
      <div style="max-height:38vh;overflow:auto;margin-bottom:14px;">${rows}</div>
      <div style="display:flex;gap:8px;">
        <button data-act="close" style="${btnCss('#fff', 'var(--muted)')}">${t('cancel')}</button>
        <button data-act="ok" style="${btnCss('var(--red)')}flex:2;">${t('confirm')}</button>
      </div>`, async (act, m) => {
      if (act !== 'ok') return m.remove();
      const circuits = [...m.querySelectorAll('input[data-uid]:checked')].map(i => i.dataset.uid);
      const cb = m.querySelector('#sa-common');
      const scope = { common: !!(cb && cb.checked), circuits };
      if (!scope.common && !circuits.length) return showToast(t('nothing'));
      m.remove();
      try {
        const signed = await SA.sign(data, { scope, image }, session);
        signatures = signed.signatures;
        saveData(); applyLocks(); await verifyNow();
        showToast(t('signed'));
      } catch (e) { alert(e.message); }
    });
  }

  function removeLastOwn() {
    const last = signatures[signatures.length - 1];
    if (!last || !session || last.payload.signerId !== session.id) return;
    if (!confirm(t('confirmRemove'))) return;
    signatures = signatures.slice(0, -1);
    unlockAll(); applyLocks(); saveData();
  }

  /* --------------------------------------------------------- 8. AFFICHAGE */
  const btnCss = (bg, fg = '#fff') => `flex:1;background:${bg};color:${fg};border:${bg === '#fff' ? '1px solid var(--border)' : 'none'};border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;`;
  function modal(html, onAct) {
    const m = document.createElement('div');
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center;';
    m.innerHTML = `<div style="background:#fff;border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:520px;max-height:90vh;overflow:auto;">${html}</div>`;
    m.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) onAct(b.dataset.act, m); else if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    return m;
  }

  function panel() {
    let p = $('sa-panel');
    if (p) return p;
    const inst = $('sec-inst-hd') && $('sec-inst-hd').closest('.sec');
    p = document.createElement('div');
    p.className = 'sec'; p.id = 'sa-panel'; p.style.marginTop = '10px';
    if (inst) inst.after(p); else document.body.appendChild(p);
    p.addEventListener('click', e => {
      const a = e.target.closest('[data-sa]'); if (!a) return;
      e.preventDefault();
      ({ sign: startSign, remove: removeLastOwn, login: () => Profil.login(), profile: () => Profil.open() })[a.dataset.sa]();
    });
    return p;
  }

  function render() {
    const p = panel();
    const res = (lastVerify && lastVerify.results) || [];
    const uidPos = {}; domUids().forEach((u, i) => uidPos[u] = i + 1);
    const color = s => s === 'valid' ? 'var(--green,#2e7d32)' : '#c62828';

    const list = signatures.length ? signatures.map((s, i) => {
      const r = res[i] || { status: 'valid' };
      const nums = (s.payload.scope.circuits || []).map(u => uidPos[u] || '?').sort((a, b) => a - b);
      const parts = [];
      if (s.payload.scope.common) parts.push(t('common'));
      if (nums.length) parts.push(nums.length + ' ' + t('circ') + ' (' + nums.join(', ') + ')');
      const when = new Date(s.payload.signedAt).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' });
      return `<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #f0f0f5;">
        ${s.image ? `<img src="${esc(s.image)}" style="width:72px;height:36px;object-fit:contain;border:1px solid var(--border);border-radius:6px;background:#fafafa;"/>` : ''}
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;">${esc(s.payload.name)}</div>
          <div style="font-size:11px;color:var(--muted);">${when} · ${parts.join(' + ')}</div>
          <div style="font-size:11.5px;font-weight:700;color:${color(r.status)};">${r.status === 'valid' ? '✓' : '⚠️'} ${st(r.status)}</div>
        </div></div>`;
    }).join('') : `<p style="font-size:12.5px;color:var(--muted);padding:4px 0;">${t('none')}</p>`;

    const summary = signatures.length && lastVerify
      ? `<div style="font-size:12px;font-weight:700;padding:7px 10px;border-radius:8px;margin-bottom:8px;background:${lastVerify.allValid ? '#e8f5e9' : '#ffebee'};color:${lastVerify.allValid ? '#2e7d32' : '#c62828'};">${lastVerify.allValid ? '✓ ' + t('allOk') : '⚠️ ' + t('problem')}</div>` : '';

    const who = session
      ? `${t('connected')} : <b>${esc(session.name)}</b>${accStatus === 'pending' ? ' · <span style="color:#e65100;">⏳</span>' : accStatus === 'revoked' ? ' · <span style="color:#c62828;">⛔</span>' : ''} · <a href="#" data-sa="profile" style="color:var(--navy);">${t('profile')}</a>`
      : `${t('notConnected')} <a href="#" data-sa="login" style="color:var(--navy);">${t('login')}</a>`;

    const last = signatures[signatures.length - 1];
    const canRemove = last && session && last.payload.signerId === session.id;

    p.innerHTML = `<div class="sec-hd">${t('title')} <span class="cnt">${signatures.length}</span></div>
      <div class="sec-bd">${summary}${list}
        <button data-sa="sign" style="margin-top:10px;width:100%;background:var(--navy);color:#fff;border:none;border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;">${t('sign')}</button>
        ${canRemove ? `<button data-sa="remove" style="margin-top:6px;width:100%;background:none;border:none;color:var(--muted);font-size:12px;text-decoration:underline;cursor:pointer;">${t('removeLast')}</button>` : ''}
        <div style="font-size:11.5px;color:var(--muted);margin-top:10px;line-height:1.5;">${who}</div></div>`;
  }

  const _applyLang = window.applyLang;
  window.applyLang = function () { const r = _applyLang.apply(this, arguments); if ($('sa-panel')) render(); applyLocks(); return r; };

  /* ------------------------------------------------------------- 9. PDF */
  const ascii = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '?');
  const PDF_TXT = {
    fr: { ok: 'Toutes les signatures sont valides au moment de la generation de ce PDF.', ko: 'ATTENTION : une ou plusieurs signatures ne sont pas valides !', signedOn: 'Signe le', scope: 'Perimetre', commonL: 'donnees communes (bas de page)', lines: 'lignes', status: 'Statut', foot1: 'Signature electronique avancee (ECDSA P-256). Le fichier JSON signe est joint a ce PDF ; pour verifier, l\'importer dans l\'application.', sealedBy: 'PDF scelle (signature numerique PDF) par', foot3: 'toute modification de ce fichier est signalee par le lecteur PDF (panneau Signatures).', foot2: 'Toute modification des donnees apres signature est detectee lors de la verification.' },
    de: { ok: 'Alle Unterschriften sind zum Zeitpunkt der PDF-Erstellung gueltig.', ko: 'ACHTUNG: eine oder mehrere Unterschriften sind ungueltig!', signedOn: 'Unterschrieben am', scope: 'Umfang', commonL: 'gemeinsame Daten (unten)', lines: 'Zeilen', status: 'Status', foot1: 'Fortgeschrittene elektronische Unterschrift (ECDSA P-256). Die signierte JSON-Datei ist angehaengt; zur Pruefung in die App importieren.', sealedBy: 'PDF versiegelt (digitale PDF-Signatur) durch', foot3: 'jede Aenderung dieser Datei wird vom PDF-Reader angezeigt (Bereich Unterschriften).', foot2: 'Jede Aenderung der Daten nach der Unterschrift wird bei der Pruefung erkannt.' },
    it: { ok: 'Tutte le firme sono valide al momento della generazione di questo PDF.', ko: 'ATTENZIONE: una o piu firme non sono valide!', signedOn: 'Firmato il', scope: 'Perimetro', commonL: 'dati comuni (in basso)', lines: 'righe', status: 'Stato', foot1: 'Firma elettronica avanzata (ECDSA P-256). Il file JSON firmato e allegato; per verificarlo, importarlo nell\'applicazione.', sealedBy: 'PDF sigillato (firma digitale PDF) da', foot3: 'ogni modifica di questo file viene segnalata dal lettore PDF (pannello Firme).', foot2: 'Ogni modifica dei dati dopo la firma viene rilevata alla verifica.' },
  };

  async function addSignaturePage(blob, sealer) {
    if (!signatures.length || !window.PDFLib) return blob;
    const P = PDF_TXT[currentLang] || PDF_TXT.fr;
    const { PDFDocument, rgb, StandardFonts } = PDFLib;
    const v = await verifyNow();
    const data = collectAll();
    const doc = await PDFDocument.load(await blob.arrayBuffer());
    const page = doc.addPage([841.89, 595.28]);
    const { width: W, height: H } = page.getSize();
    const fB = await doc.embedFont(StandardFonts.HelveticaBold), fR = await doc.embedFont(StandardFonts.Helvetica);
    const NAVY = rgb(.102, .180, .369), GRAY = rgb(.42, .45, .5), BLACK = rgb(.1, .1, .18), GREEN = rgb(.18, .49, .2), RED = rgb(.78, .16, .16), LG = rgb(.94, .945, .97);
    const MM = 2.8346, ML = 8 * MM;
    const txt = (s, x, y, sz, f, c) => page.drawText(ascii(s), { x, y, size: sz, font: f, color: c || BLACK });

    page.drawRectangle({ x: ML, y: H - 15 * MM, width: W - 2 * ML, height: 15 * MM, color: NAVY });
    txt(ascii(t('title')).toUpperCase(), ML + 2 * MM, H - 7.5 * MM, 10, fB, rgb(1, 1, 1));
    txt((data.num_tableau || '') + '  -  ' + (data.nom_installation || '').split('\n')[0], ML + 2 * MM, H - 12 * MM, 6.5, fR, rgb(1, 1, 1));

    let y = H - 25 * MM;
    page.drawRectangle({ x: ML, y: y - 2 * MM, width: W - 2 * ML, height: 8 * MM, color: v.allValid ? rgb(.91, .96, .91) : rgb(1, .92, .93) });
    txt(v.allValid ? P.ok : P.ko, ML + 3 * MM, y + .5 * MM, 9, fB, v.allValid ? GREEN : RED);
    y -= 12 * MM;

    const uidIdx = {}, uidLbl = {}; (data.circuits || []).forEach((c, i) => { uidIdx[c.uid] = i; uidLbl[c.uid] = c.groupe || (i + 1); });
    for (let i = 0; i < signatures.length; i++) {
      const s = signatures[i], r = v.results[i], S = s.payload, rowH = 24 * MM;
      if (y - rowH < 20 * MM) break;
      if (i % 2 === 0) page.drawRectangle({ x: ML, y: y - rowH + 4 * MM, width: W - 2 * ML, height: rowH, color: LG });
      if (s.image) {
        try {
          const img = await doc.embedPng(Uint8Array.from(atob(s.image.split(',')[1]), c => c.charCodeAt(0)));
          let w = 55 * MM, h = w * img.height / img.width;
          if (h > 18 * MM) { h = 18 * MM; w = h * img.width / img.height; }
          page.drawImage(img, { x: ML + 2 * MM + (55 * MM - w) / 2, y: y - 16 * MM + (18 * MM - h) / 2, width: w, height: h });
        } catch (e) { }
      }
      const X = ML + 62 * MM;
      txt(S.name + (S.email ? '  -  ' + S.email : ''), X, y, 10, fB);
      txt(P.signedOn + ' ' + new Date(S.signedAt).toLocaleString('fr-CH'), X, y - 4.5 * MM, 7.5, fR, GRAY);
      const nums = (S.scope.circuits || []).slice().sort((x, y) => (uidIdx[x] ?? 99) - (uidIdx[y] ?? 99)).map(u => uidLbl[u] || '?');
      const parts = []; if (S.scope.common) parts.push(P.commonL); if (nums.length) parts.push(P.lines + ' ' + nums.join(', '));
      txt(P.scope + ' : ' + parts.join(' + '), X, y - 8.5 * MM, 7.5, fR);
      txt(P.status + ' : ' + st(r.status), X, y - 12.5 * MM, 8, fB, r.status === 'valid' ? GREEN : RED);
      txt('ID : ' + S.signerId + '   SHA-256 : ' + S.dataHash, X, y - 16.5 * MM, 6, fR, GRAY);
      y -= rowH;
    }
    if (sealer) txt(P.sealedBy + ' ' + sealer.name + (sealer.email ? ' (' + sealer.email + ')' : '') + ' - ' + P.foot3, ML, 16 * MM, 7, fB, NAVY);
    txt(P.foot1, ML, 12 * MM, 7, fR, GRAY);
    txt(P.foot2, ML, 8 * MM, 7, fR, GRAY);

    await doc.attach(new TextEncoder().encode(JSON.stringify(data, null, 2)), 'protocole_signe.json',
      { mimeType: 'application/json', description: 'Protocole signe', creationDate: new Date(), modificationDate: new Date() });
    return new Blob([await doc.save()], { type: 'application/pdf' });
  }

  // Qui scelle le PDF : l'utilisateur connecté et autorisé. Si le protocole
  // contient des signatures et que personne n'est connecté, la connexion est proposée.
  async function resolveSealer() {
    let s = await SA.getSession();
    if (!s && signatures.length && window.Profil) s = await Profil.login();
    if (!s || !s.code) return null;
    if (await SA.accountStatus(s.id) !== 'authorized') return null;
    const entry = await SA.parseCode(s.code);
    return { privateKey: s.privateKey, publicJwk: entry.publicJwk, name: s.name, email: s.email };
  }

  if (typeof window.buildPDFBlob === 'function') {
    const _buildPDFBlob = window.buildPDFBlob;
    window.buildPDFBlob = async function () {
      await verifyNow(); // statut à jour pour la page 1 (images sur les lignes / bas de page)
      const sealer = await resolveSealer();
      const res = await _buildPDFBlob.apply(this, arguments);
      try { res.blob = await addSignaturePage(res.blob, sealer); } catch (e) { console.error('Page signatures :', e); }
      if (sealer && window.PdfScellement) {
        try {
          const data = collectAll();
          const sealedBytes = await PdfScellement.seal(new Uint8Array(await res.blob.arrayBuffer()), sealer,
            { reason: 'Protocole premieres verifications ' + (data.num_tableau || ''), location: data.lieu || '' });
          res.blob = new Blob([sealedBytes], { type: 'application/pdf' });
          setTimeout(() => showToast(t('sealed'), 3500), 2500);
        } catch (e) { console.error('Scellement :', e); setTimeout(() => showToast(t('sealError') + ' : ' + e.message, 5000), 2500); }
      } else setTimeout(() => showToast(t('notSealed'), 5000), 2500);
      return res;
    };
  }

  /* -------------------------------------------------------- 10. DÉMARRAGE */
  window.addEventListener('DOMContentLoaded', async () => {
    // loadData() a déjà été exécuté (listener de signature.js enregistré avant)
    try { const raw = localStorage.getItem(SKEY); if (raw) { const d = JSON.parse(raw); signatures = Array.isArray(d.signatures) ? d.signatures : []; } } catch (e) { }
    applyLocks();
    await refresh();
    await verifyNow();
  });

  window.SignatureUI = { refresh, verifyNow, startSign, signerForCircuit, commonSigner, getSignatures: () => signatures };
})();
