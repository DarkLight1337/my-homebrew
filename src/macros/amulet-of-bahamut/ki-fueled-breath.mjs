import { Dialogs } from '../dialog.mjs';
import { runMidiQOLMacro } from '../runner.mjs';

/**
 * @template {{}} D
 * @typedef {import('../item.mjs').ItemWithSystem<D>} ItemWithSystem
 */

/**
 * @param {unknown[]} args
 */
export async function kiFueledBreath(args) {
    await runMidiQOLMacro(args, async ({ actor }) => {
        /**
         * @type {ItemWithSystem<Item5e.Templates.ActivatedEffect>[]}
         */
        // @ts-expect-error
        const candidateBreathItems = actor.items.filter((i) => i.name.startsWith('Breath Weapon'));
        if (candidateBreathItems.length === 0) {
            ui.notifications?.error('This character does not have any breath weapons.');
        } else {
            await Dialogs.freecast(candidateBreathItems, 'breath weapon', false);
        }
    });
}
