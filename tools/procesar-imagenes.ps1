# =====================================================================
#  SEGURIDAD PRL - Procesamiento de imagenes para la web
#  - Recorta logos (marca / wordmark) y genera version para fondo oscuro
#  - Elimina marcas de agua de terceros en fotos (recorte)
#  - Redimensiona y comprime JPG (calidad 82) + miniaturas 600px
#  Uso:  powershell -ExecutionPolicy Bypass -File tools\procesar-imagenes.ps1
# =====================================================================
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$out  = Join-Path $root 'sitio\assets\img'
New-Item -ItemType Directory -Force $out | Out-Null

$jpgCodec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
function Save-Jpg($bmp, $path, $q = 82) {
  $p = New-Object Drawing.Imaging.EncoderParameters 1
  $p.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]$q)
  $bmp.Save($path, $jpgCodec, $p)
}
function Resize($src, [int]$maxW) {
  if ($src.Width -le $maxW) { $w = $src.Width; $h = $src.Height } else { $w = $maxW; $h = [int]($src.Height * $maxW / $src.Width) }
  $dst = New-Object Drawing.Bitmap $w, $h
  $g = [Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
  $g.DrawImage($src, 0, 0, $w, $h); $g.Dispose()
  return $dst
}
function Crop($src, [int]$x, [int]$y, [int]$w, [int]$h) {
  $r = New-Object Drawing.Rectangle $x, $y, $w, $h
  return $src.Clone($r, $src.PixelFormat)
}

# ---------------- FOTOS ----------------
# nombre origen | nombre destino | recorte superior (px) para quitar marca de agua
$fotos = @(
  @{ src = 'haciendo inspecciones.jpg'; dst = 'inspeccion-planta';   top = 270 },  # marca "Insight Staffing Group"
  @{ src = 'instructor en fabrica.jpg'; dst = 'capacitacion-planta'; top = 150 },  # marca "Insight Staffing Group"
  @{ src = 'mineria.jpg';               dst = 'mineria';             top = 0 },
  @{ src = 'obra civil.jpg';            dst = 'obra-civil';          top = 0 },
  @{ src = 'obra civil 2.jpg';          dst = 'obra-altura';         top = 0 }
)
foreach ($f in $fotos) {
  $img = [Drawing.Bitmap]::FromFile((Join-Path $root "imagenes\$($f.src)"))
  $bmp = New-Object Drawing.Bitmap $img; $img.Dispose()
  if ($f.top -gt 0) { $c = Crop $bmp 0 $f.top $bmp.Width ($bmp.Height - $f.top); $bmp.Dispose(); $bmp = $c }
  $big = Resize $bmp 1200; Save-Jpg $big (Join-Path $out "$($f.dst).jpg"); $big.Dispose()
  $sm  = Resize $bmp 600;  Save-Jpg $sm  (Join-Path $out "$($f.dst)-600.jpg") 78; $sm.Dispose()
  $bmp.Dispose()
  Write-Output "foto ok: $($f.dst)"
}

# ---------------- LOGOS ----------------
$logo = New-Object Drawing.Bitmap (Join-Path $root 'Logo SEGURIDADPRL sin fondo.png')
$W = $logo.Width; $H = $logo.Height
# filas con contenido opaco
$rows = New-Object bool[] $H
for ($y = 0; $y -lt $H; $y += 1) { for ($x = 0; $x -lt $W; $x += 4) { if ($logo.GetPixel($x, $y).A -gt 40) { $rows[$y] = $true; break } } }
# bloques verticales (escudo / texto / tagline)
$blocks = @(); $start = -1
for ($y = 0; $y -lt $H; $y++) {
  if ($rows[$y] -and $start -lt 0) { $start = $y }
  if (-not $rows[$y] -and $start -ge 0) { $blocks += ,@($start, ($y - 1)); $start = -1 }
}
Write-Output ("bloques: " + (($blocks | ForEach-Object { "$($_[0])-$($_[1])" }) -join ', '))
function ColBounds($bmp, $y0, $y1) {
  $minX = $bmp.Width; $maxX = 0
  for ($y = $y0; $y -le $y1; $y += 2) { for ($x = 0; $x -lt $bmp.Width; $x += 1) { if ($bmp.GetPixel($x, $y).A -gt 40) { if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x } } } }
  return @($minX, $maxX)
}
$shield = $blocks[0]; $textTop = $blocks[1][0]; $textBot = $blocks[$blocks.Count - 1][1]
$pad = 8
# Marca (escudo)
$cb = ColBounds $logo $shield[0] $shield[1]
$mark = Crop $logo ($cb[0] - $pad) ($shield[0] - $pad) ($cb[1] - $cb[0] + 2 * $pad) ($shield[1] - $shield[0] + 2 * $pad)
# Wordmark (SEGURIDADPRL + tagline)
$tb = ColBounds $logo $textTop $textBot
$word = Crop $logo ($tb[0] - $pad) ($textTop - $pad) ($tb[1] - $tb[0] + 2 * $pad) ($textBot - $textTop + 2 * $pad)
# Logo completo
$fb = ColBounds $logo $shield[0] $textBot
$full = Crop $logo ($fb[0] - $pad) ($shield[0] - $pad) ($fb[1] - $fb[0] + 2 * $pad) ($textBot - $shield[0] + 2 * $pad)

function To-Light($bmp) {
  # Recolorea grises oscuros (#37434c / casco) a blanco para fondos oscuros
  $c = New-Object Drawing.Bitmap $bmp
  for ($y = 0; $y -lt $c.Height; $y++) { for ($x = 0; $x -lt $c.Width; $x++) {
    $p = $c.GetPixel($x, $y)
    if ($p.A -gt 0) {
      $mx = [Math]::Max($p.R, [Math]::Max($p.G, $p.B)); $mn = [Math]::Min($p.R, [Math]::Min($p.G, $p.B))
      if (($mx - $mn) -lt 40 -and $mx -lt 140) { $c.SetPixel($x, $y, [Drawing.Color]::FromArgb($p.A, 255, 255, 255)) }
    } } }
  return $c
}
function Save-Png($bmp, $maxW, $name) { $r = Resize $bmp $maxW; $r.Save((Join-Path $out $name), [Drawing.Imaging.ImageFormat]::Png); $r.Dispose(); Write-Output "logo ok: $name" }

$markS = Resize $mark 160;  Save-Png $markS 160 'logo-marca.png'
$markL = To-Light $markS;   Save-Png $markL 160 'logo-marca-claro.png'
Save-Png $mark 64 'favicon.png'
Save-Png $mark 180 'apple-touch-icon.png'
$wordS = Resize $word 520;  Save-Png $wordS 520 'logo-texto.png'
$wordL = To-Light $wordS;   Save-Png $wordL 520 'logo-texto-claro.png'
$fullS = Resize $full 600;  Save-Png $fullS 600 'logo-completo.png'
$fullL = To-Light $fullS;   Save-Png $fullL 600 'logo-completo-claro.png'
# Imagen para compartir en redes (Open Graph 1200x630) sobre fondo corporativo
$og = New-Object Drawing.Bitmap 1200, 630
$g = [Drawing.Graphics]::FromImage($og); $g.SmoothingMode = 'HighQuality'; $g.InterpolationMode = 'HighQualityBicubic'
$g.Clear([Drawing.ColorTranslator]::FromHtml('#1b232a'))
$ratio = 420 / $fullL.Height; $g.DrawImage($fullL, [int]((1200 - $fullL.Width * $ratio) / 2), 105, [int]($fullL.Width * $ratio), 420)
$g.Dispose(); Save-Jpg $og (Join-Path $out 'og-image.jpg') 88; $og.Dispose()
$logo.Dispose()
Write-Output 'LISTO'
