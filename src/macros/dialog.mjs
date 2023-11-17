import { ActivationItemProps } from './item.mjs';

/**
 * @template {{}} D
 * @typedef {import('./item.mjs').ItemWithSystem<D>} ItemWithSystem
 */

export class Dialogs {

    /**
     * @template {Item} T
     * @param {ReadonlyArray<T>} items
     * @param {string} flavour
     * @returns {Promise<?T>}
     */
    static async selectItem(items, flavour) {
        return new Promise((resolve, reject) => {
            let isSelected = false;

            const selectDialog = new Dialog({
                title: 'Select Item',
                content: flavour,
                buttons: Object.fromEntries(items.map((item, i) => {
                    isSelected = false;

                    return [i, {
                        icon: `<div class="item-image"> <image src=${item.img} width="40" height="40" style="margin-top: 8px;"></div>`,
                        label: item.name,
                        callback: () => resolve(items[i]),
                    }];
                })),
                close: () => {
                    if (!isSelected) resolve(null);
                },
            });
            selectDialog.render(true);
        });
    }

    /**
     * @param {ReadonlyArray<ItemWithSystem<Item5e.Templates.ActivatedEffect>>} items
     * @param {string} noun
     * @param {boolean} enableRecharge
     */
    static async freecast(items, noun, enableRecharge) {
        const extraText = enableRecharge ? `If you later omit the casting, the ${noun} is instead recharged.` : '';
        const flavour = `<p>Please select the ${noun} to activate for free.${extraText}</p><p><em>(You should still enable "Consume Available Usage?" in the dialog.)</em></p>`;

        const selectedItem = await this.selectItem(items, flavour);
        if (selectedItem == null) return;

        const selectedItemAttrs = new ActivationItemProps(selectedItem);

        const prevCurrentUses = selectedItemAttrs.getCurrentUses();

        if (prevCurrentUses === 0) {
            // Modify currentUses so that the item can be used
            await selectedItemAttrs.setCurrentUses(1);
        }

        await MidiQOL.completeItemUse(selectedItem);

        const newCurrentUses = selectedItemAttrs.getCurrentUses();

        if (prevCurrentUses === 0) {
            if (newCurrentUses === 0) {
                // Item has been used; restore it
                await selectedItemAttrs.setCurrentUses(prevCurrentUses);
            } else if (newCurrentUses === 1) {
                // Item has not been used; recharge it (if enabled)
                if (enableRecharge) {
                    await selectedItemAttrs.setCurrentUses(prevCurrentUses + 1);
                } else {
                    // Undo our initial modification of currentUses
                    await selectedItemAttrs.setCurrentUses(0);
                }
            } else {
                throw new Error('Unexpected use of item');
            }
        } else {
            if (newCurrentUses < prevCurrentUses) {
                // Item has been used; restore it
                await selectedItemAttrs.setCurrentUses(prevCurrentUses);
            } else if (newCurrentUses === prevCurrentUses) {
                // Item has not been used; recharge it (if enabled)
                if (enableRecharge) {
                    await selectedItemAttrs.setCurrentUses(prevCurrentUses + 1);
                }
            } else {
                throw new Error('Unexpected use of item');
            }
        }
    }
}
