# ══════════════════════════════════════════════════════════════
# RelAItion — ricevitore webhook locale
# ══════════════════════════════════════════════════════════════
# Una pagina web non puo' mettersi in ascolto di chiamate in arrivo: puo' solo
# farne. Questo servizio riceve le chiamate esterne e le tiene in coda; il
# builder le preleva e avvia il flusso con i dati ricevuti.
#
# E' il funzionamento di n8n riportato in un contesto senza backend: chi chiama
# non parla direttamente col browser, ma lascia il messaggio a un intermediario
# che il browser interroga.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File relaition-webhook.ps1
#
# Poi, da qualunque client:
#   curl -X POST http://127.0.0.1:8788/hooks/contatti ^
#        -H "Content-Type: application/json" ^
#        -d "{\"cliente\":\"ACME\",\"importo\":128400}"
#
# Con un file allegato:
#   curl -X POST http://127.0.0.1:8788/hooks/contatti ^
#        -H "Content-Type: text/plain" --data-binary "@documento.txt"

param(
  [int]$Porta = 8788,
  [string]$Origine = "http://localhost:8099",
  [int]$MaxInCoda = 50
)

$ErrorActionPreference = "Stop"

# Coda in memoria: chiave = percorso del webhook, valore = elenco di chiamate.
$coda = @{}
$contatore = 0

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Porta/")
$listener.Start()

Write-Host ""
Write-Host "  RelAItion - ricevitore webhook" -ForegroundColor Cyan
Write-Host "  ------------------------------" -ForegroundColor DarkGray
Write-Host ("  In ascolto su http://127.0.0.1:{0}" -f $Porta) -ForegroundColor Green
Write-Host ""
Write-Host "  Le chiamate in arrivo restano in coda finche' il builder non le"
Write-Host "  preleva. Lascia questa finestra aperta mentre usi RelAItion."
Write-Host "  Ctrl+C per fermare."
Write-Host ""

# L'origine consentita non puo' essere una stringa fissa: l'app puo' essere
# aperta da localhost o da 127.0.0.1, su una porta qualsiasi, oppure da
# file:// (che il browser presenta come "null"). Con un valore fisso il
# browser scarta la risposta e l'applicazione riporta "servizio non in
# ascolto" mentre il servizio sta rispondendo benissimo: l'errore piu'
# fuorviante possibile.
# Si rimanda indietro l'origine della richiesta, ma solo se e' locale: un
# sito qualsiasi aperto nello stesso browser non deve poter parlare con
# questo servizio.
function Origine-Consentita($contesto) {
  $o = $contesto.Request.Headers["Origin"]
  if ([string]::IsNullOrWhiteSpace($o)) { return $Origine }
  if ($o -eq "null") { return "null" }                       # pagina aperta da file://
  if ($o -match '^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$') { return $o }
  return $Origine
}

function Rispondi($ctx, $code, $obj) {
  $r = $ctx.Response
  $r.StatusCode = $code
  $r.Headers.Add("Access-Control-Allow-Origin", (Origine-Consentita $ctx))
  $r.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
  $r.Headers.Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
  $r.ContentType = "application/json; charset=utf-8"
  $b = [Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Compress -Depth 8))
  $r.ContentLength64 = $b.Length
  $r.OutputStream.Write($b, 0, $b.Length)
  $r.OutputStream.Close()
}

# Le eccezioni .NET arrivano avvolte ("Exception calling EndConnect with 1
# argument(s): ..."): illeggibili per chi sta configurando una connessione.
# Qui si traduce nei tre casi che capitano davvero, e la causa suggerisce
# gia' dove guardare.
function Messaggio-Leggibile($testo) {
  $t = [string]$testo
  if ($t -match "actively refused|connessione.*rifiutat") { return "Porta chiusa: l'host risponde ma nessun servizio e' in ascolto su quella porta" }
  if ($t -match "No such host is known|could not be resolved|host sconosciuto") { return "Host non risolto: il nome non esiste o il DNS non lo conosce" }
  if ($t -match "timed out|timeout") { return "Nessuna risposta entro il tempo limite (porta filtrata da un firewall)" }
  if ($t -match "Exception calling .*?: ""(.*)""") { return $Matches[1] }
  return $t
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $percorso = $req.Url.AbsolutePath

    if ($req.HttpMethod -eq "OPTIONS") { Rispondi $ctx 200 @{ ok = $true }; continue }

    # ── Stato: il builder lo usa per sapere se il servizio c'e' ──
    if ($percorso -eq "/stato") {
      $totale = 0; foreach ($k in $coda.Keys) { $totale += $coda[$k].Count }
      Rispondi $ctx 200 @{ ok=$true; servizio="relaition-webhook"; ricevute=$contatore
                           inCoda=$totale; percorsi=@($coda.Keys) }
      continue
    }

    # ── Prelievo: il builder ritira le chiamate per un percorso ──
    # Vengono rimosse dalla coda: una chiamata deve avviare il flusso una volta
    # sola, altrimenti a ogni controllo si rieseguirebbe daccapo.
    if ($percorso -eq "/preleva" -and $req.HttpMethod -eq "GET") {
      $p = $req.QueryString["percorso"]
      if (-not $p) { Rispondi $ctx 400 @{ ok=$false; errore="Manca il parametro percorso" }; continue }
      $elenco = @()
      if ($coda.ContainsKey($p)) { $elenco = $coda[$p]; $coda.Remove($p) }
      Rispondi $ctx 200 @{ ok=$true; percorso=$p; chiamate=@($elenco) }
      continue
    }

    # ── Sonda: prova di connessione VERA per conto del builder ──────────────
    # Il browser non apre socket TCP e non puo' aggirare CORS. Qui invece si
    # puo': una connessione TCP reale verso host:porta, e una richiesta HTTP
    # lato server. Serve a distinguere "il servizio non risponde" da "risponde
    # ma il browser non e' autorizzato a parlarci", che dal browser sono
    # indistinguibili e mandano a cercare il problema dove non e'.
    # Nessuna credenziale passa di qui: si verifica che la porta risponda.
    if ($percorso -eq "/sonda") {
      $tipo = $req.QueryString["tipo"]
      $avvio = Get-Date

      if ($tipo -eq "tcp") {
        $h = $req.QueryString["host"]; $p = 0
        [void][int]::TryParse($req.QueryString["porta"], [ref]$p)
        if (-not $h -or $p -le 0) { Rispondi $ctx 400 @{ ok=$false; errore="Servono host e porta" }; continue }
        $cli = New-Object Net.Sockets.TcpClient
        try {
          # BeginConnect + attesa: senza timeout esplicito una porta filtrata
          # da un firewall terrebbe appesa la richiesta per minuti.
          $ar = $cli.BeginConnect($h, $p, $null, $null)
          if (-not $ar.AsyncWaitHandle.WaitOne(5000, $false)) { throw "Nessuna risposta entro 5 secondi (porta chiusa o filtrata da un firewall)" }
          $cli.EndConnect($ar)
          $ms = [int]((Get-Date) - $avvio).TotalMilliseconds
          Rispondi $ctx 200 @{ ok=$true; ms=$ms; dettaglio=("Porta {0} aperta su {1}" -f $p, $h) }
        } catch {
          Rispondi $ctx 200 @{ ok=$false; errore=(Messaggio-Leggibile $_.Exception.Message) }
        } finally { $cli.Close() }
        continue
      }

      if ($tipo -eq "http") {
        $u = $req.QueryString["url"]
        $m = $req.QueryString["metodo"]; if (-not $m) { $m = "GET" }
        if (-not $u) { Rispondi $ctx 400 @{ ok=$false; errore="Serve url" }; continue }
        try {
          $risp = Invoke-WebRequest -Uri $u -Method $m -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
          $ms = [int]((Get-Date) - $avvio).TotalMilliseconds
          Rispondi $ctx 200 @{ ok=$true; stato=[int]$risp.StatusCode; ms=$ms }
        } catch {
          # Un 401/403 non e' un fallimento della sonda: il servizio c'e' e ha
          # risposto. Va riportato come tale, non come irraggiungibilita'.
          $codice = 0
          if ($_.Exception.Response) { $codice = [int]$_.Exception.Response.StatusCode }
          $ms = [int]((Get-Date) - $avvio).TotalMilliseconds
          if ($codice -gt 0) { Rispondi $ctx 200 @{ ok=$true; stato=$codice; ms=$ms } }
          else { Rispondi $ctx 200 @{ ok=$false; errore=(Messaggio-Leggibile $_.Exception.Message) } }
        }
        continue
      }

      Rispondi $ctx 400 @{ ok=$false; errore="tipo deve essere tcp oppure http" }
      continue
    }

    # ── Ricezione: qualunque altro percorso e' un webhook ──
    if ($req.HttpMethod -eq "POST" -or $req.HttpMethod -eq "PUT") {
      $lettore = New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)
      $corpoTesto = $lettore.ReadToEnd()

      # Il corpo puo' essere JSON o testo/file: si prova a interpretarlo, e se
      # non e' JSON si conserva come contenuto grezzo. In entrambi i casi il
      # flusso riceve qualcosa di utilizzabile.
      $datiJson = $null
      try { $datiJson = $corpoTesto | ConvertFrom-Json } catch { $datiJson = $null }

      # I parametri della query string valgono quanto quelli del corpo: molte
      # integrazioni chiamano con ?cliente=ACME e nient'altro.
      $daQuery = @{}
      foreach ($k in $req.QueryString.AllKeys) { if ($k) { $daQuery[$k] = $req.QueryString[$k] } }

      $voce = @{
        id        = [guid]::NewGuid().ToString()
        percorso  = $percorso
        metodo    = $req.HttpMethod
        ricevutaIl= (Get-Date).ToString("o")
        tipo      = $req.ContentType
        query     = $daQuery
        json      = $datiJson
        testo     = $corpoTesto
        nomeFile  = $req.Headers["X-Nome-File"]
      }

      if (-not $coda.ContainsKey($percorso)) { $coda[$percorso] = @() }
      # La coda non cresce all'infinito: le chiamate piu' vecchie cadono, cosi'
      # un servizio lasciato aperto per giorni non consuma memoria senza limite.
      $coda[$percorso] = @($coda[$percorso] + $voce | Select-Object -Last $MaxInCoda)
      $contatore++

      $quando = Get-Date -Format "HH:mm:ss"
      $descrizione = if ($datiJson) { "JSON" } elseif ($corpoTesto) { "$($corpoTesto.Length) caratteri" } else { "vuota" }
      Write-Host ("  [{0}] {1} {2} - {3}" -f $quando, $req.HttpMethod, $percorso, $descrizione) -ForegroundColor Green

      Rispondi $ctx 200 @{ ok=$true; id=$voce.id; percorso=$percorso
                           messaggio="Chiamata accodata: verra' elaborata dal flusso in ascolto su questo percorso." }
      continue
    }

    Rispondi $ctx 405 @{ ok=$false; errore="Usa POST o PUT per inviare dati a un webhook" }
  }
} finally {
  $listener.Stop()
  Write-Host ""
  Write-Host ("  Servizio fermato. Chiamate ricevute: {0}" -f $contatore)
}
