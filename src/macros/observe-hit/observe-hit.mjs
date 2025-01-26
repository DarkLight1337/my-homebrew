import { runMidiQOLItemMacro } from '../runner.mjs';

/**
 * https://gitlab.com/tposney/midi-qol/-/blob/v12dnd4/src/module/utils.ts#L3740
 * 
 * @template {dnd5e_.SystemDataModel} D 
 * @param {dnd5e_.Item5e<D>} item 
 * @param {string} triggerType
 * @param {number} maxLevel
 * @param {boolean} onlyZeroCost
 * @returns {any[]}
 */
function getValidReactions(item, triggerType, maxLevel, onlyZeroCost) {
    // TODO most of the checks need to be activity checks
    if (!item.system.activities) return [];
    if (!item.system.attuned && item.system.attunement === 'required') return [];

    const validReactions = [];

    for (const activity of item.system.activities) {
        if (activity.activation?.type?.includes('reaction')) {
            if (activity.activation.type !== 'reaction') {
                console.error(`itemReaction | item ${item.name} ${activity.name} has a reaction type of ${activity.activation.type} which is deprecated - please update to reaction and reaction conditions`)
            }

            // TODO can't specify 0 cost reactions in dnd5e 4.x - have to find another way
            if (!onlyZeroCost || (activity.activation?.value ?? 1) === 0) {
                validReactions.push(activity);
            }
        }
    }

    return validReactions;
}

/**
 * @param {unknown[]} args
 */
export async function observeHit(args) {
    await runMidiQOLItemMacro(args, async ({ hitTargets, workflow }) => {
        if (workflow.attackRoll && hitTargets.length > 0) {
            const effect = workflow.actor.effects.getName('Observe Hit (In Aura)');
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

            const triggerType = 'reaction';
            const maxLevel = 9;
            const hasUsedReaction = MidiQOL.hasUsedReaction(originActor);
            const candidateActivities = originActor.items
                .map((item) => getValidReactions(item, triggerType, maxLevel, hasUsedReaction))
                .flat();
            if (!candidateActivities) return;

            for (const target of hitTargets) {
                // @ts-expect-error
                // eslint-disable-next-line no-await-in-loop
                await MidiQOL.socket().executeAsUser('chooseReactions', promptPlayer.id, {
                    tokenUuid: promptToken.uuid,
                    reactionFlavor: `<h4>${workflow.actor.name} has hit ${target.name}. Do you wish to react against ${target.name}?</h4>`,
                    reactionActivityList: candidateActivities,
                    triggerTokenUuid: target.uuid,
                    triggerType: triggerType,
                    options: {},
                });
            }
        }
    });
}
