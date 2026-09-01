var currentPage='dashboard';

var pageLabels={
  dashboard:['Dashboard','Panoramica piattaforma'],
  marketplace:['Marketplace','Catalogo agenti AI verificati'],
  builder:['Builder','Costruisci il tuo agente AI'],
  myagents:['I miei agenti','Gestisci i tuoi workflow'],
  execlog:['Log Esecuzioni','Audit trail delle esecuzioni'],
  monitoraggio:['Monitoraggio della piattaforma','Adozione complessiva, presidio e segnali di rischio'],
  learning:['Learning Hub','Percorsi formativi AI Agent'],
  challenges:['Sfide & Eventi','Hackathon e competizioni'],
  community:['Community','Forum e discussioni'],
  profile:['Profilo','Il tuo spazio personale']
};


var mktFilter='Tutti';

var B={nodes:[],edges:[],nextId:1,selId:-1,selIds:[],marquee:null,zoom:1,panX:0,panY:0,drag:null,conn:null,init:false,dbAgentId:null,context:''};


var paletteCat='all',paletteQ='';

// aiConfig.provider/key/status/customUrl/customModel riflettono il provider
// selezionato al momento nel pannello laterale (retro-compatibilità con
// export Python / chat builder, che parlano con "il" provider attivo).
// aiConfig.providers tiene invece la key e lo stato di OGNI provider testato,
// cosi' un nodo AI con model="openai" usa sempre la key OpenAI anche se nel
// pannello e' selezionato Claude — è quello che rende la piattaforma davvero
// agnostica (più provider configurati e utilizzabili in parallelo nello
// stesso workflow).
var aiConfig={
  provider:'claude',key:'',status:'idle',customUrl:'',customModel:'',
  providers:{
    claude:{key:'',status:'idle'},
    openai:{key:'',status:'idle'},
    gemini:{key:'',status:'idle'},
    mistral:{key:'',status:'idle'},
    // Modello in esecuzione sulla macchina dell'utente: nessuna chiave, ma
    // servono indirizzo e nome del modello, che qui non hanno un default
    // universale — vengono scoperti interrogando il server locale.
    locale:{key:'',status:'idle',baseUrl:'http://localhost:11434',model:'',preset:'ollama'},
    custom:{key:'',status:'idle',customUrl:'',customModel:'gpt-4o-mini'}
  }
};

var execEntries=[];

var currentAgentName='Workflow Builder';

var skipBranch_from=null;

// ── LEARNING HUB ──

var learnTab='paths';

var challengeRegistered={};

var forumFilter='all';

var forumTagFilter=null;

var activities=[];

var quizSelection={};

var profileData={name:'Mario R.',role:'AI Agent Builder',org:'Rome Business School',bio:'Master student appassionato di AI e automazione. Costruisco agenti per semplificare processi aziendali complessi.',email:'Mario.m@rbs.edu',linkedin:'linkedin.com/in/Mariom'};

var profileEditing=false;


var notifications=[
  {id:1,text:'Andrea L. ha commentato il tuo post su Salesforce',time:'30 min fa',read:false,action:'community'},
  {id:2,text:'Nuovo agente disponibile: GDPR Data Mapper',time:'2 ore fa',read:false,action:'marketplace'},
  {id:3,text:'Hai sbloccato il badge "7-Day Streak" 🔥',time:'ieri',read:true,action:'profile'},
  {id:4,text:'Hackathon "Agent for Good" — iscrizioni aperte',time:'2 giorni fa',read:true,action:'challenges'},
  {id:5,text:'Invoice Extractor aggiornato alla v2.1',time:'3 giorni fa',read:true,action:'marketplace'}
];

var notifOpen=false;


var myAgentRuns={};

var execlogFilter='all';
// Origine dell'esecuzione: manuale o pianificata. Sono due cose che si
// leggono per motivi diversi — una si e' appena lanciata e se ne cerca
// l'esito, l'altra e' partita da sola e si controlla che sia andata bene —
// quindi vanno separate, non solo etichettate.
var execlogOrigine='all';
// Paginazione del log: righe per pagina e pagina corrente PER SEZIONE, cosi'
// sfogliare le manuali non sposta le pianificate.
var execlogPerPagina=10;
var execlogPagina={manuali:1,pianificate:1};

var _searchTimer=null;

var mktSort='rating';
