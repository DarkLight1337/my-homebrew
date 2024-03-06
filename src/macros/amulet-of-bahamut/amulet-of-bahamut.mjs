import { CharacterProps } from '../actor.mjs';
import { getCompendiumItem } from '../item.mjs';
import { runDAEMacro } from '../runner.mjs';

/**
 * @typedef {import('../argparse.mjs').ParsedDAEItemMacroArgs} ParsedDAEItemMacroArgs
 */

/**
 * @param {string} name
 * @returns {Promise<dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>>}
 */
function getDerivedItem(name) {
    return getCompendiumItem(`Amulet of Bahamut: ${name}`);
}

/**
 * @typedef {object} DerivedItemOptions
 * @property {((props: CharacterProps) => boolean)} [isAvailable]
 * @property {(
 *     macroArgs: ParsedDAEItemMacroArgs,
 *     userItem: dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>
 * ) => Promise<void>} [postProcess]
 */

/**
 * @param {ParsedDAEItemMacroArgs} macroArgs
 * @param {dnd5e_.Item5e<dnd5e_.ActivatedEffectTemplate>} userItem 
 */
async function linkKiItemConsumeTarget(macroArgs, userItem) {
    const kiItem = macroArgs.targetActor.items.getName('Ki')
        ?? macroArgs.targetActor.items.getName('Ki Points');

    if (userItem == null) {
        ui.notifications?.warn('Cannot find the newly added item. Please manually set the resource consumption target.');
    } else if (kiItem == null) {
        ui.notifications?.warn('Cannot find Ki Points item. Please manually set the resource consumption target.');
    } else {
        await userItem.update({ 'system.consume.target': kiItem._id });
    }
}

/**
 * @type {Record<string, DerivedItemOptions>}
 */
const DERIVED_ITEMS = {
    'Dragon Claws': {},
    'Channel Divinity': {
        isAvailable: (props) => (props.getClassLevels('cleric') >= 2 || props.getClassLevels('paladin') >= 3),
    },
    'Ki-Fueled Breath': {
        isAvailable: (props) => props.getClassLevels('monk') >= 3,
        postProcess: linkKiItemConsumeTarget,
    },
    'Ki-Fueled Ancestry': {
        isAvailable: (props) => (props.getClassLevels('monk') >= 3 && props.getTotalLevels() >= 7),
        postProcess: linkKiItemConsumeTarget,
    },
};

/**
 * @param {unknown[]} args
 */
export async function amuletOfBahamut(args) {
    // macro.itemMacro | Custom | ItemMacro
    await runDAEMacro(args, async (macroArgs) => {
        const { targetActor } = macroArgs;

        if (args[0] === 'on') {
            // @ts-expect-error
            const charProps = new CharacterProps(targetActor);

            await Promise.all(Object.entries(DERIVED_ITEMS)
                .map(async ([derivedItemName, { isAvailable, postProcess }]) => {
                    if (isAvailable?.(charProps) ?? true) {
                        const baseItem = await getDerivedItem(derivedItemName);

                        const [userItem] = await targetActor.createEmbeddedDocuments('Item', [baseItem.toObject()]);
                        ui.notifications?.info(`An item (${baseItem.name}) has been added to your character sheet.`);

                        if (userItem instanceof dnd5e.documents.Item5e) {
                            // @ts-expect-error
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
}
