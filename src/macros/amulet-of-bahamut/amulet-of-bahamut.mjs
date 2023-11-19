import { CharacterProps } from '../actor.mjs';
import { getCompendiumItem } from '../item.mjs';
import { runDAEMacro } from '../runner.mjs';

/**
 * @param {string} name
 * @returns {Promise<Item5e>}
 */
function getDerivedItem(name) {
    return getCompendiumItem(`Amulet of Bahamut: ${name}`);
}

/**
 * @type {Record<string, (props: CharacterProps) => boolean>}
 */
const DERIVED_ITEMS = {
    // Name -> Availablity
    'Dragon Claws': () => true,
    'Channel Divinity': (props) => (props.getClassLevels('cleric') >= 2 || props.getClassLevels('paladin') >= 3),
    'Ki-Fueled Breath': (props) => props.getClassLevels('monk') >= 3,
    'Ki-Fueled Ancestry': (props) => (props.getClassLevels('monk') >= 3 && props.getTotalLevels() >= 7),
};

/**
 * @param {unknown[]} args
 */
export async function amuletOfBahamut(args) {
    await runDAEMacro(args, async ({ targetActor }) => {
        if (args[0] === 'on') {
            const charProps = new CharacterProps(targetActor);

            await Promise.all(Object.entries(DERIVED_ITEMS)
                .map(async ([derivedItemName, getIsAvailable]) => {
                    if (getIsAvailable(charProps)) {
                        const baseItem = await getDerivedItem(derivedItemName);

                        await targetActor.createEmbeddedDocuments('Item', [baseItem.toObject()]);
                        ui.notifications?.info(`An item (${baseItem.name}) has been added to your character sheet.`);

                        if (derivedItemName.startsWith('Ki-Fueled')) {
                            const userItem = targetActor.items.getName(baseItem.name);
                            const kiItem = targetActor.items.getName('Ki Points')
                                || targetActor.items.getName('Ki');

                            if (userItem == null) {
                                ui.notifications?.warn('Cannot find the newly added item. Please manually set the resource consumption target.');
                            } else if (kiItem == null) {
                                ui.notifications?.warn('Cannot find Ki item. Please manually set the resource consumption target.');
                            } else {
                                await userItem.update({ 'system.consume.target': kiItem._id });
                            }
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
                        await targetActor.deleteEmbeddedDocuments('Item', [userItem._id]);
                        ui.notifications?.info(`An item (${baseItem.name}) has been removed from your character sheet.`);
                    }
                }),
            );
        }
    });
}
