/* Génération PDF */
async function buildPDFBlob(){
  const {PDFDocument,rgb,StandardFonts}=PDFLib;
  const LOGO_B64='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';
  const T=I18N[currentLang];
  const doc=await PDFDocument.create();
  const page=doc.addPage([841.89,595.28]);
  const {width:W,height:H}=page.getSize();
  const fB=await doc.embedFont(StandardFonts.HelveticaBold);
  const fR=await doc.embedFont(StandardFonts.Helvetica);
  const logoJpgBytes=Uint8Array.from(atob(LOGO_B64),c=>c.charCodeAt(0));
  const logoJpgImg=await doc.embedJpg(logoJpgBytes);

  const NAVY=rgb(.102,.180,.369),NAVY2=rgb(.102,.180,.369),NAVY3=rgb(.102,.180,.369);
  const WHITE=rgb(1,1,1);
  const LGRAY=rgb(.941,.945,.969),LG2=rgb(.910,.914,.957),MGRAY=rgb(.816,.820,.847);
  const DGRAY=rgb(.314,.353,.431),BLACK=rgb(.102,.102,.180);
  const GREEN=rgb(.180,.490,.196),REDD=rgb(.776,.157,.157);

  const MM=2.8346,ML=8*MM,MR=8*MM;
  const R=(x,y,w,h,c)=>page.drawRectangle({x,y,width:w,height:h,color:c,borderWidth:0});
  const SR=(x,y,w,h,c,lw=.5)=>page.drawRectangle({x,y,width:w,height:h,borderColor:c,borderWidth:lw,color:undefined});
  const L=(x1,y1,x2,y2,c,lw=.35)=>page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},color:c,thickness:lw});

  // Translittère vers WinAnsi (pdf-lib Helvetica standard ne supporte pas l'Unicode haut)
  const san=(s)=>{
    const map={'\n':' ','\r':' ','\t':' ',
      '\u2018':"'",'\u2019':"'",'\u201A':"'",'\u201B':"'",
      '\u201C':'"','\u201D':'"','\u201E':'"','\u201F':'"',
      '\u2013':'-','\u2014':'-','\u2015':'-','\u2026':'...',
      '\u00D7':'x','\u00F7':'/','\u2212':'-',
      '\u03A9':'Ohm','\u03BC':'u',
      '\u00E0':'a','\u00E1':'a','\u00E2':'a','\u00E4':'ae',
      '\u00E8':'e','\u00E9':'e','\u00EA':'e','\u00EB':'e',
      '\u00EC':'i','\u00ED':'i','\u00EE':'i','\u00EF':'i',
      '\u00F2':'o','\u00F3':'o','\u00F4':'o','\u00F6':'oe',
      '\u00F9':'u','\u00FA':'u','\u00FB':'u','\u00FC':'ue',
      '\u00C0':'A','\u00C1':'A','\u00C2':'A','\u00C4':'Ae',
      '\u00C8':'E','\u00C9':'E','\u00CA':'E','\u00CB':'E',
      '\u00CC':'I','\u00CD':'I','\u00CE':'I','\u00CF':'I',
      '\u00D2':'O','\u00D3':'O','\u00D4':'O','\u00D6':'Oe',
      '\u00D9':'U','\u00DA':'U','\u00DB':'U','\u00DC':'Ue',
      '\u00C7':'C','\u00E7':'c','\u00D1':'N','\u00F1':'n',
      '\u00DF':'ss','\u00E6':'ae','\u0152':'Oe','\u0153':'oe',
      '\u2022':'-','\u2713':'OK','\u2714':'OK',
      '\u00BD':'1/2','\u00BC':'1/4','\u00BE':'3/4',
      '\u00A9':'(c)','\u00AE':'(R)','\u2122':'TM',
    };
    return String(s||'').split('').map(ch=>{
      const code=ch.codePointAt(0);
      if(map[ch]!==undefined)return map[ch];
      if(code<32||code===127)return ' ';
      if(code>255)return '?';
      return ch;
    }).join('').trim();
  };

  const Txt=(s,x,y,sz,f,c)=>{if(!s)return;page.drawText(san(s),{x,y,size:sz,font:f,color:c});};
  const TxtR=(s,xR,y,sz,f,c)=>{if(!s)return;const ss=san(s);const w=f.widthOfTextAtSize(ss,sz);page.drawText(ss,{x:xR-w,y,size:sz,font:f,color:c});};
  const TxtC=(s,x,w,y,sz,f,c)=>{if(!s)return;const ss=san(s);const tw=f.widthOfTextAtSize(ss,sz);page.drawText(ss,{x:x+(w-tw)/2,y,size:sz,font:f,color:c});};
  const clip=(s,mxW,sz,f)=>{let r=san(s);while(r.length>0&&f.widthOfTextAtSize(r,sz)>mxW)r=r.slice(0,-1);return r;};

  const D={};
  ['nom_installation','num_tableau','page','objet','num_compteur','fournisseur','remarques_install','cc_general','cc_abonne','tension','instrument','num_inventaire','facteur_icc','valeur_facteur','nom_prenom','lieu','date_sig','remarques'].forEach(k=>D[k]=gv(k));
  D.vc={};for(let i=1;i<=8;i++)D.vc['vc'+i]=gv('vc'+i);
  D.circuits=circuitIds.filter(id=>!!$('cc-'+id)).map(id=>({groupe:gv('groupe_'+id),desig:gv('desig_'+id),ctype:gv('ctype_'+id),csect:gv('csect_'+id),courbe:gv('courbe_'+id),inom:gv('inom_'+id),icc_max_lpe:gv('icc_max_lpe_'+id),icc_min_lpe:gv('icc_min_lpe_'+id),icc_max_ln:gv('icc_max_ln_'+id),icc_min_ln:gv('icc_min_ln_'+id),riso:gv('riso_'+id),rlo:gv('rlo_'+id),ddr_inom:gv('ddr_inom_'+id),ddr_idelta:gv('ddr_idelta_'+id),ddr_temps:gv('ddr_temps_'+id),champ:gv('champ_'+id),chute:gv('chute_'+id),rem:gv('rem_'+id),
    collab_nom:(($('collab_signed_'+id)&&$('collab_signed_'+id).checked)?gv('nom_prenom'):(gv('collab_nom_'+id)||'')),
    collab_sig:(($('collab_signed_'+id)&&$('collab_signed_'+id).checked)?(sigData||''):(gv('collab_sig_'+id)||''))
  }));

  // 1. HEADER — aligné sur les marges du tableau
  const HH=15*MM;
  R(ML,H-HH,W-ML-MR,HH,NAVY);
  Txt(T.pdfTitle,ML+2*MM,H-HH+9*MM,8,fB,WHITE);
  Txt(T.pdfNomInst+"  "+clip(D.nom_installation,180*MM,6.5,fR),ML+2*MM,H-HH+3.5*MM,6.5,fR,WHITE);
  // Page number top-right, logo à sa gauche
  const logoH=4*MM, logoW=logoH*(logoJpgImg.width/logoJpgImg.height);
  TxtR(T.pdfPage+" "+(D.page||'01'),W-MR-2*MM,H-HH+HH/2,7,fR,WHITE);
  page.drawImage(logoJpgImg,{x:W-MR-2*MM-logoW-15*MM, y:H-HH+(HH-logoH)/2, width:logoW, height:logoH});

  // 2. BANDEAU INFO — aligné sur les marges du tableau
  const hasExtra = !!(D.fournisseur || D.remarques_install);
  const IH = hasExtra ? 18*MM : 13*MM;
  const IY=H-HH;
  R(ML,IY-IH,W-ML-MR,IH,LGRAY);SR(ML,IY-IH,W-ML-MR,IH,MGRAY,.4);
  const kv=(lbl,val,x,y,mxV)=>{const slbl=san(lbl);Txt(slbl,x,y,6.5,fB,NAVY);const lw=fB.widthOfTextAtSize(slbl,6.5);Txt(clip(val,mxV||80*MM,6.5,fR),x+lw+2,y,6.5,fR,BLACK);};
  const ly1 = hasExtra ? IY-IH+13.5*MM : IY-IH+8.5*MM;
  const ly2 = hasExtra ? IY-IH+8.5*MM  : IY-IH+3.5*MM;
  kv(T.pdfObjet,D.objet,ML+2*MM,ly1,55*MM);
  kv(T.pdfNumTab,D.num_tableau,95*MM,ly1,30*MM);
  kv(T.pdfNumCpt,D.num_compteur,ML+2*MM,ly2,40*MM);
  kv(T.pdfCcGen,D.cc_general||"—",75*MM,ly2,50*MM);
  kv(T.pdfCcAbo,D.cc_abonne||"—",175*MM,ly2,45*MM);
  if(hasExtra){
    const ly3=IY-IH+3.5*MM;
    if(D.fournisseur) kv(T.pdfFournisseur||'Fournisseur:',D.fournisseur,ML+2*MM,ly3,80*MM);
    if(D.remarques_install){
      const remLbl=T.pdfRemarquesInstall||'Remarques:';
      const remX=D.fournisseur?140*MM:ML+2*MM;
      kv(remLbl,D.remarques_install,remX,ly3,W-MR-remX-10*MM);
    }
  }

  // 3. TABLEAU
  const BZH=57*MM,TBOT=6*MM+BZH,TTOP=IY-IH,TH=TTOP-TBOT,TW=W-ML-MR;
  const rawCW=[7,26,10,11,9,8,11,11,11,11,9,9,9,9,8,9,9,18,20];
  const sumCW=rawCW.reduce((a,b)=>a+b,0);
  const CW=rawCW.map(x=>(x/sumCW)*TW);
  const colX=ci=>{let x=ML;for(let i=0;i<ci;i++)x+=CW[i];return x;};
  const HRA=6.5*MM,HRB=8*MM;
  const NRD=18;
  const HRD=Math.max(Math.min((TH-HRA-HRB)/NRD, 5.5*MM), 3.2*MM);
  let circuits=[...D.circuits];while(circuits.length<NRD)circuits.push({});
  const dataRowY = i => TTOP - HRA - HRB - (i+1)*HRD;
  const headerAY = TTOP - HRA;
  const headerBY = TTOP - HRA - HRB;

  // Alternance lignes data
  for(let i=0;i<NRD;i++){if(i%2===0)R(ML,dataRowY(i),TW,HRD,LGRAY);}

  // Données
  for(let i=0;i<circuits.length;i++){
    const circ=circuits[i];
    const ry=dataRowY(i), ytxt=ry+HRD*0.28;
    const cols=[circ.groupe||'',circ.desig||'',circ.ctype||'',circ.csect||'',circ.courbe||'',circ.inom||'',circ.icc_max_lpe||'',circ.icc_min_lpe||'',circ.icc_max_ln||'',circ.icc_min_ln||'',circ.riso||'',circ.rlo||'',circ.ddr_inom||'',circ.ddr_idelta||'',circ.ddr_temps||'',circ.champ||'',circ.chute||'',circ.rem||''];
    cols.forEach((val,ci)=>{
      const x=colX(ci),w=CW[ci];let col=BLACK,f=fR,sz=5.8;
      if(val==='OK'){col=GREEN;f=fB;}if(val==='NOK'){col=REDD;f=fB;}
      const s=clip(val,w-2,sz,f);
      (ci===1||ci===17)?Txt(s,x+1.5,ytxt,sz,f,col):TxtC(s,x,w,ytxt,sz,f,col);
    });
    // Col 18 — Collaborateur
    if(i<D.circuits.length){
      const cx=colX(18),cw=CW[18],pad=2;
      const collabNom=circ.collab_nom||'';
      const collabSig=circ.collab_sig||'';
      Txt(clip(collabNom,cw-pad*2,4.8,fR),cx+pad,ry+HRD*.72,4.8,fR,BLACK);
      if(collabSig){
        try{
          const sb=Uint8Array.from(atob(collabSig.split(',')[1]),c=>c.charCodeAt(0));
          const si=await doc.embedPng(sb);
          const maxW=cw-pad*2, maxH=HRD*0.52;
          const ratio=si.width/si.height;
          let dw=maxW, dh=dw/ratio;
          if(dh>maxH){dh=maxH;dw=dh*ratio;}
          page.drawImage(si,{x:cx+(cw-dw)/2,y:ry+HRD*.10,width:dw,height:dh});
        }catch(e){console.warn('Sig collab circuit:',e);}
      }
    }
  }

  // Grille
  for(let ci=1;ci<19;ci++){const x=colX(ci);L(x,TBOT,x,headerBY,MGRAY,.3);}
  for(let i=0;i<NRD;i++)L(ML,dataRowY(i),ML+TW,dataRowY(i),MGRAY,.25);

  // En-têtes rowA
  const grpDefs=[
    {c:[0,1],col:NAVY},{c:[2,3],col:NAVY},{c:[4,5],col:NAVY},
    {c:[6,7,8,9,10,11],col:NAVY},{c:[12,13,14],col:NAVY},{c:[15,16],col:NAVY},{c:[17],col:NAVY},{c:[18],col:NAVY}
  ];
  grpDefs.forEach(g=>{
    const x=colX(g.c[0]),w=g.c.reduce((a,c)=>a+CW[c],0);
    R(x,headerAY,w,HRA,g.col);
  });

  // rowB
  const colGrpColor=Array(19).fill(NAVY);
  for(let ci=0;ci<19;ci++){
    const x=colX(ci),w=CW[ci];
    R(x,headerBY,w,HRB,colGrpColor[ci]);
  }

  // Séparateurs
  const grpBoundaries=[1,2,4,6,12,15,17,18];
  for(let ci=1;ci<=19;ci++){
    const x=ci<19?colX(ci):ML+TW;
    if(grpBoundaries.includes(ci)){
      L(x,headerBY,x,headerAY+HRA,WHITE,1.0);
    } else {
      L(x,headerBY,x,headerBY+HRB,WHITE,.35);
    }
  }

  // Textes rowA
  [{c:[0],l:T.pdfGrpGroupe},{c:[1],l:T.pdfGrpPartie},{c:[2,3],l:T.pdfGrpCana},{c:[4,5],l:T.pdfGrpCoupe},{c:[6,7,8,9,10,11],l:T.pdfGrpMes},{c:[12,13,14],l:T.pdfGrpDdr},{c:[15,16],l:T.pdfGrpMes},{c:[17],l:'Rem.'},{c:[18],l:T.pdfGrpCollab}].forEach(g=>{
    const x=colX(g.c[0]),w=g.c.reduce((a,c)=>a+CW[c],0);
    TxtC(g.l,x,w,headerAY+1.8*MM,5.5,fB,WHITE);
  });

  // Textes rowB
  T.pdfColHdr.forEach((hdr,ci)=>{
    const x=colX(ci),w=CW[ci],lns=hdr.split('\n'),lH=2.7*MM;
    const totH=lns.length*lH,startY=headerBY+(HRB-totH)/2+(lns.length-1)*lH;
    lns.forEach((ln,li)=>TxtC(ln,x,w,startY-li*lH,5,fB,WHITE));
  });

  L(ML,TTOP,ML+TW,TTOP,NAVY,.7);
  L(ML,headerAY,ML+TW,headerAY,NAVY,.5);
  L(ML,headerBY,ML+TW,headerBY,NAVY,.5);
  SR(ML,TBOT,TW,TH,NAVY,.7);

  // 4. ZONE BASSE
  const BY=6*MM,BH=BZH-2*MM,TW3=TW,GAP=1.5*MM;
  const C1W=TW3*.37,C2W=TW3*.37,C3W=TW3-C1W-C2W-2*GAP;
  const X1=ML,X2=X1+C1W+GAP,X3=X2+C2W+GAP;
  const colBox=(x,w,title)=>{R(x,BY,w,BH,WHITE);SR(x,BY,w,BH,MGRAY,.5);R(x,BY+BH-5.5*MM,w,5.5*MM,NAVY);Txt(title,x+2*MM,BY+BH-3.8*MM,6,fB,WHITE);};

  colBox(X1,C1W,T.pdfVerifTitle);
  TxtR(T.pdfEtat,X1+C1W-2*MM,BY+BH-3.8*MM,6,fB,WHITE);
  const vcRH=(BH-5.5*MM)/T.pdfVcLabels.length;
  T.pdfVcLabels.forEach((lbl,i)=>{
    const vy=BY+BH-5.5*MM-(i+1)*vcRH;
    if(i%2===0)R(X1,vy,C1W,vcRH,LG2);
    L(X1,vy+vcRH,X1+C1W,vy+vcRH,MGRAY,.25);
    Txt(clip(lbl,C1W-16*MM,5.3,fR),X1+2*MM,vy+vcRH*.35,5.3,fR,BLACK);
    const ok=D.vc['vc'+(i+1)];
    TxtR(ok?'OK':'NOK',X1+C1W-2*MM,vy+vcRH*.35,6,fB,ok?GREEN:REDD);
  });

  colBox(X2,C2W,T.pdfParamsTitle);
  const params=[[T.pdfFacteur,(D.facteur_icc||'NON')+"  val: "+(D.valeur_facteur||'1')],[T.pdfTension,D.tension||'240V'],[T.pdfInstrument,D.instrument||'Metrel'],[T.pdfInventaire,D.num_inventaire||'']];
  const lh=5.5*MM;
  params.forEach(([k,v],i)=>{const py=BY+BH-5.5*MM-(i+1)*lh;if(i%2===0)R(X2,py,C2W,lh,LGRAY);Txt(k,X2+2*MM,py+lh*.35,5.3,fB,DGRAY);Txt(clip(v,C2W*.45,5.3,fR),X2+C2W*.52,py+lh*.35,5.3,fR,BLACK);});
  const remTop=BY+BH-5.5*MM-params.length*lh-2*MM;
  Txt(T.pdfRem,X2+2*MM,remTop-2.5*MM,5.8,fB,NAVY);
  const remRaw=(D.remarques||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  if(remRaw){const mxW=C2W-6*MM;let lines=[];remRaw.split('\n').forEach(para=>{let words=san(para).split(' '),cur='';words.forEach(w=>{const t=cur?cur+' '+w:w;if(fR.widthOfTextAtSize(t,5.3)>mxW){if(cur)lines.push(cur);cur=w;}else cur=t;});if(cur)lines.push(cur);});lines.slice(0,5).forEach((ln,i)=>Txt(ln,X2+2*MM,remTop-7*MM-i*3.8*MM,5.3,fR,BLACK));}

  colBox(X3,C3W,T.pdfInstTitle);
  const fmtDate=d=>{if(!d)return'';const p=d.split('-');return p.length===3?p[2]+'.'+p[1]+'.'+p[0]:d;};
  [[T.pdfNomPrenom,D.nom_prenom||''],[T.pdfLieuDate,(D.lieu||'')+'   '+fmtDate(D.date_sig)]].forEach(([k,v],i)=>{
    const iy=BY+BH-5.5*MM-(i+1)*9*MM;if(i%2===0)R(X3,iy,C3W,9*MM,LGRAY);
    Txt(k,X3+2*MM,iy+5.5*MM,5.8,fB,DGRAY);Txt(clip(v,C3W-4*MM,6,fR),X3+2*MM,iy+2*MM,6,fR,BLACK);
  });
  const sigY=BY+BH-5.5*MM-2*9*MM-8*MM-2*MM-18*MM;
  Txt(T.pdfSignature,X3+2*MM,sigY+4*MM,5.8,fB,DGRAY);
  if(sigData){
    try{
      const sigBytes=Uint8Array.from(atob(sigData.split(',')[1]),c=>c.charCodeAt(0));
      const sigImg=await doc.embedPng(sigBytes);
      const maxSigW = C3W - 2*MM;
      const maxSigH = BH - 5.5*MM - 2*9*MM - 2*MM;
      const ratioImg = sigImg.width / sigImg.height;
      let drawW = maxSigW;
      let drawH = drawW / ratioImg;
      if(drawH > maxSigH){ drawH = maxSigH; drawW = drawH * ratioImg; }
      const sigX = X3 + (C3W - drawW) / 2;
      const sigBottom = BY + 1*MM;
      page.drawImage(sigImg,{x:sigX, y:sigBottom, width:drawW, height:drawH});
    }catch(e){ console.warn('Signature PDF error:',e); }
  } else {
    L(X3+18*MM,sigY+4*MM,X3+C3W-4*MM,sigY+4*MM,MGRAY,.6);
  }

  const bytes=await doc.save();
  const blob=new Blob([bytes],{type:'application/pdf'});
  const fname='Protocole_'+(D.num_tableau||'T00').replace(/\s/g,'_')+'_'+(D.date_sig||new Date().toISOString().slice(0,10))+'.pdf';
  return {blob,filename:fname};
}

async function generatePDF(){
  saveData();
  const btn=document.getElementById('pdfBtn');
  btn.disabled=true;document.getElementById('btn-pdf-lbl').textContent=I18N[currentLang].pdfLoading||'⏳ Génération...';
  try{
    const {blob,filename}=await buildPDFBlob();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.target='_blank';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    showToast(I18N[currentLang].pdfOk||'PDF généré ✓');
  }catch(e){console.error(e);showToast('Erreur: '+e.message,4000);}
  finally{btn.disabled=false;document.getElementById('btn-pdf-lbl').textContent=I18N[currentLang].btnPdf||'Générer PDF';}
}
