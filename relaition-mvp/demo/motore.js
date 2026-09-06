// ═══════════════════════════════════════════════════════════════
// MOTORE DELLA DEMO AUTOGUIDATA
// ═══════════════════════════════════════════════════════════════
// La demo vive FUORI dall'applicazione: RelAItion viene caricata dentro un
// riquadro e pilotata da qui. Nessun file dell'app e' stato modificato, nessun
// pulsante aggiunto, nessuna riga di logica toccata: se domani la demo venisse
// cancellata, la piattaforma resterebbe identica. E' anche il motivo per cui
// sta in una cartella a parte.
//
// Funziona perche' pagina e applicazione condividono l'origine: da qui si
// chiamano `go()`, `dbAll()`, `B` e tutto il resto esattamente come farebbe il
// codice dell'app.

var D = {
  passo: 0,
  riproduce: false,
  timer: null,
  velocita: 1,
  fotografia: null,
  pronta: false
};

function app(){ var f=document.getElementById('app'); return f&&f.contentWindow }
function doc(){ var w=app(); return w&&w.document }

// ── Fotografia e ripristino ────────────────────────────────────
// La demo crea agenti, pubblica, scrive nel forum e cambia il profilo: senza
// un ripristino, alla seconda esecuzione la piattaforma sarebbe piena di roba
// di prova e la terza dimostrazione mostrerebbe uno stato diverso dalla prima.
// Si fotografano tutte le tabelle prima di cominciare e si rimettono com'erano
// alla fine, cosi' la demo e' ripetibile all'infinito e identica ogni volta.
function fotografaStato(){
  var w=app(); if(!w||!w.DB_TABLES)return null;
  var f={tabelle:{},locali:{}};
  w.DB_TABLES.forEach(function(t){
    try{ f.tabelle[t]=w.dbAll('SELECT * FROM '+t) }catch(e){ f.tabelle[t]=[] }
  });
  ['relaition_builder','relaition_profilo','relaition_menu_compatto','relaition_tour_passo'].forEach(function(k){
    try{ f.locali[k]=w.localStorage.getItem(k) }catch(e){}
  });
  return f;
}

function ripristinaStato(f){
  var w=app(); if(!w||!f)return false;
  try{
    w.DB_TABLES.forEach(function(t){ w.dbRun('DELETE FROM '+t) });
    w.DB_TABLES.forEach(function(t){
      (f.tabelle[t]||[]).forEach(function(riga){ try{ w.dbInsertRow(t,riga) }catch(e){} });
    });
    Object.keys(f.locali).forEach(function(k){
      try{ if(f.locali[k]===null)w.localStorage.removeItem(k); else w.localStorage.setItem(k,f.locali[k]) }catch(e){}
    });
    if(typeof w.persistDatabaseNow==='function')w.persistDatabaseNow();
    return true;
  }catch(e){ return false }
}

// ── Puntatore finto ────────────────────────────────────────────
// In una registrazione, le cose che accadono da sole senza una causa visibile
// sono illeggibili: chi guarda vede cambiare la schermata e non capisce
// perche'. Il puntatore si muove fino al bersaglio e "preme" prima che
// l'azione avvenga, cosi' il video racconta un gesto invece di un salto.
function puntatore(){ return document.getElementById('cursore') }

function muoviPuntatore(x,y){
  var p=puntatore(); if(!p)return;
  p.style.opacity='1';
  p.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px)';
}

function premi(x,y){
  muoviPuntatore(x,y);
  var o=document.createElement('div');
  o.className='onda';
  o.style.left=Math.round(x)+'px';
  o.style.top=Math.round(y)+'px';
  document.body.appendChild(o);
  setTimeout(function(){ o.remove() },700);
}

// Posizione di un elemento dell'app nelle coordinate di QUESTA pagina:
// il riquadro puo' non partire dall'origine, e senza la traslazione il faretto
// finirebbe sistematicamente spostato.
function rettangolo(sel){
  var d=doc(); if(!d)return null;
  var el=(typeof sel==='string')?d.querySelector(sel):sel;
  if(!el)return null;
  var r=el.getBoundingClientRect();
  var f=document.getElementById('app').getBoundingClientRect();
  return {top:r.top+f.top, left:r.left+f.left, width:r.width, height:r.height,
          bottom:r.bottom+f.top, right:r.right+f.left, el:el};
}

// Clic vero, preceduto dal gesto. Restituisce false se l'elemento non c'e':
// il copione se ne accorge e il passo non finge di aver fatto qualcosa.
// Clic vero, preceduto dal gesto. Restituisce false se l'elemento non c'e':
// il copione se ne accorge e il passo non finge di aver fatto qualcosa.
// Prima di premere si porta il bersaglio dentro la parte visibile: un pulsante
// in fondo a una finestra scorrevole veniva cliccato davvero, ma il puntatore
// compariva dove quel pulsante non era, e chi guardava vedeva una cosa
// accadere senza una causa visibile.
function clicca(sel){
  var d=doc(); if(!d)return false;
  var el=(typeof sel==='string')?d.querySelector(sel):sel;
  if(!el)return false;
  var spostato=portaInVista(el);
  var premiEClicca=function(){
    var r=rettangolo(el);
    if(!r){ try{ el.click() }catch(e){} return }
    premi(r.left+r.width/2, r.top+r.height/2);
    setTimeout(function(){ try{ el.click() }catch(e){} }, 300);
  };
  if(spostato)setTimeout(premiEClicca,520); else premiEClicca();
  return true;
}

// Scrittura a macchina dentro un campo dell'app: incollare tutto insieme non
// si legge, e in una dimostrazione il testo che compare lettera per lettera e'
// il modo piu' semplice di far capire che quel campo lo sta riempiendo qualcuno.
// Scrittura a macchina dentro un campo dell'applicazione. L'effetto e' utile
// — in una registrazione il testo che compare lettera per lettera fa capire
// che quel campo lo sta riempiendo qualcuno — ma NON deve essere la condizione
// perche' la modifica avvenga.
//
// La prima versione avanzava di un carattere per battito di cronometro: quando
// il browser rallenta i timer (scheda non in primo piano, finestra coperta,
// registrazione in corso) la scrittura si fermava a quattro lettere, l'evento
// finale non partiva mai e la configurazione del nodo restava vuota. Il campo
// mostrava un testo che non era stato registrato da nessuna parte.
//
// Ora c'e' una SCADENZA: si avanza in proporzione al tempo trascorso, e allo
// scadere si scrive comunque il testo intero e si notifica. Se i timer sono
// veloci si vede l'effetto macchina da scrivere; se sono strozzati il testo
// compare a scatti o in blocco, ma il risultato e' sempre quello giusto.
function scrivi(sel,testo,fine){
  var r=rettangolo(sel);
  if(!r){ if(fine)fine(); return }
  premi(r.left+r.width/2, r.top+r.height/2);
  var el=r.el;
  try{ el.focus() }catch(e){}
  el.value='';
  var durata=Math.min(2600, Math.max(700, testo.length*26))/D.velocita;
  var t0=Date.now(), finito=false;
  var chiudi=function(){
    if(finito)return;
    finito=true;
    el.value=testo;
    scatena(el,'input');
    scatena(el,'change');
    if(fine)fine();
  };
  var battito=setInterval(function(){
    var q=(Date.now()-t0)/durata;
    if(q>=1){ clearInterval(battito); chiudi(); return }
    el.value=testo.substring(0, Math.max(1, Math.round(testo.length*q)));
    scatena(el,'input');
  }, 40);
  // Rete di sicurezza: se anche questo timer venisse strozzato, la scrittura
  // si chiude comunque e il passo successivo non resta appeso.
  setTimeout(function(){ clearInterval(battito); chiudi() }, durata+900);
}

// Notifica un campo dell'applicazione che il suo valore e' cambiato.
// L'evento sintetico da solo non bastava: il valore compariva a schermo ma la
// configurazione del nodo restava vuota, cioe' la dimostrazione mostrava una
// modifica che non era stata registrata da nessuna parte. Si scatena l'evento
// E si invoca il gestore in linea, che e' quello che l'applicazione usa
// davvero (`onchange="updConfig(...)"`).
function scatena(el,tipo){
  try{ el.dispatchEvent(new (app()).Event(tipo,{bubbles:true})) }catch(e){}
  try{
    var h=el['on'+tipo];
    if(typeof h==='function')h.call(el,{target:el,type:tipo});
  }catch(e){}
}

// ── Faretto e riquadro di narrazione ───────────────────────────
// Porta l'elemento dentro la parte visibile PRIMA di illuminarlo. Senza,
// il faretto finiva su un pezzo di schermo dove l'elemento non c'era: il
// pulsante «Installa» sta in fondo a una finestra scorrevole, e la
// dimostrazione lo annunciava mentre restava sotto il bordo. Si scorre il
// contenitore, non la pagina intera, cosi' non si sposta anche il resto.
function portaInVista(sel){
  var d=doc(); if(!d||!sel)return false;
  var el=(typeof sel==='string')?d.querySelector(sel):sel;
  if(!el||typeof el.getBoundingClientRect!=='function')return false;
  var r=el.getBoundingClientRect();
  var fuori = r.top<0 || r.bottom>(d.documentElement.clientHeight||0) ||
              r.height===0 || r.width===0;
  if(!fuori)return false;
  try{ el.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'}) }
  catch(e){ try{ el.scrollIntoView() }catch(e2){} }
  return true;
}

// Un passo puo' indicare il bersaglio come stringa, come elemento, o come
// FUNZIONE che lo calcola al momento. L'ultima serve dove l'elemento non ha un
// selettore stabile — «il pulsante che contiene la parola Installa» — e va
// ritrovato quando il passo viene eseguito, non quando il copione viene letto.
function risolviSel(s){
  try{ return (typeof s==='function')?s():s }catch(e){ return null }
}

function illumina(sel){
  var spot=document.getElementById('faretto');
  var r=sel?rettangolo(sel):null;
  if(!r){ spot.style.display='none'; return null }
  // Un elemento alto quanto tutta la finestra, o piu', non si illumina: il
  // faretto coprirebbe l'intera schermata e non indicherebbe niente. Meglio
  // spegnerlo e lasciare parlare la narrazione.
  if(r.height>window.innerHeight*0.92 && r.width>window.innerWidth*0.92){
    spot.style.display='none';
    return r;
  }
  var p=8;
  spot.style.display='block';
  spot.style.top=(r.top-p)+'px';
  spot.style.left=(r.left-p)+'px';
  spot.style.width=(r.width+p*2)+'px';
  spot.style.height=(r.height+p*2)+'px';
  return r;
}

// C'e' un'esecuzione in corso dentro l'applicazione? Illuminare mentre i nodi
// si accendono e il registro cresce significa indicare una posizione che fra
// mezzo secondo sara' diversa: si aspetta che finisca.
function esecuzioneInCorso(){
  var w=app(); if(!w)return false;
  try{ if(typeof w.isExecutionRunning==='function')return !!w.isExecutionRunning() }catch(e){}
  return false;
}

function attendiFineEsecuzione(fine,limite){
  var t0=Date.now(), max=limite||12000;
  var t=setInterval(function(){
    if(!esecuzioneInCorso()||Date.now()-t0>max){ clearInterval(t); fine() }
  },250);
}

function narra(s,i){
  var box=document.getElementById('narrazione');
  var cap=COPIONE_CAPITOLI[s.capitolo]||{n:'',t:''};
  document.getElementById('nCapitolo').textContent=cap.n+' · '+cap.t;
  document.getElementById('nTitolo').textContent=s.titolo;
  // Un passo puo' calcolare il proprio testo al momento: serve dove il
  // racconto dipende da cosa la piattaforma ha effettivamente permesso.
  document.getElementById('nTesto').innerHTML=(typeof s.testo==='function')?s.testo():s.testo;
  document.getElementById('nProgresso').style.width=Math.round((i+1)/COPIONE.length*100)+'%';
  document.getElementById('nContatore').textContent=(i+1)+' / '+COPIONE.length;

  // Il riquadro insegue l'elemento illuminato ma non lo copre e non esce dallo
  // schermo: se dal lato indicato non ci sta, si ribalta.
  var r=sel_ultimo;
  var bw=box.offsetWidth||360, bh=box.offsetHeight||180, m=16;
  var top,left;
  if(!r){ left=(window.innerWidth-bw)/2; top=window.innerHeight-bh-90; }
  else{
    var pos=s.pos||'bottom';
    if(pos==='right'){ left=r.right+m; top=r.top }
    else if(pos==='left'){ left=r.left-bw-m; top=r.top }
    else if(pos==='top'){ left=r.left+r.width/2-bw/2; top=r.top-bh-m }
    else { left=r.left+r.width/2-bw/2; top=r.bottom+m }
    if(left+bw>window.innerWidth-12)left=window.innerWidth-bw-12;
    if(left<12)left=12;
    if(top+bh>window.innerHeight-80)top=r.top-bh-m;
    if(top<12)top=12;
  }
  box.style.left=Math.round(left)+'px';
  box.style.top=Math.round(top)+'px';
  box.style.display='block';
}

var sel_ultimo=null;

// ── Esecuzione di un passo ─────────────────────────────────────
// Ogni passo puo': portare l'app su una pagina, compiere un'azione, attendere
// che qualcosa compaia, illuminare un elemento e raccontare cosa sta accadendo.
// L'attesa esplicita serve perche' alcune schermate si disegnano dopo: senza,
// il faretto illuminerebbe il vuoto lasciato dalla pagina precedente.
function vaiA(i){
  if(i<0)i=0;
  if(i>=COPIONE.length){ concludi(); return }
  D.passo=i;
  var s=COPIONE[i];
  var w=app(); if(!w)return;

  // Prima di qualunque cosa: si e' dentro l'applicazione? La schermata di
  // accesso e' un sovrapposto a tutta pagina, e chi salta a un capitolo
  // dall'indice senza passare dal passo che effettua l'accesso vedrebbe quella
  // invece della schermata di cui si parla. Il capitolo 1 e' l'eccezione:
  // racconta proprio l'accesso.
  var avvia=function(){
    if(s.pagina && w.currentPage!==s.pagina){ try{ w.go(s.pagina) }catch(e){} }

  setTimeout(function(){
    var proseguo=function(){
      // Tre attese in fila, e ognuna toglie un difetto che si vedeva:
      //  1. se un'esecuzione e' in corso si aspetta che finisca — illuminare
      //     mentre i nodi si accendono significa indicare una posizione che
      //     fra mezzo secondo sara' diversa;
      //  2. si porta il bersaglio dentro la parte visibile — il pulsante in
      //     fondo a una finestra scorrevole veniva annunciato mentre restava
      //     sotto il bordo;
      //  3. si illumina, e si ricalcola una seconda volta poco dopo, perche'
      //     alcune schermate finiscono di disegnarsi dopo che l'azione e'
      //     tornata.
      attendiFineEsecuzione(function(){
        if(D.passo!==i)return;
        var mira=risolviSel(s.sel);
        var spostato=portaInVista(mira);
        setTimeout(function(){
          if(D.passo!==i)return;
          sel_ultimo=illumina(mira);
          narra(s,i);
          aggiornaIndice();
          setTimeout(function(){
            if(D.passo!==i)return;
            var m2=risolviSel(s.sel);
            sel_ultimo=illumina(m2);
            narra(s,i);
          }, 750/D.velocita);
          if(D.riproduce)programmaProssimo(s);
        }, (spostato?520:(s.dopo||150))/D.velocita);
      }, 14000);
    };
    if(s.azione){
      try{
        // Un'azione che dichiara di essere asincrona riceve la funzione da
        // chiamare quando ha finito; le altre proseguono subito.
        if(s.azione.length>0) s.azione(proseguo); else { s.azione(); proseguo() }
      }catch(e){ console.warn('passo '+i+':',e); proseguo() }
    } else proseguo();
    }, 120/D.velocita);
  };
  if(s.capitolo>1 && typeof assicuraAccesso==='function') assicuraAccesso(avvia);
  else avvia();
}

// Il tempo di lettura non è fisso: un passo con tre righe di testo e uno con
// dodici non si leggono nello stesso tempo, e una demo che scorre prima che si
// finisca di leggere è peggio di una lenta.
function programmaProssimo(s){
  clearTimeout(D.timer);
  var testo=(typeof s.testo==='function')?s.testo():s.testo;
  var parole=String(testo||'').replace(/<[^>]+>/g,' ').split(/\s+/).length;
  var ms=(s.durata || Math.max(3200, parole*260)) / D.velocita;
  D.timer=setTimeout(function(){ if(D.riproduce)vaiA(D.passo+1) }, ms);
}

function avanti(){ clearTimeout(D.timer); vaiA(D.passo+1) }
function indietro(){ clearTimeout(D.timer); vaiA(D.passo-1) }

function riproduci(){
  D.riproduce=!D.riproduce;
  document.getElementById('bPlay').textContent=D.riproduce?'⏸':'▶';
  document.getElementById('bPlay').title=D.riproduce?'Metti in pausa':'Riproduci da sola';
  if(D.riproduce)programmaProssimo(COPIONE[D.passo]); else clearTimeout(D.timer);
}

function cambiaVelocita(){
  var v=[1,1.5,2,0.75];
  D.velocita=v[(v.indexOf(D.velocita)+1)%v.length];
  document.getElementById('bVel').textContent=D.velocita+'×';
}

// Nascondere i comandi serve alla registrazione: la barra è utile a chi guida,
// inutile a chi guarda il video.
function alternaComandi(){
  var b=document.getElementById('comandi');
  b.style.display=(b.style.display==='none')?'flex':'none';
}

function concludi(){
  clearTimeout(D.timer);
  D.riproduce=false;
  illumina(null);
  var box=document.getElementById('narrazione');
  document.getElementById('nCapitolo').textContent='Fine';
  document.getElementById('nTitolo').textContent='Dimostrazione conclusa';
  document.getElementById('nTesto').innerHTML=
    'Hai visto il percorso completo: costruzione, esecuzione, presidio, pubblicazione, '+
    'revisione, formazione e monitoraggio. <strong>Sto rimettendo la piattaforma esattamente '+
    'com\'era prima di cominciare</strong>: la dimostrazione non lascia traccia e si può ripetere identica.';
  document.getElementById('nProgresso').style.width='100%';
  var ok=ripristinaStato(D.fotografia);
  setTimeout(function(){
    document.getElementById('nTesto').innerHTML+=
      '<div style="margin-top:8px;font-size:11px;color:'+(ok?'#059669':'#B91C1C')+'">'+
      (ok?'✅ Stato ripristinato.':'⚠️ Ripristino non riuscito: ricarica la pagina.')+'</div>';
    try{ app().location.reload() }catch(e){}
  },400);
}

function ricomincia(){
  clearTimeout(D.timer); D.riproduce=false;
  document.getElementById('bPlay').textContent='▶';
  ripristinaStato(D.fotografia);
  try{ app().location.reload() }catch(e){}
  setTimeout(function(){ vaiA(0) }, 2500);
}

// ── Indice dei capitoli ────────────────────────────────────────
// Davanti a una commissione non si guarda mai tutto in ordine: serve poter
// saltare al capitolo che interessa senza scorrere cinquanta passi.
function costruisciIndice(){
  var el=document.getElementById('indice');
  var primi={};
  COPIONE.forEach(function(s,i){ if(primi[s.capitolo]===undefined)primi[s.capitolo]=i });
  el.innerHTML=Object.keys(COPIONE_CAPITOLI).map(function(k){
    var c=COPIONE_CAPITOLI[k];
    if(primi[k]===undefined)return '';
    return '<div class="voce" data-cap="'+k+'" onclick="vaiACapitolo('+primi[k]+')">'+
      '<span class="num">'+c.n+'</span><span>'+c.t+'</span></div>';
  }).join('');
}

function vaiACapitolo(i){ clearTimeout(D.timer); vaiA(i) }

function aggiornaIndice(){
  var cap=COPIONE[D.passo]&&COPIONE[D.passo].capitolo;
  Array.prototype.forEach.call(document.querySelectorAll('#indice .voce'),function(v){
    v.classList.toggle('attiva', v.getAttribute('data-cap')===String(cap));
  });
}

function alternaIndice(){
  var el=document.getElementById('pannelloIndice');
  el.style.display=(el.style.display==='none')?'block':'none';
}

// ── Avvio ──────────────────────────────────────────────────────
// Si aspetta che l'applicazione dentro il riquadro sia davvero pronta: il
// database si apre in modo asincrono, e partire prima significherebbe
// fotografare tabelle ancora vuote e poi "ripristinare" il nulla.
function attendiApp(fine,tentativi){
  tentativi=(tentativi||0)+1;
  var w=app();
  var pronta = w && typeof w.dbGetOne==='function' && typeof w.go==='function' &&
               (function(){ try{ return w.dbGetOne('SELECT COUNT(*) c FROM agents').c>=0 }catch(e){ return false } })();
  if(pronta){ fine(); return }
  if(tentativi>60){ fine(false); return }
  setTimeout(function(){ attendiApp(fine,tentativi) },300);
}

// Non ci si appende all'evento `load` del riquadro: quando questa pagina
// finisce di caricarsi, l'applicazione dentro puo' aver GIA' terminato, e in
// quel caso l'evento e' passato e non tornera' piu' — la demo restava ferma
// sulla schermata di preparazione. Il ciclo di attesa invece funziona in
// entrambi i casi, perche' guarda lo stato e non l'istante.
function avviaDemo(){
  if(D.pronta)return;
  attendiApp(function(ok){
    if(ok===false){
      document.getElementById('avvio').innerHTML=
        '<div class="logo">RelAItion</div><div class="sub">⚠️ L\'applicazione non si è caricata. '+
        'Verifica che il server locale sia attivo e che questa pagina sia servita dalla stessa origine.</div>';
      return;
    }
    D.pronta=true;
    D.fotografia=fotografaStato();
    costruisciIndice();
    document.getElementById('avvio').style.display='none';
    vaiA(0);
  });
}

if(document.readyState==='complete') avviaDemo();
else window.addEventListener('load',avviaDemo);

// Comandi da tastiera: durante una registrazione si guida meglio con i tasti
// che cercando un pulsante col mouse, che finirebbe nel video.
window.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'||e.key===' '){ e.preventDefault(); avanti() }
  else if(e.key==='ArrowLeft'){ e.preventDefault(); indietro() }
  else if(e.key.toLowerCase()==='p'){ riproduci() }
  else if(e.key.toLowerCase()==='h'){ alternaComandi() }
  else if(e.key.toLowerCase()==='i'){ alternaIndice() }
});
