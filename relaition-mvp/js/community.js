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

// ══════════════════════════════════════════════════════════════
// ALLEGATI MULTIPLI SUI POST (fino a 5)
// ══════════════════════════════════════════════════════════════
// Un post poteva portare un solo file. Ma chi racconta un flusso porta il JSON
// dell'agente, un CSV di prova e uno schema: tre cose che si spiegano insieme e
// che, una alla volta, costringevano a tre post o a una scelta.
//
// Il modello nuovo è `p.allegati`, un elenco. I campi singoli `attach_*`
// restano allineati al PRIMO allegato: sono usati in una decina di punti — la
// scheda, il visore delle immagini, l'esportazione — e riscriverli tutti per
// un cambiamento di forma sarebbe stato il modo più costoso di introdurre un
// difetto. Chi legge il campo singolo continua a funzionare; chi vuole tutti
// gli allegati chiama `allegatiDiPost()`.
var POST_ALLEGATI_MAX = 5;
var POST_ALLEGATO_BYTE = 500*1024;

function allegatiDiPost(p){
  if(!p)return [];
  if(p.allegati && p.allegati.length)return p.allegati;
  if(p.attach_name)return [{nome:p.attach_name, mime:p.attach_mime, dati:p.attach_data}];
  return [];
}

// Riallinea i campi singoli al primo allegato: è ciò che tiene in piedi tutto
// il codice scritto prima che gli allegati fossero più di uno.
function sincronizzaAllegatoPrincipale(p){
  var l=allegatiDiPost(p);
  if(l.length){ p.attach_name=l[0].nome; p.attach_mime=l[0].mime; p.attach_data=l[0].dati }
  else { p.attach_name=null; p.attach_mime=null; p.attach_data=null }
  return p;
}

// Tutte le immagini di tutti i post, non più una per post: il visore le scorre
// in fila, ed è il motivo per cui si possono allegare più schemi allo stesso
// racconto.
function immaginiDeiPost(){
  var out=[];
  (typeof POSTS!=='undefined'?POSTS:[]).forEach(function(p){
    allegatiDiPost(p).forEach(function(a,i){
      if(a.dati && /^image\//.test(a.mime||''))out.push({post:p, idx:i, nome:a.nome, dati:a.dati, user:p.user, title:p.title});
    });
  });
  return out;
}

function scaricaAllegatoPost(id, idx){
  var p=(typeof POSTS!=='undefined'?POSTS:[]).filter(function(x){return x.id===id})[0];
  var l=allegatiDiPost(p);
  var a=l[idx||0];
  if(!a||!a.dati){showToast('⚠️ Allegato non disponibile');return}
  var el=document.createElement('a');
  el.href=a.dati; el.download=a.nome||'allegato';
  document.body.appendChild(el); el.click(); document.body.removeChild(el);
  showToast('⬇️ '+(a.nome||'allegato'));
}

// Riquadro degli allegati sotto il testo del post: le immagini si vedono, gli
// altri formati restano una riga con il pulsante — per un CSV o un JSON è
// giusto così.
function allegatiHTMLPost(p){
  var l=allegatiDiPost(p);
  if(!l.length)return '';
  var imgs=l.map(function(a,i){return {a:a,i:i}}).filter(function(x){return /^image\//.test(x.a.mime||'')});
  var file=l.map(function(a,i){return {a:a,i:i}}).filter(function(x){return !/^image\//.test(x.a.mime||'')});
  var h='';
  imgs.forEach(function(x){
    h+='<div style="margin:9px 0;border-radius:10px;overflow:hidden;border:1px solid var(--bo);background:var(--bg2)">'+
      '<img src="'+x.a.dati+'" alt="'+escHtml(x.a.nome||'')+'" loading="lazy" '+
        'onclick="event.stopPropagation();apriImmaginePost('+p.id+','+x.i+')" title="Apri a schermo intero" '+
        'style="display:block;width:100%;max-height:260px;object-fit:cover;cursor:zoom-in">'+
      '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px">'+
        '<span style="flex:1;min-width:0;font-size:10.5px;color:var(--tx4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(x.a.nome||'')+'</span>'+
        '<button class="tb-btn" style="height:24px;font-size:10px" onclick="event.stopPropagation();apriImmaginePost('+p.id+','+x.i+')" title="Apri a schermo intero">🔍</button>'+
        '<button class="tb-btn" style="height:24px;font-size:10px" onclick="event.stopPropagation();scaricaAllegatoPost('+p.id+','+x.i+')" title="Scarica">⬇️</button>'+
      '</div></div>';
  });
  file.forEach(function(x){
    h+='<div style="display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--bo);border-radius:8px;padding:7px 10px;margin:8px 0">'+
      '<span style="font-size:14px">📎</span>'+
      '<span style="flex:1;min-width:0;font-size:11.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(x.a.nome||'')+'</span>'+
      '<button class="tb-btn" style="height:26px;font-size:10.5px" onclick="event.stopPropagation();scaricaAllegatoPost('+p.id+','+x.i+')">⬇️ Scarica</button>'+
      // Un flusso esportato non si scarica soltanto: si apre. E' la differenza
      // fra un post che racconta e uno che si puo' provare.
      (/\.json$/i.test(x.a.nome||"")
        ? '<button class="tb-btn primary" style="height:26px;font-size:10.5px" onclick="event.stopPropagation();importaFlussoDalPost('+p.id+','+x.i+')" title="Apre il workflow nel Builder">📥 Apri nel Builder</button>'
        : '')+
    '</div>';
  });
  return h;
}

// ── Compositore: scelta di piu' file ──
var POST_ALLEGATI = [];

function postAllegatiInit(p){
  POST_ALLEGATI = p ? allegatiDiPost(p).slice(0, POST_ALLEGATI_MAX).map(function(a){
    return {nome:a.nome, mime:a.mime, dati:a.dati, byte:a.byte||0}
  }) : [];
}

function postAllegatiRiquadro(){
  var n=POST_ALLEGATI.length;
  var chip=POST_ALLEGATI.map(function(a,i){
    var img=/^image\//.test(a.mime||'');
    return '<span class="allegato-chip" title="'+escHtml(a.nome)+'">'+
      '<span style="font-size:10px">'+(img?'🖼️':'📎')+'</span>'+
      '<span class="allegato-nome">'+escHtml(a.nome)+'</span>'+
      '<span class="allegato-x" title="Togli" onclick="postTogliAllegato('+i+')">✕</span></span>';
  }).join('');
  return '<div class="allegati-lista">'+chip+'</div>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-top:6px">'+
      '<button class="tb-btn" style="flex:1" '+(n>=POST_ALLEGATI_MAX?'disabled ':'')+
        'onclick="document.getElementById(\'postFileInput\').click()">'+
        (n?'Aggiungi un altro file…':'Scegli i file…')+'</button>'+
      '<span style="font-size:10.5px;color:'+(n>=POST_ALLEGATI_MAX?'#B45309':'var(--tx4)')+';font-weight:700">'+
        n+'/'+POST_ALLEGATI_MAX+'</span>'+
    '</div>'+
    '<div style="font-size:10.5px;color:var(--tx4);margin-top:5px;line-height:1.45">'+
      (n>=POST_ALLEGATI_MAX
        ? 'Hai raggiunto il massimo: togline uno per aggiungerne un altro.'
        : 'Workflow esportato, CSV di esempio, schema, checklist… fino a '+POST_ALLEGATI_MAX+' file, max 500 KB ciascuno.')+
    '</div>';
}

function postDisegnaAllegati(){
  var box=document.getElementById('postAllegatoInfo');
  if(box)box.innerHTML=postAllegatiRiquadro();
}

function postTogliAllegato(i){
  var via=POST_ALLEGATI.splice(i,1)[0];
  postDisegnaAllegati();
  if(via)showToast('📎 Tolto: '+via.nome);
}

// Legge i file scelti. Il campo accetta piu' selezioni, e ogni chiamata si
// somma a quelli gia' scelti: si possono prendere da cartelle diverse.
function caricaAllegatoPost(input){
  var files=Array.prototype.slice.call(input.files||[]);
  if(!files.length)return;
  var scartati=[], letti=0;
  files.forEach(function(f){
    if(POST_ALLEGATI.length>=POST_ALLEGATI_MAX){ scartati.push(f.name+' (oltre i '+POST_ALLEGATI_MAX+')'); if(++letti===files.length)fine(); return }
    if(f.size>POST_ALLEGATO_BYTE){ scartati.push(f.name+' (oltre 500 KB)'); if(++letti===files.length)fine(); return }
    var r=new FileReader();
    r.onload=function(e){
      if(POST_ALLEGATI.length<POST_ALLEGATI_MAX)
        POST_ALLEGATI.push({nome:f.name, mime:f.type||'application/octet-stream', dati:e.target.result, byte:f.size});
      if(++letti===files.length)fine();
    };
    r.onerror=function(){ scartati.push(f.name+' (non leggibile)'); if(++letti===files.length)fine() };
    r.readAsDataURL(f);
  });
  function fine(){
    postDisegnaAllegati();
    input.value='';
    if(scartati.length)showToast('⚠️ Non allegati: '+scartati.join(', '));
  }
}

function rimuoviAllegatoPost(){ POST_ALLEGATI=[]; postDisegnaAllegati() }
