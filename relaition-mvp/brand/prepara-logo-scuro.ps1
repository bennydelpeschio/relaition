$p = "C:\Users\bdelpeschio\OneDrive - BUSINESS INTEGRATION PARTNERS SPA\Desktop\MASTER AI ROME BUSINESS SCHOOL\CAPSTONE PROJECT\POC MARKETPLACE\poc marketplace luglio 2026\relaition-mvp\brand"
Add-Type -AssemblyName System.Drawing
# logo per sfondo scuro, ricavato dal logo chiaro (che e' pulito e trasparente):
# le lettere blu notte diventano bianche, il segno e il claim restano com'e'.
$src = [System.Drawing.Bitmap]::FromFile("$p\RelAItion_logo_light-mode.png")
$w = $src.Width; $h = $src.Height
$out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
# riquadro del segno (calcolato prima): dentro non si tocca niente
$mx0 = 349; $my0 = 29; $mx1 = 621; $my1 = 278
for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    $c = $src.GetPixel($x, $y)
    if ($c.A -eq 0) { $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0)); continue }
    $dentro = ($x -ge $mx0 -and $x -le $mx1 -and $y -ge $my0 -and $y -le $my1)
    # dentro il segno: solo le lettere «AI», blu notte, diventano bianche (come
    # nella versione ufficiale per sfondo scuro); i petali restano.
    # dentro il segno non si tocca niente: le lettere «AI» sono un foro e si
    # riempiono dopo, i petali restano come sono.
    if ($dentro) { $out.SetPixel($x, $y, $c); continue }
    $mx = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
    $mn = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
    $sat = 0; if ($mx -gt 0) { $sat = ($mx - $mn) / [double]$mx }
    $lum = (0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B) / 255.0
    # lettere (blu notte) e loro bordi sfumati verso l'alone grigio: bianco.
    # Il claim e' colorato e saturo: resta.
    if (($lum -lt 0.3 -and $c.R -lt 90 -and $c.G -lt 90) -or ($sat -lt 0.5 -and $lum -lt 0.9 -and $y -lt ($h * 0.8))) {
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, 255, 255, 255))
    } else { $out.SetPixel($x, $y, $c) }
  }
}
$out.Save("$p\logo-dark.png", [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose(); $src.Dispose()

# ── Le lettere «AI» dentro il segno sono un FORO trasparente nell'asset
#    ufficiale: su sfondo chiaro si leggono bianche, su sfondo scuro
#    sparirebbero. Per il logo scuro il foro si riempie di bianco, come nella
#    versione ufficiale per sfondo scuro. Le lettere stanno tutte dentro il
#    segno, quindi in quel rettangolo ogni pixel trasparente e' foro.
$tmpImg = [System.Drawing.Bitmap]::FromFile("$p\logo-dark.png"); $img = New-Object System.Drawing.Bitmap $tmpImg; $tmpImg.Dispose()
$ax0 = 425; $ay0 = 118; $ax1 = 565; $ay1 = 240
$n = 0
for ($y = $ay0; $y -le $ay1; $y++) {
  for ($x = $ax0; $x -le $ax1; $x++) {
    $c = $img.GetPixel($x, $y)
    if ($c.A -eq 255) { continue }
    if ($c.A -le 40) { $img.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255)); $n++ }
    else {
      # bordo del foro: si fonde sul bianco, cosi' non resta un orlo scuro
      $k = $c.A / 255.0
      $r = [int]($c.R * $k + 255 * (1 - $k)); $g = [int]($c.G * $k + 255 * (1 - $k)); $bb = [int]($c.B * $k + 255 * (1 - $k))
      $img.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $r, $g, $bb))
    }
  }
}
$img.Save("$p\logo-dark.png", [System.Drawing.Imaging.ImageFormat]::Png); $img.Dispose()
"foro riempito: $n pixel"

# ── Segno da solo, ritagliato dal logo scuro (cosi' le lettere «AI» sono
#    bianche: il segno si usa sul menu, che e' scuro in entrambi i temi).
$tmp2 = [System.Drawing.Bitmap]::FromFile("$p\logo-dark.png"); $ld = New-Object System.Drawing.Bitmap $tmp2; $tmp2.Dispose()
$rect = New-Object System.Drawing.Rectangle 349, 29, 273, 250
$mk = $ld.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$mk.Save("$p\mark.png", [System.Drawing.Imaging.ImageFormat]::Png); $mk.Dispose(); $ld.Dispose()
"segno: mark.png"

# ── Rifinitura: via l'alone e i margini.
#    Attorno alle lettere il logo chiaro ha un alone grigio semitrasparente
#    (antialiasing verso il bianco) che, reso bianco, su fondo scuro si vedeva
#    come una sfumatura sporca: sotto una certa opacita' si azzera. Poi si
#    ritaglia al contenuto, cosi' l'immagine si centra davvero e non porta
#    con se' un margine trasparente asimmetrico.
$t3 = [System.Drawing.Bitmap]::FromFile("$p\logo-dark.png"); $ld2 = New-Object System.Drawing.Bitmap $t3; $t3.Dispose()
$W = $ld2.Width; $H = $ld2.Height
$bx0 = $W; $by0 = $H; $bx1 = 0; $by1 = 0
for ($y = 0; $y -lt $H; $y++) { for ($x = 0; $x -lt $W; $x++) {
  $c = $ld2.GetPixel($x, $y)
  if ($c.A -eq 0) { continue }
  $dentroSegno = ($x -ge 349 -and $x -le 621 -and $y -ge 29 -and $y -le 278)
  if (-not $dentroSegno -and $c.A -lt 70) { $ld2.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0)); continue }
  if ($c.A -gt 10) {
    if ($x -lt $bx0) { $bx0 = $x }; if ($x -gt $bx1) { $bx1 = $x }
    if ($y -lt $by0) { $by0 = $y }; if ($y -gt $by1) { $by1 = $y }
  }
} }
$mg = 4
$r2 = New-Object System.Drawing.Rectangle ([Math]::Max(0, $bx0 - $mg)), ([Math]::Max(0, $by0 - $mg)), ([Math]::Min($W, $bx1 + $mg) - [Math]::Max(0, $bx0 - $mg)), ([Math]::Min($H, $by1 + $mg) - [Math]::Max(0, $by0 - $mg))
$fin = $ld2.Clone($r2, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$fin.Save("$p\logo-dark.png", [System.Drawing.Imaging.ImageFormat]::Png); $fin.Dispose(); $ld2.Dispose()
"ritaglio logo scuro: $($r2.Width)x$($r2.Height)"
