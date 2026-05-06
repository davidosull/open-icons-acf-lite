=== Open Icons for ACF (Lite) ===
Contributors: davidbuilds
Tags: acf, icons, svg, heroicons, custom fields
Author URI: https://inovomedia.co.uk
Plugin URI: https://acfopenicons.com
Requires at least: 5.8
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A beautiful icon picker field for Advanced Custom Fields using Heroicons. Pick from 324 hand-crafted SVG icons.

== Description ==

Open Icons for ACF (Lite) adds a custom field type to Advanced Custom Fields (ACF) that lets you select and display SVG icons from the Heroicons library. All 324 icons are bundled with the plugin — no external downloads required.

**Features:**

* **324 Heroicons** - Beautiful, hand-crafted SVG icons by the makers of Tailwind CSS
* **Color palette** - Define up to 3 color tokens and apply them to icons
* **Bundled locally** - All icons are included in the plugin, no external requests needed
* **Clean output** - Simple `get_openicon()` helper function for displaying icons
* **ACF block friendly** - Use Open Icons fields inside ACF blocks and Gutenberg workflows
* **Sanitised SVGs** - All icons are sanitised for security

**How it works:**

1. Add an "Open Icons" field to your ACF field group
2. Select an icon and color from the beautiful picker interface
3. Display the icon in your theme using the `get_openicon()` function

**Display icons in your theme:**

`php
<?php
$icon = get_field('your_icon_field');
get_openicon($icon, ['size' => 24, 'class' => 'my-icon']);
?>
`

**Want more icons?**

[Open Icons for ACF Premium](https://acfopenicons.com) unlocks:

* **Lucide Icons** - 1,500+ icons
* **Tabler Icons** - 5,200+ icons
* **Custom Icons** - Add your own set of icons
* Icon migration tools when switching providers
* Priority support

== Installation ==

1. Upload the `open-icons-acf` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Ensure you have Advanced Custom Fields installed and activated
4. Create a new field with the "Open Icons" type

== Frequently Asked Questions ==

= Does this plugin require ACF? =

Yes, Open Icons for ACF (Lite) requires Advanced Custom Fields (free or Pro) to be installed and activated.

= Can I use this with ACF PRO? =

Absolutely! Open Icons for ACF (Lite) works with both the free version of ACF and ACF PRO.

= Can I have both Lite and Premium versions active? =

No. The plugin will automatically prevent you from activating both versions simultaneously to avoid conflicts.

= How do I display an icon in my theme? =

Use the `get_openicon()` function:

`php
$icon = get_field('icon');
get_openicon($icon, ['size' => 24, 'class' => 'my-icon']);
`

= Can I use Open Icons inside ACF blocks? =

Yes. Register your block with `acf_register_block_type()`, attach a field group with an Open Icons field (for example `feature_icon`), and render it in your callback.

    add_action('acf/init', function () {
        if (! function_exists('acf_register_block_type')) {
            return;
        }

        acf_register_block_type([
            'name'            => 'openicon-feature',
            'title'           => __('Feature with Icon', 'open-icons-acf'),
            'description'     => __('Feature item with an Open Icons field and text.', 'open-icons-acf'),
            'render_callback' => 'openicons_render_feature_block',
            'category'        => 'widgets',
            'icon'            => 'star-filled',
            'keywords'        => ['icon', 'feature', 'open icons'],
            'supports'        => ['align' => ['wide', 'full'], 'anchor' => true, 'jsx' => true],
        ]);
    });

    function openicons_render_feature_block($block): void {
        $icon  = get_field('feature_icon');
        $title = (string) (get_field('feature_title') ?: '');

        echo '<article class="oi-feature">';

        if ($icon) {
            get_openicon($icon, ['size' => 24, 'class' => 'oi-feature__icon']);
        }

        if ($title !== '') {
            echo '<h3>' . esc_html($title) . '</h3>';
        }

        echo '</article>';
    }

= Can I change the icon color dynamically? =

Yes! Pass a `color` parameter:

`php
get_openicon($icon, ['color' => '#ff0000']);
`

= What icons are included? =

The Lite version includes the full Heroicons library (324 icons). For access to Lucide (1,500+ icons) and Tabler (5,200+ icons), consider upgrading to Premium.

== Development ==

The `src/` directory contains the uncompiled React/TypeScript source code for the admin UI components.

Source code is available on GitHub:
https://github.com/davidosull/open-icons-acf-lite.git

To build from source:

1. Clone the repository
2. Run `npm install`
3. Run `npm run build`

This will bundle the Heroicons SVGs into `assets/icons/` and compile the TypeScript/React source into `assets/build/`.

== Screenshots ==

1. The icon picker modal with search and color selection
2. Icon field in the WordPress editor
3. Settings page with color palette configuration

== Changelog ==

= 1.0.2 =
* Improved icon picker browsing with a search-first layout and a dedicated "Browse all icons" action.
* Added a "Common Icons" section that learns from usage frequency and recency to surface frequently selected icons.
* Upgraded picker rendering with virtualised grid loading for smoother performance when browsing large icon lists.
* Improved keyboard and scroll behaviour across recent, common, and full icon lists.

= 1.0.1 =
* Compatibility update for Pro migration release.
* Added explicit conflict detection support for renamed Pro plugin paths and constants.

= 1.0.0 =
* Initial release of Open Icons for ACF (Lite).
* **Breaking:** Renamed public helper function from `openicon_open_icon()` to `get_openicon()`. Update any theme templates that reference the old function name.
