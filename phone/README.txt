CALCULATOR ANIMATION — drop-in snippet
======================================

WHAT THIS IS
------------
A self-contained looping animation of a hand holding a phone, typing
$102,833 − $77,833 = $25,000 on the calculator, then revealing a
"Tax Debt / Potential Savings" success card with a Call Now button.

It is ONE file: calculator-animation.html
No external files, no libraries, no network requests. Both phone images
are embedded directly inside the file as base64.


HOW TO USE IT
-------------
Option A — paste into an existing page:
  Open calculator-animation.html in a text editor. Copy everything BELOW
  the comment header (the <div id="trc-root"> ... </div>, the <style>
  block, and the <script> block) and paste it anywhere inside your page's
  <body>. That's it.

Option B — use the file as-is:
  Just host/open calculator-animation.html directly. It renders on its own.


CHOOSE THE PHONE  (iPhone is the default)
-----------------------------------------
Set data-platform on the root <div>:
    <div id="trc-root" data-platform="ios">       -> iPhone   (default)
    <div id="trc-root" data-platform="android">   -> Android

Or set it from your own code before the snippet runs:
    window.CALC_ANIM_PLATFORM = "android";


SIZE
----
The widget scales to the width of #trc-root (max 480px, centered by
default). Override in your own CSS, e.g.:
    #trc-root { max-width: 360px; }

The background is transparent so it blends into whatever sits behind it.


TIMING  (already locked in)
---------------------------
  Speed ............. 1.5x
  Minus highlight ... 1.5 s
  Hold on result ... 1.5 s
These live at the top of the <script> block as SPEED, MINUS_HOLD_MS, and
HOLD_MS if you ever want to adjust them.


NOTES
-----
- Everything is namespaced under "trc-" / "#trc-root" so it will not
  collide with your site's existing CSS or JavaScript.
- The screen-to-phone alignment uses fixed corner coordinates (in the
  PLATFORMS object inside the <script>). Adjust those arrays if you swap
  the phone images.
