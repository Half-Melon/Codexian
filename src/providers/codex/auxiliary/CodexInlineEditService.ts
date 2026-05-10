import { QueryBackedInlineEditService } from '../../../core/auxiliary/QueryBackedInlineEditService';
import type CodexidianPlugin from '../../../main';
import { CodexAuxQueryRunner } from '../runtime/CodexAuxQueryRunner';

export class CodexInlineEditService extends QueryBackedInlineEditService {
  constructor(plugin: CodexidianPlugin) {
    super(new CodexAuxQueryRunner(plugin));
  }
}
