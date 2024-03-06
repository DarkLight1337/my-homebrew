import { CharacterProps } from '../actor.mjs';
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
export async function channelDivinity(args) {
    await runMidiQOLItemMacro(args, async ({ actor }) => {
        // @ts-expect-error
        const charProps = new CharacterProps(actor);

        /**
         * @type {dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>[]}
         */
        // @ts-expect-error
        const candidateDivinityItems = actor.items.filter((i) => i.name.startsWith('Channel Divinity:'));
        if (candidateDivinityItems.length === 0) {
            ui.notifications?.error('This character does not have any Channel Divinity abilities.');
        } else {
            await Dialogs.freecast(candidateDivinityItems, 'Channel Divinity effect', false);

            /**
             * @type {dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>[]}
             */
            // @ts-expect-error
            const candidateBreathItems = actor.items.filter((i) => i.name.startsWith('Breath Weapon'));
            if (candidateBreathItems.length === 0) {
                ui.notifications?.error('This character does not have any breath weapons.');
                return;
            }

            /**
             * @type {dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>[]}
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
