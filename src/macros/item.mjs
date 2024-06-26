/**
 * @template {dnd5e_.SystemDataModel} D 
 * @param {string} name
 * @returns {Promise<dnd5e_.Item5e<D>>}
 */
export async function getCompendiumItem(name) {
    if (game.packs == null) {
        throw new Error('The game is not yet ready');
    }

    const pack = game.packs.get('my-homebrew.my-homebrew');
    if (pack == null) {
        throw new Error('Cannot find compendium pack for My Homebrew');
    }

    await pack.getIndex();
    const itemId = pack.index.getName(name, { strict: true })._id;

    return pack.getDocument(itemId);
}

/**
 * @template {dnd5e_.SystemDataModel} D
 */
export class ItemProps {

    /**
     * @param {dnd5e_.Item5e<D>} item 
     */
    constructor(item) {
        this.item = item;
    }

    /**
     * @param {string} key
     * @returns {unknown}
     */
    getCustomItemFlag(key) {
        try {
            return this.item.getFlag('world', key);
        } catch (e) {
            // Fallback when the item is not real
            // @ts-expect-error
            return foundry.utils.getProperty(this.item.flags?.world ?? {}, key);
        }
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
        // @ts-expect-error
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
 * @augments ItemProps<dnd5e_.WeaponData>
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

        // @ts-expect-error
        return this.item.system.attunement === attunedValue;
    }

    /**
     * @returns {string}
     */
    getAttackBonusFormula() {
        // @ts-expect-error
        return this.item.system.attack.bonus;
    }

    /**
     * @param {string} value
     */
    async setAttackBonusFormula(value) {
        await this.item.update({ 'system.attack.bonus': value });
    }

    /**
     * @returns {string}
     */
    getDamageFormula() {
        // @ts-expect-error
        return this.item.system.damage.parts[0][0];
    }

    /**
     * @param {string} value
     */
    async setDamageFormula(value) {
        const newDamage = {
            // @ts-expect-error
            ...this.item.system.damage,
            parts: [
                // @ts-expect-error
                [value, this.item.system.damage.parts[0][1]],
                // @ts-expect-error
                ...this.item.system.damage.parts.slice(1),
            ],
        };

        await this.item.update({ 'system.damage': newDamage });
    }

    /**
     * @returns {string}
     */
    getVersatileDamageFormula() {
        // @ts-expect-error
        return this.item.system.damage.versatile;
    }

    /**
     * @param {string} value
     */
    async setVersatileDamageFormula(value) {
        const newDamage = {
            // @ts-expect-error
            ...this.item.system.damage,
            versatile: value,
        };

        await this.item.update({ 'system.damage': newDamage });
    }
}

/**
 * @augments ItemProps<dnd5e_.ActivatedEffectTemplate>
 */
export class ActivationItemProps extends ItemProps {

    /**
     * @returns {number}
     */
    getCurrentUses() {
        // @ts-expect-error
        return this.item.system.uses.value;
    }

    /**
     * @param {number} value
     */
    async setCurrentUses(value) {
        await this.item.update({ 'system.uses.value': value });
    }
}
