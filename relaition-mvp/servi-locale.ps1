# Server statico per lo sviluppo. L'app funziona anche aperta da file://, ma il
# service worker e le fetch verso i servizi locali richiedono un'origine http.
param([int]$Porta = 8099)
$radice = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Porta/")
$listener.Prefixes.Add("http://localhost:$Porta/")
$listener.Start()
Write-Host ("  RelAItion servito su http://localhost:{0}/   (Ctrl+C per fermare)" -f $Porta) -ForegroundColor Green

$mime = @{ ".html"="text/html; charset=utf-8"; ".js"="application/javascript; charset=utf-8"
           ".css"="text/css; charset=utf-8";   ".json"="application/json; charset=utf-8"
           ".svg"="image/svg+xml";             ".webmanifest"="application/manifest+json"
           ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"
           ".ico"="image/x-icon"; ".wasm"="application/wasm"; ".txt"="text/plain; charset=utf-8"
           ".woff"="font/woff"; ".woff2"="font/woff2"; ".map"="application/json" }

$serviti = 0
try {
  while ($listener.IsListening) {
    # Il ciclo non deve MAI morire per colpa di una richiesta. Il browser apre
    # piu' connessioni in parallelo e ne abortisce di continuo (anteprime,
    # ricaricamenti, service worker): senza questo try la prima connessione
    # chiusa a meta' faceva terminare il server, e l'app diventava
    # irraggiungibile senza spiegazione.
    $ctx = $null
    try {
      $ctx = $listener.GetContext()
      $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
      $pieno = [IO.Path]::GetFullPath((Join-Path $radice $rel))

      # Nessun accesso fuori dalla cartella servita.
      if (-not $pieno.StartsWith([IO.Path]::GetFullPath($radice))) {
        $ctx.Response.StatusCode = 403
      }
      elseif (Test-Path $pieno -PathType Leaf) {
        $byte = [IO.File]::ReadAllBytes($pieno)
        $est = [IO.Path]::GetExtension($pieno).ToLower()
        $ctx.Response.ContentType = if ($mime.ContainsKey($est)) { $mime[$est] } else { "application/octet-stream" }
        # Durante lo sviluppo un file servito dalla cache del browser fa
        # sembrare che una modifica non abbia avuto effetto.
        $ctx.Response.Headers.Add("Cache-Control", "no-store")
        $ctx.Response.ContentLength64 = $byte.Length
        $ctx.Response.OutputStream.Write($byte, 0, $byte.Length)
        $serviti++
      }
      else { $ctx.Response.StatusCode = 404 }
    }
    catch {
      Write-Host ("  richiesta non servita: {0}" -f $_.Exception.Message) -ForegroundColor DarkYellow
    }
    finally {
      if ($ctx) { try { $ctx.Response.Close() } catch {} }
    }
  }
}
finally {
  $listener.Stop()
  Write-Host ("  Server fermato. File serviti: {0}" -f $serviti)
}
