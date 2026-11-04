/* ============================================================================
 * pdf-scellement.js — Scellement du PDF par signature numérique PDF
 * ----------------------------------------------------------------------------
 * Ajoute au PDF une signature numérique standard (adbe.pkcs7.detached,
 * ECDSA P-256 / SHA-256) avec la clé de signature de l'utilisateur connecté,
 * en mode « certification, aucune modification autorisée » (DocMDP P=1).
 *
 * Un lecteur PDF (Acrobat, PDF-XChange…) affiche alors la signature dans son
 * panneau « Signatures ». Toute modification du fichier après coup
 * (texte, annotation, page…) rend la signature INVALIDE et le lecteur
 * l'indique (« document modifié depuis la signature »).
 *
 * Le certificat est auto-signé (identité vérifiée par l'application, pas par
 * une autorité reconnue) : le lecteur indique donc « identité inconnue » tant
 * que le certificat n'est pas ajouté aux certificats de confiance.
 * Aucune dépendance (pdf-lib + WebCrypto).
 * ========================================================================== */
(function (global) {
  'use strict';

  const SIG_SPACE = 8192;                 // octets réservés pour la signature CMS
  const BR_PLACEHOLDER = '**********';    // 10 caractères par valeur de ByteRange
  const subtle = global.crypto.subtle;
  const enc = new TextEncoder();

  /* ------------------------------------------------------------- DER (ASN.1) */
  const cat = (...arrs) => { const n = arrs.reduce((a, b) => a + b.length, 0), o = new Uint8Array(n); let i = 0; for (const a of arrs) { o.set(a, i); i += a.length; } return o; };
  function len(n) {
    if (n < 0x80) return Uint8Array.of(n);
    const b = []; while (n > 0) { b.unshift(n & 0xff); n >>= 8; }
    return Uint8Array.of(0x80 | b.length, ...b);
  }
  const tlv = (tag, ...content) => { const c = cat(...content); return cat(Uint8Array.of(tag), len(c.length), c); };
  const SEQ = (...c) => tlv(0x30, ...c);
  const SET = (...c) => tlv(0x31, ...c);
  const SET_SORTED = items => SET(...items.slice().sort(cmpBytes)); // SET OF : tri DER
  const CTX = (n, ...c) => tlv(0xa0 + n, ...c);                    // [n] constructed
  const OCTET = b => tlv(0x04, b);
  const NULL = () => Uint8Array.of(0x05, 0x00);
  const UTF8 = s => tlv(0x0c, enc.encode(s));
  const IA5 = s => tlv(0x16, enc.encode(s));
  const BOOL = v => Uint8Array.of(0x01, 0x01, v ? 0xff : 0x00);
  function INT(bytes) {
    if (typeof bytes === 'number') { const b = []; let n = bytes; do { b.unshift(n & 0xff); n >>= 8; } while (n > 0); bytes = Uint8Array.from(b); }
    let i = 0; while (i < bytes.length - 1 && bytes[i] === 0 && !(bytes[i + 1] & 0x80)) i++;
    bytes = bytes.slice(i);
    if (bytes[0] & 0x80) bytes = cat(Uint8Array.of(0), bytes);
    return tlv(0x02, bytes);
  }
  function OID(s) {
    const p = s.split('.').map(Number), out = [40 * p[0] + p[1]];
    for (const v of p.slice(2)) { const b = []; let n = v; do { b.unshift(n & 0x7f); n = Math.floor(n / 128); } while (n > 0); for (let i = 0; i < b.length - 1; i++) b[i] |= 0x80; out.push(...b); }
    return tlv(0x06, Uint8Array.from(out));
  }
  function BITS(bytes, unused = 0) { return tlv(0x03, Uint8Array.of(unused), bytes); }
  function TIME(d) { // UTCTime jusqu'en 2049, GeneralizedTime au-delà
    const p = n => String(n).padStart(2, '0'), y = d.getUTCFullYear();
    const s = p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z';
    return y < 2050 ? tlv(0x17, enc.encode(String(y).slice(2) + s)) : tlv(0x18, enc.encode(y + s));
  }
  function cmpBytes(a, b) { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; }

  const O = {
    sha256: '2.16.840.1.101.3.4.2.1', ecdsaSha256: '1.2.840.10045.4.3.2',
    data: '1.2.840.113549.1.7.1', signedData: '1.2.840.113549.1.7.2',
    contentType: '1.2.840.113549.1.9.3', messageDigest: '1.2.840.113549.1.9.4', signingTime: '1.2.840.113549.1.9.5',
    cn: '2.5.4.3', ou: '2.5.4.11', email: '1.2.840.113549.1.9.1',
    keyUsage: '2.5.29.15', basicConstraints: '2.5.29.19',
  };
  const ALG_ECDSA = SEQ(OID(O.ecdsaSha256));
  const ALG_SHA256 = SEQ(OID(O.sha256), NULL());

  // Signature WebCrypto (r||s brut) → ECDSA-Sig-Value DER
  async function ecdsaSign(privateKey, data) {
    const raw = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data));
    const h = raw.length / 2;
    return SEQ(INT(raw.slice(0, h)), INT(raw.slice(h)));
  }
  const sha256 = async b => new Uint8Array(await subtle.digest('SHA-256', b));

  /* ---------------------------------------------------- CERTIFICAT AUTO-SIGNÉ */
  async function selfSignedCert({ privateKey, publicJwk, name, email, now }) {
    const pub = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: publicJwk.x, y: publicJwk.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
    const spki = new Uint8Array(await subtle.exportKey('spki', pub));
    const rdn = (oid, val) => SET(SEQ(OID(oid), val));
    const dn = SEQ(
      rdn(O.cn, UTF8(name)),
      ...(email ? [rdn(O.email, IA5(email))] : []),
      rdn(O.ou, UTF8('Signature avancee - Premieres verifications (certificat auto-signe)'))
    );
    const serial = global.crypto.getRandomValues(new Uint8Array(16)); serial[0] &= 0x7f; serial[0] |= 0x01;
    const notAfter = new Date(now); notAfter.setUTCFullYear(notAfter.getUTCFullYear() + 5);
    const extensions = CTX(3, SEQ(
      SEQ(OID(O.keyUsage), BOOL(true), OCTET(BITS(Uint8Array.of(0xc0), 6))),        // digitalSignature + nonRepudiation
      SEQ(OID(O.basicConstraints), BOOL(true), OCTET(SEQ()))                        // CA = faux
    ));
    const tbs = SEQ(CTX(0, INT(2)), INT(serial), ALG_ECDSA, dn, SEQ(TIME(now), TIME(notAfter)), dn, spki, extensions);
    const cert = SEQ(tbs, ALG_ECDSA, BITS(await ecdsaSign(privateKey, tbs)));
    return { cert, issuer: dn, serial };
  }

  /* ---------------------------------------------------- CMS SignedData détaché */
  async function cmsSign({ privateKey, publicJwk, name, email }, digest, now) {
    const { cert, issuer, serial } = await selfSignedCert({ privateKey, publicJwk, name, email, now });
    const attrs = [
      SEQ(OID(O.contentType), SET(OID(O.data))),
      SEQ(OID(O.signingTime), SET(TIME(now))),
      SEQ(OID(O.messageDigest), SET(OCTET(digest))),
    ];
    const signedAttrsForSig = SET_SORTED(attrs);                    // signé avec la balise SET (0x31)
    const signature = await ecdsaSign(privateKey, signedAttrsForSig);
    const signedAttrs = cat(Uint8Array.of(0xa0), signedAttrsForSig.slice(1)); // puis [0] IMPLICIT
    const signerInfo = SEQ(INT(1), SEQ(issuer, INT(serial)), ALG_SHA256, signedAttrs, ALG_ECDSA, OCTET(signature));
    const signedData = SEQ(INT(1), SET(ALG_SHA256), SEQ(OID(O.data)), CTX(0, cert), SET(signerInfo));
    return SEQ(OID(O.signedData), CTX(0, signedData));
  }

  /* ------------------------------------------------------------ PDF */
  const pdfDate = d => { const p = n => String(n).padStart(2, '0'); const o = -d.getTimezoneOffset(), s = o >= 0 ? '+' : '-';
    return `D:${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${s}${p(Math.floor(Math.abs(o) / 60))}'${p(Math.abs(o) % 60)}'`; };
  const latin1 = b => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return s; };

  // signer = { privateKey, publicJwk, name, email }, opts = { reason, location }
  async function seal(pdfBytes, signer, opts = {}) {
    const { PDFDocument, PDFName, PDFNumber, PDFHexString, PDFString } = global.PDFLib;
    const now = new Date();
    const doc = await PDFDocument.load(pdfBytes);
    const ctx = doc.context, page = doc.getPages()[0];

    const sigDict = ctx.obj({
      Type: 'Sig', Filter: 'Adobe.PPKLite', SubFilter: 'adbe.pkcs7.detached',
      ByteRange: [PDFNumber.of(0), PDFName.of(BR_PLACEHOLDER), PDFName.of(BR_PLACEHOLDER), PDFName.of(BR_PLACEHOLDER)],
      Contents: PDFHexString.of('0'.repeat(SIG_SPACE * 2)),
      Name: PDFString.of(signer.name), M: PDFString.of(pdfDate(now)),
      Reason: PDFString.of(opts.reason || ''), Location: PDFString.of(opts.location || ''),
      ContactInfo: PDFString.of(signer.email || ''),
      // Certification : aucune modification autorisée après signature
      Reference: [ctx.obj({ Type: 'SigRef', TransformMethod: 'DocMDP', TransformParams: ctx.obj({ Type: 'TransformParams', P: 1, V: PDFName.of('1.2') }) })],
    });
    const sigRef = ctx.register(sigDict);
    const widget = ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Sig', Rect: [0, 0, 0, 0], V: sigRef, T: PDFString.of('Signature1'), F: 132, P: page.ref });
    const widgetRef = ctx.register(widget);
    let annots = page.node.lookup(PDFName.of('Annots'));
    if (!annots) { annots = ctx.obj([]); page.node.set(PDFName.of('Annots'), annots); }
    annots.push(widgetRef);
    doc.catalog.set(PDFName.of('AcroForm'), ctx.obj({ Fields: [widgetRef], SigFlags: 3 }));
    doc.catalog.set(PDFName.of('Perms'), ctx.obj({ DocMDP: sigRef }));

    const bytes = await doc.save({ useObjectStreams: false });
    const s = latin1(bytes);

    // Repérer /Contents <000…> et /ByteRange [0 /*** /*** /***]
    const ph = '<' + '0'.repeat(SIG_SPACE * 2) + '>';
    const start = s.indexOf(ph); if (start < 0 || s.indexOf(ph, start + 1) >= 0) throw new Error('Placeholder signature introuvable');
    const end = start + ph.length;
    const brMatch = /\/ByteRange\s*\[\s*0\s+\/\*{10}\s+\/\*{10}\s+\/\*{10}\s*\]/.exec(s);
    if (!brMatch) throw new Error('ByteRange introuvable');
    const range = [0, start, end, bytes.length - end];
    let brText = '/ByteRange [' + range.join(' ') + ']';
    if (brText.length > brMatch[0].length) throw new Error('ByteRange trop long');
    brText = brText.padEnd(brMatch[0].length, ' ');
    bytes.set(enc.encode(brText), brMatch.index);

    // Empreinte des deux plages, puis signature CMS
    const digest = await sha256(cat(bytes.subarray(0, start), bytes.subarray(end)));
    const cms = await cmsSign(signer, digest, now);
    if (cms.length > SIG_SPACE) throw new Error('Signature trop grande');
    const hex = Array.from(cms, b => b.toString(16).padStart(2, '0')).join('').padEnd(SIG_SPACE * 2, '0');
    bytes.set(enc.encode(hex), start + 1);
    return bytes;
  }

  global.PdfScellement = { seal, _cmsSign: cmsSign, _selfSignedCert: selfSignedCert };
})(typeof window !== 'undefined' ? window : globalThis);
