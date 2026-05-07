/* Application SBB */
let currentLang = 'fr';

function setLang(lang) {
  currentLang = lang;
  // Update active button
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.lang-btn').forEach(b => { if(b.textContent===lang.toUpperCase()) b.classList.add('active'); });
  applyLang();
  saveData();
}

function applyLang() {
  const T = I18N[currentLang];
  const s = (id, val) => { const e = document.getElementById(id); if(e) e.innerHTML = val; };
  const st = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
  const sp = (id, val) => { const e = document.getElementById(id); if(e) e.placeholder = val; };

  s('hdr-title', T.hdrTitle);
  st('saveTxt', T.saveTxt);
  st('btn-save-lbl', T.btnSave);
  st('btn-pdf-lbl', T.btnPdf);
  st('btn-add-lbl', T.btnAdd);
  st('no-circuit-msg', T.noCircuit);

  st('sec-install-hd', T.secInstall);
  st('sec-mesures-hd', T.secMesures);
  st('sec-circuits-hd', T.secCircuits);
  st('sec-vc-hd', T.secVc);
  st('sec-rem-hd', T.secRem);
  st('sec-inst-hd', T.secInst);

  st('lbl-nom-install', T.lblNomInstall);
  st('lbl-num-tab', T.lblNumTab);
  st('lbl-page', T.lblPage);
  st('lbl-objet', T.lblObjet);
  st('lbl-compteur', T.lblCompteur);
  st('lbl-cc-gen', T.lblCcGen);
  st('lbl-cc-abo', T.lblCcAbo);
  st('lbl-tension', T.lblTension);
  st('lbl-instrument', T.lblInstrument);
  st('lbl-inventaire', T.lblInventaire);
  st('lbl-facteur', T.lblFacteur);
  st('lbl-val-facteur', T.lblValFacteur);
  st('lbl-rem', T.lblRem);
  st('lbl-nom-prenom', T.lblNomPrenom);
  st('lbl-lieu', T.lblLieu);
  st('lbl-date', T.lblDate);

  T.vcLabels.forEach((lbl, i) => st('vc-lbl-'+(i+1), lbl));
  st('lbl-sig', T.lblSig||'Signature');
  const ph=$('sig-placeholder');if(ph)ph.textContent=T.sigPlaceholder||'Appuyez pour signer...';

  // Update circuit sub-labels already rendered
  document.querySelectorAll('[data-lbl]').forEach(el => {
    const key = el.getAttribute('data-lbl');
    if(T[key]) el.textContent = T[key];
  });
  // Update circuit input placeholders
  document.querySelectorAll('[data-ph]').forEach(el => {
    const key = el.getAttribute('data-ph');
    if(T[key]) el.placeholder = T[key];
  });
}

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════
const SKEY='sbb_proto_v3';
let circuitIds=[],nextId=1,autoTimer=null;
const $=id=>document.getElementById(id);
function gv(id){const e=$(id);if(!e)return'';return e.type==='checkbox'?e.checked:(e.value||'');}
function sv(id,v){const e=$(id);if(!e)return;e.type==='checkbox'?e.checked=!!v:e.value=v;}
function showToast(msg,dur=2200){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),dur);}
function markUnsaved(){$('saveDot').className='dot unsaved';$('saveTxt').textContent=I18N[currentLang].unsaved;}
function markSaved(){$('saveDot').className='dot';$('saveTxt').textContent=I18N[currentLang].saved;}
document.addEventListener('input',()=>{markUnsaved();clearTimeout(autoTimer);autoTimer=setTimeout(saveData,1800);});
document.addEventListener('change',()=>{markUnsaved();clearTimeout(autoTimer);autoTimer=setTimeout(saveData,1800);});

// ═══════════════════════════════════════════════════════════
// CIRCUITS
// ═══════════════════════════════════════════════════════════
function addCircuit(data){
  if(!data && circuitIds.length>=18){
    showToast('Maximum 18 circuits');
    return;
  }
  const T=I18N[currentLang];
  const id=nextId++;circuitIds.push(id);
  const box=$('circuits-container');
  const p=box.querySelector('p');if(p)p.remove();
  const d=document.createElement('div');d.className='cc';d.id='cc-'+id;
  d.innerHTML=`
    <div class="cc-hdr">
      <div class="cc-groupe">
        <div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;margin-bottom:2px;" data-lbl="lblGroupe">${T.lblGroupe}</div>
        <input type="text" id="groupe_${id}" data-ph="lblGroupe" placeholder="—" value="${(data&&data.groupe)||''}" style="border:1px solid var(--border);border-radius:6px;padding:5px 7px;font-size:13px;font-weight:700;background:#fff;color:var(--navy);width:100%;outline:none;text-align:center;"/>
      </div>
      <div class="cc-desig" style="flex:1;">
        <div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.3px;margin-bottom:2px;" data-lbl="lblDesig2">${T.lblDesig2||'Désignation'}</div>
        <input type="text" id="desig_${id}" data-ph="lblDesig" placeholder="${T.lblDesig}" value="${(data&&data.desig)||''}"/>
      </div>
      <button class="btn-del" onclick="removeCircuit(${id})">×</button>
    </div>
    <span class="sub-lbl" data-lbl="sublCana">${T.sublCana}</span>
    <div class="mg">
      <div class="mf">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
          <label data-lbl="lblCtype" style="font-size:9.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.2px;margin:0;">${T.lblCtype}</label>
          <button type="button" onclick="showCableHelp()" style="width:16px;height:16px;border-radius:50%;border:1.5px solid var(--navy);background:var(--navy);color:#fff;font-size:9px;font-weight:700;cursor:pointer;line-height:1;padding:0;flex-shrink:0;" title="Aide">i</button>
        </div>
        <input type="text" id="ctype_${id}" value="${(data&&data.ctype)||''}" placeholder="NYM" list="ctype-list" autocomplete="off"/>
        <datalist id="ctype-list"><option value="H07V-U"/><option value="CH-N1VV-U"/><option value="H05VV-F"/><option value="CH-N1VV-K"/><option value="H07BQ-F"/><option value="CH-N1VCV-U"/></datalist>
      </div>
      <div class="mf"><label data-lbl="lblCsect">${T.lblCsect}</label><input type="text" id="csect_${id}" value="${(data&&data.csect)||''}" placeholder="3×2.5 mm²"/></div>
    </div>
    <span class="sub-lbl" data-lbl="sublCoupe">${T.sublCoupe}</span>
    <div class="mg">
      <div class="mf"><label data-lbl="lblCourbe">${T.lblCourbe}</label><input type="text" id="courbe_${id}" value="${(data&&data.courbe)||''}" placeholder="B/C/D..." list="courbe-list-${id}" autocomplete="off"/><datalist id="courbe-list-${id}"><option value="B"/><option value="C"/><option value="D"/><option value="K"/><option value="Z"/></datalist></div>
      <div class="mf"><label data-lbl="lblInom">${T.lblInom}</label><input type="text" id="inom_${id}" value="${(data&&data.inom)||''}" placeholder="16" list="inom-list-${id}" autocomplete="off"/><datalist id="inom-list-${id}"><option value="2 A"/><option value="4 A"/><option value="6 A"/><option value="10 A"/><option value="13 A"/><option value="16 A"/><option value="20 A"/><option value="25 A"/><option value="32 A"/><option value="40 A"/><option value="50 A"/><option value="63 A"/><option value="80 A"/><option value="100 A"/><option value="125 A"/></datalist></div>
    </div>
    <span class="sub-lbl" data-lbl="sublIcc">${T.sublIcc}</span>
    <div class="mg">
      <div class="mf"><label data-lbl="lblIccMaxLpe">${T.lblIccMaxLpe}</label><input type="number" id="icc_max_lpe_${id}" value="${(data&&data.icc_max_lpe)||''}"/></div>
      <div class="mf"><label data-lbl="lblIccMinLpe">${T.lblIccMinLpe}</label><input type="number" id="icc_min_lpe_${id}" value="${(data&&data.icc_min_lpe)||''}"/></div>
      <div class="mf"><label data-lbl="lblIccMaxLn">${T.lblIccMaxLn}</label><input type="number" id="icc_max_ln_${id}" value="${(data&&data.icc_max_ln)||''}"/></div>
      <div class="mf"><label data-lbl="lblIccMinLn">${T.lblIccMinLn}</label><input type="number" id="icc_min_ln_${id}" value="${(data&&data.icc_min_ln)||''}"/></div>
      <div class="mf"><label data-lbl="lblRiso">${T.lblRiso}</label><input type="text" inputmode="decimal" id="riso_${id}" value="${(data&&data.riso)||''}" placeholder="ex: >1"/></div>
      <div class="mf"><label data-lbl="lblRlo">${T.lblRlo}</label><input type="text" inputmode="decimal" id="rlo_${id}" value="${(data&&data.rlo)||''}" placeholder="ex: <1"/></div>
    </div>
    <span class="sub-lbl" data-lbl="sublDdr">${T.sublDdr}</span>
    <div class="mg">
      <div class="mf"><label data-lbl="lblDdrInom">${T.lblDdrInom}</label><input type="number" id="ddr_inom_${id}" value="${(data&&data.ddr_inom)||''}"/></div>
      <div class="mf"><label data-lbl="lblDdrIdelta">${T.lblDdrIdelta}</label><input type="text" id="ddr_idelta_${id}" value="${(data&&data.ddr_idelta)||''}" placeholder="mA" list="idelta-list-${id}" autocomplete="off"/><datalist id="idelta-list-${id}"><option value="10 mA"/><option value="15 mA"/><option value="30 mA"/><option value="300 mA"/></datalist></div>
      <div class="mf"><label data-lbl="lblDdrTemps">${T.lblDdrTemps}</label><input type="number" id="ddr_temps_${id}" value="${(data&&data.ddr_temps)||''}"/></div>
      <div class="mf"><label data-lbl="lblChamp">${T.lblChamp}</label><select id="champ_${id}"><option value="">—</option><option>OK</option><option>NOK</option><option>N/A</option></select></div>
      <div class="mf"><label data-lbl="lblChute">${T.lblChute}</label><input type="number" step="0.1" id="chute_${id}" value="${(data&&data.chute)||''}"/></div>
    </div>
    <span class="sub-lbl" data-lbl="sublRem">${T.sublRem||'Remarque'}</span>
    <textarea id="rem_${id}" rows="2" placeholder="${T.lblRemCircuit||'Remarque sur ce circuit...'}" style="border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:#fff;color:var(--text);width:100%;outline:none;resize:vertical;min-height:48px;">${(data&&data.rem)||''}</textarea>`;
  box.appendChild(d);
  if(data){if(data.courbe)$('courbe_'+id).value=data.courbe;if(data.ddr_idelta)$('ddr_idelta_'+id).value=data.ddr_idelta;if(data.champ)$('champ_'+id).value=data.champ;}
  updateBadge();
}
function removeCircuit(id){
  const el=$('cc-'+id);if(el)el.remove();
  circuitIds=circuitIds.filter(x=>x!==id);
  if(!circuitIds.length){const box=$('circuits-container');box.innerHTML=`<p id="no-circuit-msg" style="text-align:center;color:var(--muted);font-size:13px;padding:8px 0;">${I18N[currentLang].noCircuit}</p>`;}
  circuitIds.forEach((cid,i)=>{const b=$('cn-'+cid);if(b)b.textContent=i+1;});
  updateBadge();saveData();
}

// ── Aide-mémoire câbles ──────────────────────────────────────
function showCableHelp(){
  const T=I18N[currentLang];
  document.getElementById('cable-help-tbody').innerHTML=T.cableTable.map(r=>
    '<tr><td style="padding:6px 8px;border-bottom:1px solid #e8ebf5;font-size:12px;font-weight:600;color:var(--navy);white-space:nowrap;">'+r[0]+'</td><td style="padding:6px 8px;border-bottom:1px solid #e8ebf5;font-size:12px;font-weight:600;white-space:nowrap;">'+r[1]+'</td><td style="padding:6px 8px;border-bottom:1px solid #e8ebf5;font-size:12px;color:var(--muted);line-height:1.4;">'+r[2]+'</td></tr>'
  ).join('');
  document.getElementById('cable-help-title').textContent=T.cableHelpTitle||'Types de câbles';
  document.getElementById('cable-help-col1').textContent=T.cableCol1||'Nom courant';
  document.getElementById('cable-help-col2').textContent=T.cableCol2||'Désignation';
  document.getElementById('cable-help-col3').textContent=T.cableCol3||'Description';
  document.getElementById('cable-help-modal').style.display='flex';
}
function closeCableHelp(){document.getElementById('cable-help-modal').style.display='none';}

function updateBadge(){$('cct').textContent=circuitIds.length;}

// ═══════════════════════════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════════════════════════
const FIELDS=['nom_installation','num_tableau','page','objet','num_compteur','cc_general','cc_abonne','tension','instrument','num_inventaire','facteur_icc','valeur_facteur','vc1','vc2','vc3','vc4','vc5','vc6','vc7','vc8','remarques','nom_prenom','lieu','date_sig'];
function saveData(){
  const d={lang:currentLang};
  FIELDS.forEach(f=>d[f]=gv(f));
  d.sigData=sigData;
  d.circuits=circuitIds.filter(id=>!!$('cc-'+id)).map(id=>({groupe:gv('groupe_'+id),desig:gv('desig_'+id),ctype:gv('ctype_'+id),csect:gv('csect_'+id),courbe:gv('courbe_'+id),inom:gv('inom_'+id),icc_max_lpe:gv('icc_max_lpe_'+id),icc_min_lpe:gv('icc_min_lpe_'+id),icc_max_ln:gv('icc_max_ln_'+id),icc_min_ln:gv('icc_min_ln_'+id),riso:gv('riso_'+id),rlo:gv('rlo_'+id),ddr_inom:gv('ddr_inom_'+id),ddr_idelta:gv('ddr_idelta_'+id),ddr_temps:gv('ddr_temps_'+id),champ:gv('champ_'+id),chute:gv('chute_'+id),rem:gv('rem_'+id)}));
  d.sigData=sigData;
  try{localStorage.setItem(SKEY,JSON.stringify(d));markSaved();}catch(e){showToast('Erreur sauvegarde');}
}
function loadData(){
  try{
    const raw=localStorage.getItem(SKEY);if(!raw)return;
    const d=JSON.parse(raw);
    if(d.lang && I18N[d.lang]){
      currentLang=d.lang;
      document.querySelectorAll('.lang-btn').forEach(b=>{b.classList.remove('active');if(b.textContent===d.lang.toUpperCase())b.classList.add('active');});
      applyLang();
    }
    FIELDS.forEach(f=>sv(f,d[f]));
    if(d.circuits&&d.circuits.length)d.circuits.forEach(c=>addCircuit(c));
    if(d.sigData){sigData=d.sigData;const prev=$('sig-preview');const ctx=prev.getContext('2d');prev.width=prev.offsetWidth*window.devicePixelRatio;prev.height=prev.offsetHeight*window.devicePixelRatio;ctx.scale(window.devicePixelRatio,window.devicePixelRatio);const img=new Image();img.onload=()=>{ctx.drawImage(img,0,0,prev.offsetWidth,prev.offsetHeight);};img.src=sigData;$('sig-placeholder').style.display='none';$('sig-clear-btn').style.display='block';}
    markSaved();showToast(I18N[currentLang].restored);
  }catch(e){console.error(e);}
}
function clearData(){if(!confirm(I18N[currentLang].confirmClear))return;localStorage.removeItem(SKEY);location.reload();}

// ═══════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════════════════
function collectAll(){
  const d={lang:currentLang, _version:1, _app:'SBB_Protocole'};
  FIELDS.forEach(f=>d[f]=gv(f));
  d.sigData=sigData;
  d.circuits=circuitIds.filter(id=>!!$('cc-'+id)).map(id=>({
    groupe:gv('groupe_'+id),desig:gv('desig_'+id),ctype:gv('ctype_'+id),csect:gv('csect_'+id),
    courbe:gv('courbe_'+id),inom:gv('inom_'+id),
    icc_max_lpe:gv('icc_max_lpe_'+id),icc_min_lpe:gv('icc_min_lpe_'+id),
    icc_max_ln:gv('icc_max_ln_'+id),icc_min_ln:gv('icc_min_ln_'+id),
    riso:gv('riso_'+id),rlo:gv('rlo_'+id),
    ddr_inom:gv('ddr_inom_'+id),ddr_idelta:gv('ddr_idelta_'+id),
    ddr_temps:gv('ddr_temps_'+id),champ:gv('champ_'+id),chute:gv('chute_'+id),
    rem:gv('rem_'+id)
  }));
  return d;
}

function exportData(){
  const d=collectAll();
  const json=JSON.stringify(d,null,2);
  const blob=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const tab=(d.num_tableau||'T00').replace(/[\s/\\]/g,'_');
  const date=d.date_sig||new Date().toISOString().slice(0,10);
  a.href=url; a.download='SBB_Protocole_'+tab+'_'+date+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast('Export téléchargé ✓');
}

function importData(evt){
  const file=evt.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const d=JSON.parse(e.target.result);
      if(!d._app||d._app!=='SBB_Protocole') throw new Error('Fichier non reconnu');

      // Afficher modal de choix
      showImportModal(d);
    }catch(err){
      showToast('Erreur import: '+err.message, 4000);
    }
    evt.target.value='';
  };
  reader.readAsText(file);
}

function showImportModal(d){
  // Compter les circuits à importer qui n'existent pas déjà
  const existingDesig = circuitIds
    .filter(id=>!!$('cc-'+id))
    .map(id=>gv('groupe_'+id)+'|'+gv('desig_'+id));
  const newCircuits = (d.circuits||[]).filter(c=>{
    const key=(c.groupe||'')+'|'+(c.desig||'');
    return !existingDesig.includes(key);
  });

  const modal = document.createElement('div');
  modal.id = 'import-modal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center;';
  modal.innerHTML=`
    <div style="background:#fff;border-radius:20px 20px 0 0;padding:24px;width:100%;max-width:480px;">
      <div style="font-size:16px;font-weight:700;color:var(--navy);margin-bottom:8px;">📂 Importer un fichier</div>
      <div style="font-size:13px;color:#555;margin-bottom:20px;line-height:1.5;">
        <b>${(d.circuits||[]).length}</b> circuit(s) dans le fichier —
        <b>${newCircuits.length}</b> nouveau(x) non présent(s) dans le formulaire actuel.
      </div>

      <button onclick="doImport('replace')" style="width:100%;background:var(--red);color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px;text-align:left;padding-left:16px;">
        🔄 &nbsp;Tout remplacer
        <div style="font-size:11px;font-weight:400;margin-top:2px;opacity:.85;">Écrase toutes les données actuelles avec le fichier importé</div>
      </button>

      <button onclick="doImport('merge')" style="width:100%;background:var(--navy);color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px;text-align:left;padding-left:16px;" ${newCircuits.length===0?'disabled style="opacity:.4;cursor:not-allowed;width:100%;background:var(--navy);color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:700;text-align:left;padding-left:16px;"':''}>
        ➕ &nbsp;Ajouter les nouveaux circuits seulement
        <div style="font-size:11px;font-weight:400;margin-top:2px;opacity:.85;">${newCircuits.length===0?'Aucun nouveau circuit à ajouter':'Ajoute '+newCircuits.length+' circuit(s) — garde toutes les données actuelles'}</div>
      </button>

      <button onclick="document.getElementById('import-modal').remove()" style="width:100%;background:#fff;color:var(--muted);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:14px;cursor:pointer;">
        Annuler
      </button>
    </div>`;

  // Store data for doImport
  modal._importData = d;
  modal._newCircuits = newCircuits;
  document.body.appendChild(modal);
}

function doImport(mode){
  const modal = $('import-modal');
  if(!modal) return;
  const d = modal._importData;
  const newCircuits = modal._newCircuits;
  modal.remove();

  if(mode === 'replace'){
    // ── Remplacement total ────────────────────────────────
    circuitIds=[]; nextId=1;
    $('circuits-container').innerHTML=`<p id="no-circuit-msg" style="text-align:center;color:var(--muted);font-size:13px;padding:8px 0;">${I18N[currentLang].noCircuit}</p>`;
    if(d.lang&&I18N[d.lang]){
      currentLang=d.lang;
      document.querySelectorAll('.lang-btn').forEach(b=>{b.classList.remove('active');if(b.textContent===d.lang.toUpperCase())b.classList.add('active');});
      applyLang();
    }
    FIELDS.forEach(f=>sv(f,d[f]));
    if(d.circuits&&d.circuits.length) d.circuits.forEach(c=>addCircuit(c));
    if(d.sigData){ sigData=d.sigData; }
    localStorage.setItem(SKEY,JSON.stringify(d));
    markSaved(); updateBadge();
    showToast('Import complet ✓ ('+d.circuits.length+' circuits)');

  } else if(mode === 'merge'){
    // ── Fusion — ajoute uniquement les nouveaux circuits ──
    if(newCircuits.length === 0){ showToast('Aucun nouveau circuit à ajouter'); return; }
    // Vérifier la limite de 18
    const available = 18 - circuitIds.length;
    const toAdd = newCircuits.slice(0, available);
    toAdd.forEach(c=>addCircuit(c));
    if(newCircuits.length > available){
      showToast(`${toAdd.length} circuit(s) ajouté(s) — limite 18 atteinte`, 3000);
    } else {
      showToast(`${toAdd.length} nouveau(x) circuit(s) ajouté(s) ✓`);
    }
    saveData();
  }
}
async function generatePDF(){
  saveData();
  const btn=$('pdfBtn');btn.disabled=true;$('btn-pdf-lbl').textContent=I18N[currentLang].pdfLoading;
  try{const {blob,filename}=await buildPDFBlob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.target="_blank";document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),3000);showToast(I18N[currentLang].pdfOk);}
  catch(e){console.error(e);showToast('Erreur: '+e.message,4000);}
  finally{btn.disabled=false;$('btn-pdf-lbl').textContent=I18N[currentLang].btnPdf;}
}

let _shareMode=null,_shareFilename=null,_sharePdfBlob=null;
function openShareModal(mode){
  saveData();
  _shareMode = mode;
  _sharePdfBlob = null;
  const T = I18N[currentLang];
  const title = document.getElementById('share-modal-title');
  const desc  = document.getElementById('share-modal-desc');
  if(mode === 'pdf'){
    title.textContent = T.sharePdfTitle  || 'Partager le PDF';
    desc.textContent  = T.sharePdfDesc   || 'Le PDF sera généré puis partagé selon votre choix.';
  } else {
    title.textContent = T.shareJsonTitle || 'Partager la sauvegarde JSON';
    desc.textContent  = T.shareJsonDesc  || 'Le fichier JSON sera partagé selon votre choix.';
  }
  // Translate button labels
  const el = id => document.getElementById(id);
  if(el('share-lbl-save'))   el('share-lbl-save').textContent   = T.shareSaveLbl   || "Enregistrer sur l'appareil";
  if(el('share-sub-save'))   el('share-sub-save').textContent   = T.shareSaveSub   || 'Téléchargement direct';
  if(el('share-lbl-native')) el('share-lbl-native').textContent = T.shareNativeLbl || 'Autres applications...';
  if(el('share-sub-native')) el('share-sub-native').textContent = T.shareNativeSub || 'WhatsApp, Drive, Messages...';
  if(el('share-cancel-btn')) el('share-cancel-btn').textContent = T.shareCancel    || 'Annuler';
  const nativeBtn = el('share-btn-native');
  if(nativeBtn) nativeBtn.style.display = navigator.share ? 'flex' : 'none';
  document.getElementById('share-modal').style.display = 'flex';
}
async function _doShareAction(action, blob, filename, mimeType){
  const url = URL.createObjectURL(blob);

  if(action === 'save'){
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);

  } else if(action === 'native'){
    // Étape 1 : télécharger le fichier sur l'appareil
    const shareFilename = mimeType === 'application/json'
      ? filename.replace('.json', '.txt')
      : filename;
    const dlBlob = mimeType === 'application/json'
      ? new Blob([await blob.text()], {type: 'text/plain'})
      : blob;
    const dlUrl = URL.createObjectURL(dlBlob);
    const a = document.createElement('a');
    a.href = dlUrl; a.download = shareFilename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(dlUrl), 3000);

    // Étape 2 : essayer Web Share API si disponible
    if(navigator.share){
      try {
        const file = new File([dlBlob], shareFilename, {type: dlBlob.type, lastModified: Date.now()});
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file], title: shareFilename, text: shareFilename});
        } else {
          await navigator.share({title: shareFilename, text: shareFilename});
        }
      } catch(e) {
        if(e.name !== 'AbortError'){
          // Web Share échoue (ex: Outlook) → fichier déjà téléchargé, informer l'utilisateur
          showToast('Fichier téléchargé — attachez-le manuellement', 3500);
        }
      }
    } else {
      showToast('Fichier téléchargé ✓', 2500);
    }
  }
}

function closeShareModal(){
  document.getElementById('share-modal').style.display='none';
}

async function shareAction(action){
  const mode = _shareMode; // capture before closeShareModal resets it
  closeShareModal();
  const T = I18N[currentLang];
  let blob, filename, mimeType;

  if(mode === 'pdf'){
    const btn = document.getElementById('pdfBtn');
    const lbl = document.getElementById('btn-pdf-lbl');
    btn.disabled = true;
    lbl.textContent = T.pdfLoading || '⏳ Génération...';
    try{
      const result = await buildPDFBlob();
      blob = result.blob;
      filename = result.filename;
      mimeType = 'application/pdf';
    }catch(e){
      console.error(e);
      showToast('Erreur PDF: ' + e.message, 4000);
      return;
    }finally{
      btn.disabled = false;
      lbl.textContent = T.btnPdf || 'Générer PDF';
    }
  } else {
    const d = collectAll();
    const json = JSON.stringify(d, null, 2);
    blob = new Blob([json], {type: 'application/json'});
    const tab  = (d.num_tableau||'T00').replace(/[\s/]/g,'_');
    const date = d.date_sig || new Date().toISOString().slice(0,10);
    filename = 'SBB_Protocole_' + tab + '_' + date + '.json';
    mimeType = 'application/json';
  }

  await _doShareAction(action, blob, filename, mimeType);
  if(mode === 'pdf') showToast(T.pdfOk || 'PDF généré ✓');
}
