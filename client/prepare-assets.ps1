# Créez un fichier prepare-assets.ps1 dans client/

# prepare-assets.ps1
Write-Host "Préparation des assets pour Android..." -ForegroundColor Green

# Créer les dossiers de ressources si nécessaire
$resDirs = @(
    "android/app/src/main/res/drawable-mdpi",
    "android/app/src/main/res/drawable-hdpi",
    "android/app/src/main/res/drawable-xhdpi",
    "android/app/src/main/res/drawable-xxhdpi",
    "android/app/src/main/res/drawable-xxxhdpi"
)

foreach ($dir in $resDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Créé: $dir" -ForegroundColor Yellow
    }
}

# Copier les images WebP (ajustez le chemin source selon votre structure)
$sourceImages = @(
    "assets/images/paypal.webp",
    "assets/images/mobilMoney.webp",
    "assets/images/visa.webp",
    "assets/images/orange.webp",
    "assets/images/assets_images_logo.webp"
)

foreach ($img in $sourceImages) {
    if (Test-Path $img) {
        # Copier dans tous les dossiers de densité (ou choisissez le bon)
        foreach ($dir in $resDirs) {
            Copy-Item -Path $img -Destination "$dir/" -Force
            Write-Host "Copié: $img -> $dir" -ForegroundColor Green
        }
    } else {
        Write-Host "Image non trouvée: $img" -ForegroundColor Red
    }
}

Write-Host "✅ Assets préparés avec succès!" -ForegroundColor Green