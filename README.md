# tweakpane-css

[![NPM Package](https://img.shields.io/npm/v/tweakpane-css.svg)](https://npmjs.com/package/tweakpane-css)

## Overview

_Tweakpane CSS_ is a script that automatically detects and exposes your `:root` CSS variables in a [Tweakpane](https://cocopon.github.io/tweakpane/) interface for realtime manipulation during development.

For example, given the CSS below:

```css
:root {
  --grid-pad: 2rem;
  --text-size: 1rem;
  --line-height: 1.5;
  --mobile-width: 600px;
  --dark-background-color: #000000;
  --dark-text-color: #ffffff;
  --light-background-color: #ffffff;
  --light-text-color: #000000;
}
```

The following Tweakpane will be automatically generated and displayed over your page:

<img src="./screenshot.webp" width="401px" alt="Tweakpane CSS panel" />

Changes to variables are applied immediately, and then persisted to local storage. Any variable changes are automatically applied across page refreshes.

The tweaked set of variables can be copied to the clipboard as CSS via the "Copy CSS" button.

The "Reset" button restores the variables to the original values specified in the css file, clearing local storage in the process.

The Tweakpane window has been augmented a bit to allow drag-based resizing and repositioning, and may be collapsed in the "window shade" tradition via a double-click on its title bar.

## Usage

For convenient integration and FOUC prevention, Tweakpane CSS is compiled down to a minified single-file IIFE. It's critical to use it as a classic script (no `defer`, no `module`).

You can add it to your project in three different ways:

### Locally

1. Install the package:

```sh
npm install --save-dev tweakpane-css
```

2. Add the script tag to the `head` of your template. Most casually, if you're only using Tweakpane CSS in local development, you can link right to the file in `node_modules`:

```html
<script src="main.js"></script>
```

More robust integration will depend on your framework / build tools / bundler, but again ensure that it is invoked as a classic script.

For example, in an Astro project, you have to add an `is:raw` to the script tag to prevent modularization:

```html
<script is:raw src="/node_modules/tweakpane-css/dist/main.js"></script>
```

### CDN

Add this script tag to the `head` of your template:

```html
<script src="https://cdn.jsdelivr.net/npm/tweakpane-css"></script>
```

### Bookmarklet

Create a bookmark with the url below:

```
javascript:(function(){var script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tweakpane-css';document.head.appendChild(script);})()
```

Note that the bookmarklet might not work with certain sites depending on their CSP.

The bookmarklet also has the disadvantage of not automatically loading across page reloads (though CSS values should persist and be restored once the bookmarklet is re-invoked).

## Dev Notes

Tweakpane CSS was written in [Svelte](https://svelte.dev) and leverages [svelte-tweakpane-ui](https://kitschpatrol.com/svelte-tweakpane-ui) for easy integration between Svelte and Tweakpane.

I created Tweakpane CSS for my own purposes, and it might not generalize well to other use-cases. If you'd like to see additional features or compatibility measures, please [open an issue](https://github.com/kitschpatrol/tweakpane-css/issues).

## Acknowledgements

Thanks to [Hiroki Kokubun](https://cocopon.me) for the excellent Tweakpane library.
