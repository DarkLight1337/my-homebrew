/**
 * @template {dnd5e_.ActorDataModel} D
 */
export class ActorProps {
    /**
     * @param {dnd5e_.Actor5e<D>} actor
     */
    constructor(actor) {
        this.actor = actor;
    }
}

/**
 * @augments ActorProps<dnd5e_.CharacterData>
 */
export class CharacterProps extends ActorProps {

    /**
     * @returns {number}
     */
    getCurrentHp() {
        return this.actor.system.attributes.hp.value;
    }
}
