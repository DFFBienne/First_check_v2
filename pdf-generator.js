// pdf-generator.js — Génération PDF côté client via pdf-lib

async function generatePDF(){
  saveData();
  const btn=$('pdfBtn');btn.disabled=true;$('btn-pdf-lbl').textContent=I18N[currentLang].pdfLoading;
  try{await buildPDF();showToast(I18N[currentLang].pdfOk);}
  catch(e){console.error(e);showToast('Erreur: '+e.message,4000);}
  finally{btn.disabled=false;$('btn-pdf-lbl').textContent=I18N[currentLang].btnPdf;}
}

async function buildPDF(){
  const {PDFDocument,rgb,StandardFonts}=PDFLib;
  const T=I18N[currentLang];
  const doc=await PDFDocument.create();
  const page=doc.addPage([841.89,595.28]);
  const {width:W,height:H}=page.getSize();
  const fB=await doc.embedFont(StandardFonts.HelveticaBold);
  const fR=await doc.embedFont(StandardFonts.Helvetica);

  const NAVY=rgb(.102,.180,.369),NAVY2=rgb(.141,.220,.439),NAVY3=rgb(.176,.259,.502);
  const WHITE=rgb(1,1,1);
  const LGRAY=rgb(.941,.945,.969),LG2=rgb(.910,.914,.957),MGRAY=rgb(.816,.820,.847);
  const DGRAY=rgb(.314,.353,.431),BLACK=rgb(.102,.102,.180);
  const GREEN=rgb(.180,.490,.196),REDD=rgb(.776,.157,.157);

  const MM=2.8346,ML=8*MM,MR=8*MM;
  const R=(x,y,w,h,c)=>page.drawRectangle({x,y,width:w,height:h,color:c,borderWidth:0});
  const SR=(x,y,w,h,c,lw=.5)=>page.drawRectangle({x,y,width:w,height:h,borderColor:c,borderWidth:lw,color:undefined});
  const L=(x1,y1,x2,y2,c,lw=.35)=>page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},color:c,thickness:lw});
  // Nettoie les caractères non supportés par WinAnsi (ex: \n 0x000a, \r, etc.)
  const san=(s)=>String(s||'').replace(/[\x00-\x08\x0A-\x1F\x7F]/g,' ').trim();
  const Txt=(s,x,y,sz,f,c)=>{if(!s)return;page.drawText(san(s),{x,y,size:sz,font:f,color:c});};
  const TxtR=(s,xR,y,sz,f,c)=>{if(!s)return;const ss=san(s);const w=f.widthOfTextAtSize(ss,sz);page.drawText(ss,{x:xR-w,y,size:sz,font:f,color:c});};
  const TxtC=(s,x,w,y,sz,f,c)=>{if(!s)return;const ss=san(s);const tw=f.widthOfTextAtSize(ss,sz);page.drawText(ss,{x:x+(w-tw)/2,y,size:sz,font:f,color:c});};
  const clip=(s,mxW,sz,f)=>{let r=san(s);while(r.length>0&&f.widthOfTextAtSize(r,sz)>mxW)r=r.slice(0,-1);return r;};

  const D={};
  ['nom_installation','num_tableau','page','objet','num_compteur','cc_general','cc_abonne','tension','instrument','num_inventaire','facteur_icc','valeur_facteur','nom_prenom','lieu','date_sig','remarques'].forEach(k=>D[k]=gv(k));
  D.vc={};for(let i=1;i<=8;i++)D.vc['vc'+i]=gv('vc'+i);
  D.circuits=circuitIds.filter(id=>!!$('cc-'+id)).map(id=>({desig:gv('desig_'+id),ctype:gv('ctype_'+id),csect:gv('csect_'+id),courbe:gv('courbe_'+id),inom:gv('inom_'+id),icc_max_lpe:gv('icc_max_lpe_'+id),icc_min_lpe:gv('icc_min_lpe_'+id),icc_max_ln:gv('icc_max_ln_'+id),icc_min_ln:gv('icc_min_ln_'+id),riso:gv('riso_'+id),rlo:gv('rlo_'+id),ddr_inom:gv('ddr_inom_'+id),ddr_idelta:gv('ddr_idelta_'+id),ddr_temps:gv('ddr_temps_'+id),champ:gv('champ_'+id),chute:gv('chute_'+id)}));

  // 1. HEADER
  const HH=20*MM;
  R(0,H-HH,W,HH,NAVY);
  Txt(T.pdfTitle,ML,H-HH+13*MM,8.5,fB,WHITE);
  Txt(T.pdfNomInst+"  "+clip(D.nom_installation,200*MM,7,fR),ML,H-HH+7*MM,7,fR,WHITE);
  TxtR("SBB CFF FFS",W-MR,H-HH+13*MM,11,fB,WHITE);
  TxtR(T.pdfPage+" "+(D.page||'01'),W-MR,H-HH+7*MM,7,fR,WHITE);

  // 2. BANDEAU INFO
  const IY=H-HH,IH=13*MM;
  R(0,IY-IH,W,IH,LGRAY);SR(0,IY-IH,W,IH,MGRAY,.4);
  const kv=(lbl,val,x,y,mxV)=>{Txt(lbl,x,y,6.5,fB,NAVY);const lw=fB.widthOfTextAtSize(lbl,6.5);Txt(clip(val,mxV||80*MM,6.5,fR),x+lw+2,y,6.5,fR,BLACK);};
  kv(T.pdfObjet,D.objet,ML,IY-IH+8.5*MM,55*MM);
  kv(T.pdfNumTab,D.num_tableau,95*MM,IY-IH+8.5*MM,30*MM);
  kv(T.pdfNumCpt,D.num_compteur,ML,IY-IH+3.5*MM,40*MM);
  kv(T.pdfCcGen,D.cc_general||"—",75*MM,IY-IH+3.5*MM,50*MM);
  kv(T.pdfCcAbo,D.cc_abonne||"—",175*MM,IY-IH+3.5*MM,45*MM);

  // 3. TABLEAU
  // Col 0-16 : données mesures | Col 17 : Collaborateur (Nom Prénom + ligne signature)
  const BZH=57*MM,TBOT=6*MM+BZH,TTOP=IY-IH,TH=TTOP-TBOT,TW=W-ML-MR;
  const rawCW=[7,33,11,12,10,9,12,12,12,12,10,10,10,10,9,10,11,22];
  const sumCW=rawCW.reduce((a,b)=>a+b,0);
  const CW=rawCW.map(x=>(x/sumCW)*TW);
  const colX=ci=>{let x=ML;for(let i=0;i<ci;i++)x+=CW[i];return x;};
  const NRD=14;let circuits=[...D.circuits];while(circuits.length<NRD)circuits.push({});
  const HRA=6.5*MM,HRB=8*MM,HRD=Math.max(Math.min((TH-HRA-HRB)/NRD,5.5*MM),3.5*MM);
  const rowY=ri=>ri===0?TBOT+TH-HRA:ri===1?TBOT+TH-HRA-HRB:TBOT+TH-HRA-HRB-(ri-2)*HRD;

  // Fond des lignes alternées
  for(let ri=2;ri<2+NRD;ri++){if(ri%2===0)R(ML,rowY(ri),TW,HRD,LGRAY);}

  // Bandes de couleur en-tête groupes (ligne 0)
  [{c:[0,1],col:NAVY},{c:[2,3],col:NAVY2},{c:[4,5],col:NAVY2},{c:[6,7,8,9,10,11],col:NAVY3},{c:[12,13,14],col:NAVY2},{c:[15,16],col:NAVY2},{c:[17],col:NAVY}].forEach(g=>{
    const x=colX(g.c[0]),w=g.c.reduce((a,c)=>a+CW[c],0);R(x,rowY(0),w,HRA,g.col);
  });
  R(ML,rowY(1),TW,HRB,NAVY);

  // Libellés des groupes (ligne 0)
  [{c:[0],l:T.pdfGrpGroupe},{c:[1],l:T.pdfGrpPartie},{c:[2,3],l:T.pdfGrpCana},{c:[4,5],l:T.pdfGrpCoupe},{c:[6,7,8,9,10,11],l:T.pdfGrpMes},{c:[12,13,14],l:T.pdfGrpDdr},{c:[15,16],l:T.pdfGrpMes},{c:[17],l:T.pdfGrpCollab}].forEach(g=>{
    const x=colX(g.c[0]),w=g.c.reduce((a,c)=>a+CW[c],0);TxtC(g.l,x,w,rowY(0)+1.8*MM,5.5,fB,WHITE);
  });

  // En-têtes de colonnes (ligne 1)
  T.pdfColHdr.forEach((hdr,ci)=>{
    const x=colX(ci),w=CW[ci],lns=hdr.split('\n'),lH=2.7*MM;
    const totH=lns.length*lH,startY=rowY(1)+(HRB-totH)/2+(lns.length-1)*lH;
    lns.forEach((ln,li)=>TxtC(ln,x,w,startY-li*lH,5,fB,WHITE));
  });

  // Séparateurs verticaux (18 colonnes → 19 traits)
  for(let ci=0;ci<=18;ci++){const x=ci<18?colX(ci):ML+TW;L(x,TBOT,x,TTOP,MGRAY,.3);}
  L(ML,TTOP,ML+TW,TTOP,NAVY,.7);L(ML,rowY(0),ML+TW,rowY(0),NAVY,.5);L(ML,rowY(1),ML+TW,rowY(1),MGRAY,.5);
  for(let ri=2;ri<=2+NRD;ri++)L(ML,rowY(ri),ML+TW,rowY(ri),MGRAY,.25);
  SR(ML,TBOT,TW,TH,NAVY,.7);

  // Données des circuits
  circuits.forEach((circ,ri)=>{
    const ry=rowY(ri+2),ytxt=ry+HRD*.35;
    const cols=[ri<D.circuits.length?String(ri+1):'',circ.desig||'',circ.ctype||'',circ.csect||'',circ.courbe||'',circ.inom||'',circ.icc_max_lpe||'',circ.icc_min_lpe||'',circ.icc_max_ln||'',circ.icc_min_ln||'',circ.riso||'',circ.rlo||'',circ.ddr_inom||'',circ.ddr_idelta||'',circ.ddr_temps||'',circ.champ||'',circ.chute||''];
    cols.forEach((val,ci)=>{
      const x=colX(ci),w=CW[ci];let col=BLACK,f=fR,sz=5.8;
      if(val==='OK'){col=GREEN;f=fB;}if(val==='NOK'){col=REDD;f=fB;}
      const s=clip(val,w-2,sz,f);
      ci===1?Txt(s,x+1.5,ytxt,sz,f,col):TxtC(s,x,w,ytxt,sz,f,col);
    });
    // Colonne 17 — Collaborateur : Nom Prénom (repris de l'installateur) + ligne de signature
    if(ri<D.circuits.length){
      const cx=colX(17),cw=CW[17],pad=2;
      const nameStr=clip(D.nom_prenom||'',cw-pad*2,4.8,fR);
      Txt(nameStr,cx+pad,ry+HRD*.68,4.8,fR,BLACK);
      L(cx+pad,ry+HRD*.28,cx+cw-pad,ry+HRD*.28,MGRAY,.5);
    }
  });

  // 4. ZONE BASSE — 3 blocs : Vérifications visuelles | Paramètres & Remarques | Installateur
  const BY=6*MM,BH=BZH-2*MM,TW3=TW,GAP=1.5*MM;
  const C1W=TW3*.37,C2W=TW3*.37,C3W=TW3-C1W-C2W-2*GAP;
  const X1=ML,X2=X1+C1W+GAP,X3=X2+C2W+GAP;
  const colBox=(x,w,title)=>{R(x,BY,w,BH,WHITE);SR(x,BY,w,BH,MGRAY,.5);R(x,BY+BH-5.5*MM,w,5.5*MM,NAVY);Txt(title,x+2*MM,BY+BH-3.8*MM,6,fB,WHITE);};

  // Bloc 1 : Vérifications visuelles
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

  // Bloc 2 : Paramètres de mesure & Remarques
  colBox(X2,C2W,T.pdfParamsTitle);
  const params=[[T.pdfFacteur,(D.facteur_icc||'NON')+"  val: "+(D.valeur_facteur||'1')],[T.pdfTension,D.tension||'240V'],[T.pdfInstrument,D.instrument||'Metrel'],[T.pdfInventaire,D.num_inventaire||'']];
  const lh=5.5*MM;
  params.forEach(([k,v],i)=>{const py=BY+BH-5.5*MM-(i+1)*lh;if(i%2===0)R(X2,py,C2W,lh,LGRAY);Txt(k,X2+2*MM,py+lh*.35,5.3,fB,DGRAY);Txt(clip(v,C2W*.45,5.3,fR),X2+C2W*.52,py+lh*.35,5.3,fR,BLACK);});
  const remTop=BY+BH-5.5*MM-params.length*lh-2*MM;
  Txt(T.pdfRem,X2+2*MM,remTop-2.5*MM,5.8,fB,NAVY);
  const remRaw=(D.remarques||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  if(remRaw){const mxW=C2W-6*MM;let lines=[];remRaw.split('\n').forEach(para=>{let words=san(para).split(' '),cur='';words.forEach(w=>{const t=cur?cur+' '+w:w;if(fR.widthOfTextAtSize(t,5.3)>mxW){if(cur)lines.push(cur);cur=w;}else cur=t;});if(cur)lines.push(cur);});lines.slice(0,5).forEach((ln,i)=>Txt(ln,X2+2*MM,remTop-7*MM-i*3.8*MM,5.3,fR,BLACK));}

  // Bloc 3 : Installateur électricien
  colBox(X3,C3W,T.pdfInstTitle);
  [[T.pdfNomPrenom,D.nom_prenom||''],[T.pdfLieuDate,(D.lieu||'')+'   '+(D.date_sig||'')]].forEach(([k,v],i)=>{
    const iy=BY+BH-5.5*MM-(i+1)*9*MM;if(i%2===0)R(X3,iy,C3W,9*MM,LGRAY);
    Txt(k,X3+2*MM,iy+5.5*MM,5.8,fB,DGRAY);Txt(clip(v,C3W-4*MM,6,fR),X3+2*MM,iy+2*MM,6,fR,BLACK);
  });
  const sigY=BY+BH-5.5*MM-2*9*MM-8*MM;
  Txt(T.pdfSignature,X3+2*MM,sigY+4*MM,5.8,fB,DGRAY);
  L(X3+18*MM,sigY+4*MM,X3+C3W-4*MM,sigY+4*MM,MGRAY,.6);

  // 5. FOOTER
  R(0,0,W,5*MM,LGRAY);
  Txt("C2 - Internal",ML,1.5*MM,5,fR,DGRAY);
  TxtC(T.pdfFooter,0,W,1.5*MM,5,fR,DGRAY);

  const bytes=await doc.save();
  const blob=new Blob([bytes],{type:'application/pdf'});
  const url=URL.createObjectURL(blob);
  const fname='Protocole_'+(D.num_tableau||'T00').replace(/\s/g,'_')+'_'+(D.date_sig||new Date().toISOString().slice(0,10))+'.pdf';
  const a=document.createElement('a');a.href=url;a.download=fname;a.target='_blank';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
