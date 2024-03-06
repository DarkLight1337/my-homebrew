import { runMidiQOLItemMacro } from '../runner.mjs';

/**
 * https://gitlab.com/tposney/midi-qol/-/blob/dnd3/src/module/utils.ts?ref_type=heads#L3662
 * 
 * @template {dnd5e_.SystemDataModel} D 
 * @param {dnd5e_.Item5e<D>} item 
 * @param {string} triggerType
 * @param {number} maxLevel
 * @param {boolean} onlyZeroCost
 * @returns {boolean}
 */
function itemReaction(item, triggerType, maxLevel, onlyZeroCost) {
    // @ts-expect-error
    const { activation, preparation, level, attunement } = item.system;

    if (!activation?.type?.includes('reaction')) return false;
    if (activation?.cost > 0 && onlyZeroCost) return false;
    if (item.type === 'spell') {
        if (MidiQOL.configSettings().ignoreSpellReactionRestriction) return true;
        if (preparation.mode === 'atwill') return true;
        if (level === 0) return true;
        if (preparation?.prepared !== true && preparation?.mode === 'prepared') return false;
        if (preparation.mode !== 'innate') return level <= maxLevel;
    }
    if (attunement === dnd5e.config.attunementTypes.REQUIRED) return false;

    // @ts-expect-error
    if (!item._getUsageUpdates({
        consumeUsage: item.hasLimitedUses,
        consumeResource: item.hasResource,
        slotLevel: null,
    })) return false;

    return true;
}

/**
 * @param {unknown[]} args
 */
export async function observeHit(args) {
    await runMidiQOLItemMacro(args, async ({ hitTargets, workflow }) => {
        if (workflow.attackRoll && hitTargets.length > 0) {
            const effect = workflow.actor.effects.getName('Observe Hit');
            if (!effect) return;

            /**
             * @type {dnd5e_.Item5e<dnd5e_.SystemDataModel>}
             */
            const originItem = await fromUuid(effect.origin);
            if (!(originItem instanceof dnd5e.documents.Item5e)) {
                throw new Error('The triggering item is not an instance of Item5e.');
            }

            const originActor = originItem.actor;
            if (!originActor) return;

            const originToken = MidiQOL.tokenForActor(originActor);
            if (!originToken) return;

            const originPlayer = MidiQOL.playerForActor(originItem.actor);
            if (!originPlayer) return;

            const promptToken = (originToken instanceof TokenDocument) ? originToken
                : originToken.document;

            const promptPlayer = originPlayer.active ? originPlayer : game.users?.activeGM;
            if (!promptPlayer) return;

            const triggerType = 'reactionmanual';
            const maxLevel = 9;
            const hasUsedReaction = MidiQOL.hasUsedReaction(originActor);

            for (const target of hitTargets) {
                // @ts-expect-error
                // eslint-disable-next-line no-await-in-loop
                await MidiQOL.socket().executeAsUser('chooseReactions', promptPlayer.id, {
                    tokenUuid: promptToken.uuid,
                    reactionFlavor: `<h4>${workflow.actor.name} has hit ${target.name}. Do you wish to react against ${target.name}?</h4>`,
                    reactionItemList: originActor.items.filter(
                        (item) => itemReaction(item, triggerType, maxLevel, hasUsedReaction)),
                    // @ts-expect-error
                    triggerTokenUuid: target.uuid,
                    triggerType: triggerType,
                    options: {},
                });
            }
        }
    });
}
