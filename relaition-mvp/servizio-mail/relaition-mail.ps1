# ══════════════════════════════════════════════════════════════
# RelAItion — servizio locale di invio email
# ══════════════════════════════════════════════════════════════
# Un browser non puo' aprire una connessione SMTP: SMTP viaggia su TCP e la
# pagina web parla solo HTTP. Questo servizio colma esattamente quel divario e
# nient'altro — riceve una richiesta HTTP dal builder e la inoltra al server di
# posta.
#
# SCELTA DI FONDO: la password NON passa mai dal browser.
# Viene chiesta qui all'avvio, resta in memoria di questo processo e non entra
# mai nella pagina, nel database dell'applicazione, nei flussi esportati o nelle
# pubblicazioni. Il nodo del builder invia solo destinatario, oggetto e corpo.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File relaition-mail.ps1
#
# Il servizio ascolta su http://127.0.0.1:8787 e accetta richieste solo
# dall'applicazione in esecuzione in locale.

param(
  [int]$Porta = 8787,
  [string]$Origine = "http://localhost:8099"
)

$ErrorActionPreference = "Stop"

# ── Credenziali: chieste una volta, mai scritte su disco ──────
Write-Host ""
Write-Host "  RelAItion - servizio locale di invio email" -ForegroundColor Cyan
Write-Host "  ------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Le credenziali restano in questo processo: non vengono salvate su" -ForegroundColor DarkGray
Write-Host "  disco ne' trasmesse al browser. Chiudendo la finestra spariscono." -ForegroundColor DarkGray
Write-Host ""

$presetNoti = @{
  "1" = @{ Nome="Gmail";                Host="smtp.gmail.com";      Porta=587; Ssl=$true
           Nota="Serve una password per le app (verifica in due passaggi attiva)." }
  "2" = @{ Nome="Outlook / Microsoft 365"; Host="smtp.office365.com"; Porta=587; Ssl=$true
           Nota="SMTP di base va abilitato dall'amministratore del tenant." }
  "3" = @{ Nome="Aruba";                Host="smtps.aruba.it";      Porta=465; Ssl=$true
           Nota="" }
  "4" = @{ Nome="SendGrid";             Host="smtp.sendgrid.net";   Porta=587; Ssl=$true
           Nota="L'utente e' letteralmente 'apikey'; la chiave va al posto della password." }
}

Write-Host "  Provider:"
foreach ($k in ($presetNoti.Keys | Sort-Object)) {
  Write-Host ("    [{0}] {1}" -f $k, $presetNoti[$k].Nome)
}
Write-Host "    [5] Altro (inserisco host e porta a mano)"
Write-Host ""
$scelta = Read-Host "  Scegli"

if ($presetNoti.ContainsKey($scelta)) {
  $p = $presetNoti[$scelta]
  $smtpHost = $p.Host; $smtpPorta = $p.Porta; $smtpSsl = $p.Ssl
  if ($p.Nota) { Write-Host ("  Nota: " + $p.Nota) -ForegroundColor Yellow }
} else {
  $smtpHost  = Read-Host "  Server SMTP"
  $smtpPorta = [int](Read-Host "  Porta (587 per STARTTLS, 465 per SSL)")
  $smtpSsl   = $true
}

$smtpUtente   = Read-Host "  Utente / indirizzo mittente"
$smtpPassword = Read-Host "  Password (non viene mostrata)" -AsSecureString
$mittenteNome = Read-Host "  Nome mittente (invio vuoto per usare l'indirizzo)"
if ([string]::IsNullOrWhiteSpace($mittenteNome)) { $mittenteNome = $smtpUtente }

# ── Verifica immediata della connessione ──────────────────────
# Meglio fallire adesso, con il messaggio del server di posta sotto gli occhi,
# che al primo Run dentro l'applicazione.
Write-Host ""
Write-Host "  Verifico la connessione..." -NoNewline
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
  $c = New-Object System.Net.Mail.SmtpClient($smtpHost, $smtpPorta)
  $c.EnableSsl = $smtpSsl
  $c.Credentials = New-Object System.Net.NetworkCredential(
    $smtpUtente, [Runtime.InteropServices.Marshal]::PtrToStringAuto(
      [Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassword)))
  $c.Timeout = 15000
  # Un messaggio a se stessi e' la verifica piu' onesta: prova credenziali,
  # cifratura e accettazione del mittente in una volta sola.
  $m = New-Object System.Net.Mail.MailMessage
  $m.From = New-Object System.Net.Mail.MailAddress($smtpUtente, $mittenteNome)
  $m.To.Add($smtpUtente)
  $m.Subject = "RelAItion - servizio email attivo"
  $m.Body = "Questo messaggio conferma che il servizio locale di invio e' configurato correttamente."
  $c.Send($m)
  Write-Host " riuscita." -ForegroundColor Green
  Write-Host ("  Messaggio di prova inviato a " + $smtpUtente) -ForegroundColor DarkGray
} catch {
  Write-Host " FALLITA." -ForegroundColor Red
  Write-Host ("  " + $_.Exception.Message) -ForegroundColor Red
  if ($_.Exception.InnerException) {
    Write-Host ("  " + $_.Exception.InnerException.Message) -ForegroundColor DarkRed
  }
  Write-Host ""
  Write-Host "  Cause piu' frequenti:" -ForegroundColor Yellow
  Write-Host "   - Gmail: serve una password per le app, non quella dell'account"
  Write-Host "   - Microsoft 365: SMTP di base disabilitato sul tenant"
  Write-Host "   - Porta 465 con EnableSsl richiede un client che parli SSL diretto"
  Write-Host ""
  Read-Host "  Premi Invio per uscire"
  exit 1
}

# ── Server HTTP ───────────────────────────────────────────────
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Porta/")
$listener.Start()

Write-Host ""
Write-Host ("  In ascolto su http://127.0.0.1:{0}" -f $Porta) -ForegroundColor Green
Write-Host  "  Lascia questa finestra aperta mentre usi RelAItion."
Write-Host  "  Ctrl+C per fermare il servizio."
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

function Scrivi-Risposta($contesto, $codice, $oggetto) {
  $risposta = $contesto.Response
  $risposta.StatusCode = $codice
  # Solo l'applicazione locale puo' chiamare questo servizio.
  $risposta.Headers.Add("Access-Control-Allow-Origin", (Origine-Consentita $contesto))
  $risposta.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
  $risposta.Headers.Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
  $risposta.ContentType = "application/json; charset=utf-8"
  $byte = [Text.Encoding]::UTF8.GetBytes(($oggetto | ConvertTo-Json -Compress -Depth 5))
  $risposta.ContentLength64 = $byte.Length
  $risposta.OutputStream.Write($byte, 0, $byte.Length)
  $risposta.OutputStream.Close()
}

$inviate = 0

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request

    if ($req.HttpMethod -eq "OPTIONS") { Scrivi-Risposta $ctx 200 @{ ok = $true }; continue }

    if ($req.Url.AbsolutePath -eq "/stato") {
      Scrivi-Risposta $ctx 200 @{ ok=$true; servizio="relaition-mail"; mittente=$smtpUtente
                                  server=$smtpHost; inviate=$inviate }
      continue
    }

    # ── Sonda: prova di connessione VERA per conto del builder ──────────────
    # Il browser non apre socket TCP e non puo' aggirare CORS. Qui invece si
    # puo': una connessione TCP reale verso host:porta, e una richiesta HTTP
    # lato server. Serve a distinguere "il servizio non risponde" da "risponde
    # ma il browser non e' autorizzato a parlarci", che dal browser sono
    # indistinguibili e mandano a cercare il problema dove non e'.
    # Nessuna credenziale passa di qui: si verifica che la porta risponda.
    if ($req.Url.AbsolutePath -eq "/sonda") {
      $tipo = $req.QueryString["tipo"]
      $avvio = Get-Date

      if ($tipo -eq "tcp") {
        $h = $req.QueryString["host"]; $p = 0
        [void][int]::TryParse($req.QueryString["porta"], [ref]$p)
        if (-not $h -or $p -le 0) { Scrivi-Risposta $ctx 400 @{ ok=$false; errore="Servono host e porta" }; continue }
        $cli = New-Object Net.Sockets.TcpClient
        try {
          # BeginConnect + attesa: senza timeout esplicito una porta filtrata
          # da un firewall terrebbe appesa la richiesta per minuti.
          $ar = $cli.BeginConnect($h, $p, $null, $null)
          if (-not $ar.AsyncWaitHandle.WaitOne(5000, $false)) { throw "Nessuna risposta entro 5 secondi (porta chiusa o filtrata da un firewall)" }
          $cli.EndConnect($ar)
          $ms = [int]((Get-Date) - $avvio).TotalMilliseconds
          Scrivi-Risposta $ctx 200 @{ ok=$true; ms=$ms; dettaglio=("Porta {0} aperta su {1}" -f $p, $h) }
        } catch {
          Scrivi-Risposta $ctx 200 @{ ok=$false; errore=(Messaggio-Leggibile $_.Exception.Message) }
        } finally { $cli.Close() }
        continue
      }

      if ($tipo -eq "http") {
        $u = $req.QueryString["url"]
        $m = $req.QueryString["metodo"]; if (-not $m) { $m = "GET" }
        if (-not $u) { Scrivi-Risposta $ctx 400 @{ ok=$false; errore="Serve url" }; continue }
        try {
          $risp = Invoke-WebRequest -Uri $u -Method $m -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
          $ms = [int]((Get-Date) - $avvio).TotalMilliseconds
          Scrivi-Risposta $ctx 200 @{ ok=$true; stato=[int]$risp.StatusCode; ms=$ms }
        } catch {
          # Un 401/403 non e' un fallimento della sonda: il servizio c'e' e ha
          # risposto. Va riportato come tale, non come irraggiungibilita'.
          $codice = 0
          if ($_.Exception.Response) { $codice = [int]$_.Exception.Response.StatusCode }
          $ms = [int]((Get-Date) - $avvio).TotalMilliseconds
          if ($codice -gt 0) { Scrivi-Risposta $ctx 200 @{ ok=$true; stato=$codice; ms=$ms } }
          else { Scrivi-Risposta $ctx 200 @{ ok=$false; errore=(Messaggio-Leggibile $_.Exception.Message) } }
        }
        continue
      }

      Scrivi-Risposta $ctx 400 @{ ok=$false; errore="tipo deve essere tcp oppure http" }
      continue
    }

    if ($req.Url.AbsolutePath -ne "/invia" -or $req.HttpMethod -ne "POST") {
      Scrivi-Risposta $ctx 404 @{ ok=$false; errore="Percorso non gestito" }
      continue
    }

    try {
      $lettore = New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)
      $corpo = $lettore.ReadToEnd() | ConvertFrom-Json

      if ([string]::IsNullOrWhiteSpace($corpo.a)) { throw "Destinatario mancante" }

      $msg = New-Object System.Net.Mail.MailMessage
      $msg.From = New-Object System.Net.Mail.MailAddress($smtpUtente, $mittenteNome)
      foreach ($dest in ($corpo.a -split "[;,]")) {
        $d = $dest.Trim(); if ($d) { $msg.To.Add($d) }
      }
      if ($corpo.cc) {
        foreach ($dest in ($corpo.cc -split "[;,]")) {
          $d = $dest.Trim(); if ($d) { $msg.CC.Add($d) }
        }
      }
      $msg.Subject = if ($corpo.oggetto) { $corpo.oggetto } else { "(senza oggetto)" }
      $msg.Body = $corpo.corpo
      $msg.IsBodyHtml = [bool]$corpo.html

      # Allegati: arrivano come data URL, gli stessi file che il flusso ha
      # generato. Vengono ricostruiti in memoria, senza toccare il disco.
      if ($corpo.allegati) {
        foreach ($all in $corpo.allegati) {
          $base64 = ($all.dati -split ",")[-1]
          $byte = [Convert]::FromBase64String($base64)
          $flusso = New-Object IO.MemoryStream(,$byte)
          $tipo = if ($all.mime) { $all.mime } else { "application/octet-stream" }
          $msg.Attachments.Add(
            (New-Object System.Net.Mail.Attachment($flusso, $all.nome, $tipo)))
        }
      }

      $client = New-Object System.Net.Mail.SmtpClient($smtpHost, $smtpPorta)
      $client.EnableSsl = $smtpSsl
      $client.Credentials = New-Object System.Net.NetworkCredential(
        $smtpUtente, [Runtime.InteropServices.Marshal]::PtrToStringAuto(
          [Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassword)))
      $client.Timeout = 30000
      $client.Send($msg)
      $msg.Dispose()

      $inviate++
      $quando = Get-Date -Format "HH:mm:ss"
      Write-Host ("  [{0}] inviata a {1} - {2}" -f $quando, $corpo.a, $msg.Subject) -ForegroundColor Green
      Scrivi-Risposta $ctx 200 @{ ok=$true; destinatario=$corpo.a; inviate=$inviate }

    } catch {
      $err = $_.Exception.Message
      if ($_.Exception.InnerException) { $err += " - " + $_.Exception.InnerException.Message }
      Write-Host ("  [errore] " + $err) -ForegroundColor Red
      Scrivi-Risposta $ctx 500 @{ ok=$false; errore=$err }
    }
  }
} finally {
  $listener.Stop()
  Write-Host ""
  Write-Host ("  Servizio fermato. Messaggi inviati in questa sessione: {0}" -f $inviate)
}
