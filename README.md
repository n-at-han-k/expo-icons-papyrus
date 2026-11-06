# expo-icons-papyrus

[Papirus](https://github.com/PapirusDevelopmentTeam/papirus-icon-theme) icons as
`react-native-svg` components — one module per icon, so Metro only bundles what
you import.

Nothing is vendored. `nix build` fetches Papirus at the rev pinned in
`nix/package/expo-icons-papyrus/default.nix`, converts the icons listed in
`icons.json`, and the store path *is* the npm package.

```nix
# in the consuming flake
expo-icons-papyrus.packages.${system}.default
```

```sh
nix build            # $out = the package
```

## Use

```tsx
import Folder from "expo-icons-papyrus/icons/folder";
import Trash from "expo-icons-papyrus/icons/feather-trash-symbolic";

<Folder size={48} />
<Trash size={16} colorClassName="accent-red-500" className="opacity-80" />
```

Module name = the Papirus filename. `size` defaults to the icon's native size
(24 for symbolic, 64 for colour).

Two kinds of icon:

- **symbolic** (`*-symbolic`) — monochrome, painted `fill="currentColor"`, so
  `colorClassName` (any `accent-*` class) tints them. These are the UI icons.
- **colour** (`64x64/...`) — the full Papirus artwork, fixed palette;
  `colorClassName` does nothing.

`className` styles the `<Svg>` itself (opacity, margin, transform).

## Adding an icon

Append its path, relative to the theme root, to `icons.json`:

```json
"24x24/symbolic/actions/edit-find-symbolic.svg"
```

Both lists live in the upstream repo under `Papirus/`. Symbolic icons only
exist at `24x24`; colour icons are redrawn per size (`16x16` is not `64x64`
scaled down), so pick the bucket closest to how you render it.

## Why a converter and not SVGR

Papirus keeps its paint in `style="fill:#5294e2"` and its symbolic colour in a
`<style id="current-color-scheme">` block with a `class`. `react-native-svg`
reads neither — it ignores the `style` attribute and has no CSS cascade — so an
untouched Papirus SVG renders solid black on iOS and Android.
`scripts/generate.mjs` flattens `style` into props, drops the stylesheet, and
keeps `fill:currentColor` as a prop, which `react-native-svg` *does* resolve
from the `color` prop on `<Svg>`. Across 11,709 colour icons the set uses only
paths, rects and the odd gradient — no filters, masks or text — so the output
needs no runtime shims.
