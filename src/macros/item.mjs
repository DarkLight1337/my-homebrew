/**
 * @template {{}} D
 * @typedef {Item5e & { system: D }} ItemWithSystem
 */

/**
 * @param {string} name
 * @returns {Promise<ItemWithSystem<any>>}
 */
export async function getCompendiumItem(name) {
    if (game.packs == null) {
        throw new Error('The game is not yet ready');
    }

    /**
     * @type {CompendiumCollection<CompendiumCollection.Metadata> | undefined}
     */
    const pack = game.packs.get('my-homebrew.my-homebrew');
    if (pack == null) {
        throw new Error('Cannot find compendium pack for My Homebrew');
    }

    await pack.getIndex();
    const itemId = pack.index.getName(name, { strict: true })._id;

    return pack.getDocument(itemId);
}

/**
 * @template {{}} D
 */
export class ItemProps {

    /**
     * @param {ItemWithSystem<D>} item 
     */
    constructor(item) {
        this.item = item;
    }

    /**
     * @param {string} key
     * @returns {unknown}
     */
    getCustomItemFlag(key) {
        return this.item.getFlag('world', key);
    }

    /**
     * @param {string} key
     * @param {unknown} value
     */
    async setCustomItemFlag(key, value) {
        await this.item.setFlag('world', key, value);
    }

    /**
     * @returns {string}
     */
    getDescription() {
        return this.item.system.description.value;
    }

    /**
     * @param {string} value
     */
    async setDescription(value) {
        await this.item.update({ 'system.description.value': value });
    }
}

/**
 * @augments ItemProps<Item5e.Data.Weapon>
 */
export class WeaponProps extends ItemProps {

    /**
     * @returns {boolean}
     */
    getIsAttuned() {
        // @ts-expect-error
        const attunedValue = CONFIG.DND5E?.attunementTypes?.ATTUNED;
        if (typeof attunedValue !== 'number') {
            throw new Error('Cannot find int flag for ATTUNED');
        }

        return this.item.system.attunement === attunedValue;
    }

    /**
     * @returns {string}
     */
    getAttackBonusFormula() {
        // @ts-expect-error
        return this.item.system.attackBonus;
    }

    /**
     * @param {string} value
     */
    async setAttackBonusFormula(value) {
        // @ts-expect-error
        await this.item.update({ 'system.attackBonus': value });
    }

    /**
     * @returns {string}
     */
    getDamageFormula() {
        return this.item.system.damage.parts[0][0];
    }

    /**
     * @param {string} value
     */
    async setDamageFormula(value) {
        /**
         * @type {Item5e.Data.Weapon['damage']}
         */
        const newDamage = {
            ...this.item.system.damage,
            parts: [
                [value, this.item.system.damage.parts[0][1]],
                ...this.item.system.damage.parts.slice(1),
            ],
        };

        await this.item.update({ 'system.damage': newDamage });
    }

    /**
     * @returns {string}
     */
    getVersatileDamageFormula() {
        return this.item.system.damage.versatile;
    }

    /**
     * @param {string} value
     */
    async setVersatileDamageFormula(value) {
        const newDamage = {
            ...this.item.system.damage,
            versatile: value,
        };

        await this.item.update({ 'system.damage': newDamage });
    }
}

/**
 * @augments ItemProps<Item5e.Templates.ActivatedEffect>
 */
export class ActivationItemProps extends ItemProps {

    /**
     * @returns {number}
     */
    getCurrentUses() {
        return this.item.system.uses.value;
    }

    /**
     * @param {number} value
     */
    async setCurrentUses(value) {
        await this.item.update({ 'system.uses.value': value });
    }
}
