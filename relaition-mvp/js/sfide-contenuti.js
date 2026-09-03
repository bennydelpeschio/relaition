// ══════════════════════════════════════════
// CONTENUTO DELLE SFIDE
// ══════════════════════════════════════════
// Una sfida senza contenuto e' un annuncio: si legge una volta e non ci si
// torna. Mancavano le cose che in una vera iniziativa esistono sempre — il
// regolamento, le fasi con le date, il programma di un evento, il materiale
// per cominciare, le domande gia' poste.
//
// Le date delle fasi si calcolano dalla scadenza dichiarata sulla sfida, non
// sono scritte a mano: cosi' restano coerenti qualunque giorno si guardi.

var SFIDA_CONTENUTI={

  hack1:{
    regolamento:[
      'Team da 2 a 4 persone. Si partecipa con un agente costruito durante l’hackathon, non con uno già pubblicato.',
      'L’agente deve affrontare un problema sociale o ambientale documentabile: la candidatura dichiara quale, e su quali dati si basa.',
      'Almeno due controlli di governance configurati. Un agente che tratta dati di persone senza mascheramento non è ammesso.',
      'Il flusso va eseguito almeno una volta prima della consegna: la giuria guarda il registro dell’esecuzione, non solo il canvas.',
      'Il codice e i prompt restano di chi li scrive. La piattaforma ne ospita una copia per la valutazione.'
    ],
    fasi:[
      {q:-14,t:'Apertura iscrizioni',d:'I team si formano e dichiarano l’area di intervento.'},
      {q:-2, t:'Sessione di preparazione',d:'Un’ora online su come impostare un flusso valutabile.'},
      {q:0,  t:'Avvio delle 48 ore',d:'Consegna del tema e apertura delle candidature.'},
      {q:2,  t:'Chiusura consegne',d:'Dopo questo momento le candidature restano visibili ma non modificabili.'},
      {q:5,  t:'Proclamazione',d:'Valutazione della giuria sui quattro criteri dichiarati e annuncio.'}
    ],
    materiali:[
      {t:'Costruire agenti efficaci',u:'https://www.anthropic.com/engineering/building-effective-agents',d:'Da leggere prima di iniziare: quando un agente serve davvero.'},
      {t:'NIST AI Risk Management Framework',u:'https://www.nist.gov/itl/ai-risk-management-framework',d:'La struttura con cui la giuria valuta il presidio.'}
    ],
    faq:[
      {d:'Posso partecipare da solo?',r:'No: il minimo è due persone. È una scelta di formato, non una regola tecnica — la piattaforma non lo impedisce.'},
      {d:'Vale un agente che avevo già in bozza?',r:'Sì se non era pubblicato. Va dichiarato nella nota della candidatura.'},
      {d:'Serve una chiave API mia?',r:'Serve per far girare i nodi AI davvero. Senza, il flusso si costruisce e si valida, ma le esecuzioni sono dimostrative e la giuria lo vede dal registro.'}
    ]
  },

  sprint1:{
    regolamento:[
      'Si candida un proprio agente già costruito. Non c’è un tema: conta come si comporta.',
      'Il punteggio è calcolato dalla piattaforma sulle esecuzioni reali dell’agente candidato — 60% esecuzioni riuscite, 40% assenza di errori.',
      'Le esecuzioni valide sono quelle registrate nel Log Esecuzioni a nome di chi candida.',
      'Si può cambiare l’agente candidato fino alla scadenza: vale sempre l’ultimo.',
      'Le esecuzioni con approvazione umana ancora in attesa non contano né come riuscite né come fallite.'
    ],
    fasi:[
      {q:-10,t:'Apertura',d:'Le candidature si aprono e la classifica inizia ad aggiornarsi.'},
      {q:-3, t:'Metà percorso',d:'Chi è sotto la media riceve un suggerimento su cosa manca.'},
      {q:0,  t:'Chiusura',d:'La classifica si congela sull’ultima esecuzione registrata.'}
    ],
    materiali:[
      {t:'Prompt engineering — Anthropic',u:'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',d:'Un prompt più preciso è il modo più veloce per alzare il tasso di successo.'},
      {t:'Chain-of-Thought prompting',u:'https://arxiv.org/abs/2201.11903',d:'Perché far esplicitare i passaggi riduce gli errori di classificazione.'}
    ],
    faq:[
      {d:'Come faccio a salire in classifica?',r:'Eseguendo il flusso e correggendo ciò che fallisce. Il punteggio si aggiorna da solo: non c’è nulla da inviare.'},
      {d:'Le esecuzioni vecchie contano?',r:'Sì, tutte quelle a tuo nome su quell’agente. La sfida misura l’agente, non il periodo.'},
      {d:'Se cambio agente perdo i punti?',r:'Il punteggio segue l’agente candidato: cambiandolo, cambia anche il punteggio.'}
    ]
  },

  challenge1:{
    regolamento:[
      'L’agente candidato deve elaborare documenti finanziari: fatture, note spese, estratti conto.',
      'Punteggio: 50% tasso di successo, 25% numero di esecuzioni, 25% controlli configurati. I pesi mostrati sono la formula.',
      'Un tasso alto su poche esecuzioni non vince: il numero di esecuzioni ha un tetto dichiarato a dieci.',
      'Il mascheramento dei dati personali è consigliato ma non obbligatorio: pesa dentro il criterio dei controlli.',
      'Le esecuzioni dimostrative — quelle senza un modello collegato — contano come le altre: la sfida misura il flusso, non la chiave.'
    ],
    fasi:[
      {q:-20,t:'Apertura',d:'Pubblicazione del regolamento e apertura delle candidature.'},
      {q:-6, t:'Confronto intermedio',d:'Incontro facoltativo per confrontare le impostazioni adottate.'},
      {q:0,  t:'Chiusura',d:'Congelamento della classifica.'},
      {q:3,  t:'Certificazione',d:'A chi supera la soglia viene riconosciuto il badge Esperto Finance.'}
    ],
    materiali:[
      {t:'RAG: rassegna aggiornata',u:'https://arxiv.org/abs/2312.10997',d:'Utile se l’agente confronta i documenti con procedure interne.'},
      {t:'Function calling — OpenAI',u:'https://platform.openai.com/docs/guides/function-calling',d:'Per far calcolare i totali a uno strumento invece che al modello.'}
    ],
    faq:[
      {d:'Che documenti posso usare?',r:'Quelli che vuoi, anche di prova. La piattaforma non li invia da nessuna parte: restano nel tuo browser.'},
      {d:'Il modello sbaglia gli importi. È un problema mio?',r:'È il motivo per cui esiste il criterio sui controlli: un nodo «Convalida output» che verifica lo schema alza il punteggio e ferma le risposte malformate.'}
    ]
  },

  gov1:{
    regolamento:[
      'Vince l’agente meglio presidiato, non il più complesso.',
      'Punteggio: 60% controlli configurati nel flusso candidato, 40% esecuzioni riuscite con presidio attivo.',
      'Contano i controlli davvero collegati nel grafo: un nodo presente ma escluso dall’esecuzione non conta.',
      'Il tetto è a quattro controlli: oltre quel numero non si guadagna punteggio, per non premiare l’accumulo.',
      'La giuria può chiedere di mostrare il registro di un’esecuzione in cui un controllo è intervenuto davvero.'
    ],
    fasi:[
      {q:-12,t:'Apertura',d:'Candidature aperte a chiunque abbia un agente con almeno un controllo.'},
      {q:-4, t:'Revisione fra pari',d:'Ogni partecipante commenta il presidio di un altro agente candidato.'},
      {q:0,  t:'Chiusura',d:'Congelamento della classifica e assegnazione del badge Governance.'}
    ],
    materiali:[
      {t:'OWASP Top 10 per applicazioni LLM',u:'https://owasp.org/www-project-top-10-for-large-language-model-applications/',d:'Le vulnerabilità che i controlli della piattaforma affrontano, una per una.'},
      {t:'Regolamento europeo sull’AI',u:'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',d:'L’Allegato III elenca i casi in cui l’approvazione umana non è facoltativa.'}
    ],
    faq:[
      {d:'Quali nodi contano come controllo?',r:'Quelli della categoria Controlli: mascheramento dati, convalida output, approvazione umana, gestore eccezioni, filtro contenuti, soglia di confidenza, difesa da istruzioni ostili, limitatore di frequenza, verifica di fondatezza.'},
      {d:'Mettere quattro controlli a caso funziona?',r:'Alza il primo criterio ma non il secondo: senza esecuzioni riuscite si arriva a 60 su 100 e non oltre.'}
    ]
  },

  ws1:{
    programma:[
      {o:'14:00',t:'Apertura e obiettivi',d:'Cosa si porta a casa in quattro ore.'},
      {o:'14:20',t:'Generazione contenuti',d:'Un nodo AI con formato di uscita vincolato, e perché il testo libero non si passa a valle.'},
      {o:'15:10',t:'Pianificazione delle pubblicazioni',d:'Espressioni cron e il limite della scheda aperta.'},
      {o:'16:00',t:'Pausa',d:''},
      {o:'16:15',t:'Test A/B',d:'Una condizione che alterna due prompt e il registro che dice quale ramo ha preso.'},
      {o:'17:00',t:'Analisi dei risultati',d:'Leggere il Monitoraggio senza confondere crescita e successo.'},
      {o:'17:40',t:'Domande aperte',d:''}
    ],
    regolamento:[
      'Massimo 30 posti, in presenza a Roma. La prenotazione si annulla fino al giorno prima.',
      'Portare il proprio computer: si costruisce, non si guarda costruire.',
      'Una chiave API propria è consigliata ma non necessaria: gli esercizi funzionano anche in modalità dimostrativa.',
      'Il pacchetto di modelli viene consegnato a fine giornata a chi ha partecipato.'
    ],
    materiali:[
      {t:'Prompt engineering — OpenAI',u:'https://platform.openai.com/docs/guides/prompt-engineering',d:'Da leggere prima: si parte dando per acquisite le basi.'},
      {t:'crontab.guru',u:'https://crontab.guru/',d:'Serve nella sessione sulla pianificazione.'}
    ],
    faq:[
      {d:'Serve esperienza di programmazione?',r:'No. Serve aver costruito almeno un flusso nel Builder, anche banale.'},
      {d:'C’è una versione online?',r:'No, questa edizione è solo in presenza. L’incontro aperto del mese è online.'}
    ]
  },

  ama1:{
    programma:[
      {o:'00:00',t:'Come si passa dal prototipo alla produzione',d:'Cosa cambia davvero, e cosa si scopre solo dopo.'},
      {o:'00:25',t:'Costi',d:'Dove finiscono i token e quali scelte li moltiplicano senza che nessuno se ne accorga.'},
      {o:'00:50',t:'Sicurezza e dati',d:'Chi vede cosa, dove restano i documenti, cosa si può dimostrare a un revisore.'},
      {o:'01:15',t:'Domande dal vivo',d:'Le domande raccolte in anticipo hanno la precedenza.'}
    ],
    regolamento:[
      'Novanta minuti, online, con registrazione disponibile dopo per gli iscritti.',
      'Le domande si raccolgono in anticipo su questa pagina: le più votate aprono la sessione.',
      'Non ci sono domande fuori tema, ma le risposte su casi specifici della propria azienda restano generali.'
    ],
    materiali:[
      {t:'Costruire agenti efficaci',u:'https://www.anthropic.com/engineering/building-effective-agents',d:'Il riferimento su cui si appoggia buona parte della discussione.'},
      {t:'NIST AI Risk Management Framework',u:'https://www.nist.gov/itl/ai-risk-management-framework',d:'Per la parte su governo e rischio.'}
    ],
    faq:[
      {d:'Come faccio a far scegliere la mia domanda?',r:'Scrivila qui sotto: le domande sono ordinate per voti, e le prime aprono l’incontro.'},
      {d:'Riceverò la registrazione?',r:'Sì, chi è prenotato la riceve. Chi si prenota dopo l’incontro no.'}
    ]
  },

  demo1:{
    programma:[
      {o:'00:00',t:'Apertura',d:'Come funziona il voto e come si vince.'},
      {o:'00:15',t:'Presentazioni',d:'Sei minuti a testa: cosa fa l’agente, quanto gira, cosa ha cambiato.'},
      {o:'01:30',t:'Voto della community',d:'Aperto per un’ora anche a chi segue online.'},
      {o:'02:30',t:'Giuria e proclamazione',d:'Il voto della community pesa quanto la giuria.'}
    ],
    regolamento:[
      'Si candida un agente già in esercizio: deve avere esecuzioni registrate, non essere una bozza.',
      'Sei minuti di presentazione, non uno di più. Le domande vengono dopo tutte le demo.',
      'Il voto della community vale il 50%, la giuria il restante 50% sui tre criteri dichiarati.',
      'Ogni persona esprime un voto solo, e non può votare la propria candidatura.',
      'I primi tre finiscono in evidenza nel catalogo per un mese.'
    ],
    fasi:[
      {q:-25,t:'Apertura candidature',d:'Chi ha un agente in produzione si propone.'},
      {q:-5, t:'Selezione',d:'Fino a quindici candidature ammesse alla presentazione.'},
      {q:0,  t:'Demo Day',d:'Presentazioni, voto della community, proclamazione.'}
    ],
    materiali:[
      {t:'Costruire agenti efficaci',u:'https://www.anthropic.com/engineering/building-effective-agents',d:'Utile per impostare la presentazione su cosa l’agente cambia, non su come è fatto.'}
    ],
    faq:[
      {d:'Cosa conta come «in esercizio»?',r:'Almeno un’esecuzione registrata nel Log. La piattaforma lo verifica sulla candidatura.'},
      {d:'Posso votare più di una demo?',r:'No, un voto a testa. È il motivo per cui il voto della community pesa quanto la giuria.'}
    ]
  }
};

// La data di una fase si ricava dalla scadenza della sfida: `q` sono i giorni
// rispetto a quel momento (negativi = prima). Scriverle a mano avrebbe
// riprodotto lo stesso difetto delle date fisse che avevamo tolto.
function sfDataFase(s,q){
  var d=sfScadenza(s);
  d.setDate(d.getDate()+q);
  return d;
}
// Una fase con scarto q dalla scadenza cade fra (giorni + q) giorni da
// oggi: negativo significa gia' avvenuta, zero e' oggi.
function sfGiorniAllaFase(s,q){ return s.giorni + q }
function sfStatoFase(s,q){
  var g=sfGiorniAllaFase(s,q);
  if(g<0)return 'fatta';
  if(g===0)return 'oggi';
  return 'attesa';
}

// ══════════════════════════════════════════
// DOMANDE E VOTI
// ══════════════════════════════════════════
// Sono la parte che si puo' MOSTRARE mentre accade: si scrive una domanda, si
// vota quella di un altro, l'ordine cambia sotto gli occhi. Tutto il resto di
// una sfida — regolamento, fasi, premi — si legge e basta.

function sfVoti(tipo,refId){
  return dbGetOne('SELECT COUNT(*) c FROM challenge_votes WHERE tipo=? AND ref_id=?',[tipo,refId]).c;
}
function sfHoVotato(tipo,refId){
  return !!dbGetOne('SELECT 1 x FROM challenge_votes WHERE tipo=? AND ref_id=? AND user=?',[tipo,refId,utenteCorrente()]);
}
// Il voto si toglie ricliccando: un voto irrevocabile fa esitare, e chi esita
// non vota.
function sfVota(tipo,refId,sfida){
  if(sfHoVotato(tipo,refId))dbRun('DELETE FROM challenge_votes WHERE tipo=? AND ref_id=? AND user=?',[tipo,refId,utenteCorrente()]);
  else dbRun('INSERT OR IGNORE INTO challenge_votes (tipo,ref_id,user,ts) VALUES (?,?,?,?)',[tipo,refId,utenteCorrente(),new Date().toISOString()]);
  persistDatabaseNow();
  if(sfida)sfAggiorna(sfida);
}

function sfDomande(id){
  var righe=dbAll('SELECT * FROM challenge_questions WHERE challenge_id=? ORDER BY id',[id]);
  return righe.map(function(q){
    q.voti=sfVoti('domanda',q.id);
    q.mio=sfHoVotato('domanda',q.id);
    return q;
  // Ordinate per voti: e' il criterio dichiarato — «le piu' votate aprono la
  // sessione» — e va rispettato anche nell'elenco, non solo a parole.
  }).sort(function(a,b){return (b.voti-a.voti)||(a.id-b.id)});
}

function sfInviaDomanda(id){
  var el=document.getElementById('sfDomandaTesto');
  if(!el)return;
  var t=el.value.trim();
  if(t.length<8){showToast('⚠️ Scrivi una domanda un po’ più lunga');el.focus();return}
  dbRun('INSERT INTO challenge_questions (challenge_id,user,testo,ts) VALUES (?,?,?,?)',
    [id,utenteCorrente(),t.substring(0,400),new Date().toISOString()]);
  persistDatabaseNow();
  addXP(15,'Domanda posta su una sfida');
  showToast('💬 Domanda pubblicata · +15 XP');
  el.value='';
  sfAggiorna(id);
}

function sfEliminaDomanda(qid,sfida){
  var q=dbGetOne('SELECT * FROM challenge_questions WHERE id=?',[qid]);
  if(!q||q.user!==utenteCorrente())return;
  if(!confirm('Eliminare la tua domanda?'))return;
  dbRun('DELETE FROM challenge_questions WHERE id=?',[qid]);
  dbRun("DELETE FROM challenge_votes WHERE tipo='domanda' AND ref_id=?",[qid]);
  persistDatabaseNow();
  sfAggiorna(sfida);
}

// ══════════════════════════════════════════
// I BLOCCHI DI CONTENUTO NELLA SCHEDA
// ══════════════════════════════════════════
function sfTitoletto(t){
  return '<div style="font-size:12px;font-weight:700;margin:18px 0 6px">'+t+'</div>';
}

function sfBloccoFasi(s){
  var c=SFIDA_CONTENUTI[s.id];
  if(!c||!c.fasi)return '';
  return sfTitoletto('🗓️ Come si svolge')+
    c.fasi.map(function(f){
      var st=sfStatoFase(s,f.q);
      var col=st==='fatta'?'#94A3B8':st==='oggi'?s.colore:'var(--tx4)';
      var seg=st==='fatta'?'●':st==='oggi'?'◉':'○';
      return '<div style="display:flex;gap:10px;padding:6px 0'+(st==='oggi'?';background:'+s.colore+'0d;border-radius:8px;padding-left:8px;padding-right:8px':'')+'">'+
        '<span style="color:'+col+';font-size:13px;line-height:1.4;flex-shrink:0">'+seg+'</span>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:12px;font-weight:700;'+(st==='fatta'?'color:var(--tx4)':'')+'">'+escHtml(f.t)+
            (st==='oggi'?' <span class="badge" style="background:'+s.colore+'22;color:'+s.colore+'">oggi</span>':'')+'</div>'+
          (f.d?'<div style="font-size:11px;color:var(--tx3);line-height:1.5">'+escHtml(f.d)+'</div>':'')+
        '</div>'+
        '<span style="font-size:10.5px;color:var(--tx4);flex-shrink:0;white-space:nowrap">'+
          sfDataFase(s,f.q).toLocaleDateString('it-IT',{day:'numeric',month:'short'})+'</span>'+
      '</div>';
    }).join('');
}

function sfBloccoProgramma(s){
  var c=SFIDA_CONTENUTI[s.id];
  if(!c||!c.programma)return '';
  return sfTitoletto('📋 Programma')+
    c.programma.map(function(p){
      return '<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--bg2)">'+
        '<span style="font-size:11px;font-weight:700;color:'+s.colore+';flex-shrink:0;width:44px">'+escHtml(p.o)+'</span>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:12px;font-weight:700">'+escHtml(p.t)+'</div>'+
          (p.d?'<div style="font-size:11px;color:var(--tx3);line-height:1.5">'+escHtml(p.d)+'</div>':'')+
        '</div></div>';
    }).join('');
}

function sfBloccoRegolamento(s){
  var c=SFIDA_CONTENUTI[s.id];
  if(!c||!c.regolamento)return '';
  return sfTitoletto('📜 Regolamento')+
    '<ol style="margin:0;padding-left:18px;font-size:11.5px;color:var(--tx2);line-height:1.65">'+
      c.regolamento.map(function(r){return '<li style="margin-bottom:5px">'+escHtml(r)+'</li>'}).join('')+
    '</ol>';
}

function sfBloccoMateriali(s){
  var c=SFIDA_CONTENUTI[s.id];
  if(!c||!c.materiali)return '';
  return sfTitoletto('📚 Materiale')+
    c.materiali.map(function(m){
      return '<a href="'+m.u+'" target="_blank" rel="noopener noreferrer" '+
        'style="display:block;padding:7px 0;border-bottom:1px solid var(--bg2);text-decoration:none;color:inherit">'+
        '<div style="font-size:12px;font-weight:700;color:var(--ac2)">'+escHtml(m.t)+' ↗</div>'+
        '<div style="font-size:11px;color:var(--tx3);line-height:1.5">'+escHtml(m.d)+'</div></a>';
    }).join('');
}

function sfBloccoFaq(s){
  var c=SFIDA_CONTENUTI[s.id];
  if(!c||!c.faq)return '';
  return sfTitoletto('❓ Domande frequenti')+
    c.faq.map(function(f){
      return '<div style="padding:7px 0;border-bottom:1px solid var(--bg2)">'+
        '<div style="font-size:12px;font-weight:700">'+escHtml(f.d)+'</div>'+
        '<div style="font-size:11.5px;color:var(--tx3);line-height:1.55;margin-top:2px">'+escHtml(f.r)+'</div></div>';
    }).join('');
}

// L'unico blocco su cui si AGISCE: si scrive, si vota, l'ordine cambia.
function sfBloccoDomande(s){
  var d=sfDomande(s.id);
  var elenco=d.length? d.map(function(q,i){
    var mia=q.user===utenteCorrente();
    return '<div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--bg2)">'+
      '<button class="tb-btn" style="flex-direction:column;height:auto;padding:4px 8px;min-width:42px;gap:0;flex-shrink:0;'+
        (q.mio?'border-color:'+s.colore+';color:'+s.colore:'')+'" '+
        'onclick="sfVota(\'domanda\','+q.id+',\''+s.id+'\')" title="'+(q.mio?'Togli il voto':'Vota questa domanda')+'">'+
        '<span style="font-size:12px;line-height:1">▲</span>'+
        '<span style="font-size:12px;font-weight:800;line-height:1.2">'+q.voti+'</span></button>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:12.5px;color:var(--tx2);line-height:1.55">'+escHtml(q.testo)+'</div>'+
        '<div style="font-size:10.5px;color:var(--tx4);margin-top:3px">'+escHtml(q.user)+
          (mia?' · tu':'')+' · '+relTimeIt(new Date(q.ts).getTime())+
          (i===0&&q.voti>0?' · <span style="color:'+s.colore+';font-weight:700">più votata</span>':'')+
          (mia?' · <span style="text-decoration:underline;cursor:pointer" onclick="sfEliminaDomanda('+q.id+',\''+s.id+'\')">elimina</span>':'')+
        '</div>'+
        (q.risposta?'<div style="margin-top:6px;background:var(--bg2);border-radius:8px;padding:8px 10px">'+
          '<div style="font-size:10px;font-weight:700;color:var(--tx4);text-transform:uppercase">Risposta'+(q.risposta_di?' di '+escHtml(q.risposta_di):'')+'</div>'+
          '<div style="font-size:11.5px;color:var(--tx2);line-height:1.55;margin-top:2px">'+escHtml(q.risposta)+'</div></div>':'')+
      '</div></div>';
  }).join('') : '<div style="font-size:11.5px;color:var(--tx4);font-style:italic;padding:6px 0">Nessuna domanda ancora: la tua sarebbe la prima.</div>';

  return sfTitoletto('💬 Domande alla community ('+d.length+')')+
    '<div style="font-size:10.5px;color:var(--tx4);margin-bottom:8px">Ordinate per voti. Le più votate hanno la precedenza.</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:10px">'+
      '<input id="sfDomandaTesto" class="prop-input" style="flex:1" placeholder="Scrivi una domanda su questa iniziativa…" '+
        'onkeydown="if(event.key===\'Enter\'){sfInviaDomanda(\''+s.id+'\')}">'+
      '<button class="tb-btn primary" style="flex-shrink:0" onclick="sfInviaDomanda(\''+s.id+'\')">Pubblica</button>'+
    '</div>'+elenco;
}

// ══════════════════════════════════════════
// CLASSIFICA CON VOTO E REVISIONE FRA PARI
// ══════════════════════════════════════════
// La classifica era un elenco da leggere. Ma due regolamenti promettono
// interazione e non la trovavano da nessuna parte: il Demo Day dichiara che
// «il voto della community vale il 50%», e la sfida sul presidio prevede che
// «ogni partecipante commenti il presidio di un altro agente candidato».
//
// Il voto della community e il punteggio calcolato restano due colonne
// SEPARATE: il primo dice cosa piace alle persone, il secondo cosa fanno le
// esecuzioni. Sommarli in un numero solo nasconderebbe quale dei due sta
// parlando.

function sfCommentiCandidatura(subId){
  return dbAll('SELECT * FROM challenge_feedback WHERE submission_id=? ORDER BY id',[subId]);
}

function sfInviaFeedback(subId,sfida){
  var el=document.getElementById('sfFb'+subId);
  if(!el)return;
  var t=el.value.trim();
  if(t.length<8){showToast('⚠️ Scrivi un commento un po’ più lungo');el.focus();return}
  dbRun('INSERT INTO challenge_feedback (challenge_id,submission_id,user,testo,ts) VALUES (?,?,?,?,?)',
    [sfida,subId,utenteCorrente(),t.substring(0,400),new Date().toISOString()]);
  persistDatabaseNow();
  addXP(20,'Revisione fra pari su una candidatura');
  showToast('💬 Commento pubblicato · +20 XP');
  sfAggiorna(sfida);
}

function sfEliminaFeedback(fid,sfida){
  var f=dbGetOne('SELECT * FROM challenge_feedback WHERE id=?',[fid]);
  if(!f||f.user!==utenteCorrente())return;
  if(!confirm('Eliminare il tuo commento?'))return;
  dbRun('DELETE FROM challenge_feedback WHERE id=?',[fid]);
  persistDatabaseNow();
  sfAggiorna(sfida);
}

// Quale candidatura è aperta per il commento: una alla volta, altrimenti la
// classifica diventa una colonna di caselle di testo.
var sfCandAperta=null;
function sfAlternaFeedback(subId,sfida){
  sfCandAperta=(sfCandAperta===subId)?null:subId;
  sfAggiorna(sfida);
}

function sfBloccoClassifica(s){
  if(!s.metrica)return '';
  var classifica=sfClassifica(s);
  var votoAttivo=(s.giorni>=0);

  var righe=classifica.map(function(r,i){
    var sub=dbGetOne('SELECT * FROM challenge_submissions WHERE challenge_id=? AND user=?',[s.id,r.utente]);
    var subId=sub?sub.id:0;
    var voti=subId?sfVoti('candidatura',subId):0;
    var mio=subId?sfHoVotato('candidatura',subId):false;
    var commenti=subId?sfCommentiCandidatura(subId):[];
    var aperta=(sfCandAperta===subId);

    // Non si vota la propria candidatura: senza questa regola il voto della
    // community misurerebbe soltanto quanti partecipanti ci sono.
    var pulsanteVoto = !subId ? '' :
      r.io
        ? '<span class="tb-btn" style="height:28px;font-size:11px;opacity:.5;cursor:default" title="Non puoi votare la tua candidatura">👍 '+voti+'</span>'
        : '<button class="tb-btn" style="height:28px;font-size:11px;'+(mio?'border-color:'+s.colore+';color:'+s.colore:'')+'" '+
          (votoAttivo?'':'disabled ')+
          'onclick="sfVota(\'candidatura\','+subId+',\''+s.id+'\')" title="'+(mio?'Togli il voto':'Vota questa candidatura')+'">👍 '+voti+'</button>';

    return '<div style="padding:8px 0;border-bottom:1px solid var(--bg2)'+
        (r.io?';background:var(--ac-ul);border-radius:8px;padding-left:8px;padding-right:8px':'')+'">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<span style="width:22px;font-size:13px;text-align:center;flex-shrink:0">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1))+'</span>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:12px;font-weight:700">'+escHtml(r.utente)+(r.io?' · tu':'')+'</div>'+
          '<div style="font-size:10.5px;color:var(--tx4)">'+escHtml(r.agente)+' — '+escHtml(r.det)+'</div>'+
          (sub&&sub.nota?'<div style="font-size:11px;color:var(--tx3);font-style:italic;margin-top:3px">«'+escHtml(sub.nota)+'»</div>':'')+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">'+
          pulsanteVoto+
          (subId?'<button class="tb-btn" style="height:28px;font-size:11px" onclick="sfAlternaFeedback('+subId+',\''+s.id+'\')" '+
            'title="Revisione fra pari">💬 '+commenti.length+'</button>':'')+
          '<span style="font-size:13px;font-weight:800;color:'+s.colore+';min-width:26px;text-align:right">'+r.punti+'</span>'+
        '</div>'+
      '</div>'+
      (aperta?
        '<div style="margin:8px 0 2px 32px">'+
          commenti.map(function(c){
            var suo=(c.user===utenteCorrente());
            return '<div style="padding:6px 0;border-top:1px solid var(--bg2)">'+
              '<div style="font-size:11.5px;color:var(--tx2);line-height:1.5">'+escHtml(c.testo)+'</div>'+
              '<div style="font-size:10px;color:var(--tx4);margin-top:2px">'+escHtml(c.user)+(suo?' · tu':'')+
                ' · '+relTimeIt(new Date(c.ts).getTime())+
                (suo?' · <span style="text-decoration:underline;cursor:pointer" onclick="sfEliminaFeedback('+c.id+',\''+s.id+'\')">elimina</span>':'')+
              '</div></div>';
          }).join('')+
          (r.io
            ? '<div style="font-size:11px;color:var(--tx4);font-style:italic;padding-top:6px">I commenti sulla tua candidatura li scrivono gli altri partecipanti.</div>'
            : '<div style="display:flex;gap:6px;margin-top:6px">'+
              '<input id="sfFb'+subId+'" class="prop-input" style="flex:1;height:30px;font-size:11.5px" '+
                'placeholder="Cosa funziona, cosa migliorerebbe…" '+
                'onkeydown="if(event.key===\'Enter\'){sfInviaFeedback('+subId+',\''+s.id+'\')}">'+
              '<button class="tb-btn primary" style="height:30px;font-size:11px;flex-shrink:0" onclick="sfInviaFeedback('+subId+',\''+s.id+'\')">Invia</button></div>')+
        '</div>'
      :'')+
    '</div>';
  }).join('');

  return sfTitoletto('🥇 Classifica')+
    '<div style="font-size:11px;color:var(--tx4);margin-bottom:8px">'+escHtml(s.metrica.l)+
      ' — calcolata sulle esecuzioni reali degli agenti candidati, non su un punteggio dichiarato. '+
      'Il pollice è il voto della community e resta un conteggio a parte.</div>'+
    (classifica.length? righe
      : '<div style="font-size:11.5px;color:var(--tx4);font-style:italic">Nessuna candidatura: la classifica si popola quando qualcuno candida un agente.</div>');
}
