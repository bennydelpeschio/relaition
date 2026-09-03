// ══════════════════════════════════════════
// COMMUNITY — i numeri diventano veri
// ══════════════════════════════════════════
// La Community aveva già post, commenti, allegati e composizione. Il problema
// non era che mancasse qualcosa: era che i numeri mostrati non corrispondevano
// a niente.
//
//   «💬 44» su un post con ZERO commenti. Tutti e quindici i post dichiaravano
//   un conteggio inventato: 8 contro 3 reali, 31 contro 2, 44 contro 0. Chi
//   apriva il post lo vedeva subito.
//
//   «❤️» era `p.likes++`: un contatore cieco. Dieci clic della stessa persona
//   facevano dieci. Non si poteva togliere il voto, e nessuno sapeva chi
//   avesse apprezzato.
//
//   «👁️» erano numeri fissi scritti nel seme, uguali dopo cento aperture.
//
// Qui i tre conteggi diventano interrogazioni: contano righe, e le righe le
// scrivono le persone. È la stessa correzione già fatta sulle recensioni degli
// agenti e sui voti delle sfide — la regola della piattaforma è che un numero
// mostrato deve essere calcolato, non dichiarato.

// ── MI PIACE ──
function fmLike(postId){
  return dbGetOne('SELECT COUNT(*) c FROM forum_likes WHERE post_id=?',[postId]).c;
}
function fmHoMessoLike(postId){
  return !!dbGetOne('SELECT 1 x FROM forum_likes WHERE post_id=? AND user=?',[postId,utenteCorrente()]);
}
// Si toglie ricliccando, come il voto sulle sfide: un gesto irrevocabile fa
// esitare, e chi esita non partecipa.
function fmAlternaLike(postId){
  if(fmHoMessoLike(postId)){
    dbRun('DELETE FROM forum_likes WHERE post_id=? AND user=?',[postId,utenteCorrente()]);
  }else{
    dbRun('INSERT OR IGNORE INTO forum_likes (post_id,user,ts) VALUES (?,?,?)',
      [postId,utenteCorrente(),new Date().toISOString()]);
    addXP(5,'Apprezzato un contributo della community');
  }
  persistDatabaseNow();
  if(currentPage==='community')renderCommunity();
  var ov=document.getElementById('modalOverlay');
  if(ov&&/show/.test(ov.className)&&ov.getAttribute('data-post')==String(postId))openPostDetail(postId);
}

// ── COMMENTI: il conteggio è la lunghezza dell'elenco ──
// Non c'è più un campo `comments` da tenere allineato: un contatore separato
// dai dati che conta è un contatore che prima o poi mente.
function fmCommenti(postId){
  return (COMMENTS[postId]||[]).length;
}

// ── VISUALIZZAZIONI ──
// Contate per persona, non per apertura: riaprire lo stesso post dieci volte
// non è dieci persone interessate. Il seme resta come base, altrimenti un
// forum appena aperto mostrerebbe ovunque «1».
function fmViste(postId,base){
  return (base||0)+dbGetOne('SELECT COUNT(*) c FROM forum_views WHERE post_id=?',[postId]).c;
}
function fmRegistraVista(postId){
  dbRun('INSERT OR IGNORE INTO forum_views (post_id,user,ts) VALUES (?,?,?)',
    [postId,utenteCorrente(),new Date().toISOString()]);
}

// ── I MIEI CONTRIBUTI ──
// Chi scrive vuole ritrovare ciò che ha scritto senza scorrere tutto.
function fmMieiPost(){
  return POSTS.filter(function(p){return p.user===utenteCorrente()}).length;
}
function fmMieiCommenti(){
  var n=0;
  Object.keys(COMMENTS).forEach(function(k){
    n+=COMMENTS[k].filter(function(c){return c.user===utenteCorrente()}).length;
  });
  return n;
}

// Un commento si cancella solo se è proprio. Il conteggio si aggiorna da solo,
// perché è calcolato.
function fmEliminaCommento(postId,idx){
  var c=(COMMENTS[postId]||[])[idx];
  if(!c||c.user!==utenteCorrente())return;
  if(!confirm('Eliminare il tuo commento?'))return;
  COMMENTS[postId].splice(idx,1);
  saveForumState();
  openPostDetail(postId);
  showToast('🗑️ Commento eliminato');
}

// ── RIEPILOGO IN CIMA ALLA PAGINA ──
// Dice a chi guarda quanto è viva la community, con numeri che ora reggono il
// controllo: si può aprire un post e contare.
function fmRiepilogo(){
  var post=POSTS.length;
  var commenti=Object.keys(COMMENTS).reduce(function(a,k){return a+COMMENTS[k].length},0);
  var like=dbGetOne('SELECT COUNT(*) c FROM forum_likes').c;
  var autori={};POSTS.forEach(function(p){autori[p.user]=1});
  var voci=[
    ['💬',post,'contributi'],
    ['↩️',commenti,'risposte'],
    ['❤️',like,'apprezzamenti'],
    ['👥',Object.keys(autori).length,'persone'],
    ['✍️',fmMieiPost()+fmMieiCommenti(),'tuoi interventi']
  ];
  return '<div class="card" style="padding:12px 16px;margin-bottom:14px;display:flex;gap:22px;flex-wrap:wrap;align-items:center">'+
    voci.map(function(v){
      return '<div style="display:flex;align-items:baseline;gap:6px">'+
        '<span style="font-size:14px">'+v[0]+'</span>'+
        '<span style="font-size:16px;font-weight:800">'+v[1]+'</span>'+
        '<span style="font-size:11px;color:var(--tx4)">'+v[2]+'</span></div>';
    }).join('')+
    '<span style="margin-left:auto;font-size:10.5px;color:var(--tx4)">Ogni numero è contato sulle righe reali, non dichiarato.</span>'+
  '</div>';
}
