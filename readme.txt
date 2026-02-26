=== Open Icons Lite for ACF ===
Contributors: davidbuilds
Tags: acf, icons, svg, heroicons, custom fields
Requires at least: 5.8
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A beautiful icon picker field for Advanced Custom Fields using Heroicons. Pick from 292 hand-crafted SVG icons.

== Description ==

ACF Open Icons Lite adds a custom field type to Advanced Custom Fields (ACF) that lets you select and display SVG icons from the Heroicons library.

**Features:**

* **292 Heroicons** - Beautiful, hand-crafted SVG icons by the makers of Tailwind CSS
* **color palette** - Define up to 3 color tokens and apply them to icons
* **Smart caching** - Icons are cached locally for optimal performance
* **Clean output** - Simple `acf_open_icon()` helper function for displaying icons
* **Sanitised SVGs** - All icons are sanitised for security

**How it works:**

1. Add an "Open Icons" field to your ACF field group
2. Select an icon and color from the beautiful picker interface
3. Display the icon in your theme using the `acf_open_icon()` function

**Display icons in your theme:**

`php
<?php
$icon = get_field('your_icon_field');
acf_open_icon($icon, ['size' => 24, 'class' => 'my-icon']);
?>
`

**Want more icons?**

[ACF Open Icons Premium](https://acfopenicons.com) unlocks:

* **Lucide Icons** - 1,500+ icons
* **Tabler Icons** - 5,200+ icons
* Icon migration tools when switching providers
* Priority support

== Installation ==

1. Upload the `acf-open-icons-lite` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Ensure you have Advanced Custom Fields installed and activated
4. Create a new field with the "Open Icons" type

== Frequently Asked Questions ==

= Does this plugin require ACF? =

Yes, ACF Open Icons Lite requires Advanced Custom Fields (free or Pro) to be installed and activated.

= Can I use this with ACF PRO? =

Absolutely! ACF Open Icons Lite works with both the free version of ACF and ACF PRO.

= Can I have both Lite and Premium versions active? =

No. The plugin will automatically prevent you from activating both versions simultaneously to avoid conflicts.

= How do I display an icon in my theme? =

Use the `acf_open_icon()` function:

`php
$icon = get_field('icon');
acf_open_icon($icon, ['size' => 24, 'class' => 'my-icon']);
`

= Can I change the icon color dynamically? =

Yes! Pass a `color` parameter:

`php
acf_open_icon($icon, ['color' => '#ff0000']);
`

= What icons are included? =

The Lite version includes the full Heroicons library (292 icons). For access to Lucide (1,500+ icons) and Tabler (5,200+ icons), consider upgrading to Premium.

== Screenshots ==

1. The icon picker modal with search and color selection
2. Icon field in the WordPress editor
3. Settings page with color palette configuration

== Changelog ==

= 1.0.0 =
Initial release of ACF Open Icons Lite.
