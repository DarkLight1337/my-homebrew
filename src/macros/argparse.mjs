/**
 * @template {{}} D
 * @typedef {import('./actor.mjs').ActorWithSystem<D>} ActorWithSystem
 */

/**
 * @template {{}} D
 * @typedef {import('./item.mjs').ItemWithSystem<D>} ItemWithSystem
 */

/**
 * @typedef {object} RawMidiQOLMacroParams
 * @property {string} macroPass
 * @property {string} actorUuid
 * @property {string} tokenUuid
 * @property {string} itemUuid
 * @property {string | undefined} itemCardId
 * @property {TokenDocument[]} targets
 * @property {TokenDocument[]} hitTargets
 * @property {?Roll} damageRoll
 * @property {boolean} isCritical
 */

/**
 * @typedef {object} ParsedMidiQOLMacroParams
 * @property {string} macroPass
 * @property {ActorWithSystem<any>} actor
 * @property {TokenDocument} token
 * @property {ItemWithSystem<any>} item
 * @property {string | undefined} itemCardId
 * @property {TokenDocument[]} targets
 * @property {TokenDocument[]} hitTargets
 * @property {?Roll} damageRoll
 * @property {boolean} isCritical
 */

/**
 * @param {unknown[]} args
 * @returns {Promise<ParsedMidiQOLMacroParams>}
 */
export async function parseMidiQOLMacroArgs(args) {
    const firstArg = args[0];

    // @ts-expect-error
    const macroPass = firstArg.macroPass;
    if (typeof macroPass !== 'string') {
        console.error('macroPass:', macroPass);
        throw new Error('The macro pass is not a string');
    }

    // @ts-expect-error
    const tokenUuid = firstArg.tokenUuid;
    if (typeof tokenUuid !== 'string') {
        console.error('tokenUuid:', tokenUuid);
        throw new Error('The token UUID is not a string.');
    }

    // @ts-expect-error
    const itemUuid = firstArg.itemUuid;
    if (typeof itemUuid !== 'string') {
        console.error('itemUuid:', itemUuid);
        throw new Error('The item UUID is not a string.');
    }

    // @ts-expect-error
    const itemCardId = firstArg.itemCardId;
    if (itemCardId != null && typeof itemCardId !== 'string') {
        console.error('itemCardId:', itemCardId);
        throw new Error('The item card UUID is not a string.');
    }

    // @ts-expect-error
    const targets = firstArg.targets;
    if (!Array.isArray(targets)) {
        console.error('targets:', targets);
        throw new Error('The list of targets is not an array.');
    }

    // @ts-expect-error
    const hitTargets = firstArg.hitTargets;
    if (!Array.isArray(hitTargets)) {
        console.error('hitTargets:', hitTargets);
        throw new Error('The list of hit targets is not an array.');
    }

    // @ts-expect-error
    const damageRoll = firstArg.damageRoll ?? null;
    if (damageRoll != null && !(damageRoll instanceof Roll)) {
        console.error('damageRoll:', damageRoll);
        throw new Error('The damage roll is not a Roll object.');
    }

    // @ts-expect-error
    const isCritical = firstArg.isCritical ?? false;
    if (typeof isCritical !== 'boolean') {
        console.error('isCritical:', isCritical);
        throw new Error('The critical flag is not a boolean.');
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
    };
}

/**
 * @typedef {object} RawDAEMacroParams
 * @property {string} origin
 * @property {string} actorUuid
 */

/**
 * @typedef {object} ParsedDAEMacroParams
 * @property {?ItemWithSystem<any>} originItem
 * @property {ActorWithSystem<any>} targetActor
 */

/**
 * @param {unknown[]} args
 * @returns {Promise<ParsedDAEMacroParams>}
 */
export async function parseDAEMacroArgs(args) {
    const lastArg = args[args.length - 1];

    // @ts-expect-error
    const originUuid = lastArg.origin;
    if (typeof originUuid !== 'string') {
        console.error('originUuid:', originUuid);
        throw new Error('The origin UUID is not a string.');
    }

    // @ts-expect-error
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
