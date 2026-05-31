import type { Paginator } from "@smithy/types";
import { ListDeadLetterSourceQueuesCommandInput, ListDeadLetterSourceQueuesCommandOutput } from "../commands/ListDeadLetterSourceQueuesCommand";
import type { SQSPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateListDeadLetterSourceQueues: (config: SQSPaginationConfiguration, input: ListDeadLetterSourceQueuesCommandInput, ...rest: any[]) => Paginator<ListDeadLetterSourceQueuesCommandOutput>;
