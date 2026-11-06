# Vasúti Forgalomirányító Szimulátor – WEBPROG Beadandó

**A futtatható program nyilvános HTTPS-linkje:** még nincs publikálva, kitöltendő.

**Bemutató videó linkje (intézményi OneDrive):** a hallgató saját narrációjú felvétele még elkészítendő.

## Hallgatói adatok

- **Név:** kitöltendő a hallgató által.
- **Neptun-kód:** kitöltendő a hallgató által.
- **Szak / képzés:** a kiírás sablonjában Programtervező informatikus BSc (ELTE IK); a tényleges adat ellenőrizendő.

## Hallgatói nyilatkozat és AI-használat

Ez a példány fejlesztési változat. A saját munkáról és a megengedett segítségről szóló nyilatkozatot a hallgatónak a tényleges munkamegosztás alapján, a kurzus szabályaival összhangban kell kitöltenie. Ez a dokumentum nem tesz helyette önállósági nyilatkozatot.

- [ ] A feladatot teljesen önállóan, AI-segítség nélkül készítettem el. **Erre a változatra nem igaz.**
- [x] A fejlesztés során generatív AI-t használtunk.

**A tényleges segítség:** a kiírás feldolgozása, a fejlesztési terv, az adatmodell, az alkalmazás első forráskódja és a célzott ellenőrzések jelentős részben Codex segítségével készültek. Ez több a szintaxiskeresésnél vagy hibakeresésnél, ezért a segítség mértékét a végső nyilatkozatban is valósághűen kell feltüntetni. A kiírás az AI-t tanácsadói és hibakereső szerepben támogatja; a hallgatónak az engedélyezett felhasználást és a saját hozzájárulását az oktató elvárásaihoz kell igazítania.

**A kódvédés feltétele:** a hallgató a teljes beadott kódot segédeszköz nélkül el tudja magyarázni, és kisebb módosításokat önállóan végre tud hajtani. A nyilatkozat végleges szövegét a PDF sablonja alapján a hallgató egészítse ki.

## Helyi indítás

Az alkalmazásnak nincsenek telepítendő JavaScript-függőségei és nincs buildlépése. ES-modulok miatt HTTP-kiszolgálóról kell megnyitni.

Ha Python 3 elérhető, a projekt gyökerében futtasd:

```sh
python -m http.server 5174 --bind 127.0.0.1
```

Ezután nyisd meg a [helyi játékot](http://127.0.0.1:5174/). A kiszolgáló a terminálban Ctrl+C-vel leállítható. Más statikus HTTP-kiszolgáló is használható. A helyi indítás fejlesztési lehetőség; a beadáshoz külön nyilvános HTTPS-publikálás szükséges.

## Fájlstruktúra és felelősségek

```text
index.html
style.css
js/
  state.js
  render.js
  app.js
README.md
```

- `state.js`: változtathatatlan pályaleírások és menetrendek, változó futamállapot, vonatmozgás, váltóutak, jelzők, hibák, ütközésvizsgálat és mentési adatok ellenőrzése. Nem használ DOM-ot.
- `render.js`: Canvas 2D kirajzolás, HUD, menetrend, eseménylista és ranglista megjelenítése. A futam szabályait nem változtatja meg.
- `app.js`: inicializálás, egyetlen RAF-hurok, egér- és gombesemények, nézetek, párbeszédablakok, `localStorage` mentés/betöltés és eredménytárolás.
- A megjelenítés saját Canvas-geometriát és helyi betűkészleteket használ; nincs külső médiafájl vagy JS-könyvtár.
- Az `AGENTS.md`, `FEJLESZTESI_TERV.md`, valamint az `output/` és az esetleges `tmp/` belső munkasegédlet. Nem alkalmazásfüggőségek, és nem szükségesek a beadási ZIP-be.

## Játékszabályok és kezelőszervek

1. Adj meg egy játékosnevet, és válassz pályát.
2. A vonatok a rögzített menetrend szerint érkeznek. A színük mutatja a célperont; a menetrend névvel is megadja a színt.
3. Bal kattintás a **V jelű körön**: következő váltóút. A világos összeköttetés megmutatja, mely bejövő sínek csatlakoznak a kiválasztott kimenő sínhez.
4. Bal kattintás a **J jelű fényjelzőn**: vörös/zöld váltás. A jelzők kezdetben vörösek. A vonat a vörös jelző előtt automatikusan megáll.
5. Jobb kattintás a **vonaton**: kézi fék behúzása/feloldása. A „FÉK” felirat jelzi a kézi megállítást; „TILOS” jelzi a jelző miatti várakozást. A kézi fék feloldása nem enged át vörös jelzőn.
6. A szaggatott, pulzáló kör ütközésveszélyt jelez. Keresztező sínek vonatai is ütközhetnek. A jelzők nem állnak át automatikusan a foglaltságtól.
7. Szünetben a mozgás és az időmérés megáll; a váltók és jelzők állíthatók. A szabályzat/ranglista átmenetileg szüneteltet; bezáráskor a korábban futó menet folytatódik. Háttérbe kerülés után kézzel kell folytatni.
8. A „Menet mentése” egy mentési helyet kezel. A főmenü betöltésgombja innen állítja vissza a menetet. Új mentés felülírja a régit; a reset önmagában nem törli a korábbi mentést.

## Pályák és megoldási útvonalak

| Pálya | Bejárat | Váltó | Jelző | Peron | Vonat |
|---|---:|---:|---:|---:|---:|
| Kitérő vágány | 1 | 2 | 3 | 2 | 4 |
| Rendező-pályaudvar | 2 | 3 | 4 | 3 | 5 |
| Fejpályaudvari csúcsforgalom | 2 | 4 | 6 | 4 | 6 |

A mozgás balról jobbra irányított. A geometriai keresztezés önmagában nem csomópont: átágazni a V jelű váltóknál lehet, a keresztezésen történő fizikai ütközés azonban baleset.

**Könnyű:** a négy vonat célja piros, kék, piros, kék. Pirosnál V1 fővágány + V2 piros; kéknél V1 kitérő + V2 kék. V2 összevezető váltó, ezért rossz bejövő ág esetén kisiklás történik. A jelzőket szabadra kell állítani. A váltókat csak az előző vonat áthaladása után készítsd elő a következő célra.

**Közepes – egy megoldási útvonal-sorozat:**

| Vonat | Útvonal |
|---|---|
| SZ201, felső → kék | V1: kék közvetlen |
| TE202, alsó → piros | V2: piros közvetlen |
| GY203, felső → sárga | V1: V3 felé; V3: sárga |
| SZ204, alsó → kék | V2: V3 felé; V3: kék |
| GY205, felső → piros | V1: V3 felé; V3: piros |

**Nehéz – egy megoldási útvonal-sorozat:**

| Vonat | Útvonal |
|---|---|
| SZ301, felső → piros | V1: 1–2. peron felé; V3: piros |
| TE302, alsó → kék | V2: 3–4. peron felé; V4: kék |
| GY303, felső → sárga | V1: 1–2. peron felé; V3: sárga |
| SZ304, alsó → zöld | V2: 3–4. peron felé; V4: zöld |
| GY305, felső → kék | V1: 3–4. peron felé; V4: kék |
| TE306, alsó → piros | V2: 1–2. peron felé; V3: piros |

A fenti útvonalak modelltesztben és a böngésző rendes kezelőszerveivel is hibátlanul teljesültek. A böngészős eredmények: könnyű 4/4 (01:25), közepes 5/5 (00:54), nehéz 6/6 (00:41), mindegyik 0 hibával. Az alkalmazás nem tartalmaz automatikus váltóállítást; a modelltesztben külön tesztvezérlő szimulálta a játékosi műveleteket, a böngészős próbán kattintással állítottuk a váltókat és jelzőket. Ez az útvonaltábla nem helyettesíti a közelség és a közös váltók figyelését.

## Pontosított működési döntések

A kiírás egyes részletei nem egyértelműek. Az alábbiak az első változat választott értelmezései, oktatói pontosítás esetén felülvizsgálandók:

- **Kimenetel:** ütközés azonnali Game Over. Rossz peron/kisiklás hibapont és feldolgozott vonat, a többi szerelvény tovább halad. Az összes vonat feldolgozása után hibátlanul győzelem, hibával külön befejezett állapot következik. Csak hibátlan menet kerül a ranglistára.
- **Várakozás:** a piros jelző vagy kézi fék miatt álló aktív vonatok várakozási idejének összege, vonatmásodpercben. A kiírás nem ad hivatalos késésképletet; ez nem célállomási menetrendi késés.
- **Holtpont:** a pályák irányított, ciklusmentes hálózatok, van megoldásuk. Nincs önkényes várakozási idő miatti vereség; a kézi fék vagy vörös jelző miatti állás a megfelelő kapcsolással feloldható. A felület a várakozó vonatokra figyelmeztet. Automatikus általános holtpontfelismerő nincs.
- **Biztonsági határok:** 75 logikai pixel alatt közelségjelzés, 29 pixel alatt ütközés. A vonat közepe a vörös jelző sínre vetített helye előtt 23 pixellel áll meg, ezért a jármű eleje sem éri el a jelzőt.
- **Ranglista:** pályánként a legjobb 20 eredmény, hibapont majd idő szerint növekvően. Egy futam egyedi azonosítója akadályozza meg ugyanazon mentett győzelem ismételt felvételét, amíg az eredmény szerepel a listán.

## Adattárolás és hibakezelés

- Mentéskulcs: `valtoallomas.save.v1`. Tartalmazza a játékosnevet, pályát, időt, váltókat, jelzőket, vonatok pozícióját/irányát/sebességét/célját, kézi féket, menetrendi előrehaladást és számlálókat.
- Ranglistakulcs: `valtoallomas.rankings.v1`. Szintenként tárolja a nevet, időt, hibát, dátumot és futamazonosítót.
- A mentés nem helyettesítheti a program rögzített pályaadatait. Betöltéskor típus-, tartomány-, állapot- és konzisztenciaellenőrzés történik.
- Sérült JSON, hibás mentés és tárhelyhiba felületi üzenetet kap; sikertelen betöltéskor a tárolt adat nem íródik felül.
- Az adatok böngészőhöz és eredethez kötődnek. A `localhost`, a `127.0.0.1`, másik port és a későbbi nyilvános cím külön tárolót jelenthet. Böngészőadat-törléskor a mentés és ranglista elveszhet.

## Kódvédési felkészülés

Az alábbi részeket a hallgatónak a forrásban meg kell találnia, meg kell értenie és önállóan módosítania kell tudni:

1. **Gráfreprezentáció:** miért van a csomópontnak típusa, az élnek két végpontja és hossza, a váltónak pedig bejövő/kimenő útvonala?
2. **Vektorinterpoláció:** `t = megtettTávolság / sínhossz`, majd `x = ax + (bx − ax) × t`, és ugyanígy `y`. A vonat irányszöge `atan2(by − ay, bx − ax)`.
3. **Mozgás:** a megtett út `sebesség × elteltIdő`. Miért kell az él végén megmaradó utat a következő élre átvinni?
4. **Ütközés:** két vonat távolsága `hypot(ax − bx, ay − by)`. Miért kell különböző sínek vonatait is összevetni?
5. **Időlépés:** a modell legfeljebb 1/120 másodperces lépésekkel dolgozik. Miért akadályozza ez meg a jelző vagy az ütközési zóna átugrását? Miért nem ugyanaz a szimulációs lépés és a képernyő frissítési gyakorisága?
6. **Event Loop / RAF:** hogyan jut el az egérkattintás az állapotmódosításon át a következő rajzolásig? Miért marad pontosan egy RAF-hurok reset és betöltés után is?
7. **Modulhatárok:** miért nem kérdez le DOM-ot a `state.js`, és miért nem a rajzoló függvény mozgatja a vonatokat?
8. **Mentés:** miért kell az aktív vonatok mellett a menetrendi mutató és a kézi fék is? Miért nem jó a falióra alapján folytatni a mentett játékidőt?
9. **Hibakezelés:** miben különbözik egy várt játékbeli hiba (téves peron) és egy technikai hiba (sérült JSON)?

Gyakorló módosítások: egy sebesség megváltoztatása; a közelségi határ módosítása; új HUD-mező hozzáadása a megfelelő modulokban; a ranglista sorrendjének magyarázata; sérült mentés ellenőrzésének bemutatása. A kötelező menetrendet és darabszámokat a beadási változatban meg kell tartani.

## Önellenőrző lista és véglegesítés

- [x] Az előírt öt alkalmazásfájl és natív ES-modulok, külső JS-könyvtár nélkül.
- [x] Három előírt pálya, modelltesztben igazolt balesetmentes megoldásokkal.
- [x] Játékosnév, pályaválasztás, Canvas, váltók, jelzők és jobb gombos fék.
- [x] Menetrendi érkezés, szünet, reset, HUD és saját párbeszédablakok.
- [x] Közelség, ütközés, kisiklás és téves peron kezelése célzott modellpróbákban.
- [x] Játékállás mentése és oldal-újratöltés utáni betöltése böngészőben ellenőrizve.
- [x] A könnyű pálya teljes böngészős végigjátszása: 4/4, 0 hiba; ranglista és újratöltés utáni megőrzés ellenőrizve.
- [x] A közepes és nehéz pálya teljes, hibátlan böngészős végigjátszása: 5/5, illetve 6/6, 0 hibával.
- [x] További 11 tárolási és ranglista-ellenőrzési eset sikeres, elkülönített böngészős teszttárolóval: sérült/hiányzó mentés, szimulált kvóta- és hozzáférési hiba, rendezés és dupla eredmény kizárása.
- [ ] Hallgatói adatok, nyilatkozat és saját hozzájárulás véglegesítése.
- [ ] Az ideiglenes szabályértelmezések egyeztetése, újabb kiírás és határidő ellenőrzése.
- [ ] Nyilvános HTTPS-publikálás, a valódi URL feltüntetése és a publikált változat ellenőrzése.
- [ ] Saját hangos, 3–5 perces videó, megosztott intézményi OneDrive-linkkel.
- [ ] Végleges ZIP, Moodle-feltöltés és kódvédési felkészülés.

Az ellenőrzések részletes naplója és a még nyitott követelmények a belső `FEJLESZTESI_TERV.md` fájlban találhatók. A nyilvános elérést a jegy beírásáig fenn kell tartani.
