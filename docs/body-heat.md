# Froid, chaleur et tenues

La **chaleur** de la tenue de Kaldor (tenue plus casque, de 0 à 3, voir
[les tenues et casques](kaldor-outfits.md)) est comparée à chaque instant à la
**température ressentie** là où il se trouve, à l'heure qu'il est. Trop froid
pour sa tenue, il grelotte, puis le froid lui ronge la santé jusqu'à le tuer.
Trop couvert dans la chaleur, il ne perd jamais de santé, mais sa faim se creuse
plus vite. Le code est dans `scripts/body-heat.js`.

## Plage de confort de chaque chaleur

| Chaleur | Tenues | Protège du froid jusqu'à | Trop chaude au-delà de |
| --- | --- | --- | --- |
| 0 · Aucune | Pagne noué, Voiles du nomade, Harnais de l'arène, Robe du Serpent, Tenue du corsaire | 8 °C | jamais |
| 1 · Légère | Brigandine du mercenaire, Cuir du traqueur, Cotte de mailles | −4 °C | 30 °C |
| 2 · Bonne | Peau de l'ours, Kaftan des steppes | −14 °C | 22 °C |
| 3 · Grand froid | Pelisse du Grand Froid, ou une tenue de chaleur 2 avec le Casque fourré ou le Heaume fermé | −30 °C | 14 °C |

## Température ressentie

- La base est la **température réelle** du biome : saison de l'année de 96
  jours, heure du jour, altitude, et mélange des biomes aux frontières (la même
  valeur que celle affichée à droite du nom de lieu).
- Le **vent** refroidit seulement par temps froid (environ −6 °C au plus
  par grand vent sous 0 °C). La **pluie** mouille d'autant plus qu'il fait froid, la
  **neige** et surtout le **blizzard** refroidissent encore.
- Dans un **village** ou une ville, les maisons coupent une bonne part du vent
  et du blizzard et les foyers gagnent 2 °C au froid.
- Près du **feu d'une halte ou d'une auberge** (la tente de repos ou l'auberge
  du lieu), pendant le **sommeil**, le **repos** au relais et les **haltes**
  d'un voyage, Kaldor est au chaud : au moins 18 °C ressentis. Près du feu, il
  ouvre son manteau : une tenue chaude n'y est jamais trop chaude.

## Le froid

- Jusqu'à 2 °C sous la plage de sa tenue, Kaldor **grelotte** sans perdre de
  santé.
- Au-delà, il perd **un demi-cœur (1 PV)** toutes les `120 / (écart − 2)`
  minutes de jeu. Une minute de jeu dure deux tiers de seconde.
- À 0 PV, il **meurt de froid** : l'écran de mort l'indique (« Mort de
  froid ») et coûte une tête comme une défaite. Avar le ramène réchauffé :
  pendant 90 minutes de jeu (une minute réelle) le froid ne le blesse pas, le
  temps de changer de tenue ou de rejoindre un feu.
- En **voyage** organisé (cheval, charrette, bateau), le froid ronge la santé
  mais ne tue pas : Kaldor arrive au pire avec 1 PV.

| Exemple (hiver, en pleine nature) | Ressenti | Effet |
| --- | --- | --- |
| Pagne à Roche-Blanche | −25 °C | mort en 25 s environ |
| Brigandine à Veille-Boréale | −16 °C | mort en 80 s environ |
| Pagne à Clairval, à l'aube | −3 °C | mort en 90 s environ |
| Brigandine à Clairval, à l'aube | −3 °C | à l'aise |
| Peau de l'ours à Val-des-Neiges | −16 °C | perte très lente, 2 PV par jour |
| Pelisse à Roche-Blanche | −25 °C | aucune perte |

## La chaleur

- Une tenue trop chaude ne coûte **jamais de santé**.
- La faim se creuse de **10 % de plus par degré** au-dessus de la plage de la
  tenue, au plus quatre fois plus vite. Les tenues de chaleur 0 ne sont jamais
  trop chaudes.
- La faim vide reste la seule cause de perte de santé, comme avant (plancher
  de 1 PV) : les repas automatiques consomment donc plus de rations.

| Exemple (été, en plein jour) | Ressenti | Faim |
| --- | --- | --- |
| Pelisse à l'Oasis-du-Safran | 39 °C | ×3,5 |
| Brigandine à l'Oasis-du-Safran | 39 °C | ×1,9 |
| Pelisse à Clairval | 27 °C | ×2,3 |
| Kaftan des steppes à Clairval | 27 °C | ×1,5 |
| Pagne ou Voiles du nomade au désert | 39 °C | normale |

## Ce que voit le joueur

- **HUD** : la température du lieu prend la couleur de ce que ressent Kaldor,
  avec un flocon quand il a froid (blanc à chaque demi-cœur perdu) et un soleil
  quand sa tenue est trop chaude. La jauge de faim devient orange, avec une
  goutte de sueur, quand elle se creuse plus vite.
- **Givre** : tant que le froid le blesse, du givre bleuté et des aiguilles de
  glace couvrent les bords de l'écran, plus épais quand l'écart grandit.
- **Avertissements** quand l'état empire : « Le froid gagne » (il grelotte),
  « Grand froid » (il perd de la santé), « Trop couvert » (la faim se creuse
  plus vite, avec le pourcentage). Le retour au confort est silencieux.
- **Inventaire** : une ligne *Climat* sous la *Tenue* donne le ressenti, l'air,
  l'abri, la plage de la tenue portée et son effet. L'écran *Tenue* rappelle la
  plage de la tenue choisie et le ressenti.
- **Palefrenier** : le panneau du voyage donne le ressenti en route (du plus
  froid au plus chaud) et prévient si la tenue laissera le froid ronger la
  santé ou sera trop chaude. Les rations conseillées tiennent compte de la faim
  plus rapide. Pendant le voyage, la ligne des repas affiche « Grand froid ·
  santé en baisse » ou « Tenue trop chaude · faim plus rapide ».

Les compagnons ne sont pas concernés pour l'instant.

## Tests

`tests/body-heat.test.cjs` vérifie les plages de chaque chaleur (casque
fourré compris), l'effet du vent, de la pluie, de la neige, du village et du
feu, la mort rapide en pagne au grand froid et sa cause sur l'écran de mort, la
survie en pelisse, le plancher de 1 PV en voyage et le repos au chaud pendant
ses haltes, le feu d'une halte et le répit après le retour d'Avar, la faim plus
rapide sans perte de santé dans la chaleur (au plus ×4), le climat et les
rations du panneau de voyage, les avertissements, le HUD et la ligne *Climat*
de l'inventaire.
