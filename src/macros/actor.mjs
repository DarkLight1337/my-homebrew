/**
 * @template {{}} D
 * @typedef {Actor5e & { system: D }} ActorWithSystem
 */

/**
 * @template {{}} D
 */
export class ActorProps {
    /**
     * @param {ActorWithSystem<D>} actor
     */
    constructor(actor) {
        this.actor = actor;
    }
}

/**
 * @augments ActorProps<Actor5e.Templates.Character>
 */
export class CharacterProps extends ActorProps {

    /**
     * @returns {number}
     */
    getCurrentHp() {
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
