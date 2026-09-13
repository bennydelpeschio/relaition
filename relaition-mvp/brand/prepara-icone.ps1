# Icone dell'app dall'asset ufficiale RelAItion_app-icon.png.
# L'asset ha un margine trasparente attorno al quadrato arrotondato: se lo si
# usa cosi' com'e', Windows e Android lo riscalano a misura CON il margine, e
# l'icona risulta piu' piccola delle altre. Qui si ritaglia al contenuto e poi
# si producono le due forme del manifest.
$p = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -AssemblyName System.Drawing
$ic = [System.Drawing.Bitmap]::FromFile("$p\RelAItion_app-icon.png")
$w = $ic.Width; $h = $ic.Height
$minX = $w; $minY = $h; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $h; $y++) { for ($x = 0; $x -lt $w; $x++) {
  if ($ic.GetPixel($x, $y).A -gt 30) {
    if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
    if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
  }
} }
Write-Output "contenuto: $minX,$minY - $maxX,$maxY su ${w}x${h}"
$rect = New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
$tr = $ic.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$tr.Save("$p\app-icon-ritagliata.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bg = $tr.GetPixel([int]($tr.Width * 0.12), [int]($tr.Height * 0.5))
Write-Output "colore di fondo: R$($bg.R) G$($bg.G) B$($bg.B)"
foreach ($s in 192, 512) {
  # `any`: il quadrato arrotondato a tutto campo, angoli trasparenti
  $b = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($tr, 0, 0, $s, $s); $g.Dispose()
  $b.Save("$p\icon-$s.png", [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
  # `maskable`: sfondo pieno del suo stesso blu e un margine dell'8%, perche'
  # Android ritaglia la forma e tiene solo il centro
  $m = New-Object System.Drawing.Bitmap $s, $s, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($m)
  $g.Clear([System.Drawing.Color]::FromArgb(255, $bg.R, $bg.G, $bg.B))
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
  $in = [int]($s * 0.08)
  $g.DrawImage($tr, $in, $in, $s - 2 * $in, $s - 2 * $in); $g.Dispose()
  $m.Save("$p\icon-$s-maskable.png", [System.Drawing.Imaging.ImageFormat]::Png); $m.Dispose()
}
$tr.Dispose(); $ic.Dispose()
Get-ChildItem "$p\icon-*.png" | Select-Object Name, Length | Format-Table -AutoSize
