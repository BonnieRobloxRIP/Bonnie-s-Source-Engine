# Black Mesa Phase 1 Texture Spec

Use these exact canvas sizes for Phase 1.
All paths are referenced by `addon/RP/ui/black_mesa_menu.json`.

| Texture Path (without extension) | Exact Canvas (px) | Draw Notes |
|---|---:|---|
| `textures/ui/black_mesa/bm_mainmenu_ribbon` | `620 x 46` | Orange top strip with angled right edge.
| `textures/ui/black_mesa/bm_tab_active` | `82 x 4` | Orange active-tab underline.
| `textures/ui/black_mesa/bm_mainmenu_bottom_bar` | `256 x 52` | Gray footer bar tile. Stretched to full width in UI.
| `textures/ui/black_mesa/bm_mainmenu_button` | `132 x 36` | Primary action frame (Resume/Start).
| `textures/ui/black_mesa/bm_chapter_card` | `286 x 194` | Chapter card base frame.
| `textures/ui/black_mesa/chapter_card_selected` | `286 x 194` | Optional dedicated selected chapter card highlight frame.
| `textures/ui/black_mesa/chapter_thumb` | `270 x 112` | Optional thumbnail region inside chapter card. If absent, UI uses a dark placeholder.
| `textures/ui/black_mesa/bm_mainmenu_right_arrow` | `42 x 64` | Campaign carousel arrow icon.

## File names to create

Create these files under `addon/RP/textures/ui/black_mesa/`:

- `bm_mainmenu_ribbon.png`
- `bm_tab_active.png`
- `bm_mainmenu_bottom_bar.png`
- `bm_mainmenu_button.png`
- `bm_chapter_card.png`
- `chapter_card_selected.png`
- `chapter_thumb.png`
- `bm_mainmenu_right_arrow.png`

## Nineslice metadata used in this phase

Optional but recommended for stretch-safe edges (already pre-created as `.json` files):

- `bottom_bar.json`
- `chapter_card.json`
- `chapter_card_selected.json`
