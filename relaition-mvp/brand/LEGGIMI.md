# Identità visiva

Gli asset ufficiali sono i tre file `RelAItion_*.png`. Da quelli si ricavano i
file che l'applicazione usa davvero, con lo script `prepara-logo-scuro.ps1`
(`powershell -ExecutionPolicy Bypass -File brand\prepara-logo-scuro.ps1`).

| File | Da dove viene | Dove si usa |
|---|---|---|
| `RelAItion_logo_light-mode.png` | ufficiale, trasparente | riferimento; copiato in `logo-light.png` per usi su sfondo chiaro (documento, slide) |
| `RelAItion_logo_dark-mode.png` | ufficiale, ma con lo sfondo blu dipinto dentro | solo riferimento: non si usa nell'app |
| `logo-dark.png` | ricavato dal logo chiaro: lettere rese bianche, foro delle lettere «AI» riempito di bianco, **trasparente** | schermata di accesso, schermata di avvio, splash della demo |
| `mark.png` | ritaglio del segno da `logo-dark.png` | menu laterale |
| `RelAItion_app-icon.png` | ufficiale (210 px) | favicon, `apple-touch-icon`, e base delle icone sotto |
| `icon-192.png`, `icon-512.png` | riscalatura dell'app icon | manifest, `purpose: any` |
| `icon-192-maskable.png`, `icon-512-maskable.png` | app icon su quadrato pieno del suo stesso blu, con margine di sicurezza | manifest, `purpose: maskable` (Android ritaglia la forma) |
| `icon-ricostruito.svg`, `icon-precedente-fulmine.svg`, `mark.svg` | le versioni ricostruite a mano prima degli asset ufficiali | nessun uso, tenute per confronto |

Nota sul logo chiaro ufficiale: le lettere «AI» dentro il segno sono un **foro
trasparente**, non pixel bianchi. Su fondo chiaro si leggono bianche; su fondo
scuro sparirebbero. Per questo il logo scuro le riempie di bianco.

L'app icon ufficiale è 210 px: la 512 è un ingrandimento. Se arriva una
versione a 512 px o più, basta sostituire il file e rilanciare lo script.
