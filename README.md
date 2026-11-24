# Code Themes

Three dark themes for Claude Code sessions in the desktop and mobile apps. Each one recolours the session, frosts its panels and adds a slow animated scene behind the conversation.

| Theme | Look |
| --- | --- |
| **Ash Snow** (recommended) | Charcoal sky, a glowing moon, falling snow, snow-capped peaks and a hiker with a lantern walking along the nearest ridge. |
| **Blue Steel** | Cool blue-grey sky with drifting ridges, shooting stars, birds and a hiker with a warm lantern. Slower, calmer motion. |
| **Cyberpunk** | Muted pink and teal over a night-city skyline with softly blinking windows. |

Install **one theme at a time**. Each theme sets the whole look when a session starts, so two installed together will replace each other.

## Install

At the prompt of a terminal session:

```
/plugin install ash-snow --marketplace grizz6/code-themes
```

From a shell:

```bash
claude plugin install ash-snow --marketplace grizz6/code-themes
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `grizz6/code-themes`, then **Add plugin** and pick a theme.

Answer `y` to add the marketplace, then choose the **user** scope so the theme loads in every new session. Replace `ash-snow` with `blue-steel` or `cyberpunk` for the others.

To switch themes, uninstall the current one first:

```bash
claude plugin uninstall ash-snow
```

## Where themes show

- Shown in Claude Code sessions in the Claude desktop and mobile apps.
- Not shown in the terminal, editors such as VS Code, or regular Claude chat.
- Themes style the conversation view. The app's sidebar, session list, settings and dialogs keep their own look.
- Fonts use the app's generic sans-serif and code fonts.
- When the operating system's reduce-motion setting is on, the background is drawn still.

## Layout

```
.claude-plugin/marketplace.json   lists the three themes
themes/<name>/                    one theme each: manifest, hooks module and colour helper
```
