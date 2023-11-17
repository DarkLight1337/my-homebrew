import { CharacterProps } from '../actor.mjs';
import { Dialogs } from '../dialog.mjs';
import { runMidiQOLMacro } from '../runner.mjs';

/**
 * @template {{}} D
 * @typedef {import('../item.mjs').ItemWithSystem<D>} ItemWithSystem
 */

const LEVEL_5_ABILITIES = [
    'Chromatic Warding',
    'Gem Flight',
    'Enervating Breath', 'Repulsion Breath',
];

/**
 * @param {unknown[]} args
 */
export async function channelDivinity(args) {
    await runMidiQOLMacro(args, async ({ actor }) => {
        const charProps = new CharacterProps(actor);

        /**
         * @type {ItemWithSystem<Item5e.Templates.ActivatedEffect>[]}
         */
        // @ts-expect-error
        const candidateDivinityItems = actor.items.filter((i) => i.name.startsWith('Channel Divinity:'));
        if (candidateDivinityItems.length === 0) {
            ui.notifications?.error('This character does not have any Channel Divinity abilities.');
        } else {
            await Dialogs.freecast(candidateDivinityItems, 'Channel Divinity effect', false);

            /**
             * @type {ItemWithSystem<Item5e.Templates.ActivatedEffect>[]}
             */
            // @ts-expect-error
            const candidateBreathItems = actor.items.filter((i) => i.name.startsWith('Breath Weapon'));
            if (candidateBreathItems.length === 0) {
                ui.notifications?.error('This character does not have any breath weapons.');
                return;
            }

            /**
             * @type {ItemWithSystem<Item5e.Templates.ActivatedEffect>[]}
             */
            let candidateRacialItems = [];
            if (charProps.getTotalLevels() >= 7) {
                // @ts-expect-error
                candidateRacialItems = actor.items
                    .filter((i) => LEVEL_5_ABILITIES.includes(i.name));
                if (candidateRacialItems.length === 0) {
                    ui.notifications?.error('This character does not have any level 5 dragonborn features.');
                    return;
                }
            }

            const candidateItems = [...candidateBreathItems, ...candidateRacialItems];
            await Dialogs.freecast(candidateItems, 'ability', true);
        }
    });
}
