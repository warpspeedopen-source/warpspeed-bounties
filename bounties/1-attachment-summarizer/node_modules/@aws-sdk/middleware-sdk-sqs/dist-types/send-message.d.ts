import type { InitializeHandlerOptions, InitializeMiddleware, Pluggable } from "@smithy/types";
import type { PreviouslyResolved } from "./configurations";
export declare const sendMessageMiddleware: (options: PreviouslyResolved) => InitializeMiddleware<any, any>;
export declare const sendMessageMiddlewareOptions: InitializeHandlerOptions;
export declare const getSendMessagePlugin: (config: PreviouslyResolved) => Pluggable<any, any>;
