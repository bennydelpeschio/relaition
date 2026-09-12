// ══════════════════════════════════════════
// APPROFONDIMENTI DELLE LEZIONI
// ══════════════════════════════════════════
// La scheda Risorse offriva un «Video Tutorial» che apriva soltanto un avviso:
// «in un ambiente di produzione qui si aprirebbe la playlist». Una promessa che
// non si mantiene insegna a non fidarsi nemmeno delle altre.
//
// Qui non si finge di ospitare video: si rimanda a materiale ESTERNO, pubblico
// e verificato, quello che chi ha scritto la lezione andrebbe davvero a
// leggere. Ogni indirizzo di questo elenco e' stato interrogato e risponde;
// quelli che non rispondevano — la pagina ISO, che blocca le richieste
// automatiche — sono stati tolti invece di lasciati sperare.
//
// Tipi: video, corso, articolo (paper), guida (documentazione ufficiale),
// norma (testo normativo), strumento.

var RISORSA_TIPO={
  video:    {i:'🎥', l:'Video'},
  corso:    {i:'🎓', l:'Corso'},
  articolo: {i:'📄', l:'Articolo'},
  guida:    {i:'📘', l:'Guida'},
  norma:    {i:'⚖️', l:'Norma'},
  strumento:{i:'🔧', l:'Strumento'}
};

// Risorse dichiarate una volta e richiamate per sigla: le stesse fonti servono
// piu' lezioni, e ripeterle per esteso significherebbe correggerle in dieci
// punti quando un indirizzo cambia.
var RISORSE={
  transformer:{t:'Attention Is All You Need',u:'https://arxiv.org/abs/1706.03762',k:'articolo',
               d:'L’articolo del 2017 che introduce l’architettura su cui poggiano tutti i modelli attuali.'},
  react:      {t:'ReAct: ragionamento e azione',u:'https://arxiv.org/abs/2210.03629',k:'articolo',
               d:'Il ciclo ragiona-agisci-osserva che il motore della piattaforma riproduce.'},
  cot:        {t:'Chain-of-Thought prompting',u:'https://arxiv.org/abs/2201.11903',k:'articolo',
               d:'Perché chiedere al modello di esplicitare i passaggi cambia la qualità della risposta.'},
  rag:        {t:'Retrieval-Augmented Generation',u:'https://arxiv.org/abs/2005.11401',k:'articolo',
               d:'L’articolo originale su come fondare le risposte su documenti recuperati.'},
  ragSurvey:  {t:'RAG per i modelli linguistici: rassegna',u:'https://arxiv.org/abs/2312.10997',k:'articolo',
               d:'Panoramica aggiornata su segmentazione, recupero e riordino, le tre scelte che contano.'},
  toolformer: {t:'Toolformer: modelli che usano strumenti',u:'https://arxiv.org/abs/2302.04761',k:'articolo',
               d:'Come un modello impara a decidere quando invocare uno strumento esterno.'},
  agentiEff:  {t:'Costruire agenti efficaci',u:'https://www.anthropic.com/engineering/building-effective-agents',k:'guida',
               d:'Quando conviene un agente e quando bastano dei passaggi fissi: la domanda da farsi per prima.'},
  promptAnt:  {t:'Prompt engineering, documentazione Anthropic',u:'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',k:'guida',
               d:'Tecniche verificate, con esempi: la fonte da cui partire prima di improvvisare.'},
  promptOai:  {t:'Prompt engineering, documentazione OpenAI',u:'https://platform.openai.com/docs/guides/prompt-engineering',k:'guida',
               d:'Le stesse tecniche viste dal lato OpenAI: utile confrontare le due impostazioni.'},
  toolAnt:    {t:'Tool use, documentazione Anthropic',u:'https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview',k:'guida',
               d:'Il formato con cui un modello dichiara di voler usare uno strumento.'},
  funcOai:    {t:'Function calling, documentazione OpenAI',u:'https://platform.openai.com/docs/guides/function-calling',k:'guida',
               d:'La stessa idea nel formato OpenAI, quello che la piattaforma usa per questo fornitore.'},
  embedAnt:   {t:'Embedding, documentazione Anthropic',u:'https://docs.anthropic.com/en/docs/build-with-claude/embeddings',k:'guida',
               d:'Cosa sono le rappresentazioni vettoriali e quando servono davvero.'},
  gemini:     {t:'API Gemini, documentazione',u:'https://ai.google.dev/gemini-api/docs',k:'guida',
               d:'Riferimento del terzo fornitore collegabile alla piattaforma.'},
  aiAct:      {t:'Regolamento europeo sull’intelligenza artificiale',u:'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',k:'norma',
               d:'Testo ufficiale. L’Allegato III elenca i casi ad alto rischio che impongono il percorso rafforzato.'},
  gdpr:       {t:'GDPR, testo ufficiale',u:'https://eur-lex.europa.eu/eli/reg/2016/679/oj',k:'norma',
               d:'Il regolamento a cui rispondono mascheramento dei dati e registro dei trattamenti.'},
  edpb:       {t:'European Data Protection Board',u:'https://edpb.europa.eu/',k:'norma',
               d:'Linee guida e pareri applicativi: è qui che il testo diventa pratica.'},
  nist:       {t:'NIST AI Risk Management Framework',u:'https://www.nist.gov/itl/ai-risk-management-framework',k:'guida',
               d:'Come si struttura la gestione del rischio di un sistema AI, indipendentemente dalla giurisdizione.'},
  owasp:      {t:'OWASP Top 10 per applicazioni LLM',u:'https://owasp.org/www-project-top-10-for-large-language-model-applications/',k:'guida',
               d:'Le dieci vulnerabilità ricorrenti, a partire dall’iniezione di istruzioni ostili.'},
  bm25:       {t:'Okapi BM25',u:'https://en.wikipedia.org/wiki/Okapi_BM25',k:'articolo',
               d:'La funzione di punteggio lessicale che la piattaforma combina con i vettori.'},
  tfidf:      {t:'TF-IDF',u:'https://en.wikipedia.org/wiki/Tf%E2%80%93idf',k:'articolo',
               d:'Come si pesa un termine in base a quanto è raro: la base del recupero implementato qui.'},
  cron:       {t:'crontab.guru',u:'https://crontab.guru/',k:'strumento',
               d:'Scrivi un’espressione cron e leggila in parole: utile per il pannello «Metti in produzione».'},
  b3b1:       {t:'3Blue1Brown, reti neurali e transformer',u:'https://www.youtube.com/@3blue1brown',k:'video',
               d:'La serie visiva che spiega cosa succede dentro un modello. Il punto di partenza se la matematica intimidisce.'},
  karpathy:   {t:'Andrej Karpathy, costruire un LLM da zero',u:'https://www.youtube.com/@AndrejKarpathy',k:'video',
               d:'Lezioni in cui un modello viene costruito riga per riga: il modo più diretto per togliere la magia.'},
  hfCourse:   {t:'Hugging Face, corso di NLP',u:'https://huggingface.co/learn/nlp-course/chapter1/1',k:'corso',
               d:'Corso gratuito e pratico: tokenizzazione, modelli, fine-tuning.'},
  fsapi:      {t:'File System Access API',u:'https://developer.mozilla.org/en-US/docs/Web/API/File_System_API',k:'guida',
               d:'L’interfaccia con cui la piattaforma scrive davvero su una cartella del computer.'},
  swapi:      {t:'Service Worker API',u:'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API',k:'guida',
               d:'Come funziona il meccanismo che rende RelAItion installabile e utilizzabile offline.'}
};

// Da due a tre risorse per lezione: un elenco più lungo non viene letto, e
// diluirebbe quelle che contano davvero.
var LEZIONE_RISORSE={
  '1-0':['agentiEff','react','b3b1'],
  '1-1':['transformer','b3b1','hfCourse'],
  '1-2':['react','toolformer','karpathy'],
  '1-3':['agentiEff','promptAnt'],
  '1-4':['promptAnt','promptOai','cot'],
  '1-5':['owasp','nist'],

  '2-0':['agentiEff','promptAnt'],
  '2-1':['agentiEff','karpathy'],
  '2-2':['funcOai','toolAnt','gemini'],
  '2-3':['nist','owasp'],
  '2-4':['nist','agentiEff'],
  '2-5':['toolformer','hfCourse'],

  '3-0':['promptAnt','cot'],
  '3-1':['gdpr','nist'],
  '3-2':['ragSurvey','promptOai'],
  '3-3':['aiAct','gdpr'],
  '3-4':['nist','agentiEff'],
  '3-5':['nist','aiAct'],

  '4-0':['gdpr','edpb','aiAct'],
  '4-1':['gdpr','edpb'],
  '4-2':['owasp','promptAnt'],
  '4-3':['aiAct','nist','fsapi'],
  '4-4':['nist','aiAct'],
  '4-5':['nist','owasp'],

  '5-0':['promptOai','cot'],
  '5-1':['cron','funcOai'],
  '5-2':['funcOai','toolAnt'],
  '5-3':['promptAnt','cot'],
  '5-4':['nist','hfCourse'],
  '5-5':['agentiEff','react'],

  '6-0':['ragSurvey','rag'],
  '6-1':['bm25','tfidf','embedAnt'],
  '6-2':['react','nist'],
  '6-3':['aiAct','owasp'],
  '6-4':['aiAct','nist'],
  '6-5':['nist','swapi']
};

// Il riquadro compare solo se la lezione dichiara delle risorse, e ogni voce
// dice CHE COSA e' prima di dove porta: un elenco di link nudi costringe ad
// aprirli tutti per capire quale serviva.
function bloccoRisorse(key){
  var sigle=LEZIONE_RISORSE[key];
  if(!sigle||!sigle.length)return '';
  var voci=sigle.map(function(s){
    var r=RISORSE[s];
    if(!r)return '';
    var t=RISORSA_TIPO[r.k]||{i:'🔗',l:''};
    return '<a href="'+r.u+'" target="_blank" rel="noopener noreferrer" '+
      'style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--bg2);text-decoration:none;color:inherit">'+
      '<span style="font-size:16px;line-height:1.3;flex-shrink:0">'+t.i+'</span>'+
      '<span style="flex:1;min-width:0">'+
        '<span style="display:block;font-size:12.5px;font-weight:700;color:var(--ac2)">'+escHtml(r.t)+' ↗</span>'+
        '<span style="display:block;font-size:11.5px;color:var(--tx3);line-height:1.5;margin-top:2px">'+escHtml(r.d)+'</span>'+
      '</span>'+
      '<span class="badge badge-gray" style="flex-shrink:0;font-size:10px">'+t.l+'</span>'+
    '</a>';
  }).join('');
  return '<div class="card" style="margin-top:14px;padding:14px 16px">'+
    '<div style="font-size:12.5px;font-weight:800;margin-bottom:2px">📚 Per approfondire</div>'+
    '<div style="font-size:10.5px;color:var(--tx4);margin-bottom:6px">Materiale esterno e pubblico: articoli originali, documentazione dei fornitori, testi normativi. Si apre in una scheda nuova.</div>'+
    voci+
  '</div>';
}

// ══════════════════════════════════════════
// BIBLIOTECA — tutte le risorse in un posto solo
// ══════════════════════════════════════════
// Le risorse per lezione si trovano solo aprendo quella lezione. Chi cerca
// «il testo dell'AI Act» o «il corso di NLP» senza ricordare dove l'ha visto
// dovrebbe altrimenti riaprirle a una a una.
function apriBiblioteca(){
  var perTipo={};
  Object.keys(RISORSE).forEach(function(s){
    var r=RISORSE[s];(perTipo[r.k]=perTipo[r.k]||[]).push(r);
  });
  // Dove compare ciascuna risorsa: dice a quale lezione tornare per il
  // contesto, che da sola una fonte esterna non ha.
  var lezioniDi=function(risorsa){
    var sigla=Object.keys(RISORSE).filter(function(s){return RISORSE[s]===risorsa})[0];
    var dove=[];
    Object.keys(LEZIONE_RISORSE).forEach(function(k){
      if(LEZIONE_RISORSE[k].indexOf(sigla)>=0){
        var p=PATHS.filter(function(x){return x.id===parseInt(k.split('-')[0],10)})[0];
        var l=p&&p.lessons[parseInt(k.split('-')[1],10)];
        if(l)dove.push(l.t);
      }
    });
    return dove;
  };
  var corpo=Object.keys(RISORSA_TIPO).filter(function(k){return perTipo[k]}).map(function(k){
    var t=RISORSA_TIPO[k];
    return '<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin:16px 0 4px">'+
        t.i+' '+t.l+' ('+perTipo[k].length+')</div>'+
      perTipo[k].map(function(r){
        var dove=lezioniDi(r);
        return '<a href="'+r.u+'" target="_blank" rel="noopener noreferrer" '+
          'style="display:block;padding:8px 0;border-bottom:1px solid var(--bg2);text-decoration:none;color:inherit">'+
          '<div style="font-size:12.5px;font-weight:700;color:var(--ac2)">'+escHtml(r.t)+' ↗</div>'+
          '<div style="font-size:11.5px;color:var(--tx3);line-height:1.5;margin-top:2px">'+escHtml(r.d)+'</div>'+
          (dove.length?'<div style="font-size:10px;color:var(--tx4);margin-top:3px">Citata in: '+escHtml(dove.slice(0,3).join(' · '))+(dove.length>3?' e altre '+(dove.length-3):'')+'</div>':'')+
        '</a>';
      }).join('');
  }).join('');
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>Biblioteca</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 4px;line-height:1.6">'+
      Object.keys(RISORSE).length+' risorse esterne e pubbliche citate nelle lezioni: articoli originali, '+
      'documentazione dei fornitori, testi normativi, corsi e video. RelAItion non le ospita, '+
      'si aprono sul sito di chi le pubblica.</p>'+
    corpo,true);
}
