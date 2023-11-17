import * as Macros from './macros/index.mjs';

Hooks.once('init', async () => {
    if ('MyHomebrew' in globalThis) {
        ui.notifications?.error('<p>Unable to load module (my-homebrew):</p><code>MyHomebrew is already defined in the global context.</code>');
    } else {
        Object.assign(globalThis, { MyHomebrew: { Macros } });
    }
});
