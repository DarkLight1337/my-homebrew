import { ChatContext } from '../chat.mjs';
import { WeaponProps, getCompendiumItem } from '../item.mjs';
import { runMidiQOLItemMacro } from '../runner.mjs';

/**
 * @param {string} s
 * @returns {string}
 */
function toSentenceCase(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

class FlameTongueItemProps {

    /**
     * @type {WeaponProps}
     */
    #props;

    /**
     * @type {ChatContext}
     */
    #chat;

    /**
     * @param {dnd5e_.Item5e<dnd5e_.WeaponData>} item
     */
    constructor(item) {
        this.item = item;

        this.#props = new WeaponProps(item);
        this.#chat = new ChatContext(item.name);
    }

    /**
     * @param {?number} initValue
     * @returns {?number}
     */
    getEffectType(initValue = null) {
        // Initially, the flag is not set.
        // In that case, this function should still return `initValue`
        const prevEffectType = this.#props.getCustomItemFlag('prevEffectType');
        if (prevEffectType == null) return initValue;
        if (typeof prevEffectType !== 'number') {
            throw new Error('The effect type of not a number');
        }

        // A value of `-1` represents `null` (see this.setEffectType)
        return (prevEffectType === -1) ? null : prevEffectType;
    }

    /**
     * @param {?number} value
     */
    async setEffectType(value) {
        await this.#props.setCustomItemFlag('prevEffectType', value ?? -1);
    }

    static DURABILITY_REGEXP = /<h2>Durability \[([0-9]+)\/([0-9]+)\]<\/h2>/;

    /**
     * @returns {number}
     */
    getCurrentDurability() {
        const matches = this.#props.getDescription().match(FlameTongueItemProps.DURABILITY_REGEXP);

        const currentDurability = matches?.[1];
        if (currentDurability == null) throw new Error('Cannot find current durability');

        return Number.parseInt(currentDurability, 10);
    }

    /**
     * @param {number} value
     */
    async setCurrentDurability(value) {
        const newDurabilityText = `<h2>Durability [${value.toFixed(0)}/$2]</h2>`;

        const prevDescription = this.#props.getDescription();

        let newDescription = null;
        if (prevDescription.match(FlameTongueItemProps.DURABILITY_REGEXP) == null) {
            this.#chat.sendDetails('Cannot find durability to replace. Please set the durability header manually.');
        } else {
            newDescription = prevDescription.replace(
                FlameTongueItemProps.DURABILITY_REGEXP,
                newDurabilityText,
            );
        }

        if (newDescription != null) {
            await this.#props.setDescription(newDescription);
        }
    }

    /**
     * @returns {number}
     */
    getMaxDurability() {
        const matches = this.#props.getDescription().match(FlameTongueItemProps.DURABILITY_REGEXP);

        const maxDurability = matches?.[2];
        if (maxDurability == null) throw new Error('Cannot find max durability');

        return Number.parseInt(maxDurability, 10);
    }

    /**
     * @param {number} value
     */
    async setMaxDurability(value) {
        const newDurabilityText = `<h2>Durability [$1/${value.toFixed(0)}]</h2>`;

        const prevDescription = this.#props.getDescription();

        let newDescription = null;
        if (prevDescription.match(FlameTongueItemProps.DURABILITY_REGEXP) == null) {
            this.#chat.sendDetails('Cannot find durability to replace. Please set the durability header manually.');
        } else {
            newDescription = prevDescription.replace(
                FlameTongueItemProps.DURABILITY_REGEXP,
                newDurabilityText,
            );
        }

        if (newDescription != null) {
            await this.#props.setDescription(newDescription);
        }
    }

    /**
     * @returns {boolean}
     */
    getIsAttuned() {
        return this.#props.getIsAttuned();
    }

    // Initially, the attack bonus should have a trailing "- X" to indicate the penalty from fusion
    static ATTACK_PENALTY_REGEXP = /-\s*([0-9]+)$/;

    /**
     * @returns {boolean}
     */
    getIsFused() {
        const matches = this.#props.getAttackBonusFormula()
            .match(FlameTongueItemProps.ATTACK_PENALTY_REGEXP);

        const attackPenalty = matches?.[1];
        if (attackPenalty == null) return false;

        return Number.parseInt(attackPenalty, 10) !== 0;
    }

    /**
     * @param {boolean} isFused
     */
    async setIsFused(isFused) {
        const newAttackPenaltyText = isFused ? '-2' : '';

        const prevAttackBonusFormula = this.#props.getAttackBonusFormula();

        let newAttackBonusFormula = null;
        if (prevAttackBonusFormula.match(FlameTongueItemProps.ATTACK_PENALTY_REGEXP) == null) {
            newAttackBonusFormula = `${prevAttackBonusFormula} ${newAttackPenaltyText}`;
        } else {
            newAttackBonusFormula = prevAttackBonusFormula.replace(
                FlameTongueItemProps.ATTACK_PENALTY_REGEXP,
                newAttackPenaltyText,
            );
        }

        if (newAttackBonusFormula != null) {
            await this.#props.setAttackBonusFormula(newAttackBonusFormula);
        }
    }

    // Initially, the damage formula should have a trailing "- X" to
    // indicate the penalty from durability loss
    static DAMAGE_PENALTY_REGEXP = /-\s*([0-9]+)$/;

    async updateDamagePenalty() {
        const currentDurability = this.getCurrentDurability();
        const maxDurability = this.getMaxDurability();
        const newDamagePenaltyText = `- ${maxDurability - currentDurability}`;

        const prevDamageFormula = this.#props.getDamageFormula();
        let newDamageFormula;

        if (prevDamageFormula.match(FlameTongueItemProps.DAMAGE_PENALTY_REGEXP) == null) {
            newDamageFormula = `${prevDamageFormula} ${newDamagePenaltyText}`;
        } else {
            newDamageFormula = prevDamageFormula.replace(
                FlameTongueItemProps.DAMAGE_PENALTY_REGEXP,
                newDamagePenaltyText,
            );
        }

        const prevVersatileDamageFormula = this.#props.getVersatileDamageFormula();
        let newVersatileDamageFormula;

        if (prevVersatileDamageFormula.match(FlameTongueItemProps.DAMAGE_PENALTY_REGEXP) == null) {
            newVersatileDamageFormula = `${prevVersatileDamageFormula} ${newDamagePenaltyText}`;
        } else {
            newVersatileDamageFormula = prevVersatileDamageFormula.replace(
                FlameTongueItemProps.DAMAGE_PENALTY_REGEXP,
                newDamagePenaltyText,
            );
        }

        if (newDamageFormula != null) {
            await this.#props.setDamageFormula(newDamageFormula);
        }

        if (newVersatileDamageFormula != null) {
            await this.#props.setVersatileDamageFormula(newVersatileDamageFormula);
        }
    }
}

/**
 * @typedef {object} FudgedRolls
 * @property {?number} [effectTrigger]
 * @property {?number} [effectType]
 */

class MacroHandler {

    /**
     * @type {FlameTongueItemProps}
     */
    #itemProps;

    /**
     * @type {ChatContext}
     */
    #chat;

    /**
     * @param {Parameters<Parameters<runMidiQOLItemMacro>[1]>[0]} macroArgs
     * @param {FudgedRolls} fudgedRolls
     */
    constructor(macroArgs, fudgedRolls = {}) {
        this.macroArgs = macroArgs;
        this.fudgedRolls = fudgedRolls;

        // @ts-expect-error
        this.#itemProps = new FlameTongueItemProps(macroArgs.item);
        this.#chat = new ChatContext(macroArgs.item.name);
    }

    /**
     * @param {string} name
     * @returns {Promise<dnd5e_.Item5e<dnd5e_.WeaponData>>}
     */
    #getDerivedItem(name) {
        return getCompendiumItem(`Unstable Flame: ${name}`);
    }

    /**
     * @param {{
     *     targets: foundry_.TokenDocument[];
     *     damageRoll: foundry_.Roll;
     *     damageType: string;
     * }} params
     */
    async #applyDamage({ targets, damageRoll, damageType }) {
        if (damageRoll.total == null) {
            throw new Error(`The damage roll has not been evaluated yet: ${damageRoll}`);
        }

        const { actor, token, itemCardId } = this.macroArgs;

        // eslint-disable-next-line no-new
        new MidiQOL.DamageOnlyWorkflow(
            actor,
            token,
            damageRoll.total,
            damageType,
            // @ts-expect-error
            targets,
            damageRoll,
            { flavor: `(${toSentenceCase(damageType)})`, itemCardId: itemCardId },
        );
    }

    /**
     * @param {dnd5e_.Item5e<dnd5e_.WeaponData>} item
     */
    async #applyAoE(item) {
        await MidiQOL.completeItemUse(item, {}, { checkGMStatus: true });
    }

    async handleOnAttack() {
        const currentDurability = this.#itemProps.getCurrentDurability();
        const maxDurability = this.#itemProps.getMaxDurability();
        const isAttuned = this.#itemProps.getIsAttuned();
        const isFused = this.#itemProps.getIsFused();

        this.#chat.sendDetails(`Attuned: ${isAttuned} | Durability: ${currentDurability}/${maxDurability} | Fused: ${isFused}`);

        const effectType = await this.#rollEffectTrigger({ isAttuned });
        await this.#itemProps.setEffectType(effectType);

        await this.#itemProps.updateDamagePenalty();
    }

    /**
     * @param {{ isAttuned?: boolean }} params
     * @returns {Promise<?number>}
     */
    async #rollEffectTrigger({ isAttuned }) {
        const effectTrigger = this.fudgedRolls.effectTrigger || (await new Roll('1d4').evaluate()).total;
        this.#chat.sendDetails(`Effect trigger: 1d4 -> ${effectTrigger}`);

        switch (effectTrigger) {
            case 1:
                return this.#rollEffectType();
            case 2:
                return isAttuned ? this.#rollEffectType() : null;
            case 3:
                return null;
            case 4:
                return null;
            default:
                throw new Error(`Invalid effectTrigger: ${effectTrigger}`);
        }
    }

    /**
     * @param {{ isReroll?: boolean }} params
     * @returns {Promise<number>}
     */
    async #rollEffectType({ isReroll = false } = {}) {
        const effectType = this.fudgedRolls.effectType || (await new Roll('1d6').evaluate()).total;
        if (isReroll) {
            this.#chat.sendDetails(`Effect type: 1d6 -> 6 -> ${effectType}`);
        } else {
            this.#chat.sendDetails(`Effect type: 1d6 -> ${effectType}`);
        }

        switch (effectType) {
            case 1: {
                this.#chat.sendMessage('The sword screams in the tone of a human male in his 40s!');

                const effectItem = await this.#getDerivedItem('Scream');
                await this.#rollAoE(effectItem);

                return 1;
            }
            case 2: {
                this.#chat.sendMessage('The sword emits a flash of bright light!');

                const effectItem = await this.#getDerivedItem('Flash');
                await this.#rollAoE(effectItem);

                return 2;
            }
            case 3: {
                this.#chat.sendMessage('The sword expels a cloud of smoke.');

                const effectItem = await this.#getDerivedItem('Smoke');
                await this.#rollAoE(effectItem);

                return 3;
            }
            case 4: {
                this.#chat.sendMessage('The sword heats up and sparks.');

                // Defer to OnHitHandler

                return 4;
            }
            case 5: {
                this.#chat.sendMessage('The sword is briefly wreathed in flame!');

                // Defer to OnHitHandler

                return 5;
            }
            case 6: {
                if (isReroll) {
                    this.#chat.sendMessage('The sword explodes in your hands!!');

                    const effectItem = await this.#getDerivedItem('Explode');
                    await this.#rollAoE(effectItem);

                    const prevIsFused = this.#itemProps.getIsFused();
                    await this.#itemProps.setIsFused(false);
                    if (prevIsFused) {
                        this.#chat.sendMessage('The longsword tip is blasted away from the sword!');
                    }

                    await this.#itemProps.setCurrentDurability(
                        this.#itemProps.getCurrentDurability() - 1);
                    this.#chat.sendMessage(`The sword now has ${this.#itemProps.getCurrentDurability()}/${this.#itemProps.getMaxDurability()} durability points.`);

                    return 6;
                }

                return this.#rollEffectType({ isReroll: true });
            }
            default:
                throw new Error(`Invalid effectType on attack: ${effectType}`);
        }
    }

    /**
     * @param {dnd5e_.Item5e<dnd5e_.WeaponData>} item
     */
    async #rollAoE(item) {
        const { actor } = this.macroArgs;

        // Add the auxillary item to the spellbook if it is not there; otherwise update it
        // We do not delete the auxillary item afterwards as that may prematurely cancel the effect

        let auxItem = actor.items.getName(item.name);
        if (auxItem == null) {
            await actor.createEmbeddedDocuments('Item', [item.toObject()]);
            const newItem = actor.items.getName(item.name, { strict: true });
            auxItem = newItem;
        } else {
            await auxItem.update(item.toObject());
        }

        // @ts-expect-error
        await this.#applyAoE(auxItem);
    }

    async handleOnHit() {
        const effectType = this.#itemProps.getEffectType();

        // This occurs when user rolls the damage without any effect triggered
        if (effectType == null) return;

        switch (effectType) {
            case 1:
            case 2:
            case 3:
                break;
            case 4: {
                const { hitTargets, damageRoll, isCritical } = this.macroArgs;
                if (hitTargets.length === 0 || damageRoll == null) return;

                const diceMult = isCritical ? 2 : 1;

                await this.#rollHitDamage({ targets: hitTargets, diceCount: 1 * diceMult, diceSize: 6, damageType: 'fire' });
                break;
            }
            case 5: {
                const { hitTargets, damageRoll, isCritical } = this.macroArgs;
                if (hitTargets.length === 0 || damageRoll == null) return;

                const diceMult = isCritical ? 2 : 1;

                await this.#rollHitDamage({ targets: hitTargets, diceCount: 2 * diceMult, diceSize: 6, damageType: 'fire' });
                break;
            }
            case 6:
                break;
            default:
                throw new Error(`Invalid effectType on hit: ${effectType}`);
        }
    }

    /**
     * @param {{
     *     targets: foundry_.TokenDocument[];
     *     diceCount: number;
     *     diceSize: number;
     *     damageType: string;
     * }} params
     */
    async #rollHitDamage({ targets, diceCount, diceSize, damageType }) {
        const damageRoll = await new Roll(`${diceCount}d${diceSize}[${damageType}]`).evaluate();
        await this.#applyDamage({ targets, damageRoll, damageType });
    }

    async handleMacroPass() {
        switch (this.macroArgs.macroPass) {
            case 'postAttackRoll':
                await this.handleOnAttack();
                break;
            case 'postActiveEffects':
                await this.handleOnHit();
                break;
            default:
                break;
        }
    }
}

/**
 * @param {unknown[]} args
 * @param {FudgedRolls} fudgedRolls
 */
export async function halfMeltedFlameTongue(args, fudgedRolls) {
    await runMidiQOLItemMacro(args, async (macroArgs) => {
        await new MacroHandler(macroArgs, fudgedRolls).handleMacroPass();
    });
}
