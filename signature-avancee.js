/* ============================================================================
 * signature-avancee.js — Moteur de signature électronique avancée
 * ----------------------------------------------------------------------------
 * Comptes :
 *  - à l'inscription, une paire de clés ECDSA P-256 est générée sur l'appareil ;
 *    la clé privée est chiffrée avec le mot de passe de l'utilisateur
 *    (PBKDF2-SHA256 600 000 itérations + AES-256-GCM) ;
 *  - le résultat est un « code d'inscription » (texte SBB1.…) envoyé par e-mail
 *    au responsable, qui le colle dans utilisateurs.txt ;
 *  - sur n'importe quel appareil, nom + mot de passe déchiffrent la clé.
 *    Sans le mot de passe, personne (ni le responsable) ne peut signer.
 * Signatures :
 *  - chaque signature couvre un périmètre (données communes et/ou circuits) via
 *    une empreinte SHA-256 ; toute modification ultérieure est détectée ;
 *  - seules les clés présentes dans utilisateurs.txt sont acceptées.
 * 100 % hors-ligne, aucune dépendance.
 * ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ CONFIG */
  const CONFIG = {
    // Clés du JSON exclues des « données communes »
    excludedKeys: ['signatures', 'sigData', 'lang', '_version', '_app', 'circuits'],
    circuitKey: 'uid',            // identifiant stable d'un circuit
    codePrefix: 'SBB1.',
    registryUrl: 'utilisateurs.txt', // liste des personnes autorisées (texte simple)
    pbkdf2Iterations: 600000,
    minPasswordLength: 12,
    db: { name: 'sbb-signature', store: 'keys', version: 1 },
  };

  const subtle = global.crypto && global.crypto.subtle;
  const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
  const SIG_ALG = { name: 'ECDSA', hash: 'SHA-256' };
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  /* ----------------------------------------------------------------- HELPERS */
  function b64url(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(str) {
    const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s + '==='.slice((s.length + 3) % 4));
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  }
  // Sérialisation canonique (clés triées) : même donnée → même empreinte
  function canonical(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort()
      .map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  }
  async function sha256(str) { return b64url(await subtle.digest('SHA-256', enc.encode(str))); }
  async function fingerprint(jwk) {
    return (await sha256(canonical({ crv: 'P-256', kty: 'EC', x: jwk.x, y: jwk.y }))).slice(0, 22);
  }
  function circuitId(c, i) {
    const k = c && c[CONFIG.circuitKey];
    return k != null && k !== '' ? String(k) : '#' + i;
  }
  const rnd = n => global.crypto.getRandomValues(new Uint8Array(n));

  /* ---------------------------------------------------------------- INDEXEDDB */
  function openDb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(CONFIG.db.name, CONFIG.db.version);
      r.onupgradeneeded = () => r.result.createObjectStore(CONFIG.db.store);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function dbOp(mode, fn) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const tx = db.transaction(CONFIG.db.store, mode);
      const r = fn(tx.objectStore(CONFIG.db.store));
      tx.oncomplete = () => res(r && r.result);
      tx.onerror = () => rej(tx.error);
    });
  }
  const dbGet = k => dbOp('readonly', s => s.get(k));
  const dbPut = (k, v) => dbOp('readwrite', s => s.put(v, k));
  const dbDel = k => dbOp('readwrite', s => s.delete(k));

  /* ---------------------------------------------------------- COMPTES / CODES */
  async function passwordKey(password, salt, iterations) {
    const base = await subtle.importKey('raw', enc.encode(String(password).normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  // Crée un compte : retourne { code, entry, privateKey }
  async function createAccount({ nom, prenom, email, password }) {
    nom = String(nom || '').trim(); prenom = String(prenom || '').trim(); email = String(email || '').trim();
    if (!nom || !prenom) throw new Error('NAME_REQUIRED');
    if (String(password || '').length < CONFIG.minPasswordLength) throw new Error('PASSWORD_TOO_SHORT');
    const kp = await subtle.generateKey(ALG, true, ['sign', 'verify']);
    const jwk = await subtle.exportKey('jwk', kp.publicKey);
    const pkcs8 = await subtle.exportKey('pkcs8', kp.privateKey);
    const salt = rnd(16), iv = rnd(12), it = CONFIG.pbkdf2Iterations;
    const aes = await passwordKey(password, salt, it);
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(jwk.x + '.' + jwk.y) }, aes, pkcs8);
    const body = { v: 1, nom, prenom, email, d: new Date().toISOString().slice(0, 10),
      x: jwk.x, y: jwk.y, s: b64url(salt), i: b64url(iv), it, k: b64url(ct) };
    const code = CONFIG.codePrefix + b64url(enc.encode(JSON.stringify(body)));
    const entry = await parseCode(code);
    const privateKey = await subtle.importKey('pkcs8', pkcs8, ALG, false, ['sign']); // non exportable
    return { code, entry, privateKey };
  }

  // Lit un code d'inscription (espaces et retours à la ligne ignorés)
  async function parseCode(code, revoque) {
    const s = String(code || '').replace(/\s+/g, '');
    if (!s.startsWith(CONFIG.codePrefix)) throw new Error('BAD_CODE');
    let b;
    try { b = JSON.parse(dec.decode(unb64url(s.slice(CONFIG.codePrefix.length)))); } catch (e) { throw new Error('BAD_CODE'); }
    if (b.v !== 1 || !b.x || !b.y || !b.k) throw new Error('BAD_CODE');
    const publicJwk = { kty: 'EC', crv: 'P-256', x: b.x, y: b.y };
    return {
      id: await fingerprint(publicJwk), code: s,
      nom: b.nom, prenom: b.prenom, name: (b.nom + ' ' + b.prenom).trim(), email: b.email || '',
      publicJwk, validFrom: b.d || null, validUntil: revoque || null,
      enc: { s: b.s, i: b.i, it: b.it, k: b.k },
    };
  }

  // Déchiffre la clé privée avec le mot de passe → CryptoKey non exportable
  async function unlock(entry, password) {
    const e = entry.enc;
    const aes = await passwordKey(password, unb64url(e.s), e.it);
    let pkcs8;
    try {
      pkcs8 = await subtle.decrypt({ name: 'AES-GCM', iv: unb64url(e.i),
        additionalData: enc.encode(entry.publicJwk.x + '.' + entry.publicJwk.y) }, aes, unb64url(e.k));
    } catch (err) { throw new Error('BAD_PASSWORD'); }
    return subtle.importKey('pkcs8', pkcs8, ALG, false, ['sign']);
  }

  /* ---------------------------------------------------------------- REGISTRE */
  // utilisateurs.txt : texte libre, tolérant aux erreurs de copie.
  //   - une ligne commençant par SBB1. démarre un code, les lignes suivantes
  //     composées uniquement de caractères base64 le prolongent ;
  //   - # ou // = commentaire ; accents graves, virgules, guillemets ignorés ;
  //   - « REVOQUE 2026-12-31 » sous un code le révoque à cette date.
  function parseRegistryText(txt) {
    const items = []; let cur = null;
    const flush = () => { if (cur) { items.push(cur); cur = null; } };
    for (const raw of String(txt || '').split(/\r?\n/)) {
      const line = raw.trim();
      const part = line.replace(/(\/\/|#).*$/, '').replace(/[`'",;{}\[\]]/g, ' ').replace(/^\s*code\s*:/i, '').trim();
      const rev = line.match(/r[ée]voqu[ée]?\s*:?\s*(\d{4}-\d{2}-\d{2})/i);
      if (/^SBB1\./.test(part)) { flush(); cur = { code: part.split(/\s+/)[0], revoque: null }; }
      else if (cur && /^[A-Za-z0-9_-]+$/.test(part)) cur.code += part;
      else if (part && !rev) flush();
      if (rev) { const target = cur || items[items.length - 1]; if (target) target.revoque = rev[1]; }
    }
    flush();
    return items;
  }

  let _registry = null, _registryInfo = { loaded: false, codes: 0, errors: 0 };
  async function loadRegistry(force) {
    if (_registry && !force) return _registry;
    let items = [], loaded = false;
    if (Array.isArray(global.UTILISATEURS)) { items = items.concat(global.UTILISATEURS); loaded = true; } // ancien format / tests
    if (CONFIG.registryUrl && typeof fetch === 'function' && global.location && /^https?:/.test(global.location.protocol)) {
      try {
        const r = await fetch(CONFIG.registryUrl, { cache: 'no-cache' });
        if (r.ok) { items = items.concat(parseRegistryText(await r.text())); loaded = true; }
      } catch (e) { console.warn('utilisateurs.txt inaccessible', e); }
    }
    const out = [], seen = new Set(); let errors = 0;
    for (const item of items) {
      try {
        const code = typeof item === 'string' ? item : item && item.code;
        const e = await parseCode(code, item && item.revoque);
        if (!seen.has(e.id)) { seen.add(e.id); out.push(e); }
      } catch (err) { errors++; console.warn('utilisateurs.txt : code illisible ignoré', err); }
    }
    out.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    _registryInfo = { loaded, codes: out.length, errors };
    return (_registry = out);
  }
  const registryInfo = () => _registryInfo;
  async function findUser(id) { return (await loadRegistry()).find(u => u.id === id) || null; }
  // 'authorized' | 'pending' (absent du registre) | 'revoked'
  async function accountStatus(id) {
    const u = await findUser(id);
    if (!u) return 'pending';
    if (u.validUntil && new Date().toISOString().slice(0, 10) > u.validUntil) return 'revoked';
    return 'authorized';
  }

  /* ----------------------------------------------------------------- SESSION */
  let _session = null; // { id, name, email, code, privateKey }
  async function openSession(entry, privateKey, remember) {
    _session = { id: entry.id, name: entry.name, nom: entry.nom, prenom: entry.prenom, email: entry.email, code: entry.code, privateKey };
    try { if (remember) await dbPut('session', _session); else await dbDel('session'); } catch (e) { console.warn(e); }
    return _session;
  }
  async function login(entry, password, remember) { return openSession(entry, await unlock(entry, password), remember); }
  async function getSession() {
    if (_session) return _session;
    try { _session = (await dbGet('session')) || null; } catch (e) { _session = null; }
    return _session;
  }
  async function logout() { _session = null; try { await dbDel('session'); } catch (e) { } }

  /* ---------------------------------------------------------------- PÉRIMÈTRE */
  function extractScope(data, scope) {
    const out = {};
    if (scope.common) {
      out.common = {};
      for (const k of Object.keys(data)) if (!CONFIG.excludedKeys.includes(k)) out.common[k] = data[k];
    }
    const wanted = new Set((scope.circuits || []).map(String));
    out.circuits = {};
    (data.circuits || []).forEach((c, i) => { const id = circuitId(c, i); if (wanted.has(id)) out.circuits[id] = c; });
    for (const id of wanted) if (!(id in out.circuits)) out.circuits[id] = null; // circuit supprimé → détecté
    return out;
  }
  function lockedScope(data) {
    const res = { common: false, circuits: new Set() };
    for (const s of data.signatures || []) {
      if (s.payload.scope.common) res.common = true;
      (s.payload.scope.circuits || []).forEach(c => res.circuits.add(String(c)));
    }
    return res;
  }
  function unsignedCircuits(data) {
    const locked = lockedScope(data).circuits;
    return (data.circuits || []).map(circuitId).filter(id => !locked.has(id));
  }

  /* ---------------------------------------------------------------- SIGNATURE */
  // Retourne une COPIE de data avec la signature ajoutée dans data.signatures
  async function sign(data, { scope, image } = {}, session) {
    session = session || await getSession();
    if (!session) throw new Error('NOT_LOGGED_IN');
    const d = JSON.parse(JSON.stringify(data));
    d.signatures = d.signatures || [];
    const locked = lockedScope(d);
    scope = scope || { common: !locked.common, circuits: unsignedCircuits(d) };
    scope = { common: !!scope.common, circuits: (scope.circuits || []).map(String).sort() };
    if (scope.common && locked.common) throw new Error('ALREADY_SIGNED');
    if (scope.circuits.some(c => locked.circuits.has(c))) throw new Error('ALREADY_SIGNED');
    if (!scope.common && !scope.circuits.length) throw new Error('NOTHING_TO_SIGN');

    const payload = {
      v: 1, signerId: session.id, name: session.name, email: session.email || '',
      signedAt: new Date().toISOString(), scope,
      dataHash: await sha256(canonical(extractScope(d, scope))),
      imageHash: image ? await sha256(image) : null,
      prevHash: await sha256(canonical(d.signatures.map(s => s.sig))), // chaînage
    };
    const sig = await subtle.sign(SIG_ALG, session.privateKey, enc.encode(canonical(payload)));
    d.signatures.push({ payload, sig: b64url(sig), image: image || null });
    return d;
  }

  /* ------------------------------------------------------------ VÉRIFICATION */
  // Statuts : valid | modified | image_replaced | unknown_signer | expired | bad_signature | broken_chain
  async function verify(data, registry) {
    registry = registry || await loadRegistry();
    const sigs = data.signatures || [];
    const results = [];
    for (let i = 0; i < sigs.length; i++) {
      const { payload, sig, image } = sigs[i];
      const r = { index: i, name: payload.name, email: payload.email, signedAt: payload.signedAt, scope: payload.scope, status: 'valid' };
      results.push(r);
      const u = registry.find(a => a.id === payload.signerId);
      if (!u) { r.status = 'unknown_signer'; continue; }
      const day = payload.signedAt.slice(0, 10);
      if ((u.validFrom && day < u.validFrom) || (u.validUntil && day > u.validUntil)) { r.status = 'expired'; continue; }
      let ok = false;
      try {
        const pub = await subtle.importKey('jwk', { ...u.publicJwk, ext: true }, ALG, false, ['verify']);
        ok = await subtle.verify(SIG_ALG, pub, unb64url(sig), enc.encode(canonical(payload)));
      } catch (e) { ok = false; }
      if (!ok || payload.name !== u.name) { r.status = 'bad_signature'; continue; }
      if (await sha256(canonical(sigs.slice(0, i).map(s => s.sig))) !== payload.prevHash) { r.status = 'broken_chain'; continue; }
      if (payload.imageHash && (!image || await sha256(image) !== payload.imageHash)) { r.status = 'image_replaced'; continue; }
      if (await sha256(canonical(extractScope(data, payload.scope))) !== payload.dataHash) { r.status = 'modified'; continue; }
    }
    return { allValid: results.every(r => r.status === 'valid'), results };
  }

  global.SignatureAvancee = {
    CONFIG, createAccount, parseCode, unlock, loadRegistry, registryInfo, parseRegistryText, findUser, accountStatus,
    login, openSession, getSession, logout,
    sign, verify, lockedScope, unsignedCircuits, circuitId,
    _canonical: canonical, _sha256: sha256,
  };
})(typeof window !== 'undefined' ? window : globalThis);
