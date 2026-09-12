# Prepara i file del marchio a partire dagli asset ufficiali:
#   RelAItion_logo_light-mode.png  -> logo-light.png (copia) e mark.png (ritaglio del segno)
#   RelAItion_logo_dark-mode.png   -> logo-dark.png  (stesso file, con lo sfondo blu notte reso trasparente)
#   RelAItion_app-icon.png         -> icon-192.png, icon-512.png
# Si lancia con: powershell -ExecutionPolicy Bypass -File brand\prepara-loghi.ps1
$p = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -AssemblyName System.Drawing

# ── logo per sfondo chiaro: e' gia' trasparente, si copia col nome usato dall'app
Copy-Item "$p\RelAItion_logo_light-mode.png" "$p\logo-light.png" -Force

# ── segno da solo: ritaglio dal logo chiaro, cercando i pixel vivi (blu/viola
#    luminosi) nella parte alta, dove non c'e' il claim
$src = [System.Drawing.Bitmap]::FromFile("$p\RelAItion_logo_light-mode.png")
$w = $src.Width; $h = $src.Height
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0
$limY = [int]($h * 0.78)
for ($y = 0; $y -lt $limY; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    $c = $src.GetPixel($x, $y)
    if ($c.A -lt 60) { continue }
    $mx = [Math]::Max($c.R, [Math]::Max($c.G, $c.B))
    $mn = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
    $sat = 0; if ($mx -gt 0) { $sat = ($mx - $mn) / [double]$mx }
    $lum = (0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B) / 255.0
    if ($sat -gt 0.5 -and $c.B -gt 150 -and $lum -gt 0.28) {
      if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
Write-Output "segno: $minX,$minY - $maxX,$maxY"
$m = 6
$rx = [Math]::Max(0, $minX - $m); $ry = [Math]::Max(0, $minY - $m)
$rw = [Math]::Min($w - $rx, $maxX - $minX + 2 * $m); $rh = [Math]::Min($h - $ry, $maxY - $minY + 2 * $m)
$rect = New-Object System.Drawing.Rectangle $rx, $ry, $rw, $rh
$mark = $src.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$mark.Save("$p\mark.png", [System.Drawing.Imaging.ImageFormat]::Png); $mark.Dispose()
$src.Dispose()

# ── logo per sfondo scuro: l'ufficiale ha lo sfondo blu notte (15,23,76)
#    dipinto dentro. Si rende trasparente per distanza da quel colore, con una
#    sfumatura sui bordi cosi' le lettere non restano seghettate.
$d = [System.Drawing.Bitmap]::FromFile("$p\RelAItion_logo_dark-mode.png")
$w = $d.Width; $h = $d.Height
$out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$bgR = 15; $bgG = 23; $bgB = 76
for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    $c = $d.GetPixel($x, $y)
    $dist = [Math]::Sqrt(($c.R - $bgR) * ($c.R - $bgR) + ($c.G - $bgG) * ($c.G - $bgG) + ($c.B - $bgB) * ($c.B - $bgB))
    # entro 18 e' sfondo; oltre 70 e' soggetto; in mezzo, alfa proporzionale
    if ($dist -le 18) { $a = 0 }
    elseif ($dist -ge 70) { $a = 255 }
    else { $a = [int](255 * (($dist - 18) / 52.0)) }
    if ($a -eq 0) { $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0)) }
    else {
      # nei pixel semitrasparenti si toglie la quota di sfondo mescolata, per
      # non lasciare un alone blu attorno alle lettere bianche
      $k = $a / 255.0
      $r = [int][Math]::Min(255, [Math]::Max(0, ($c.R - $bgR * (1 - $k)) / $k))
      $g = [int][Math]::Min(255, [Math]::Max(0, ($c.G - $bgG * (1 - $k)) / $k))
      $bb = [int][Math]::Min(255, [Math]::Max(0, ($c.B - $bgB * (1 - $k)) / $k))
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $r, $g, $bb))
    }
  }
}
$out.Save("$p\logo-dark.png", [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose(); $d.Dispose()

# ── icone dall'app icon ufficiale (210 px): 192 in riduzione, 512 in ingrandimento
$ic = [System.Drawing.Bitmap]::FromFile("$p\RelAItion_app-icon.png")
foreach ($s in 192, 512) {
  $b = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($ic, 0, 0, $s, $s); $g.Dispose()
  $b.Save("$p\icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
}
$ic.Dispose()
Get-ChildItem "$p\*.png" | Select-Object Name, Length | Format-Table -AutoSize
