import { WorkerEntrypoint } from "cloudflare:workers";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { TableConfig, SQLiteTableWithColumns, SQLiteTable, SQLiteSelectBuilder  } from "drizzle-orm/sqlite-core";
import { InferInsertModel } from "drizzle-orm";
import { ZodError, ZodPipe } from "zod/v4";
import type { BuildSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

abstract class DB<ENV> extends WorkerEntrypoint<ENV> {
	protected abstract db: DrizzleD1Database<any>;

	protected abstract _paginate<T extends TableConfig>(
		table: SQLiteTableWithColumns<T>,
		pagination: { page: number, pageSize?: number }
	): any;

	protected abstract insert<
		Table extends SQLiteTable,
		Schema extends ZodPipe
	>(
		table: Table,
		schema: Schema,
		rawData: any
	): any;
}

export function Database<ENV>(
	getDB: (env: ENV) => Parameters<typeof drizzle>
){
	return class DATABASE extends DB<ENV> {
		
		protected db = drizzle(...getDB(this.env));

		async tableInfo(name: string) {
			const tableMetadata = await this.db.run(
				sql`PRAGMA table_info('${name}')`
			);
			console.log(tableMetadata);
			return tableMetadata;
		}

		protected _paginate<T extends TableConfig>(
			source: SQLiteTable<T>,
			{page, pageSize = 20}:{page: number, pageSize?: number}
		) {
			const offset = page * pageSize;
			return this.db.select().from(source)
				.limit(pageSize).offset(offset)
		}

        protected _select<Table extends SQLiteTable>(table: Table) {
            return this.db.select().from(table);
        }

		protected insert<
			Table extends SQLiteTable,
			Schema extends ZodPipe
		>(
			table: Table,
			schema: Schema,
			rawData: Parameters<Schema['parse']>[0]
		) {
			const object = schema.safeParse(rawData);
            if (!object.success) {
                console.error('parse error:', object.error.message)
                throw new Error(object.error.message);
            }
            console.log("parsed", object.data)
			const values = object.data as InferInsertModel<Table>;
			const query = this.db.insert(table).values(values)
				.then((result) => ({result, values}))
			return Object.assign(query, { values });
		}

		protected with_error<T, ARGS extends any[]>(handler: (...args: ARGS) => Promise<T>) {
			return async (...args: ARGS) => {
				try {
					return await handler(...args);
				} catch (error: any) {
					console.error("error occured:", error);
					return {info: error.message}
				}
			}
		}
	}
}

type ConcreteDB<ENV> = new (...args: any[]) => InstanceType<ReturnType<typeof Database<ENV>>>;

// export function Interface<
//     ENV,
//     Base extends ConcreteDB<ENV>,
//     const T extends Record<string, { table: SQLiteTable, schema: ZodPipe }>
// >(
//     BaseClass: Base,
//     interactions: T
// ) {
//     type TableNames = keyof T & string;

// 	type TableConfigFor<K extends TableNames> = 
// 		T[K]['table'] extends SQLiteTableWithColumns<infer Config> ? Config : never;

//     return class Interface extends BaseClass {
//         private tables = new Map(
//             Object.entries(interactions).map(([name, config]) => [name, config])
//         );

//         protected get tablesOnly(): { [K in keyof T]: T[K]['table'] } {
//             const result: any = {};
//             for (const [key, value] of this.tables.entries()) {
//                 result[key] = value.table;
//             }
//             return result;
//         }

//         private table<K extends TableNames>(tableName: K): T[K] {
//             const config = this.tables.get(tableName);
//             if (!config) throw new Error(`Missing table config: ${tableName}`);
//             return config as T[K];
//         }

//         protected put<K extends TableNames>(tableName: K) {
//             const config = this.table(tableName);

//             return {
//                 with: (rawData: Parameters<T[K]['schema']['parse']>[0]) => 
//                     this.insert(
//                         config.table, 
//                         config.schema, 
//                         rawData
//                     ) as Promise<{
//                         result: any,
//                         values: InferInsertModel<T[K]['table']>
//                     }> & {values: InferInsertModel<T[K]['table']>}
//             };
//         }


//         protected paginate<K extends TableNames>(tableName: K) {
//             const config = this.table(tableName);
//             return (page: number, pageSize: number = 20) => {
//                 const table = config.table;
//                 const query = this._paginate<TableConfigFor<K>>(
//                     table as SQLiteTable<TableConfigFor<K>>,
//                     { page, pageSize }
//                 );
//                 return query;
//             };
//         }

//         protected delete<K extends TableNames>(tableName: K) {
//             const config = this.table(tableName);

//             return this.db.delete(config.table)
//         }

//         protected select<K extends TableNames>(tableName: K) {
//             const config = this.table(tableName);
//             return this._select(config.table);
//         }
        
// 		protected interact<K extends TableNames>(tableName: K) {
// 			type PaginatedQuery = ReturnType<typeof this.paginate<K>> extends (page: number, pageSize?: number) => infer R 
// 				? R 
// 				: never;

// 			type InsertResult = ReturnType<typeof this.put<K>>['with'] extends (rawData: any) => infer R 
// 				? R 
// 				: never;

// 			return <
// 				ListArgs extends any[],
// 				InsertArgs extends any[]
// 			>(interactions: {
// 				list: (
// 					query: PaginatedQuery, 
// 					tables: { [P in keyof T]: T[P]['table'] }
// 				) => (...args: ListArgs) => Promise<any>,
// 				insert: (
// 					insertFn: (rawData: Parameters<T[K]['schema']['parse']>[0]) => InsertResult,
// 					tables: { [P in keyof T]: T[P]['table'] }
// 				) => (...args: InsertArgs) => Promise<any>
// 			}) => ({
// 				list: (page: number, pageSize: number = 20) => {
// 					const query = this.paginate(tableName)(page, pageSize);
// 					return (...args: ListArgs) => interactions.list(query, this.tablesOnly)(...args);
// 				},
// 				insert: () => {
// 					const insertFn = (rawData: Parameters<T[K]['schema']['parse']>[0]) => 
// 						this.put(tableName).with(rawData);
// 					return (...args: InsertArgs) => interactions.insert(insertFn, this.tablesOnly)(...args);
// 				}
// 			});
// 		}
        
//     }
// }

type SocketLike = {
    send: (users: string[], message: any) => void;
};

export function Event<
    ENV,
    Base extends ConcreteDB<ENV>,
    MessageType extends {
        [TypeField in TypeKey]: string;
    } & {
        [ContentField in ContentKey]: any;
    },
    SOCKET extends SocketLike = SocketLike,
    const TypeKey extends string = "type",
    const ContentKey extends string = "content",
>(
    BASE: Base,
    getSocket: (env: ENV) => SOCKET,
    config?: {
        typeField?: TypeKey;
        contentField?: ContentKey;
    }
) {
    const {
        typeField = "type" as TypeKey,
        contentField = "content" as ContentKey
    } = config || {};

    return class EVENT_DB extends BASE {
        public socket = getSocket(this.env);

        protected event(users: string[], message: MessageType) {
            this.socket.send(users, message);
        }

        protected withEvent<
            T extends MessageType[TypeKey],
            A extends any[],
            R extends MessageType[ContentKey]
        >(
            type: T,
            handler: (...args: A) => Promise<R>,
            informer: (...args: A) => Promise<string[]>
        ): (...args: A) => Promise<R> {
            return async (...args: A): Promise<R> => {
                console.log('calling event handler');
                const [message, receivers] = await Promise.all([
                    handler(...args),
                    informer(...args)
                ]);

                const eventMessage = {
                    [typeField]: type,
                    [contentField]: message
                } as MessageType;

                this.event(receivers, eventMessage);
                return message;
            };
        }
    };
}