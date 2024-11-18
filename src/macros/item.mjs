/**
 * @template {dnd5e_.SystemDataModel} D 
 * @param {string} name
 * @returns {Promise<dnd5e_.Item5e<D>>}
 */
export async function getCompendiumEquipment(name) {
    if (game.packs == null) {
        throw new Error('The game is not yet ready');
    }

    const pack = game.packs.get('my-homebrew.equipment');
    if (pack == null) {
        throw new Error('Cannot find compendium pack for Equipment');
    }

    await pack.getIndex();
    const itemId = pack.index.getName(name, { strict: true })._id;

    return pack.getDocument(itemId);
}

/**
 * @template {dnd5e_.SystemDataModel} D 
 * @param {string} name
 * @returns {Promise<dnd5e_.Item5e<D>>}
 */
export async function getCompendiumFeature(name) {
    if (game.packs == null) {
        throw new Error('The game is not yet ready');
    }

    const pack = game.packs.get('my-homebrew.features');
    if (pack == null) {
        throw new Error('Cannot find compendium pack for Features');
    }

    await pack.getIndex();
    const itemId = pack.index.getName(name, { strict: true })._id;

    return pack.getDocument(itemId);
}

/**
 * @param {string} name
 * @returns {Promise<foundry_.RollTable>}
 */
export async function getCompendiumRollTable(name) {
    if (game.packs == null) {
        throw new Error('The game is not yet ready');
    }

    const pack = game.packs.get('my-homebrew.rolltables');
    if (pack == null) {
        throw new Error('Cannot find compendium pack for Roll Tables');
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
        await this.item.update({
            // @ts-expect-error
            'system.uses.spent': this.item.system.uses.max - value,
            'system.uses.value': value,
        });
    }

    /**
     * @returns {number}
     */
    getMaxUses() {
        // @ts-expect-error
        return this.item.system.uses.max;
    }

    /**
     * @param {number} value
     */
    async setMaxUses(value) {
        await this.item.update({
            // @ts-expect-error
            'system.uses.max': this.item.system.uses.max,
        });
    }
}

/**
 * @augments ActivationItemProps
 */
export class WeaponProps extends ActivationItemProps {

    /**
     * @returns {boolean}
     */
    getIsAttuned() {
        // @ts-expect-error
        return this.item.system.attuned;
    }

    /**
     * @returns {foundry_.Collection<foundry_.ActiveEffect>}
     */
    getEffects() {
        return this.item.effects;
    }

    /**
     * @returns {string}
     */
    getDamageBonus() {
        // @ts-expect-error
        return this.item.system.damage.base.bonus;
    }

    /**
     * @param {string} value
     */
    async setDamageBonus(value) {
        await this.item.update({ 'system.damage.base.bonus': value });
    }

    /**
     * @returns {string}
     */
    getVersatileDamageBonus() {
        // @ts-expect-error
        return this.item.system.damage.versatile.bonus;
    }

    /**
     * @param {string} value
     */
    async setVersatileDamageBonus(value) {
        await this.item.update({ 'system.damage.versatile.bonus': value });
    }
}
