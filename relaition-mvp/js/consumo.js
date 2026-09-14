// ═══════════════════════════════════════════
// CONSUMO DI TOKEN E QUOTA DI PROVA
// ═══════════════════════════════════════════
// La piattaforma chiamava il modello con la chiave dell'utente e non teneva
// il conto di quanto consumava: il Monitoraggio lo dichiarava come limite.
// Qui il conto si tiene. Per ogni chiamata si registrano i token in ingresso
// e in uscita: quelli riportati dal fornitore nella risposta quando ci sono,
// altrimenti una stima dai caratteri (circa quattro per token), marcata come
// tale. Il numero mostrato e' calcolato, e dice se e' misurato o stimato.
//
// La QUOTA DI PROVA e' una politica, non un credito: nessuno paga i token al
// posto dell'utente, la chiave resta la sua. Superata la quota, la
// piattaforma lo dice e continua. In un'installazione aziendale con un proxy
// di inferenza gestito dal fornitore della piattaforma, lo stesso contatore
// alimenterebbe i crediti di benvenuto e poi l'addebito al piano: e' il
// modello commerciale descritto nel documento, che qui ha solo il contatore.

var QUOTA_PROVA_TOKEN=100000;
var CONSUMO_AVVISATO={};

// Token dalla risposta del fornitore, quando li riporta.
function usageDa(provider,data){
  try{
    if(!data)return null;
    if(data.usage&&data.usage.input_tokens!=null)
      return {input:data.usage.input_tokens||0, output:data.usage.output_tokens||0, stimato:false};
    if(data.usage&&data.usage.prompt_tokens!=null)
      return {input:data.usage.prompt_tokens||0, output:data.usage.completion_tokens||0, stimato:false};
    if(data.usageMetadata&&data.usageMetadata.promptTokenCount!=null)
      return {input:data.usageMetadata.promptTokenCount||0, output:data.usageMetadata.candidatesTokenCount||0, stimato:false};
  }catch(e){}
  return null;
}

// Stima dai caratteri: circa quattro per token in italiano. Dichiarata.
function stimaToken(testo){ return Math.ceil(String(testo||'').length/4) }

// Registra una chiamata. `ctx` dice da dove viene: agente e nodo, oppure la
// chat del Builder o l'aiuto alla scrittura.
function registraConsumo(provider,usage,ctx){
  if(typeof DB==='undefined'||!DB||!usage)return;
  var chi=(typeof utenteCorrente==='function')?utenteCorrente():'';
  try{
    dbRun('INSERT INTO consumo_token (user,agent,node,provider,tokens_in,tokens_out,stimato,ts) VALUES (?,?,?,?,?,?,?,?)',
      [chi,(ctx&&ctx.agente)||'',(ctx&&ctx.nodo)||'',provider||'',usage.input|0,usage.output|0,usage.stimato?1:0,new Date().toISOString()]);
    if(typeof scheduleDbPersist==='function')scheduleDbPersist(); else if(typeof persistDatabase==='function')persistDatabase();
  }catch(e){}
  avvisaQuota(chi);
}

// Totale per utente, con la quota di stimati: «12.400 token, di cui 3.100
// stimati» e' un numero onesto; «12.400 token» e basta non lo sarebbe.
function consumoUtente(chi,daData){
  chi=chi||((typeof utenteCorrente==='function')?utenteCorrente():'');
  var r;
  try{
    r=dbGetOne('SELECT COALESCE(SUM(tokens_in+tokens_out),0) tot, COALESCE(SUM(CASE WHEN stimato=1 THEN tokens_in+tokens_out ELSE 0 END),0) stim, COUNT(*) n FROM consumo_token WHERE user=?'+(daData?' AND ts>=?':''), daData?[chi,daData]:[chi]);
  }catch(e){ r=null }
  return {tot:(r&&r.tot)||0, stimati:(r&&r.stim)||0, chiamate:(r&&r.n)||0};
}

function avvisaQuota(chi){
  if(quotaUsata(chi)<QUOTA_PROVA_TOKEN||CONSUMO_AVVISATO[chi])return;
  CONSUMO_AVVISATO[chi]=true;
  if(typeof showToast==='function')showToast('Quota di prova esaurita ('+QUOTA_PROVA_TOKEN.toLocaleString('it-IT')+' token): da qui in poi i nodi AI hanno bisogno della tua chiave, nel pannello Integrazione AI.');
}

// Riquadro per il profilo: totale, quota, ultimi trenta giorni.
function consumoCardHTML(){
  var chi=(typeof utenteCorrente==='function')?utenteCorrente():'';
  var tot=consumoUtente(chi);
  var trenta=new Date(); trenta.setDate(trenta.getDate()-30);
  var mese=consumoUtente(chi,trenta.toISOString());
  var usataQ=quotaUsata(chi);
  var pct=Math.min(100,Math.round(usataQ/QUOTA_PROVA_TOKEN*100));
  var oltre=usataQ>=QUOTA_PROVA_TOKEN;
  var conChiave=Math.max(0,tot.tot-usataQ);
  var f=function(n){return Number(n||0).toLocaleString('it-IT')};
  return '<div class="card" style="padding:16px">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
      '<span style="font-size:13px;font-weight:800;flex:1">Consumo di token</span>'+
      '<span class="badge '+(oltre?'badge-y':'badge-b')+'">'+(oltre?'quota di prova esaurita':'quota di prova')+'</span>'+
    '</div>'+
    '<div style="font-size:10.5px;color:var(--tx4);margin-bottom:10px;line-height:1.5">Contati su ogni chiamata: misurati dove il fornitore li riporta, stimati altrove (circa 4 caratteri per token). Le chiamate a quota sono simulate e contate a parte.</div>'+
    '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px">'+
      '<div><div style="font-size:20px;font-weight:800">'+f(tot.tot)+'</div><div style="font-size:10px;color:var(--tx4)">token in totale'+(tot.stimati?' · '+f(tot.stimati)+' stimati':'')+'</div></div>'+
      '<div><div style="font-size:20px;font-weight:800">'+f(mese.tot)+'</div><div style="font-size:10px;color:var(--tx4)">ultimi 30 giorni · '+f(mese.chiamate)+' chiamate</div></div>'+
      '<div><div style="font-size:20px;font-weight:800">'+f(conChiave)+'</div><div style="font-size:10px;color:var(--tx4)">con la tua chiave</div></div>'+
    '</div>'+
    '<div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--tx4);margin-bottom:4px"><span>Quota di prova: usati '+f(usataQ)+' di '+f(QUOTA_PROVA_TOKEN)+' token</span><span>'+pct+'%</span></div>'+
    '<div style="height:6px;background:var(--bg2);border-radius:3px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:'+(oltre?'#F59E0B':'var(--ac)')+'"></div></div>'+
    '<div style="font-size:10.5px;color:var(--tx4);margin-top:8px;line-height:1.5">Con una chiave collegata i nodi AI usano quella e la quota non si tocca. Senza chiave usano la quota: risposte <strong>simulate</strong> e dichiarate tali, perché in questo prototipo non c\'è un proxy che compri inferenza. Non è un credito: nessuno paga i token al posto tuo.</div>'+
  '</div>';
}

// ── Il nome pubblico ──────────────────────────────────────────
// `callAI` avvolge la chiamata con ripiego e registra il consumo. I chiamanti
// possono dire da dove chiamano con `config.consumo={agente,nodo}`; senza,
// la riga resta attribuita all'utente e al fornitore, senza agente.
async function callAI(prompt,systemPrompt,config){
  // Il bivio: quota di prova (simulata, dichiarata) o chiave propria.
  if(typeof usaQuota==='function'&&usaQuota()){
    var testoQ=rispostaQuota(prompt,systemPrompt,config);
    var usoQ={input:stimaToken(String(systemPrompt||'')+String(prompt||'')),output:stimaToken(testoQ),stimato:true};
    registraConsumo('quota-prova',usoQ,config&&config.consumo);
    return {text:testoQ,demo:true,quota:true,provider:'quota-prova',usage:usoQ};
  }
  var r=await callAIConRipiego(prompt,systemPrompt,config);
  try{
    if(r&&!r.demo&&!r.error&&!r.aborted){
      var provider=r.provider||normalizeProviderName(config&&config.model?config.model:aiConfig.provider);
      var usage=r.usage||{input:stimaToken(String(systemPrompt||'')+String(prompt||'')),output:stimaToken(r.text||''),stimato:true};
      r.usage=usage;
      registraConsumo(provider,usage,config&&config.consumo);
    }
  }catch(e){}
  return r;
}

// ── Fonte delle chiamate: quota di prova o chiave propria ──────
// Chi ha ancora quota deve poter eseguire un flusso ANCHE senza una chiave, e
// chi ha una chiave deve poter scegliere. Ma la quota, in questo prototipo,
// non compra inferenza: non c'e' un proxy con una chiave del fornitore della
// piattaforma. Quindi una chiamata «a quota» restituisce una risposta
// SIMULATA, dichiarata tale in ogni riga del registro, nel conto dei token
// (fornitore «quota-prova») e nel Monitoraggio. Il flusso gira, si vede la
// struttura, non il contenuto. In un'installazione con il proxy, lo stesso
// bivio manderebbe la chiamata al proxy invece che alla simulazione.
//
// Nessuna scelta da fare: se c'e' una chiave collegata si usa quella, altrimenti
// la quota. Un selettore (v102) e' stato tolto: confondeva, e la regola
// automatica e' l'unica sensata.

// Token gia' presi dalla quota: solo le chiamate a quota, non quelle con la
// chiave propria, che la quota non riguarda.
function quotaUsata(chi){
  chi=chi||((typeof utenteCorrente==='function')?utenteCorrente():'');
  try{ return dbGetOne("SELECT COALESCE(SUM(tokens_in+tokens_out),0) t FROM consumo_token WHERE user=? AND provider='quota-prova'",[chi]).t||0 }catch(e){ return 0 }
}
function quotaResidua(chi){ return Math.max(0,QUOTA_PROVA_TOKEN-quotaUsata(chi)) }

// La chiamata in arrivo va alla quota?
function usaQuota(){
  var pronto=(typeof anyProviderReady==='function')?anyProviderReady():null;
  if(pronto)return false;
  return quotaResidua()>0;
}

// Risposta simulata, nel formato che il nodo si aspetta. Dice di essere
// simulata anche dentro il testo: se finisce in un file o in una mail, lo si
// legge li'.
function rispostaQuota(prompt,systemPrompt,config){
  var fmt=String((config&&(config.outformat||config.outFormat))||'').toLowerCase();
  var estratto=String(prompt||'').replace(/\s+/g,' ').trim().substring(0,90);
  if(fmt==='json'){
    return JSON.stringify({simulato:true,fonte:'quota di prova',nota:'Risposta simulata: nessun modello collegato. Il flusso prosegue per mostrare la struttura, non il contenuto.',richiesta:estratto});
  }
  return 'Risposta simulata dalla quota di prova (nessun modello collegato). Richiesta: «'+estratto+(String(prompt||'').length>90?'…':'')+'». Collega la tua chiave nel pannello Integrazione AI per una risposta vera.';
}

// Quando cambia lo stato dei fornitori, il riquadro del profilo (se a schermo)
// deve dire la stessa cosa.
function aggiornaFonteUI(){
  var pc=document.getElementById('profile-consumo');
  if(pc&&typeof consumoCardHTML==='function')pc.innerHTML=consumoCardHTML();
}
