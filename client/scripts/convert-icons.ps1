# Script pour convertir les icônes JPG en PNG
# Necessite .NET Framework ou .NET Core

$ErrorActionPreference = "Stop"

$iconPath = "assets/images/icon.png"
$adaptiveIconPath = "assets/images/adaptative-icon.png"

Write-Host "Conversion des icones JPG en PNG..." -ForegroundColor Yellow

# Fonction pour convertir JPG en PNG en utilisant .NET
function Convert-JpgToPng {
    param(
        [string]$InputPath,
        [string]$OutputPath
    )
    
    try {
        Add-Type -AssemblyName System.Drawing
        
        $inputFullPath = (Resolve-Path $InputPath).Path
        $outputFullPath = (Resolve-Path (Split-Path $OutputPath -Parent)).Path + "\" + (Split-Path $OutputPath -Leaf)
        
        # Lire l'image JPG
        $image = [System.Drawing.Image]::FromFile($inputFullPath)
        
        # Creer un nouveau fichier PNG
        $image.Save($outputFullPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Liberer les ressources
        $image.Dispose()
        
        Write-Host "Converti: $InputPath -> $OutputPath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Erreur lors de la conversion de $InputPath : $_" -ForegroundColor Red
        return $false
    }
}

# Verifier si les fichiers existent
if (Test-Path $iconPath) {
    $tempIcon = "assets/images/icon_temp.jpg"
    Copy-Item $iconPath $tempIcon -Force
    Remove-Item $iconPath -Force
    Convert-JpgToPng -InputPath $tempIcon -OutputPath $iconPath
    Remove-Item $tempIcon -Force -ErrorAction SilentlyContinue
}

if (Test-Path $adaptiveIconPath) {
    $tempAdaptive = "assets/images/adaptative-icon_temp.jpg"
    Copy-Item $adaptiveIconPath $tempAdaptive -Force
    Remove-Item $adaptiveIconPath -Force
    Convert-JpgToPng -InputPath $tempAdaptive -OutputPath $adaptiveIconPath
    Remove-Item $tempAdaptive -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Conversion terminee!" -ForegroundColor Green
Write-Host "Vous pouvez maintenant relancer: npx expo-doctor" -ForegroundColor Cyan

