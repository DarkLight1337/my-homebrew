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
        type Roll = foundryTypes.Roll;
        type Users = WorldCollection<User> & {
            players: ReadonlyArray<User>;
            activeGM: User | null;
        };

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
        type Item = Omit<foundryTypes.Item, 'actor'> & {
            get actor(): Actor | null;
        } & BaseItem;

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
    const Roll: typeof foundryTypes.Roll;

    const canvas: foundryTypes.Canvas;
    const game: foundryTypes.Game & {
        get collections(): foundry_.Collection<string, foundry_.WorldCollection>;
        get packs(): foundry_.Collection<string, foundry_.CompendiumCollection>;
        get users(): foundry_.Users;
    };

    const fromUuid: typeof globalFromUuid;

    // dnd5e system
    namespace dnd5e_ {
        type SystemDataModel = InstanceType<typeof dnd5eTypes.dataModels.SystemDataModel> & foundry_.TypeDataModel;
        type CurrencyTemplate = InstanceType<typeof dnd5eTypes.dataModels.shared.CurrencyTemplate> & SystemDataModel;

        type ActorDataModel = InstanceType<typeof dnd5eTypes.dataModels.ActorDataModel> & SystemDataModel;
        type CommonTemplate = InstanceType<typeof dnd5eTypes.dataModels.actor.CommonTemplate> & CurrencyTemplate & ActorDataModel;
        type CreatureTemplate = InstanceType<typeof dnd5eTypes.dataModels.actor.CreatureTemplate> & CommonTemplate;
        type CharacterData = InstanceType<typeof dnd5eTypes.dataModels.actor.CharacterData> & CreatureTemplate;

        type ItemDataModel = InstanceType<typeof dnd5eTypes.dataModels.ItemDataModel> & SystemDataModel;
        type ItemDescriptionTemplate = InstanceType<typeof dnd5eTypes.dataModels.item.ItemDescriptionTemplate> & SystemDataModel;
        type ItemTypeTemplate = InstanceType<typeof dnd5eTypes.dataModels.item.ItemTypeTemplate> & SystemDataModel;
        type IdentifiableTemplate = InstanceType<typeof dnd5eTypes.dataModels.item.IdentifiableTemplate> & SystemDataModel;
        type PhysicalItemTemplate = InstanceType<typeof dnd5eTypes.dataModels.item.PhysicalItemTemplate> & SystemDataModel;
        type EquippableItemTemplate = InstanceType<typeof dnd5eTypes.dataModels.item.EquippableItemTemplate> & SystemDataModel;
        type ActivatedEffectTemplate = InstanceType<typeof dnd5eTypes.dataModels.item.ActivatedEffectTemplate> & SystemDataModel;
        type MountableTemplate = InstanceType<typeof dnd5eTypes.dataModels.item.MountableTemplate> & SystemDataModel;
        type ActionTemplate = InstanceType<typeof dnd5eTypes.dataModels.item.ActionTemplate> & ItemDataModel;

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
