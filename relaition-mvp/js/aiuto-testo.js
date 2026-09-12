// ═══════════════════════════════════════════
// AIUTO ALLA SCRITTURA NEI CAMPI DI TESTO
// ═══════════════════════════════════════════
// Il prompt di un nodo AI, il contesto del flusso, il corpo di un'email: sono
// i campi dove chi non scrive prompt per mestiere si ferma. Qui, sotto
// ognuno, c'e' una riga in cui si dice a parole cosa si vuole ottenere, e il
// modello collegato scrive il testo al posto dell'utente, o migliora quello
// che c'e' gia'. Il risultato finisce nel campo come se fosse stato digitato:
// si legge, si corregge, si tiene o si ripristina il precedente.
//
// Senza un modello collegato non si finge: si dice dove collegarlo.

var AIUTO_TESTO_PRECEDENTE={};

// HTML del blocco da mettere sotto un'area di testo. `id` e' l'id dell'area,
// `tipo` decide le istruzioni date al modello, `nid` e `chiave` servono a
// scrivere il valore anche nella configurazione del nodo (non solo nel campo).
function aiutoTestoHTML(id,tipo,nid,chiave){
  var domanda={
    prompt:'Cosa deve fare questo nodo? Es. «estrarre fornitore, importo e data da una fattura, in JSON»',
    contesto:'Che regole devono valere per tutto il flusso? Es. «tono formale, mai inventare numeri, azienda Acme»',
    testo:'Cosa deve dire questo testo? Es. «avvisare il cliente che la pratica è sospesa in attesa di documenti»'
  }[tipo]||'Cosa vuoi ottenere?';
  return '<div class="aiuto-testo" id="aiuto_'+id+'">'+
    '<button type="button" class="aiuto-testo-apri" onclick="aiutoTestoAlterna(\''+id+'\')">Aiutami a scriverlo</button>'+
    '<div class="aiuto-testo-corpo" style="display:none">'+
      '<textarea class="prop-input" id="aiutoRichiesta_'+id+'" rows="2" placeholder="'+escHtml(domanda)+'"></textarea>'+
      '<div class="aiuto-testo-azioni">'+
        '<button type="button" class="tb-btn" onclick="aiutoTestoGenera(\''+id+'\',\''+tipo+'\','+(nid==null?'null':nid)+',\''+(chiave||'')+'\',false)">Scrivi da zero</button>'+
        '<button type="button" class="tb-btn" onclick="aiutoTestoGenera(\''+id+'\',\''+tipo+'\','+(nid==null?'null':nid)+',\''+(chiave||'')+'\',true)">Migliora quello che c\'è</button>'+
        '<span class="aiuto-testo-stato" id="aiutoStato_'+id+'"></span>'+
      '</div>'+
    '</div>'+
  '</div>';
}

function aiutoTestoAlterna(id){
  var box=document.getElementById('aiuto_'+id); if(!box)return;
  var corpo=box.querySelector('.aiuto-testo-corpo');
  var aperto=corpo.style.display!=='none';
  corpo.style.display=aperto?'none':'block';
  if(!aperto){ var r=document.getElementById('aiutoRichiesta_'+id); if(r)r.focus(); }
}

// Cosa sa il modello del posto in cui sta scrivendo: nome e tipo del nodo, il
// contesto del flusso, i campi che arrivano da monte. Senza, scriverebbe un
// prompt generico buono per qualunque nodo, che e' il contrario dell'aiuto.
function aiutoTestoContesto(nid){
  var righe=[];
  try{
    if(typeof B!=='undefined'&&B.context)righe.push('Contesto generale del flusso: '+B.context);
    if(nid!=null&&typeof B!=='undefined'){
      var n=B.nodes.filter(function(x){return x.id===nid})[0];
      if(n){
        righe.push('Nodo: «'+n.name+'» (tipo '+n.type+(n.detail?', '+n.detail:'')+').');
        if(typeof campiDisponibiliAMonte==='function'){
          var c=campiDisponibiliAMonte(B.nodes,B.edges,nid);
          if(c&&c.campi&&c.campi.length)righe.push('Campi disponibili dai nodi precedenti: '+c.campi.join(', ')+'.');
        }
      }
    }
  }catch(e){}
  return righe.join('\n');
}

async function aiutoTestoGenera(id,tipo,nid,chiave,migliora){
  var campo=document.getElementById(id);
  var richiesta=(document.getElementById('aiutoRichiesta_'+id)||{}).value||'';
  var stato=document.getElementById('aiutoStato_'+id);
  if(!campo)return;
  richiesta=richiesta.trim();
  var attuale=(campo.value||'').trim();
  if(!richiesta&&!(migliora&&attuale)){
    if(stato)stato.textContent='Scrivi prima cosa vuoi ottenere.';
    return;
  }
  var pronto=(typeof anyProviderReady==='function')?anyProviderReady():null;
  if(!pronto){
    if(stato)stato.innerHTML='Nessun modello collegato: aprilo nel pannello <strong>Integrazione AI</strong> a sinistra e premi Testa.';
    return;
  }
  var istruzioni={
    prompt:'Scrivi un system prompt per un nodo AI di un flusso automatico. Deve dire al modello chi è, cosa riceve in ingresso, cosa deve produrre e in che formato, e cosa NON deve fare (non inventare dati, lasciare vuoto ciò che manca). Frasi brevi, imperative, in italiano. Nessun preambolo, nessuna spiegazione: restituisci SOLO il testo del prompt.',
    contesto:'Scrivi il contesto generale di un flusso automatico: regole che tutti i nodi AI devono rispettare (tono, lingua, cosa non inventare, nomi da usare o evitare, vincoli). Elenco puntato asciutto, in italiano. Restituisci SOLO il testo.',
    testo:'Scrivi il testo richiesto per un campo di un flusso automatico (per esempio il corpo di un messaggio). Chiaro, breve, in italiano, senza segnaposto inventati: se serve un dato variabile usa la forma {{result.campo}}. Restituisci SOLO il testo.'
  }[tipo]||'Scrivi il testo richiesto, in italiano. Restituisci SOLO il testo.';
  var ctx=aiutoTestoContesto(nid);
  var utente=(ctx?ctx+'\n\n':'')+
    (migliora&&attuale?('Testo attuale da migliorare:\n"""\n'+attuale+'\n"""\n\n'):'')+
    (richiesta?('Obiettivo: '+richiesta):'Migliora il testo attuale mantenendone l\'intento.');
  if(stato)stato.textContent='Sto scrivendo…';
  try{
    var r=await callAI(utente,istruzioni,{temperature:0.4,model:'auto'});
    if(r&&r.demo){ if(stato)stato.textContent='Il modello non ha risposto: '+String(r.text||'').substring(0,90); return }
    var testo=(r&&r.text?String(r.text):'').trim();
    // Il modello a volte incornicia la risposta: si toglie la cornice, non il
    // contenuto.
    testo=testo.replace(/^```[a-z]*\n?/i,'').replace(/\n?```$/,'').replace(/^"""\n?/,'').replace(/\n?"""$/,'').trim();
    if(!testo){ if(stato)stato.textContent='Il modello non ha restituito testo.'; return }
    AIUTO_TESTO_PRECEDENTE[id]=campo.value;
    campo.value=testo;
    if(typeof adattaAltezza==='function'&&campo.style.maxHeight)adattaAltezza(campo);
    // La configurazione del nodo si aggiorna da `onchange`, che non scatta
    // per un valore assegnato da codice: si chiama a mano.
    if(nid!=null&&chiave&&typeof updConfig==='function')updConfig(nid,chiave,testo);
    if(stato)stato.innerHTML='Fatto ('+(r.provider?providerLabel(r.provider):'modello')+'). <span class="aiuto-testo-link" onclick="aiutoTestoRipristina(\''+id+'\','+(nid==null?'null':nid)+',\''+(chiave||'')+'\')">Ripristina il precedente</span>';
  }catch(e){
    if(stato)stato.textContent='Non ci sono riuscito: '+String(e&&e.message||e).substring(0,90);
  }
}

function aiutoTestoRipristina(id,nid,chiave){
  var campo=document.getElementById(id); if(!campo)return;
  var prec=AIUTO_TESTO_PRECEDENTE[id];
  if(prec==null)return;
  campo.value=prec;
  if(typeof adattaAltezza==='function'&&campo.style.maxHeight)adattaAltezza(campo);
  if(nid!=null&&chiave&&typeof updConfig==='function')updConfig(nid,chiave,prec);
  var stato=document.getElementById('aiutoStato_'+id);
  if(stato)stato.textContent='Ripristinato.';
  delete AIUTO_TESTO_PRECEDENTE[id];
}
