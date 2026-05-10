import { QueryBackedInstructionRefineService } from '../../../core/auxiliary/QueryBackedInstructionRefineService';
import type CodexidianPlugin from '../../../main';
import { CodexAuxQueryRunner } from '../runtime/CodexAuxQueryRunner';

export class CodexInstructionRefineService extends QueryBackedInstructionRefineService {
  constructor(plugin: CodexidianPlugin) {
    super(new CodexAuxQueryRunner(plugin));
  }
}
