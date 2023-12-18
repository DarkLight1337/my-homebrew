import { runMidiQOLItemMacro } from '../runner.mjs';

/**
 * @param {unknown[]} args
 */
export async function observeHit(args) {
    await runMidiQOLItemMacro(args, async ({ hitTargets, workflow }) => {
        if (workflow.attackRoll && hitTargets.length > 0) {
            const effect = workflow.actor.effects.getName('Observe Hit');
            if (!effect) return;

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
                // @ts-expect-error
                : originToken.document;

            const promptPlayer = originPlayer.active ? originPlayer : game.users?.activeGM;
            if (!promptPlayer) return;

            for (const target of hitTargets) {
                // @ts-expect-error
                // eslint-disable-next-line no-await-in-loop
                await MidiQOL.socket().executeAsUser('chooseReactions', promptPlayer.id, {
                    tokenUuid: promptToken.uuid,
                    reactionFlavor: `${workflow.actor.name} has hit ${target.name}. Do you wish to react against ${target.name}?`,
                    triggerTokenUuid: target.uuid,
                    triggerType: 'reactionmanual',
                    options: {},
                });
            }
        }
    });
}
