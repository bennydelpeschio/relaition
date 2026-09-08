// ══════════════════════════════════════════
// SFIDE ED EVENTI
// ══════════════════════════════════════════
// Erano sei riquadri di testo con un solo pulsante «Iscriviti» che alzava una
// bandierina: una bacheca appoggiata accanto al prodotto, non una sua parte.
// Mancava tutto quello che rende una sfida una sfida — candidare qualcosa,
// vedere come si sta andando, potersi ritirare.
//
// Le date erano scritte a mano («15-16 Luglio 2026») e ormai nel passato:
// l'hackathon risultava «Iscrizioni aperte» sei settimane dopo essersi svolto.
// Qui le scadenze sono RELATIVE al giorno in cui si guarda, quindi la pagina
// non invecchia fra una dimostrazione e l'altra.

// `giorni` — quanti ne mancano alla scadenza (negativo = conclusa).
// `metrica` — se presente, la sfida ha una classifica CALCOLATA sui dati della
// piattaforma; se assente è un evento, e si prenota soltanto.
var SFIDE=[
  {id:'hack1', tipo:'hackathon', titolo:'Hackathon: Agent for Good', icona:'🏆', colore:'#F59E0B', giorni:21, dove:'Online',
   desc:'Costruisci un agente che risolva un problema sociale o ambientale. Team cross-funzionali di 2-4 persone, tre giorni.',
   premi:'1° borsa di studio per un master in IA · 2° visore VR · 3° cuffie di fascia alta · ai primi tre budget e supporto per portare il prototipo in produzione',
   criteri:[['Impatto sociale',30],['Innovazione tecnica',25],['Usabilità',25],['Presentazione',20]],
   binari:["Efficienza operativa","Impatto sul cliente","Innovazione di prodotto"],
   mentori:"AI Champions di reparto ed esperti IT, presenti per tutta la durata su questioni tecniche, di sicurezza e di governance.",
   cadenza:"Quadrimestrale",
   posti:80, iscrittiBase:47},

  {id:'sprint1', tipo:'sfida', titolo:'Sprint: il miglior agente commerciale', icona:'⚡', colore:'#10B981', giorni:5, dove:'Online',
   desc:'Candida un agente che qualifichi contatti commerciali. Vince chi porta a termine più esecuzioni senza errori.',
   premi:'500 XP e presenza in evidenza nel catalogo',
   criteri:[['Esecuzioni riuscite',60],['Assenza di errori',40]],
   posti:50, iscrittiBase:23,
   metrica:{id:'affidabilita', l:'Esecuzioni riuscite, al netto dei fallimenti'}},

  {id:'challenge1', tipo:'sfida', titolo:'Challenge: finanza senza errori', icona:'🎯', colore:'#6366F1', giorni:12, dove:'Online',
   desc:'Un agente che elabori documenti finanziari con il minor tasso di errore possibile. Si candida un proprio flusso e si misura sulle sue esecuzioni reali.',
   premi:'800 XP e voucher viaggio · attestato di partecipazione',
   criteri:[['Tasso di successo',50],['Numero di esecuzioni',25],['Controlli attivi',25]],
   posti:40, iscrittiBase:15,
   metrica:{id:'qualita', l:'Tasso di successo, pesato sul numero di esecuzioni'}},

  {id:'gov1', tipo:'sfida', titolo:'Challenge: presidio dimostrabile', icona:'🛡️', colore:'#0D9488', giorni:18, dove:'Online',
   desc:'Vince l\'agente meglio presidiato: mascheramento, convalida, approvazione umana, gestione delle eccezioni. Il punteggio conta i controlli davvero configurati nel flusso candidato.',
   premi:'600 XP e badge Ethical AI Guardian',
   criteri:[['Controlli configurati',60],['Esecuzioni con presidio attivo',40]],
   posti:40, iscrittiBase:9,
   metrica:{id:'presidio', l:'Controlli configurati nel flusso candidato'}},

  {id:'ws1', tipo:'evento', titolo:'Workshop: agenti per il marketing', icona:'📣', colore:'#8B5CF6', giorni:9, dove:'Roma, in presenza',
   desc:'Quattro ore per costruire una suite di agenti marketing: generazione contenuti, pianificazione, test A/B, analisi.',
   premi:'200 XP, attestato e pacchetto di modelli',
   criteri:[['Posti limitati',100]],
   posti:30, iscrittiBase:18},

  {id:'ama1', tipo:'evento', titolo:'AMA: portare gli agenti in produzione', icona:'🎤', colore:'#0EA5E9', giorni:15, dove:'Online',
   desc:'Novanta minuti di domande e risposte su scala, sicurezza e costi degli agenti in esercizio. Le domande si raccolgono prima, in Community.',
   premi:'100 XP e registrazione disponibile dopo',
   criteri:[['Domande raccolte in anticipo',100]],
   mentori:"Esperti di data governance e AI ethics.",
   cadenza:"Mensile",
   posti:200, iscrittiBase:62},

  {id:'demo1', tipo:'evento', titolo:'Demo Day: agenti in esercizio', icona:'🎬', colore:'#EF4444', giorni:30, dove:'Roma e online',
   desc:'Chi ha un agente in produzione lo presenta con una dimostrazione dal vivo del flusso. Giuria di responsabili aziendali ed esperti esterni, più il voto della community.',
   premi:'Al primo classificato budget, tempo e supporto per portare l’agente in esercizio · i primi tre in evidenza nel catalogo',
   criteri:[['Impatto sul business',35],['Scalabilità',25],['Etica e presidio',20],['Presentazione',20]],
   cadenza:"Al termine di ogni hackathon",
   posti:15, iscrittiBase:8}
];

function sfidaById(id){ return SFIDE.filter(function(s){return s.id===id})[0] }

// ── Stato dell'utente su una sfida ──
function sfIscritto(id){
  return !!dbGetOne('SELECT 1 x FROM challenges_registered WHERE user=? AND challenge_id=?',[utenteCorrente(),id]);
}
function sfCandidatura(id,chi){
  return dbGetOne('SELECT * FROM challenge_submissions WHERE challenge_id=? AND user=?',[id,chi||utenteCorrente()]);
}
function sfIscritti(id){
  return dbAll('SELECT user,ts FROM challenges_registered WHERE challenge_id=? ORDER BY ts',[id]);
}
// I partecipanti mostrati sono quelli finti del bando PIU' quelli veri: senza
// la base l'hackathon avrebbe due iscritti e non sembrerebbe un'iniziativa
// aperta; senza i veri, iscriversi non cambierebbe nulla di visibile.
function sfConteggio(s){ return s.iscrittiBase + sfIscritti(s.id).length }

function sfScadenza(s){
  var d=new Date(); d.setDate(d.getDate()+s.giorni); d.setHours(18,0,0,0);
  return d;
}
function sfDescriviScadenza(s){
  if(s.giorni<0)return 'Conclusa';
  if(s.giorni===0)return 'Ultimo giorno';
  if(s.giorni===1)return 'Scade domani';
  if(s.giorni<=14)return 'Scade fra '+s.giorni+' giorni';
  return sfScadenza(s).toLocaleDateString('it-IT',{day:'numeric',month:'long'});
}
function sfStato(s){
  if(s.giorni<0)  return {t:'Conclusa',      c:'#64748B', b:'#F1F5F9'};
  if(s.giorni<=7) return {t:'In chiusura',   c:'#B45309', b:'#FEF3C7'};
  if(s.tipo==='evento')return {t:'Prenotazioni aperte',c:'#1D4ED8', b:'#DBEAFE'};
  return {t:'Iscrizioni aperte', c:'#047857', b:'#D1FAE5'};
}

// ══════════════════════════════════════════
// CLASSIFICA CALCOLATA
// ══════════════════════════════════════════
// I pesi mostrati nella scheda SONO la formula: «Esecuzioni riuscite 60% ·
// Assenza di errori 40%» significa che il punteggio e' 0,6 sul primo criterio e
// 0,4 sul secondo, su una scala 0-100. Un punteggio calcolato in un modo e
// dichiarato in un altro sarebbe peggio di nessun punteggio.
//
// Ogni criterio viene prima normalizzato a 0-100 con un tetto dichiarato — dieci
// esecuzioni riuscite valgono il massimo, quattro controlli valgono il massimo —
// perche' senza tetto il primo che esegue cento volte rende la classifica
// insensibile a tutto il resto.
function sfPunteggio(metrica,agentName,autore){
  var e=dbGetOne("SELECT COUNT(*) tot, SUM(CASE WHEN status='ok' THEN 1 ELSE 0 END) ok FROM exec_log WHERE agent=? AND user=?",[agentName,autore])||{tot:0,ok:0};
  var tot=e.tot||0, ok=e.ok||0, ko=tot-ok;
  var controlli=0;
  var r=dbGetOne('SELECT nodes_json FROM agents WHERE name=? AND author=?',[agentName,autore]);
  try{ controlli=JSON.parse(r?r.nodes_json:'[]').filter(function(x){return x.type==='gr'}).length }catch(e2){}
  var tetto=function(v,max){ return Math.max(0,Math.min(100,Math.round(v/max*100))) };

  if(metrica==='affidabilita'){
    // 60% esecuzioni riuscite, 40% assenza di errori.
    var senzaErrori=tot?Math.round((ok/tot)*100):0;
    return {v:Math.round(tetto(ok,10)*0.6 + senzaErrori*0.4), ok:ok,
            d:ok+' riuscite, '+ko+' fallite'};
  }
  if(metrica==='qualita'){
    // 50% tasso di successo, 25% numero di esecuzioni, 25% controlli attivi.
    var tasso=tot?Math.round(ok*100/tot):0;
    return {v:Math.round(tasso*0.5 + tetto(tot,10)*0.25 + tetto(controlli,4)*0.25), ok:ok,
            d:tasso+'% su '+tot+' esecuzioni · '+controlli+' controlli'};
  }
  if(metrica==='presidio'){
    // 60% controlli configurati, 40% esecuzioni con presidio attivo.
    return {v:Math.round(tetto(controlli,4)*0.6 + tetto(ok,10)*0.4), ok:ok,
            d:controlli+' controlli · '+ok+' esecuzioni riuscite'};
  }
  return {v:0,ok:0,d:'—'};
}

function sfClassifica(s){
  if(!s.metrica)return [];
  return dbAll('SELECT * FROM challenge_submissions WHERE challenge_id=?',[s.id])
    .map(function(c){
      var p=sfPunteggio(s.metrica.id,c.agent_name,c.user);
      return {utente:c.user,agente:c.agent_name,punti:p.v,det:p.d,ok:p.ok||0,io:c.user===utenteCorrente()};
    })
    // A parita' di punteggio decide chi ha piu' esecuzioni riuscite alle
    // spalle: senza un criterio dichiarato l'ordine dipenderebbe dall'ordine
    // di inserimento, che non e' un merito.
    .sort(function(a,b){return (b.punti-a.punti)||(b.ok-a.ok)||a.utente.localeCompare(b.utente)});
}

// ══════════════════════════════════════════
// AZIONI
// ══════════════════════════════════════════
function sfIscrivi(id){
  var s=sfidaById(id); if(!s)return;
  dbRun('INSERT OR IGNORE INTO challenges_registered (user,challenge_id,ts) VALUES (?,?,?)',
    [utenteCorrente(),id,new Date().toISOString()]);
  if(typeof challengeRegistered==='object')challengeRegistered[id]=true;
  persistDatabaseNow();
  addXP(50,'Iscrizione a: '+s.titolo);
  showToast('✅ Iscrizione registrata · +50 XP');
  sfAggiorna(id);
}

// L'iscrizione era a senso unico: ci si iscriveva e non si poteva piu' uscire,
// il che rende il conteggio dei partecipanti una misura che sale e basta.
function sfAnnulla(id){
  var s=sfidaById(id); if(!s)return;
  if(!confirm('Annullare l’iscrizione a «'+s.titolo+'»?'+(sfCandidatura(id)?'\nAnche la candidatura verrà ritirata.':'')))return;
  dbRun('DELETE FROM challenges_registered WHERE user=? AND challenge_id=?',[utenteCorrente(),id]);
  dbRun('DELETE FROM challenge_submissions WHERE user=? AND challenge_id=?',[utenteCorrente(),id]);
  if(typeof challengeRegistered==='object')delete challengeRegistered[id];
  persistDatabaseNow();
  showToast('Iscrizione annullata');
  sfAggiorna(id);
}

function sfApriCandidatura(id){
  var s=sfidaById(id); if(!s)return;
  var miei=dbAll('SELECT id,name FROM agents WHERE author=? ORDER BY updated_at DESC',[utenteCorrente()]);
  if(!miei.length){
    showToast('⚠️ Non hai ancora un agente da candidare: costruiscine uno nel Builder');
    return;
  }
  var gia=sfCandidatura(id);
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>'+s.icona+' Candida un agente</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<div style="font-size:12px;color:var(--tx3);margin:8px 0 14px;line-height:1.6">'+escHtml(s.titolo)+
      (s.metrica?': il punteggio si calcola su <strong>'+escHtml(s.metrica.l).toLowerCase()+'</strong> dell’agente scelto, sulle sue esecuzioni reali.':'')+'</div>'+
    '<div class="prop-group"><div class="prop-label">Agente</div>'+
      '<select class="prop-select" id="sfAgente">'+miei.map(function(a){
        return '<option value="'+a.id+'"'+(gia&&gia.agent_id===a.id?' selected':'')+'>'+escHtml(a.name)+'</option>';
      }).join('')+'</select></div>'+
    '<div class="prop-group"><div class="prop-label">Nota per la giuria (facoltativa)</div>'+
      '<textarea class="prop-input" id="sfNota" rows="3" style="resize:vertical">'+escHtml(gia?(gia.nota||''):'')+'</textarea></div>'+
    '<div style="display:flex;gap:8px;margin-top:14px">'+
      '<button class="tb-btn primary" onclick="sfSalvaCandidatura(\''+id+'\')">'+(gia?'Aggiorna la candidatura':'Candida')+'</button>'+
      (gia?'<button class="tb-btn" style="color:#B91C1C" onclick="sfRitira(\''+id+'\')">Ritira</button>':'')+
      '<button class="tb-btn" onclick="closeModal()">Annulla</button>'+
    '</div>',true);
}

function sfSalvaCandidatura(id){
  var sel=document.getElementById('sfAgente'); if(!sel)return;
  var aid=parseInt(sel.value,10);
  var a=dbGetOne('SELECT id,name FROM agents WHERE id=?',[aid]); if(!a)return;
  var nota=(document.getElementById('sfNota')||{value:''}).value.trim().substring(0,400);
  var ora=new Date().toISOString();
  var gia=sfCandidatura(id);
  if(gia)dbRun('UPDATE challenge_submissions SET agent_id=?,agent_name=?,nota=?,ts=? WHERE id=?',[a.id,a.name,nota,ora,gia.id]);
  else{
    dbRun('INSERT INTO challenge_submissions (challenge_id,user,agent_id,agent_name,nota,ts) VALUES (?,?,?,?,?,?)',
      [id,utenteCorrente(),a.id,a.name,nota,ora]);
    // Candidare implica partecipare: chiedere due gesti per la stessa
    // intenzione fa solo dimenticare il secondo.
    dbRun('INSERT OR IGNORE INTO challenges_registered (user,challenge_id,ts) VALUES (?,?,?)',[utenteCorrente(),id,ora]);
    if(typeof challengeRegistered==='object')challengeRegistered[id]=true;
    addXP(80,'Candidatura a: '+id);
  }
  persistDatabaseNow();
  closeModal();
  showToast(gia?'Candidatura aggiornata':'🏁 Agente candidato · +80 XP');
  sfAggiorna(id);
}

function sfRitira(id){
  var gia=sfCandidatura(id); if(!gia)return;
  dbRun('DELETE FROM challenge_submissions WHERE id=?',[gia.id]);
  persistDatabaseNow();
  closeModal();
  showToast('Candidatura ritirata');
  sfAggiorna(id);
}

// ══════════════════════════════════════════
// LA SFIDA È UNA PAGINA, NON UNA FINESTRA
// ══════════════════════════════════════════
// Il dettaglio viveva in una finestra sovrapposta: si chiudeva solo con la ✕,
// Indietro usciva dalla pagina invece di tornare all'elenco, e un contenuto
// lungo — regolamento, fasi, classifica, domande — dentro un riquadro
// sovrapposto obbliga a due scorrimenti annidati.
//
// Ora entra e esce come il Learning Hub: l'elenco si nasconde, il dettaglio
// prende la pagina, e l'indirizzo diventa `#challenges/sprint1` — quindi
// Indietro torna all'elenco, il collegamento si puo' mandare a qualcuno, e
// ricaricando si riapre dove si era.
function sfApriPagina(id,daStoria){
  var s=sfidaById(id); if(!s)return;
  var lista=document.getElementById('challenges-content');
  var det=document.getElementById('challenges-detail');
  if(!lista||!det)return;
  sfCorrente=id;
  lista.style.display='none';
  det.classList.add('active');
  det.innerHTML=sfContenutoPagina(s);
  if(!daStoria&&typeof navRegistra==='function')navRegistra('challenges',id);
  window.scrollTo(0,0);
}

function sfChiudiPagina(daStoria){
  var lista=document.getElementById('challenges-content');
  var det=document.getElementById('challenges-detail');
  if(!det||!det.classList.contains('active'))return;
  sfCorrente=null; sfCandAperta=null;
  det.classList.remove('active');
  det.innerHTML='';
  if(lista)lista.style.display='';
  if(!daStoria&&typeof navRegistra==='function')navRegistra('challenges');
}

var sfCorrente=null;

// Compatibilita': le schede e i vecchi richiami chiamano ancora sfApri.
function sfApri(id){ sfApriPagina(id) }

// Ridisegna il dettaglio se aperto su QUESTA sfida, altrimenti l'elenco.
// Ridisegnare sempre tutto farebbe perdere la posizione di scorrimento a ogni
// voto — e chi vota tre domande di fila tornerebbe in cima tre volte.
function sfAggiorna(id){
  if(sfCorrente&&(!id||sfCorrente===id)){
    var det=document.getElementById('challenges-detail');
    var s=sfidaById(sfCorrente);
    if(det&&s){
      var y=window.scrollY;
      det.innerHTML=sfContenutoPagina(s);
      window.scrollTo(0,y);
    }
    return;
  }
  if(currentPage==='challenges'&&typeof renderChallenges==='function')renderChallenges();
}

function sfContenutoPagina(s){
  var id=s.id;
  var st=sfStato(s), iscritto=sfIscritto(id), cand=sfCandidatura(id);
  var iscritti=sfIscritti(id);
  var pieno=Math.min(100,Math.round(sfConteggio(s)/s.posti*100));

  var pesi='<div style="display:flex;flex-direction:column;gap:5px;margin-top:6px;max-width:520px">'+
    s.criteri.map(function(c){
      return '<div style="display:flex;align-items:center;gap:8px;font-size:11.5px">'+
        '<span style="flex:1;color:var(--tx2)">'+escHtml(c[0])+'</span>'+
        '<div style="width:130px;height:5px;background:var(--bg2);border-radius:3px;overflow:hidden">'+
          '<div style="width:'+c[1]+'%;height:100%;background:'+s.colore+'"></div></div>'+
        '<span style="width:32px;text-align:right;color:var(--tx4)">'+c[1]+'%</span></div>';
    }).join('')+'</div>';

  // Binari tematici, mentori e cadenza: il capitolo 4.3 li chiede esplicitamente
  // («per guidare l'innovazione verso obiettivi strategici vengono definiti dei
  // binari tematici»; «gli AI Champions e gli esperti IT devono essere presenti
  // come mentori»). Compaiono solo dove sono dichiarati, così una scheda non
  // mostra sezioni vuote per uniformità.
  var contorno='';
  if(s.binari&&s.binari.length){
    contorno+='<div style="margin-top:14px"><div style="font-size:11px;font-weight:700;margin-bottom:5px">Binari tematici</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap">'+s.binari.map(function(b){
        return '<span class="badge badge-b" style="font-size:10px">'+escHtml(b)+'</span>';
      }).join('')+'</div></div>';
  }
  if(s.mentori){
    contorno+='<div style="margin-top:12px;font-size:11.5px;color:var(--tx3);line-height:1.5">'+
      '<strong style="color:var(--tx2)">Mentori</strong> · '+escHtml(s.mentori)+'</div>';
  }
  if(s.cadenza){
    contorno+='<div style="margin-top:8px;font-size:11px;color:var(--tx4)">Cadenza: '+escHtml(s.cadenza)+'</div>';
  }
  pesi+=contorno;

  var azioni='';
  if(s.giorni>=0){
    if(s.metrica)azioni+='<button class="tb-btn primary" onclick="sfApriCandidatura(\''+id+'\')">'+(cand?'✏️ Modifica la candidatura':'🏁 Candida un agente')+'</button>';
    else if(!iscritto)azioni+='<button class="tb-btn primary" onclick="sfIscrivi(\''+id+'\')">'+(s.tipo==='evento'?'Prenota il posto':'Iscriviti')+'</button>';
    if(iscritto)azioni+='<button class="tb-btn" style="color:#B91C1C" onclick="sfAnnulla(\''+id+'\')">Annulla l’iscrizione</button>';
    else if(s.metrica)azioni+='<button class="tb-btn" onclick="sfIscrivi(\''+id+'\')">Iscriviti senza candidare</button>';
  }

  return '<div class="lesson-back" onclick="sfChiudiPagina()">← Torna a Sfide &amp; Eventi</div>'+
    '<div style="display:flex;gap:14px;align-items:center;margin-bottom:8px;flex-wrap:wrap">'+
      '<div class="agent-icon" style="background:'+s.colore+'15;color:'+s.colore+';width:54px;height:54px;font-size:28px">'+s.icona+'</div>'+
      '<div style="flex:1;min-width:220px">'+
        '<div style="font-size:20px;font-weight:800">'+escHtml(s.titolo)+'</div>'+
        '<div style="font-size:12px;color:var(--tx3);margin-top:2px">'+escHtml(sfDescriviScadenza(s))+' · '+escHtml(s.dove)+'</div>'+
      '</div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
        '<span class="badge" style="background:'+st.b+';color:'+st.c+'">'+escHtml(st.t)+'</span>'+
        (iscritto?'<span class="badge badge-g">✅ Sei iscritto</span>':'')+
        (cand?'<span class="badge badge-b">🏁 '+escHtml(cand.agent_name)+'</span>':'')+
      '</div>'+
    '</div>'+
    (azioni?'<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px">'+azioni+'</div>':'')+
    '<p style="font-size:13px;color:var(--tx2);line-height:1.7;max-width:760px">'+escHtml(s.desc)+'</p>'+
    // Due colonne dove c'e' spazio: in una pagina intera incolonnare tutto
    // sprecherebbe meta' schermo e allungherebbe lo scorrimento.
    '<div class="grid-2" style="align-items:start;margin-top:8px">'+
      '<div class="card" style="padding:16px">'+
        (typeof sfBloccoFasi==='function'?sfBloccoFasi(s):'')+
        (typeof sfBloccoProgramma==='function'?sfBloccoProgramma(s):'')+
        sfTitoletto('📏 Come si valuta')+pesi+
        sfTitoletto('🏅 Riconoscimenti')+
        '<div style="font-size:11.5px;color:var(--tx3);line-height:1.6">'+escHtml(s.premi)+'</div>'+
        sfTitoletto('👥 Partecipazione')+
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--tx4);margin-bottom:4px">'+
          '<span>'+sfConteggio(s)+' di '+s.posti+' posti</span><span>'+pieno+'%</span></div>'+
        '<div style="height:5px;background:var(--bg2);border-radius:3px;overflow:hidden">'+
          '<div style="width:'+pieno+'%;height:100%;background:'+s.colore+'"></div></div>'+
        (iscritti.length?'<div style="font-size:11px;color:var(--tx4);margin-top:7px">Da questa piattaforma: '+
          iscritti.map(function(i){return escHtml(i.user)}).join(', ')+'</div>':'')+
      '</div>'+
      '<div class="card" style="padding:16px">'+
        (typeof sfBloccoClassifica==='function'?sfBloccoClassifica(s):'')+
        (typeof sfBloccoRegolamento==='function'?sfBloccoRegolamento(s):'')+
      '</div>'+
    '</div>'+
    '<div class="grid-2" style="align-items:start;margin-top:16px">'+
      '<div class="card" style="padding:16px">'+
        (typeof sfBloccoMateriali==='function'?sfBloccoMateriali(s):'')+
        (typeof sfBloccoFaq==='function'?sfBloccoFaq(s):'')+
      '</div>'+
      '<div class="card" style="padding:16px">'+
        (typeof sfBloccoDomande==='function'?sfBloccoDomande(s):'')+
      '</div>'+
    '</div>';
}

// ══════════════════════════════════════════
// HALL OF FAME
// ══════════════════════════════════════════
function sfHallOfFame(){
  var v=dbAll('SELECT * FROM challenge_winners ORDER BY posizione, id');
  if(!v.length)return '';
  return '<div class="card mt-20"><div class="card-header"><div class="card-title">🏛️ Edizioni passate</div></div>'+
    '<div class="grid-3" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">'+
    v.map(function(x){
      return '<div style="text-align:center;padding:16px;background:var(--bg2);border-radius:var(--rl)">'+
        '<div style="font-size:24px">'+(x.posizione===1?'🥇':x.posizione===2?'🥈':'🥉')+'</div>'+
        '<div style="font-size:13px;font-weight:700;margin-top:6px">'+escHtml(x.vincitore)+'</div>'+
        '<div style="font-size:11px;color:var(--tx4)">'+escHtml(x.edizione)+'</div>'+
        (x.agente?'<div style="font-size:11px;color:var(--ac);font-weight:600;margin-top:4px">'+escHtml(x.agente)+'</div>':'')+
      '</div>';
    }).join('')+'</div></div>';
}

// ══════════════════════════════════════════
// LE SCHEDE IN PAGINA
// ══════════════════════════════════════════
function sfSchede(){
  // Prima quelle che scadono: una pagina ordinata per scadenza dice da sola
  // cosa richiede attenzione adesso.
  var ordinate=SFIDE.slice().sort(function(a,b){return a.giorni-b.giorni});
  return '<div class="grid-2">'+ordinate.map(function(s){
    var st=sfStato(s), iscritto=sfIscritto(s.id), cand=sfCandidatura(s.id);
    var pieno=Math.min(100,Math.round(sfConteggio(s)/s.posti*100));
    return '<div class="card" style="border-left:4px solid '+s.colore+';cursor:pointer" onclick="sfApri(\''+s.id+'\')">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'+
        '<span style="font-size:24px">'+s.icona+'</span>'+
        '<div style="flex:1;min-width:0"><div class="card-title">'+escHtml(s.titolo)+'</div>'+
          '<div style="font-size:11px;color:var(--tx4)">'+escHtml(sfDescriviScadenza(s))+' · '+escHtml(s.dove)+'</div></div>'+
        '<span class="badge" style="background:'+st.b+';color:'+st.c+';flex-shrink:0">'+escHtml(st.t)+'</span>'+
      '</div>'+
      '<div style="font-size:12px;color:var(--tx3);line-height:1.6;margin-bottom:10px">'+escHtml(s.desc)+'</div>'+
      (s.metrica?'<div style="font-size:10.5px;color:'+s.colore+';font-weight:700;margin-bottom:8px">📊 Classifica calcolata sui dati reali</div>':'')+
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--tx4);margin-bottom:3px">'+
        '<span>'+sfConteggio(s)+'/'+s.posti+' partecipanti</span><span>'+pieno+'%</span></div>'+
      '<div style="height:4px;background:var(--bg3);border-radius:10px;overflow:hidden;margin-bottom:10px">'+
        '<div style="height:100%;width:'+pieno+'%;background:'+s.colore+';border-radius:10px"></div></div>'+
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'+
        (cand?'<span class="badge badge-b">🏁 '+escHtml(cand.agent_name)+'</span>'
             :iscritto?'<span class="badge badge-g">✅ Iscritto</span>':'')+
        '<span style="margin-left:auto;font-size:11px;color:'+s.colore+';font-weight:700">Apri →</span>'+
      '</div></div>';
  }).join('')+'</div>';
}
