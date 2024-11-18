import { ActiveEffectData } from './foundry/common/documents/active-effect.mjs';
import { ActorData } from './foundry/common/documents/actor.mjs';
import { ChatMessageData } from './foundry/common/documents/chat-message.mjs';
import { ItemData } from './foundry/common/documents/item.mjs';
import { SceneData } from './foundry/common/documents/scene.mjs';
import { TokenData } from './foundry/common/documents/token.mjs';
import { UserData } from './foundry/common/documents/user.mjs';
import { fromUuid as globalFromUuid } from './foundry/dist/core/utils.mjs';
import * as foundryTypes from './foundry/public/scripts/foundry_.js';
import * as dnd5eTypes from './dnd5e/dnd5e.mjs';

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
    playerFor, playerForActor, reactionDialog, reportMidiCriticalFlags, requestReactions,
    setBonusActionUsed, setReactionUsed, tokenForActor, validRollAbility,
} from 'midi-qol/src/module/utils.js';
import { ConfigPanel } from 'midi-qol/src/module/apps/ConfigPanel.js';
import { resolveTargetConfirmation, templateTokens } from 'midi-qol/src/module/itemhandling.js';
import { addUndoChatMessage, getUndoQueue, removeMostRecentWorkflow, showUndoQueue, undoMostRecentWorkflow } from 'midi-qol/src/module/undo.js';
import { showUndoWorkflowApp } from 'midi-qol/src/module/apps/UndoWorkflow.js';
import { TroubleShooter } from 'midi-qol/src/module/apps/TroubleShooter.js';
import { TargetConfirmationDialog } from 'midi-qol/src/module/apps/TargetConfirmation.js';

declare global {

    // Foundry VTT
    namespace foundry_ {
        type DataModel = InstanceType<typeof foundry.abstract.DataModel>;
        type TypeDataModel = InstanceType<typeof foundry.abstract.TypeDataModel> & DataModel;
        type Document = InstanceType<typeof foundry.abstract.Document> & DataModel;

        interface Collection<V> extends ReadonlyMap<string, V>, ReadonlyArray<V> {
            getName(name: string, options: { strict: false }): V | undefined;
            getName(name: string, options: { strict: true }): V;
            getName(name: string, options?: { strict?: boolean }): V | undefined;
        }

        type DocumentCollection<T extends Document = Document> = foundryTypes.DocumentCollection & Collection<T>;
        type WorldCollection<T extends Document = Document> = foundryTypes.WorldCollection & DocumentCollection<T>;
        type CompendiumCollection<T extends Document = Document> = foundryTypes.CompendiumCollection & DocumentCollection<T>;
        type CompendiumPacks<T extends Document = Document> = foundryTypes.CompendiumPacks & Collection<CompendiumCollection<T>>;

        type Canvas = foundryTypes.Canvas;
        type Game = foundryTypes.Game;
        type Dialog = foundryTypes.Dialog;
        type Roll = foundry.dice.Roll;
        type RollTable = foundryTypes.RollTable;

        type BaseActiveEffect = InstanceType<typeof foundry.documents.BaseActiveEffect> & ActiveEffectData & Document;
        type ActiveEffect = foundryTypes.ActiveEffect & BaseActiveEffect;

        type ActorData_ = Omit<ActorData, 'items' | 'effects'> & {
            items: Collection<Item>;
            effects: Collection<BaseActiveEffect>;
        };
        type BaseActor = InstanceType<typeof foundry.documents.BaseActor> & ActorData_ & Document;
        type Actor = foundryTypes.Actor & BaseActor;

        type BaseChatMessage = InstanceType<typeof foundry.documents.BaseChatMessage> & ChatMessageData & Document;
        type ChatMessage = foundryTypes.ChatMessage & BaseChatMessage;

        type ItemData_ = Omit<ItemData, 'effects'> & {
            effects: Collection<ActiveEffect>;
        };
        type BaseItem = InstanceType<typeof foundry.documents.BaseItem> & ItemData_ & Document;
        type Item = foundryTypes.Item;

        type BaseScene = InstanceType<typeof foundry.documents.BaseScene> & SceneData & Document;
        type Scene = foundryTypes.Scene & BaseScene;

        type BaseTokenDocument = InstanceType<typeof foundry.documents.BaseToken> & TokenData & Document;
        type TokenDocument = foundryTypes.TokenDocument & BaseTokenDocument;

        type BaseUser = InstanceType<typeof foundry.documents.BaseUser> & UserData & Document;
        type User = foundryTypes.User & BaseUser;
    }

    const ChatMessage: typeof foundry.abstract.Document & typeof foundryTypes.ChatMessage;
    const Dialog: typeof foundryTypes.Dialog;
    const Token: typeof foundryTypes.Token;
    const TokenDocument: typeof foundry.abstract.Document & typeof foundryTypes.TokenDocument;
    const Roll: typeof foundry.dice.Roll;

    const canvas: foundryTypes.Canvas;
    const game: foundryTypes.Game;

    const fromUuid: typeof globalFromUuid;

    // dnd5e system
    namespace dnd5e_ {
        type SystemDataModel = dnd5eTypes.dataModels.SystemDataModel;
        type CurrencyTemplate = dnd5eTypes.dataModels.shared.CurrencyTemplate;

        type ActorDataModel = dnd5eTypes.dataModels.ActorDataModel;
        type CommonTemplate = InstanceType<typeof dnd5eTypes.dataModels.actor.CommonTemplate> & CurrencyTemplate & ActorDataModel;
        type CreatureTemplate = dnd5eTypes.dataModels.actor.CreatureTemplate;
        type CharacterData = CharacterData;

        type ItemDataModel = dnd5eTypes.dataModels.ItemDataModel;
        type ItemDescriptionTemplate = dnd5eTypes.dataModels.item.ItemDescriptionTemplate;
        type ItemTypeTemplate = dnd5eTypes.dataModels.item.ItemTypeTemplate;
        type IdentifiableTemplate = dnd5eTypes.dataModels.item.IdentifiableTemplate;
        type PhysicalItemTemplate = dnd5eTypes.dataModels.item.PhysicalItemTemplate;
        type EquippableItemTemplate = dnd5eTypes.dataModels.item.EquippableItemTemplate;
        type ActivatedEffectTemplate = dnd5eTypes.dataModels.item.ActivatedEffectTemplate;
        type MountableTemplate = dnd5eTypes.dataModels.item.MountableTemplate;
        type ActionTemplate = dnd5eTypes.dataModels.item.ActionTemplate;

        type WeaponData = InstanceType<typeof dnd5eTypes.dataModels.item.WeaponData>
            & ItemDescriptionTemplate & IdentifiableTemplate & ItemTypeTemplate & PhysicalItemTemplate & EquippableItemTemplate
            & ActivatedEffectTemplate & ActionTemplate & MountableTemplate
            & ItemDataModel;

        type Actor5e<S extends SystemDataModel> = Omit<InstanceType<typeof dnd5eTypes.documents.Actor5e> & foundry_.Actor, 'items' | 'effects'> & {
            items: foundry_.Collection<Item5e<SystemDataModel>>;
            effects: foundry_.Collection<foundry_.ActiveEffect>;
            system: S;
        };
        type Item5e<S extends SystemDataModel> = Omit<InstanceType<typeof dnd5eTypes.documents.Item5e> & foundry_.Item, 'actor' | 'effects'> & {
            name: string;
            img: string;
            actor: Actor5e<SystemDataModel> | null;
            effects: foundry_.Collection<foundry_.ActiveEffect>;
            system: S;
        };
    }

    // MidiQOL module
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
        GameSystemConfig: typeof dnd5e.config;
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
        midiRenderRoll: typeof midiRenderRoll;
        midiSoundSettings: () => typeof midiSoundSettings;
        MQfromActorUuid: typeof MQfromActorUuid;
        MQfromUuid: typeof MQfromUuid;
        MQFromUuid: typeof MQfromUuid;
        overTimeJSONData: typeof overTimeJSONData;
        playerFor: typeof playerFor;
        playerForActor: typeof playerForActor;
        reactionDialog: typeof reactionDialog;
        requestReactions: typeof requestReactions;
        removeMostRecentWorkflow: typeof removeMostRecentWorkflow;
        reportMidiCriticalFlags: typeof reportMidiCriticalFlags;
        resolveTargetConfirmation: typeof resolveTargetConfirmation;
        selectTargetsForTemplate: typeof templateTokens;
        setBonusActionUsed: typeof setBonusActionUsed;
        setReactionUsed: typeof setReactionUsed;
        showUndoQueue: typeof showUndoQueue;
        showUndoWorkflowApp: typeof showUndoWorkflowApp;
        socket: () => typeof SaferSocket;
        TargetConfirmationDialog: typeof TargetConfirmationDialog;
        tokenForActor: typeof tokenForActor;
        TrapWorkflow: typeof TrapWorkflow;
        TroubleShooter: typeof TroubleShooter;
        undoMostRecentWorkflow: typeof undoMostRecentWorkflow;
        validRollAbility: typeof validRollAbility;
        Workflow: typeof Workflow;
    };

    // Macro arguments
    const args: unknown[];
}

export {};
