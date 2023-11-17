export class ChatContext {

    /**
     * @param {string} flavour
     */
    constructor(flavour) {
        this.flavour = flavour;
    }

    /**
     * @param {string} content
     */
    async sendMessage(content) {
        await ChatMessage.create({
            flavor: this.flavour,
            content: content,
        });
    }

    /**
     * @param {string} content
     */
    async sendDetails(content) {
        await ChatMessage.create({
            flavor: this.flavour,
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OOC,
            whisper: game.users?.filter((u) => u.isGM).map((u) => u._id) ?? [],
            blind: true,
        });
    }
}
