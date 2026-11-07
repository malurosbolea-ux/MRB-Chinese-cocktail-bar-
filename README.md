# MRB · Chinese cocktail house

Concept website for a luxury Chinese cocktail house in Madrid, built as a portfolio project. English by default, with a one-click switch to Spanish.

**By María Luisa Ros Bolea** · [Portfolio](https://malurosbolea-ux.github.io/digital-strategy-portfolio/) · [LinkedIn](https://www.linkedin.com/in/marialuisarosbolea/)

> MRB is the sample brand I use across my portfolio, and it reinvents itself for every concept. Prices, menu and booking form are for demonstration only.

## What's inside

- **Logo system** (`brand/`): paifang gateway logo, wordmark, round emblem and red seal, as vector SVG and PNG, plus a one-page brand identity sheet.
- **Loader**: the MRB gateway is painted top to bottom, then the screen rolls up like a hanging scroll.
- **Hero**: red smoke, film grain and the salon video, dissolving like ink in water as you scroll.
- **Ink gallery**: three hanging scrolls unroll with the scroll and then fan out in 3D through mist.
- **Signature cocktails**: horizontal scroll; each photo turns from black and white to colour as it reaches the centre.
- **Moon gate**: a circular video window that opens to fill the screen.
- **Experiences, salon and reservations**: ink-spread reveals, parallax gallery and a demo booking form.
- **The menu** (`carta.html`): sticky tabs, a hanging painting that changes per section, photo preview on hover and a print / PDF version.
- **EN / ES switch**: remembered between visits. Link straight to Spanish with `?lang=es`.
- No libraries: plain HTML, CSS and JavaScript. Responsive, with reduced-motion support.

## Structure

```
index.html          Home
carta.html          The menu
assets/css/         Styles
assets/js/          Scroll effects and language switch
assets/img/         Photos (WebP), favicon and social image
assets/video/       Compressed videos (no audio)
brand/              MRB logo files and brand identity sheet
```

## Publish on GitHub Pages

1. Create a new public repository called `mrb-cocktail-house`.
2. Click **Add file → Upload files** and drag in everything inside this folder (so `index.html` sits at the root).
3. Click **Commit changes**.
4. Go to **Settings → Pages**, choose branch `main` and folder `/ (root)`, then save.
5. In a minute or two the site will be live at `https://malurosbolea-ux.github.io/mrb-cocktail-house/`.
