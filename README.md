# Yannicks Kookboek

Een openbaar, statisch receptenarchief. De website wordt gebouwd met Astro en gepubliceerd via GitHub Pages.

## Inhoud

- Zoek recepten op naam, keuken, tag of ingrediënt.
- Filter op categorie en bereidingstijd.
- Wissel tussen lijst- en rasterweergave.
- Open een rustige, afdrukbare receptpagina.
- Vink ingrediënten af tijdens het koken.
- Responsive voor mobiel, tablet en desktop.

## Bronnen

`personal-hub/recepten/` blijft de private, canonieke opslag. `src/content/recepten/` is een gecontroleerde openbare kopie. De synchronisatie kopieert alleen recept-Markdown en een vaste lijst toegestane metadata; hulpmiddelen, weekmenu's en boodschappenlijsten worden niet meegenomen.

```bash
npm run sync:recipes
npm run sync:recipes:check
```

Standaard wordt `../personal-hub/recepten` gebruikt. Een ander bronpad kan met `RECIPE_SOURCE_DIR`:

```bash
RECIPE_SOURCE_DIR=/pad/naar/recepten npm run sync:recipes
```

## Lokaal ontwikkelen

Node.js 22 of nieuwer is vereist.

```bash
npm ci
npm run dev
```

De belangrijkste kwaliteitscontroles:

```bash
npm run check
npm test
npm run build
npm run test:e2e
```

Playwright heeft een Chromium-browser nodig:

```bash
npx playwright install chromium
```

## Publicatie

Een push naar `main` start CI en publiceert de statische uitvoer via GitHub Pages. De standaardbasis is `/Receptenarchief/`. Voor een later eigen domein kunnen `SITE_URL` en `BASE_PATH` tijdens de build worden aangepast.

## Privacy en herkomst

- Geen analytics, advertenties, cookies of externe lettertypen.
- Geen foto's van oorspronkelijke receptsites.
- Elk recept toont een link naar de oorspronkelijke bron.
- Voeg alleen eigen foto's toe via het optionele veld `afbeelding`.
