// ══════════════════════════════════════════
// RECENSIONI DEGLI AGENTI
// ══════════════════════════════════════════
// La scheda di ogni agente mostrava tre recensioni scritte nel codice —
// "Implementato in produzione in 2 ore", "Ottimo agente, configurazione
// semplice", "Perfetto per il nostro workflow" — IDENTICHE su tutti e 22 gli
// agenti del catalogo. Dicevano che la scheda ha delle recensioni, non cosa
// pensa qualcuno di quell'agente: aprendone due di seguito la finzione era
// evidente. Ora sono righe di database, una persona ne scrive al massimo una
// per agente, e la valutazione mostrata e' la media di quelle righe.

// La chiave e' testuale e non l'id numerico: gli agenti pubblicati dalla
// community prendono l'id 1000+n dalla riga di `published_agents`, e quel
// numero si sposta se una pubblicazione viene rimossa — le recensioni
// finirebbero attaccate a un altro agente. Il nome, per le pubblicazioni, e'
// gia' univoco; per il catalogo l'id e' fisso nel codice.
function recChiave(a){
  if(!a)return null;
  return (a.community||a.id>=1000)?('pub:'+a.name):('cat:'+a.id);
}

function recElenco(chiave){
  if(!chiave)return [];
  return dbAll('SELECT * FROM recensioni WHERE agent_key=? ORDER BY COALESCE(updated_at,created_at) DESC',[chiave]);
}

// Media, numero e distribuzione: la distribuzione e' la parte che distingue
// "4.5 con tutti d'accordo" da "4.5 con meta' entusiasti e meta' delusi".
function recRiepilogo(chiave){
  var righe=recElenco(chiave);
  var dist=[0,0,0,0,0],somma=0;
  righe.forEach(function(r){ var s=Math.max(1,Math.min(5,r.stelle|0)); dist[s-1]++; somma+=s });
  return {n:righe.length, media:righe.length?(somma/righe.length):0, dist:dist, righe:righe};
}

function recMia(chiave){
  return dbGetOne('SELECT * FROM recensioni WHERE agent_key=? AND autore=?',[chiave,utenteCorrente()]);
}

// Le stelle sono disegnate in frazioni, non arrotondate: una media di 4.5
// arrotondata mostrava cinque stelle piene accanto al numero "4.5", cioe' un
// disegno che contraddiceva la cifra che aveva di fianco. Cinque stelle grigie
// fanno da fondo, una copia dorata viene ritagliata alla percentuale esatta.
function recStelle(n,dim){
  n=Math.max(0,Math.min(5,n||0));
  var d=dim||12, pc=(n/5*100).toFixed(1);
  return '<span style="position:relative;display:inline-block;font-size:'+d+'px;line-height:1;letter-spacing:1px;white-space:nowrap">'+
    '<span style="color:var(--bd)">★★★★★</span>'+
    '<span style="position:absolute;left:0;top:0;width:'+pc+'%;overflow:hidden;color:#F59E0B">★★★★★</span>'+
  '</span>';
}

// Valutazione da mostrare: la media reale quando esistono recensioni, altrimenti
// il valore di catalogo. Senza questo la scheda avrebbe potuto dichiarare "4.8"
// con sotto tre recensioni da due stelle.
function recValutazione(a){
  var r=recRiepilogo(recChiave(a));
  if(r.n)return {valore:Math.round(r.media*10)/10, n:r.n, reale:true};
  return {valore:a.rating||0, n:0, reale:false};
}

var recStelleScelte=0;
function recScegliStelle(n){
  recStelleScelte=n;
  for(var i=1;i<=5;i++){
    var b=document.getElementById('recStella'+i);
    if(b)b.style.color=(i<=n)?'#F59E0B':'var(--bd)';
  }
  var av=document.getElementById('recAvviso'); if(av)av.textContent='';
}

// ── Il blocco che compare nella scheda dell'agente ──
function recBlocco(a){
  var chiave=recChiave(a);
  var r=recRiepilogo(chiave);
  var mia=recMia(chiave);
  recStelleScelte=mia?mia.stelle:0;

  var testata=r.n
    ? '<div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">'+
        '<div style="text-align:center;min-width:66px">'+
          '<div style="font-size:26px;font-weight:800;line-height:1">'+(Math.round(r.media*10)/10)+'</div>'+
          recStelle(r.media,11)+
          '<div style="font-size:10px;color:var(--tx4);margin-top:2px">'+r.n+' recension'+(r.n===1?'e':'i')+'</div>'+
        '</div>'+
        '<div style="flex:1">'+[5,4,3,2,1].map(function(s){
          var q=r.dist[s-1],pc=r.n?Math.round(q*100/r.n):0;
          return '<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--tx4)">'+
            '<span style="width:10px">'+s+'</span>'+
            '<div style="flex:1;height:5px;background:var(--bg2);border-radius:3px;overflow:hidden">'+
              '<div style="width:'+pc+'%;height:100%;background:#F59E0B"></div></div>'+
            '<span style="width:16px;text-align:right">'+q+'</span></div>';
        }).join('')+'</div>'+
      '</div>'
    : '<div style="background:var(--bg2);border-radius:8px;padding:12px;font-size:11px;color:var(--tx3);margin-bottom:12px">'+
      'Ancora nessuna recensione: la tua sarebbe la prima.</div>';

  // Il modulo e' sempre visibile, anche a chi ha gia' scritto: in quel caso
  // parte compilato e il salvataggio CORREGGE la propria recensione. Un secondo
  // modulo vuoto farebbe credere di poterne lasciare due.
  var modulo='<div style="border:1px solid var(--bd);border-radius:10px;padding:12px;margin-bottom:14px">'+
    '<div style="font-size:11px;font-weight:700;margin-bottom:6px">'+(mia?'✏️ La tua recensione':'✍️ Scrivi una recensione')+'</div>'+
    '<div style="display:flex;gap:2px;margin-bottom:8px">'+[1,2,3,4,5].map(function(i){
      return '<span id="recStella'+i+'" onclick="recScegliStelle('+i+')" title="'+i+' su 5" '+
        'style="cursor:pointer;font-size:22px;line-height:1;color:'+((mia&&i<=mia.stelle)?'#F59E0B':'var(--bd)')+'">★</span>';
    }).join('')+'</div>'+
    '<textarea id="recTesto" rows="2" placeholder="Cosa ha funzionato, cosa no?" '+
      'style="width:100%;box-sizing:border-box;border:1px solid var(--bd);border-radius:8px;padding:8px;font:inherit;font-size:12px;resize:vertical">'+
      escHtml(mia?(mia.testo||''):'')+'</textarea>'+
    '<div id="recAvviso" style="font-size:11px;color:#B91C1C;margin-top:4px"></div>'+
    '<div style="display:flex;gap:6px;margin-top:8px">'+
      '<button class="tb-btn primary" style="height:30px;font-size:11px" onclick="recSalva('+a.id+')">'+(mia?'Aggiorna':'Pubblica')+'</button>'+
      (mia?'<button class="tb-btn" style="height:30px;font-size:11px;color:#B91C1C" onclick="recElimina('+a.id+')">Elimina</button>':'')+
    '</div></div>';

  var elenco=r.righe.map(function(x){
    var suo=(x.autore===utenteCorrente());
    return '<div style="padding:9px 0;border-bottom:1px solid var(--bg2)">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">'+
        '<span style="font-size:12px;font-weight:600">'+escHtml(x.autore)+
          (suo?' <span style="font-size:9px;font-weight:700;color:var(--ac);background:var(--ac-ul);border-radius:4px;padding:1px 5px">tu</span>':'')+'</span>'+
        '<span style="display:flex;align-items:center;gap:6px">'+recStelle(x.stelle,11)+
          '<span style="font-size:10px;color:var(--tx4)">'+relTimeIt(new Date(x.updated_at||x.created_at).getTime())+'</span></span>'+
      '</div>'+
      (x.testo?'<div style="font-size:12px;color:var(--tx3);margin-top:3px;line-height:1.55">'+escHtml(x.testo)+'</div>':'')+
    '</div>';
  }).join('');

  return '<div id="recBloccoWrap">'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:8px">💬 Recensioni</div>'+
    testata+modulo+elenco+'</div>';
}

// Ridisegna SOLO il blocco: rigenerare l'intera finestra riporterebbe in cima
// chi ha appena scritto, perdendo la posizione di scorrimento.
function recRidisegna(id){
  var a=AGENTS.concat(getPublishedAgents()).find(function(x){return x.id===id});
  var w=document.getElementById('recBloccoWrap');
  if(a&&w)w.outerHTML=recBlocco(a);
  if(typeof renderMkt==='function'&&currentPage==='marketplace')renderMkt();
}

function recSalva(id){
  var a=AGENTS.concat(getPublishedAgents()).find(function(x){return x.id===id});if(!a)return;
  var chiave=recChiave(a);
  var testo=(document.getElementById('recTesto')||{value:''}).value.trim();
  var av=document.getElementById('recAvviso');
  // Le stelle sono il dato che entra nella media: senza, la recensione
  // sposterebbe il conteggio senza dire niente.
  if(!recStelleScelte){ if(av)av.textContent='Scegli da 1 a 5 stelle prima di pubblicare.'; return }
  if(testo.length>600)testo=testo.substring(0,600);
  var ora=new Date().toISOString();
  var mia=recMia(chiave);
  if(mia)dbRun('UPDATE recensioni SET stelle=?,testo=?,updated_at=? WHERE id=?',[recStelleScelte,testo,ora,mia.id]);
  else dbRun('INSERT INTO recensioni (agent_key,autore,stelle,testo,created_at) VALUES (?,?,?,?,?)',
    [chiave,utenteCorrente(),recStelleScelte,testo,ora]);
  if(typeof persistDatabaseNow==='function')persistDatabaseNow();
  // 4.4: «anche gli agenti con il rating piu' alto generano punti esperienza».
  // Solo alla PRIMA recensione e solo da 4 stelle in su: se contasse anche la
  // modifica, si potrebbe far salire un autore alzando e riabbassando il voto.
  if(!mia && recStelleScelte>=4 && a.author && a.author!==utenteCorrente() && typeof addXPa==='function')
    addXPa(a.author,10,'Recensione positiva ricevuta su "'+a.name+'" ('+recStelleScelte+'/5)');
  showToast(mia?'✏️ Recensione aggiornata':'💬 Recensione pubblicata');
  addAct((mia?'Aggiornata':'Pubblicata')+' una recensione su "'+a.name+'" ('+recStelleScelte+'/5)');
  recRidisegna(id);
}

function recElimina(id){
  var a=AGENTS.concat(getPublishedAgents()).find(function(x){return x.id===id});if(!a)return;
  var mia=recMia(recChiave(a));
  if(!mia)return;
  if(!confirm('Eliminare la tua recensione su "'+a.name+'"?'))return;
  dbRun('DELETE FROM recensioni WHERE id=?',[mia.id]);
  if(typeof persistDatabaseNow==='function')persistDatabaseNow();
  recStelleScelte=0;
  showToast('🗑️ Recensione eliminata');
  recRidisegna(id);
}
