import { configSettings, checkRule, enableWorkflow, midiSoundSettings } from 'midi-qol/src/module/settings.js';
import { overTimeJSONData } from 'midi-qol/src/module/Hooks.js';
import { SaferSocket } from 'midi-qol/src/module/GMAction.js';
import { TrapWorkflow, DamageOnlyWorkflow, Workflow, DummyWorkflow, WORKFLOWSTATES } from 'midi-qol/src/module/workflow.js';
import {
    addConcentration, applyTokenDamage, canSense, canSenseModes,
    checkIncapacitated, checkNearby, checkRange,
    completeItemRoll, completeItemUse, computeCoverBonus, contestedRoll,
    displayDSNForRoll, doConcentrationCheck, doOverTimeEffect, findNearby,
    getChanges, getConcentrationEffect, getDistanceSimple, getDistanceSimpleOld, getTokenPlayerName, getTraitMult,
    hasCondition, hasUsedBonusAction, hasUsedReaction, isTargetable, midiRenderRoll, MQfromActorUuid, MQfromUuid,
    playerFor, playerForActor, reactionDialog, reportMidiCriticalFlags,
    setBonusActionUsed, setReactionUsed, tokenForActor, validRolAbility,
} from 'midi-qol/src/module/utils.js';
import { ConfigPanel } from 'midi-qol/src/module/apps/ConfigPanel.js';
import { resolveLateTargeting, templateTokens } from 'midi-qol/src/module/itemhandling.js';
import { addUndoChatMessage, getUndoQueue, removeMostRecentWorkflow, showUndoQueue, undoMostRecentWorkflow } from 'midi-qol/src/module/undo.js';
import { showUndoWorkflowApp } from 'midi-qol/src/module/apps/UndoWorkflow.js';
import { TroubleShooter } from 'midi-qol/src/module/apps/TroubleShooter.js';
import { LateTargetingDialog } from 'midi-qol/src/module/apps/LateTargeting.js';

declare global {
    const dnd5e: {
        documents: {
            Actor5e: typeof Actor5e;
            Item5e: typeof Item5e;
        };
    };

    namespace Actor5e {
        interface Data {
            system: Actor5e.Data.Data;
        }
    }
    interface Actor5e {
        system: Actor5e.Data.Data;
        classes: Record<string, Item5e & { system: Item5e.Data.Class }>;

        createEmbeddedDocuments(embeddedName: string, data?: any[], context?: DocumentModificationContext): Promise<Document[]>;
        updateEmbeddedDocuments(embeddedName: string, updates?: any[], context?: DocumentModificationContext): Promise<Document[]>;
        deleteEmbeddedDocuments(embeddedName: string, ids?: string[], context?: DocumentModificationContext): Promise<Document[]>;
    }

    namespace Item5e {
        interface Data {
            system: Item5e.Data.Data;
        }
    }
    interface Item5e {
        system: Item5e.Data.Data;

        toObject(source?: boolean): any;
    }

    const MidiQOL: {
        addConcentration: typeof addConcentration;
        addUndoChatMessage: typeof addUndoChatMessage;
        applyTokenDamage: typeof applyTokenDamage;
        canSense: typeof canSense;
        canSenseModes: typeof canSenseModes;
        checkIncapacitated: typeof checkIncapacitated;
        checkNearby: typeof checkNearby;
        checkRange: typeof checkRange;
        checkRule: typeof checkRule;
        completeItemRoll: typeof completeItemRoll;
        completeItemUse: typeof completeItemUse;
        computeCoverBonus: typeof computeCoverBonus;
        computeDistance: typeof getDistanceSimple;
        ConfigPanel: typeof ConfigPanel;
        configSettings: () => typeof configSettings;
        contestedRoll: typeof contestedRoll;
        DamageOnlyWorkflow: typeof DamageOnlyWorkflow;
        displayDSNForRoll: typeof displayDSNForRoll;
        doConcentrationCheck: typeof doConcentrationCheck;
        doOverTimeEffect: typeof doOverTimeEffect;
        DummyWorkflow: typeof DummyWorkflow;
        enableWorkflow: typeof enableWorkflow;
        findNearby: typeof findNearby;
        getChanges: typeof getChanges;
        getConcentrationEffect: typeof getConcentrationEffect;
        getDistance: typeof getDistanceSimpleOld;
        getTokenPlayerName: typeof getTokenPlayerName;
        getTraitMult: typeof getTraitMult;
        getUndoQueue: typeof getUndoQueue;
        hasCondition: typeof hasCondition;
        hasUsedBonusAction: typeof hasUsedBonusAction;
        hasUsedReaction: typeof hasUsedReaction;
        incapacitatedConditions: string[];
        isTargetable: typeof isTargetable;
        LateTargetingDialog: typeof LateTargetingDialog;
        midiRenderRoll: typeof midiRenderRoll;
        midiSoundSettings: () => typeof midiSoundSettings;
        MQfromActorUuid: typeof MQfromActorUuid;
        MQfromUuid: typeof MQfromUuid;
        MQFromUuid: typeof MQfromUuid;
        overTimeJSONData: typeof overTimeJSONData;
        playerFor: typeof playerFor;
        playerForActor: typeof playerForActor;
        reactionDialog: typeof reactionDialog;
        removeMostRecentWorkflow: typeof removeMostRecentWorkflow;
        reportMidiCriticalFlags: typeof reportMidiCriticalFlags;
        resolveLateTargeting: typeof resolveLateTargeting;
        selectTargetsForTemplate: typeof templateTokens;
        setBonusActionUsed: typeof setBonusActionUsed;
        setReactionUsed: typeof setReactionUsed;
        showUndoQueue: typeof showUndoQueue;
        showUndoWorkflowApp: typeof showUndoWorkflowApp;
        socket: () => typeof SaferSocket;
        tokenForActor: typeof tokenForActor;
        TrapWorkflow: typeof TrapWorkflow;
        TroubleShooter: typeof TroubleShooter;
        undoMostRecentWorkflow: typeof undoMostRecentWorkflow;
        validRolAbility: typeof validRolAbility;
        Workflow: typeof Workflow;
        WORKFLOWSTATES: typeof WORKFLOWSTATES;
    };

    // Macro arguments
    const args: unknown[];
}

export {};
