import { parseDAEMacroArgs, parseMidiQOLMacroArgs } from './argparse.mjs';

/**
 * @param {unknown[]} args
 * @param {(macroArgs: Awaited<ReturnType<parseDAEMacroArgs>>) => Promise<void>} runner
 */
export async function runDAEMacro(args, runner) {
    try {
        const macroArgs = await parseDAEMacroArgs(args);
        const { originItem, targetActor } = macroArgs;

        try {
            await runner(macroArgs);
        } catch (err) {
            ui.notifications?.error(`<p>Unable to run DAE macro for item: ${originItem?.name ?? null}</p><p>Error:</p><code>${err}</code>`);

            console.error('Error:', err);
            console.error('Item:', originItem);
            console.error('Actor:', targetActor);
            console.error('Macro arguments:', args);
        }
    } catch (err) {
        ui.notifications?.error(`<p>Unable to run DAE macro.</p><p>Error:</p><code>${err}</code>`);

        console.error('Macro arguments:', args);
    }
}

/**
 * @param {unknown[]} args
 * @param {(macroArgs: Awaited<ReturnType<parseMidiQOLMacroArgs>>) => Promise<void>} runner
 */
export async function runMidiQOLMacro(args, runner) {
    try {
        const macroArgs = await parseMidiQOLMacroArgs(args);
        const { actor, item } = macroArgs;

        try {
            await runner(macroArgs);
        } catch (err) {
            ui.notifications?.error(`<p>Unable to run MidiQOL macro for item: ${item.name}</p><p>Error:</p><code>${err}</code>`);

            console.error('Error:', err);
            console.error('Item:', item);
            console.error('Actor:', actor);
            console.error('Macro arguments:', args);
        }
    } catch (err) {
        ui.notifications?.error(`<p>Unable to run MidiQOL macro.</p><p>Error:</p><code>${err}</code>`);

        console.error('Macro arguments:', args);
    }
}
