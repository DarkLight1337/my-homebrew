import { CharacterProps } from '../actor.mjs';
import { ChatContext } from '../chat.mjs';
import { ActivationItemProps } from '../item.mjs';
import { runMidiQOLItemMacro } from '../runner.mjs';

/**
 * @param {unknown[]} args
 */
export async function waterWard(args) {
    // flags.midi-qol.onUseMacroName | Custom | ItemMacro,preTargetDamageApplication
    await runMidiQOLItemMacro(args, async ({ workflow }) => {
        const chat = new ChatContext('Water Barrier');

        for (const target of workflow.targets) {
            /**
             * @type {dnd5e_.Actor5e<dnd5e_.CharacterData>}
             */
            const targetActor = target.actor;

            /**
             * @type {dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>}
             */
            // @ts-expect-error
            const targetItem = targetActor.items.getName('Water Ward');

            if (targetItem) {
                const itemProps = new ActivationItemProps(targetItem);
                const charProps = new CharacterProps(targetActor);

                const currentUses = itemProps.getCurrentUses();
                const currentHp = charProps.getCurrentHp();

                if (currentUses > 0 && currentHp <= 0) {
                    if (workflow.damageDetail.some((term) => term.type === 'fire')) {
                        chat.sendMessage(`A sheet of water envelops ${target.name}, preventing this instance of fire damage.`);

                        // eslint-disable-next-line no-await-in-loop
                        await itemProps.setCurrentUses(currentUses - 1);
                    }
                }
            }
        }
    });
}
