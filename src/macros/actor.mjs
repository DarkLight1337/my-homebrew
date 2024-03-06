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
        // @ts-expect-error
        return this.actor.system.attributes.hp.value;
    }

    /**
     * @param {string} name
     * @returns {number}
     */
    getClassLevels(name) {
        return this.actor.classes[name]?.system.levels ?? 0;
    }

    /**
     * @returns {number}
     */
    getTotalLevels() {
        // @ts-expect-error
        return this.actor.system.details.level;
    }
}
