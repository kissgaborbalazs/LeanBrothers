# LeanBrothers – Fájlstruktúra

```
leanbrothers/
├── index.html              ← HTML váz (szerkezet, nincsenek hardcoded szövegek)
├── style.css               ← Minden CSS (színek, layout, animációk)
├── main.js                 ← Navigáció, accordion, nyelv váltó logika
└── translations/
    ├── hu.json             ← Magyar tartalom (ITT SZERKESZD A SZÖVEGEKET)
    └── en.json             ← Angol tartalom (ITT SZERKESZD A SZÖVEGEKET)
```

## Szöveg módosítása

1. Nyisd meg a `translations/hu.json` fájlt
2. Keresd meg a módosítani kívánt kulcsot (pl. `"cta" > "btn"`)
3. Módosítsd az értéket
4. Mentés – azonnal él

## Új szekció hozzáadása

1. Add hozzá a HTML blokkot az `index.html`-be (sablon a fájl végén)
2. Add a SECTION_IDS tömbhöz a `main.js`-ben
3. Add a tartalmakat a `hu.json` és `en.json` fájlokba

## Deployment megjegyzés

A JSON fájlokat a `translations/` almappába kell helyezni.
Ha a JSON nem érhető el (pl. file:// protokoll), a rendszer
automatikusan visszaesik a `data-hu` / `data-en` attribútumokra.
