import { Dialogs } from '../dialog.mjs';
import { runMidiQOLItemMacro } from '../runner.mjs';

const LEVEL_5_ABILITIES = [
    'Chromatic Warding',
    'Gem Flight',
    'Metallic Breath Weapon', 'Enervating Breath', 'Repulsion Breath',
];

/**
 * @param {unknown[]} args
 */
export async function kiFueledAncestry(args) {
    await runMidiQOLItemMacro(args, async ({ actor }) => {
        /**
         * @type {dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>[]}
         */
        // @ts-expect-error
        const candidateRacialItems = actor.items.filter((i) => LEVEL_5_ABILITIES.includes(i.name));
        if (candidateRacialItems.length === 0) {
            ui.notifications?.error('This character does not have any level 5 dragonborn features.');
        } else {
            await Dialogs.freecast(candidateRacialItems, 'dragonborn feature', false);
        }
    });
}
