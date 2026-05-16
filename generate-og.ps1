Add-Type -AssemblyName System.Drawing

$W = 1200
$H = 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Palette
$cFond      = [System.Drawing.Color]::FromArgb(244,246,251)
$cSurface   = [System.Drawing.Color]::FromArgb(255,255,255)
$cTexte     = [System.Drawing.Color]::FromArgb(30,41,59)
$cTexteDoux = [System.Drawing.Color]::FromArgb(100,116,139)
$cPrimaire  = [System.Drawing.Color]::FromArgb(99,102,241)
$cRevenu    = [System.Drawing.Color]::FromArgb(16,185,129)
$cDepense   = [System.Drawing.Color]::FromArgb(244,63,94)

# Special chars (script stays ASCII-safe)
$EUR   = [char]0x20AC  # euro
$E_ACC = [char]0xE9    # e accent aigu
$E_MAJ = [char]0xC9    # E accent aigu
$MINUS = [char]0x2212  # true minus sign

# Background
$g.Clear($cFond)

# Helper : rounded rectangle path
function RoundPath($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  if ($r -le 0) {
    $p.AddRectangle((New-Object System.Drawing.RectangleF($x, $y, $w, $h)))
  } else {
    $p.AddArc($x,                $y,                $r*2, $r*2, 180, 90)
    $p.AddArc($x + $w - $r*2,    $y,                $r*2, $r*2, 270, 90)
    $p.AddArc($x + $w - $r*2,    $y + $h - $r*2,    $r*2, $r*2,   0, 90)
    $p.AddArc($x,                $y + $h - $r*2,    $r*2, $r*2,  90, 90)
    $p.CloseFigure()
  }
  return $p
}

# === RIGHT : three mini dashboard cards ===
$cardX = 740
$cardW = 380
$cardH = 142
$cardGap = 22
$cardYStart = 60

$cards = @(
  @{ y = $cardYStart;                        accent = $cPrimaire; label = 'SOLDE ACTUEL';                value = "1 247,50 $EUR";       valueColor = $cPrimaire },
  @{ y = $cardYStart + ($cardH + $cardGap);  accent = $cRevenu;   label = 'REVENUS';                     value = "+ 2 100,00 $EUR";     valueColor = $cRevenu },
  @{ y = $cardYStart + ($cardH + $cardGap)*2; accent = $cDepense; label = "D${E_MAJ}PENSES";             value = "$MINUS 852,50 $EUR";  valueColor = $cDepense }
)

foreach ($c in $cards) {
  # Soft layered shadow
  for ($i = 6; $i -ge 1; $i--) {
    $alpha = [int](22 - ($i * 2.5))
    if ($alpha -lt 4) { $alpha = 4 }
    $sp = RoundPath ($cardX) ($c.y + $i) $cardW $cardH 18
    $sb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($alpha, 30, 41, 59))
    $g.FillPath($sb, $sp)
    $sb.Dispose(); $sp.Dispose()
  }

  # Card body
  $cp = RoundPath $cardX $c.y $cardW $cardH 18
  $cb = New-Object System.Drawing.SolidBrush $cSurface
  $g.FillPath($cb, $cp)
  $cb.Dispose()

  # Left accent stripe (clipped to card path so corners stay rounded)
  $g.SetClip($cp)
  $sBr = New-Object System.Drawing.SolidBrush $c.accent
  $g.FillRectangle($sBr, $cardX, $c.y, 6, $cardH)
  $sBr.Dispose()
  $g.ResetClip()
  $cp.Dispose()

  # Label
  $lf = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $lb = New-Object System.Drawing.SolidBrush $cTexteDoux
  $g.DrawString($c.label, $lf, $lb, [single]($cardX + 32), [single]($c.y + 28))
  $lf.Dispose(); $lb.Dispose()

  # Value
  $vf = New-Object System.Drawing.Font('Segoe UI', 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $vb = New-Object System.Drawing.SolidBrush $c.valueColor
  $g.DrawString($c.value, $vf, $vb, [single]($cardX + 30), [single]($c.y + 60))
  $vf.Dispose(); $vb.Dispose()
}

# === LEFT : typography block ===
$leftX = 80

# Kicker : small indigo dot + uppercase label
$dotBrush = New-Object System.Drawing.SolidBrush $cPrimaire
$g.FillEllipse($dotBrush, $leftX, 134, 10, 10)
$dotBrush.Dispose()

$kF = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$kB = New-Object System.Drawing.SolidBrush $cTexteDoux
$g.DrawString('BUDGET PERSONNEL', $kF, $kB, [single]($leftX + 22), [single]128)
$kF.Dispose(); $kB.Dispose()

# Title
$tF = New-Object System.Drawing.Font('Segoe UI', 92, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$tB = New-Object System.Drawing.SolidBrush $cPrimaire
$g.DrawString('Mon Budget', $tF, $tB, [single]($leftX - 5), [single]180)
$tF.Dispose(); $tB.Dispose()

# Tagline (two lines, second slightly muted)
$gF = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$gB = New-Object System.Drawing.SolidBrush $cTexte
$g.DrawString("G${E_ACC}rez vos d${E_ACC}penses et revenus", $gF, $gB, [single]$leftX, [single]320)
$gF.Dispose(); $gB.Dispose()

$gF2 = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$gB2 = New-Object System.Drawing.SolidBrush $cTexteDoux
$g.DrawString("en toute simplicit${E_ACC}.", $gF2, $gB2, [single]$leftX, [single]362)
$gF2.Dispose(); $gB2.Dispose()

# Bottom chips : color dot + label
$chipY = 490
$chipSpacing = 175
$chips = @(
  @{ x = $leftX;                       color = $cPrimaire; label = 'Solde' },
  @{ x = $leftX + $chipSpacing;        color = $cRevenu;   label = 'Revenus' },
  @{ x = $leftX + $chipSpacing * 2;    color = $cDepense;  label = "D${E_ACC}penses" }
)
foreach ($chip in $chips) {
  $cb = New-Object System.Drawing.SolidBrush $chip.color
  $g.FillEllipse($cb, $chip.x, $chipY, 14, 14)
  $cb.Dispose()
  $cF = New-Object System.Drawing.Font('Segoe UI', 19, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $cBr = New-Object System.Drawing.SolidBrush $cTexte
  $g.DrawString($chip.label, $cF, $cBr, [single]($chip.x + 24), [single]($chipY - 5))
  $cF.Dispose(); $cBr.Dispose()
}

# Footer URL (subtle, bottom-left)
$uF = New-Object System.Drawing.Font('Segoe UI', 15, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$uB = New-Object System.Drawing.SolidBrush $cTexteDoux
$g.DrawString('dazhko.github.io/mon-budget', $uF, $uB, [single]$leftX, [single]568)
$uF.Dispose(); $uB.Dispose()

# Thin vertical separator (very subtle)
$sepPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(40, 30, 41, 59)), 1
$g.DrawLine($sepPen, 700, 90, 700, 540)
$sepPen.Dispose()

# Save PNG
$out = 'C:\Users\Dazko\Desktop\mon-budget\og-image.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()

Write-Output "Saved: $out"
