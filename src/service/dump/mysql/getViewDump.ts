import { Node } from '@/model/interface/node';
import { SchemaDumpOptions } from './interfaces/Options';

export interface ShowCreateView {
    View: string;
    'Create View': string;
    character_set_client: string;
    collation_connection: string;
}

export async function getViewDump(node: Node, sessionId: string, options: Required<SchemaDumpOptions>, views: Array<string>): Promise<string> {

    if (views.length == 0) {
        return "";
    }
    const getSchemaMultiQuery = views.map(view => {
        return node.dialect.showViewSource(node.database, view)
    }).join("")
    const result = await node.multiExecute(getSchemaMultiQuery, sessionId) as ShowCreateView[][];
    const createStatements = result.map((r, i) => {
        const res = r[0]
        let schema = res['Create View']
        if (!options.engine) {
            schema = schema.replace(/ENGINE\s*=\s*\w+ /, '');
        }
        if (options.view.createOrReplace) {
            schema = schema.replace(/^CREATE/, 'CREATE OR REPLACE');
        }
        if (!options.view.algorithm) {
            schema = schema.replace(
                /^CREATE( OR REPLACE)? ALGORITHM[ ]?=[ ]?\w+/,
                'CREATE$1',
            );
        }
        if (!options.view.definer) {
            schema = schema.replace(
                /^CREATE( OR REPLACE)?( ALGORITHM[ ]?=[ ]?\w+)? DEFINER[ ]?=[ ]?.+?@.+?( )/,
                'CREATE$1$2$3',
            );
        }
        if (!options.view.sqlSecurity) {
            schema = schema.replace(
                /^CREATE( OR REPLACE)?( ALGORITHM[ ]?=[ ]?\w+)?( DEFINER[ ]?=[ ]?.+?@.+)? SQL SECURITY (?:DEFINER|INVOKER)/,
                'CREATE$1$2$3',
            );
        }
        return schema;
    });

    return createStatements.join("\n\n");
}