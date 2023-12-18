import { parseDAEItemMacroArgs, parseMidiQOLFunctionMacroArgs, parseMidiQOLItemMacroArgs } from './argparse.mjs';

/**
 * @param {unknown} args
 * @param {(macroArgs: Awaited<ReturnType<parseDAEItemMacroArgs>>) => Promise<void>} runner
 */
export async function runDAEMacro(args, runner) {
    try {
        // @ts-expect-error
        const macroArgs = await parseDAEItemMacroArgs(args);
        const { originItem, targetActor } = macroArgs;

        try {
            await runner(macroArgs);
        } catch (err) {
            ui.notifications?.error(`<p>Unable to run DAE item macro.</p><p>Error:</p><code>${err}</code>`);

            console.error('Error:', err);
            console.error('Item:', originItem);
            console.error('Actor:', targetActor);
            console.error('Macro arguments:', args);
        }
    } catch (err) {
        ui.notifications?.error(`<p>Unable to run DAE item macro.</p><p>Error:</p><code>${err}</code>`);

        console.error('Macro arguments:', args);
    }
}

/**
 * @param {unknown} args
 * @param {(macroArgs: Awaited<ReturnType<parseMidiQOLItemMacroArgs>>) => Promise<void>} runner
 */
export async function runMidiQOLFunctionMacro(args, runner) {
    try {
        // @ts-expect-error
        const macroArgs = await parseMidiQOLFunctionMacroArgs(args);
        const { actor, item } = macroArgs;

        try {
            await runner(macroArgs);
        } catch (err) {
            ui.notifications?.error(`<p>Unable to run MidiQOL function macro.</p><p>Error:</p><code>${err}</code>`);

            console.error('Error:', err);
            console.error('Item:', item);
            console.error('Actor:', actor);
            console.error('Macro arguments:', args);
        }
    } catch (err) {
        ui.notifications?.error(`<p>Unable to run MidiQOL function macro.</p><p>Error:</p><code>${err}</code>`);

        console.error('Macro arguments:', args);
    }
}

/**
 * @param {unknown} args
 * @param {(macroArgs: Awaited<ReturnType<parseMidiQOLItemMacroArgs>>) => Promise<void>} runner
 */
export async function runMidiQOLItemMacro(args, runner) {
    try {
        // @ts-expect-error
        const macroArgs = await parseMidiQOLItemMacroArgs(args);
        const { actor, item } = macroArgs;

        try {
            await runner(macroArgs);
        } catch (err) {
            ui.notifications?.error(`<p>Unable to run MidiQOL item macro.</p><p>Error:</p><code>${err}</code>`);

            console.error('Error:', err);
            console.error('Item:', item);
            console.error('Actor:', actor);
            console.error('Macro arguments:', args);
        }
    } catch (err) {
        ui.notifications?.error(`<p>Unable to run MidiQOL item macro.</p><p>Error:</p><code>${err}</code>`);

        console.error('Macro arguments:', args);
    }
}
