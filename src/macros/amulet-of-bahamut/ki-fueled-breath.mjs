import { Dialogs } from '../dialog.mjs';
import { runMidiQOLItemMacro } from '../runner.mjs';

/**
 * @param {unknown[]} args
 */
export async function kiFueledBreath(args) {
    await runMidiQOLItemMacro(args, async ({ actor }) => {
        /**
         * @type {dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>[]}
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
