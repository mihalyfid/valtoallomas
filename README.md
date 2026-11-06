# Vasúti Forgalomirányító Szimulátor — WEBPROG Beadandó

## Hallgatói Adatok
* **Név:** Mihályfi Dávid
* **Neptun kód:** ZGPZOO
* **Szak / Képzés:** Programtervező informatikus BSc (ELTE IK)
* **Bemutató videó linkje (OneDrive):** [Videó megtekintése](https://...)
* **A futtatható program linkje (Vercel, Netlify, Firebase, stb.):**
---

## Hallgatói Nyilatkozat és AI Használat
Kijelentem, hogy ez a megoldás a saját szellemi munkám. Nem másoltam és nem vettem át harmadik féltől származó kész kódrészleteket jogosulatlanul. Tudomásul veszem az ELTE HKR 377/A. § szerinti szabályzatot: a nem megengedett segítség igénybevétele vagy a másolat készítése fegyelmi eljárást és a tárgy automatikus elutasítását vonja maga után.

### AI Eszközök Használata (Jelöld a megfelelőt):
* [ ] A feladatot teljesen önállóan, AI segítség nélkül készítettem el.
* [X] Használtam mesterséges intelligenciát (pl. ChatGPT, GitHub Copilot) tanácsadóként.
  * *Részletezés:* Az AI-t tanácadóként, legfőképp szintaxis keresésre, a nyelv sajátosságainak tisztázására, és hibakeresésre használtam.

Tudomásul veszem, hogy a személyes szóbeli kódvédésen a kód minden egyes sorát önállóan, segédeszköz nélkül meg kell tudnom magyarázni.

---

## Önellenőrző Lista (Checklist)

### Kezdőképernyő & Általános Funkciók
- [X] Játékosnév bekérése és validálása
- [X] 3 különböző nehézségi szintű pálya kiválasztása
- [X] Játékszabályzat és irányítás megtekintése
- [X] Pályánkénti dicsőséglista (helyi ranglista) localStorage-ban
- [X] Korábbi játékállás visszatöltése a főmenüből

### Játékmenet & Felület (Canvas)
- [X] Folyamatosan frissülő játékidő (stopper) kijelzése
- [X] Célba ért vonatok és hiba/késésszámláló dinamikus HUD-ja
- [X] Topológiai vágányhálózat és állomások kirajzolása Canvas 2D-ben
- [X] Váltók állítása bal egérgombbal (vizuális irányjelzéssel)
- [X] Vasúti fényjelzők (kétoptikás) szabad/tilos állítása bal kattintással
- [X] Szerelvények vészfékezése / feloldása jobb egérgombbal
- [X] Jobb egérgombos böngészőmenü letiltva a játéktéren

### Szimuláció, Logika & Hibakezelés
- [X] Menetrend szerinti automatikus vonatindítás eltérő sebességekkel
- [X] Vörös jelzőnél kötelező és automatikus megállás
- [X] Közelgő ütközés valós idejű vizuális figyelmeztetése (sárga/piros aura)
- [X] Vonatütközések azonnali detektálása és Game Over kezelése
- [X] Kisiklás kezelése helytelen váltóállás vagy nyitott vágányvég esetén
- [X] Helytelen célperonra futás büntetése
- [X] Játék végi győzelmi / vereségi értesítés egyedi modális ablakban (alert nélkül)

### Kódminőség & Architektúra
- [X] Szigorú "1 HTML + 1 CSS + 3 JS" moduláris struktúra (state, render, app)
- [X] Nincs var kulcsszó a teljes forráskódban
- [X] Nincsenek getElementById, DOMContentLoaded, alert() hívások
- [X] Tiszta Vanilla JS (nincs külső könyvtár vagy framework)
- [X] Játékállás mentése és visszatöltése localStorage segítségével
- [ ] A 3-5 perces narrált bemutató videó feltöltve és megosztható OneDrive linken
- [X] Online deployment, a program elérhető valamilyen online platformon, ennek elérhetőségét feltüntettem itt a README.md file elején

