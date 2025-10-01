<#
fix-ico-from-png.ps1
Converts an existing PNG (saved with .ico name) at installer\creo-automation.ico into a proper multi-resolution .ico file.
It overwrites the same filename. Run this on Windows PowerShell (not PowerShell Core) where System.Drawing is available.
#>
param(
  [string]$Path = "creo-automation.ico"
)

if (-not (Test-Path $Path)) {
  Write-Error "File not found: $Path"
  exit 2
}

Add-Type -AssemblyName System.Drawing

try {
  $src = [System.Drawing.Image]::FromFile((Resolve-Path $Path))
  $sizes = @(16,32,48,256)
  $images = @()
  foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($src, 0, 0, $s, $s)
    $g.Dispose()
    $images += $bmp
  }

  $ms = New-Object System.IO.MemoryStream
  $bw = New-Object System.IO.BinaryWriter($ms)

  # ICONDIR header
  $bw.Write([Int16]0)   # reserved
  $bw.Write([Int16]1)   # image type (1 = icon)
  $bw.Write([Int16]($images.Count))

  $imageDataList = @()
  $offset = 6 + (16 * $images.Count)

  foreach ($img in $images) {
    $imgMs = New-Object System.IO.MemoryStream
    $img.Save($imgMs, [System.Drawing.Imaging.ImageFormat]::Png)
    $imgBytes = $imgMs.ToArray()
    $imageDataList += $imgBytes

    $width = if ($img.Width -ge 256) { 0 } else { [byte]$img.Width }
    $height = if ($img.Height -ge 256) { 0 } else { [byte]$img.Height }
    $palette = 0
    $colorPlanes = 1
    $bitsPerPixel = 32
    $bytesInRes = $imgBytes.Length

    $bw.Write([byte]$width)
    $bw.Write([byte]$height)
    $bw.Write([byte]$palette)
    $bw.Write([byte]$colorPlanes)
    $bw.Write([Int16]$bitsPerPixel)
    $bw.Write([Int32]$bytesInRes)
    $bw.Write([Int32]$offset)

    $offset += $bytesInRes
    $imgMs.Dispose()
  }

  foreach ($b in $imageDataList) { $bw.Write($b) }

  $bw.Flush()
  $bytes = $ms.ToArray()
  $tmp = [System.IO.Path]::GetTempFileName() + '.ico'
  [System.IO.File]::WriteAllBytes($tmp, $bytes)
  # Replace atomically when possible
  try {
    Move-Item -Path $tmp -Destination $Path -Force
    Write-Output "Wrote ICO: $Path"
  } catch {
    Write-Output "Wrote temp ICO: $tmp (failed to move over $Path): $_"
  }
  exit 0
} catch {
  Write-Error "Failed to convert PNG to ICO: $_"
  exit 1
} finally {
  foreach ($i in $images) { $i.Dispose() }
  if ($src) { $src.Dispose() }
  if ($bw) { $bw.Dispose() }
  if ($ms) { $ms.Dispose() }
}
