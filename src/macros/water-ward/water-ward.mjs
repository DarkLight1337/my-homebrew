import { CharacterProps } from '../actor.mjs';
import { ChatContext } from '../chat.mjs';
import { ActivationItemProps, getCompendiumItem } from '../item.mjs';
import { runDAEMacro, runMidiQOLItemMacro } from '../runner.mjs';

/**
 * @template {{}} D
 * @typedef {import('../actor.mjs').ActorWithSystem<D>} ActorWithSystem
 */

/**
 * @typedef {import('../argparse.mjs').ParsedDAEItemMacroArgs} ParsedDAEItemMacroArgs
 */

/**
 * @template {{}} D
 * @typedef {import('../item.mjs').ItemWithSystem<D>} ItemWithSystem
 */

/**
 * @param {string} name
 * @returns {Promise<Item5e>}
 */
function getDerivedItem(name) {
    return getCompendiumItem(`Water Ward: ${name}`);
}

/**
 * @typedef {object} DerivedItemOptions
 * @property {((props: CharacterProps) => boolean)} [isAvailable]
 * @property {(macroArgs: ParsedDAEItemMacroArgs, userItem: Item5e) => Promise<void>} [postProcess]
 */

/**
 * @type {Record<string, DerivedItemOptions>}
 */
const DERIVED_ITEMS = {
    Drink: {},
    Squirt: {},
};

/**
 * @param {unknown[]} args
 */
export async function waterWard(args) {
    if (args[0] === 'on' || args[0] === 'off') {
        // macro.itemMacro | Custom | ItemMacro
        await runDAEMacro(args, async (macroArgs) => {
            const { targetActor } = macroArgs;

            if (args[0] === 'on') {
                const charProps = new CharacterProps(targetActor);

                await Promise.all(Object.entries(DERIVED_ITEMS)
                    .map(async ([derivedItemName, { isAvailable, postProcess }]) => {
                        if (isAvailable?.(charProps) ?? true) {
                            const baseItem = await getDerivedItem(derivedItemName);

                            const [userItem] = await targetActor.createEmbeddedDocuments('Item', [baseItem.toObject()]);
                            ui.notifications?.info(`An item (${baseItem.name}) has been added to your character sheet.`);

                            if (userItem instanceof dnd5e.documents.Item5e) {
                                await postProcess?.(macroArgs, userItem);
                            } else {
                                throw new Error('The new item is not an instance of Item5e.');
                            }
                        }
                    }),
                );
            } else if (args[0] === 'off') {
                await Promise.all(Object.keys(DERIVED_ITEMS)
                    .map(async (derivedItemName) => {
                        const baseItem = await getDerivedItem(derivedItemName);
                        const userItem = targetActor.items.getName(baseItem.name);

                        if (userItem != null) {
                            await userItem.delete();
                            ui.notifications?.info(`An item (${baseItem.name}) has been removed from your character sheet.`);
                        }
                    }),
                );
            }
        });
    } else {
        // flags.midi-qol.onUseMacroName | Custom | ItemMacro,preTargetDamageApplication
        await runMidiQOLItemMacro(args, async ({ workflow }) => {
            const chat = new ChatContext('Water Barrier');

            for (const target of workflow.targets) {
                /**
                 * @type {ActorWithSystem<Actor5e.Templates.Character>}
                 */
                const targetActor = target.actor;

                /**
                 * @type {ItemWithSystem<Item5e.Templates.ActivatedEffect>}
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
}
