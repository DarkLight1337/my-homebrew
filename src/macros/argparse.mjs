/**
 * @template {{}} D
 * @typedef {import('./actor.mjs').ActorWithSystem<D>} ActorWithSystem
 */

/**
 * @template {{}} D
 * @typedef {import('./item.mjs').ItemWithSystem<D>} ItemWithSystem
 */

/**
 * @typedef {object} ParsedDAEItemMacroArgs
 * @property {?ItemWithSystem<any>} originItem
 * @property {ActorWithSystem<any>} targetActor
 */

/**
 * @typedef {object} RawDAEItemMacroArgs
 * @property {string} origin
 * @property {string} actorUuid
 */

/**
 * This is applicable to Item Macros that are called by DAE under `macro.itemMacro`.
 * 
 * @param {[...unknown[], RawDAEItemMacroArgs]} args
 * @returns {Promise<ParsedDAEItemMacroArgs>}
 */
export async function parseDAEItemMacroArgs(args) {
    /**
     * @type {RawDAEItemMacroArgs}
     */
    // @ts-expect-error
    const lastArg = args[args.length - 1];

    const originUuid = lastArg.origin;
    if (typeof originUuid !== 'string') {
        console.error('originUuid:', originUuid);
        throw new Error('The origin UUID is not a string.');
    }

    const targetUuid = lastArg.actorUuid;
    if (typeof targetUuid !== 'string') {
        console.error('targetUuid:', targetUuid);
        throw new Error('The target UUID is not a string.');
    }

    const originItemOrActor = await fromUuid(originUuid);
    let originItem;
    if (originItemOrActor instanceof dnd5e.documents.Item5e) {
        originItem = originItemOrActor;
    } else {
        originItem = null;
    }

    const targetTokenOrActor = await fromUuid(targetUuid);
    let targetActor;
    if (targetTokenOrActor instanceof Token) {
        targetActor = targetTokenOrActor.actor;
    }
    if (targetTokenOrActor instanceof dnd5e.documents.Actor5e) {
        targetActor = targetTokenOrActor;
    } else {
        console.error('targetTokenOrActor:', targetTokenOrActor);
        throw new Error('The entity is not a 5e actor.');
    }

    return { originItem, targetActor };
}

/**
 * @typedef {object} ParsedMidiQOLMacroArgs
 * @property {string} macroPass
 * @property {ActorWithSystem<any>} actor
 * @property {TokenDocument} token
 * @property {ItemWithSystem<any>} item
 * @property {string} [itemCardId]
 * @property {TokenDocument[]} targets
 * @property {TokenDocument[]} hitTargets
 * @property {Roll} [damageRoll]
 * @property {boolean} isCritical
 * @property {InstanceType<typeof MidiQOL.Workflow>} workflow
 */

/**
 * @typedef {object} RawMidiQOLFunctionMacroArgs
 * @property {[RawMidiQOLItemMacroArgs]} args
 */

/**
 * This is applicable to Function Macros that are called by DAE under
 * `flags.midi-qol.onUseMacroName`.
 * Note that the parsed parameters are based on the triggering actor rather than the actor that is
 * currently under the active effect.
 * 
 * @param {RawMidiQOLFunctionMacroArgs} args
 * @returns {Promise<ParsedMidiQOLMacroArgs>}
 */
export async function parseMidiQOLFunctionMacroArgs(args) {
    return parseMidiQOLItemMacroArgs(args.args);
}

/**
 * @typedef {object} RawMidiQOLItemMacroArgs
 * @property {string} macroPass
 * @property {string} actorUuid
 * @property {string} tokenUuid
 * @property {string} itemUuid
 * @property {string} [itemCardId]
 * @property {TokenDocument[]} targets
 * @property {TokenDocument[]} hitTargets
 * @property {Roll} [damageRoll]
 * @property {boolean} isCritical
 * @property {InstanceType<typeof MidiQOL.Workflow>} workflow
 */

/**
 * This is applicable to Item Macros that are called by Midi-QOL when the item is used.
 * 
 * This is also applicable to Item Macros called by DAE under `flags.midi-qol.onUseMacroName`.
 * Note that the parsed parameters are based on the triggering actor rather than the actor that is
 * currently under the active effect.
 * 
 * @param {[RawMidiQOLItemMacroArgs]} args
 * @returns {Promise<ParsedMidiQOLMacroArgs>}
 */
export async function parseMidiQOLItemMacroArgs(args) {
    const firstArg = args[0];

    const macroPass = firstArg.macroPass;
    if (typeof macroPass !== 'string') {
        console.error('macroPass:', macroPass);
        throw new Error('The macro pass is not a string');
    }

    const tokenUuid = firstArg.tokenUuid;
    if (typeof tokenUuid !== 'string') {
        console.error('tokenUuid:', tokenUuid);
        throw new Error('The token UUID is not a string.');
    }

    const itemUuid = firstArg.itemUuid;
    if (typeof itemUuid !== 'string') {
        console.error('itemUuid:', itemUuid);
        throw new Error('The item UUID is not a string.');
    }

    const itemCardId = firstArg.itemCardId;
    if (itemCardId != null && typeof itemCardId !== 'string') {
        console.error('itemCardId:', itemCardId);
        throw new Error('The item card UUID is not a string.');
    }

    const targets = firstArg.targets;
    if (!Array.isArray(targets)) {
        console.error('targets:', targets);
        throw new Error('The list of targets is not an array.');
    }

    const hitTargets = firstArg.hitTargets;
    if (!Array.isArray(hitTargets)) {
        console.error('hitTargets:', hitTargets);
        throw new Error('The list of hit targets is not an array.');
    }

    const damageRoll = firstArg.damageRoll ?? undefined;
    if (damageRoll != null && !(damageRoll instanceof Roll)) {
        console.error('damageRoll:', damageRoll);
        throw new Error('The damage roll is not a Roll object.');
    }

    const isCritical = firstArg.isCritical ?? false;
    if (typeof isCritical !== 'boolean') {
        console.error('isCritical:', isCritical);
        throw new Error('The critical flag is not a boolean.');
    }

    const workflow = firstArg.workflow;
    if (!(workflow instanceof MidiQOL.Workflow)) {
        console.error('workflow:', workflow);
        throw new Error('The workflow is not a Workflow instance.');
    }

    const token = await fromUuid(tokenUuid);
    if (token == null) {
        throw new Error(`Cannot find token with UUID: ${tokenUuid}`);
    }
    if (!(token instanceof TokenDocument)) {
        console.error('token:', token);
        throw new Error('The entity is not a token.');
    }

    const actor = token.actor;
    if (!(actor instanceof dnd5e.documents.Actor5e)) {
        console.error('actor:', actor);
        throw new Error('The entity is not a 5e actor.');
    }

    const item = await fromUuid(itemUuid);
    if (item == null) {
        throw new Error(`Cannot find item with UUID: ${itemUuid}`);
    }
    if (!(item instanceof dnd5e.documents.Item5e)) {
        console.error('item:', item);
        throw new Error('The entity is not a 5e item.');
    }

    return {
        macroPass,
        actor,
        token,
        item,
        itemCardId,
        targets,
        hitTargets,
        damageRoll,
        isCritical,
        workflow,
    };
}
