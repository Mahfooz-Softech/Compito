// Minimal Supabase client stub to remove Supabase dependency at runtime
// This satisfies imports like `import { supabase } from '@/integrations/supabase/client'`
// and returns structured error objects so callers can handle gracefully.

// Helper to create a consistent error response
function createError(message: string) {
	return { message } as { message: string };
}

// Generic table operation result shapes
type QueryResult<T = unknown> = Promise<{ data: T | null; error: { message: string } | null }>;

type AuthSession = { session: unknown | null };

type AuthUser = { user: unknown | null };

function createQueryChain() {
	return {
		select: (_fields?: string): QueryResult => Promise.resolve({ data: null, error: createError('Supabase removed: select unavailable') }),
		update: (_values: unknown): QueryResult => Promise.resolve({ data: null, error: createError('Supabase removed: update unavailable') }),
		insert: (_values: unknown): QueryResult => Promise.resolve({ data: null, error: createError('Supabase removed: insert unavailable') }),
		delete: (): QueryResult => Promise.resolve({ data: null, error: createError('Supabase removed: delete unavailable') }),
		eq: (_col: string, _val: unknown) => createQueryChain(),
		in: (_col: string, _vals: unknown[]) => createQueryChain(),
		order: (_col: string, _opts?: unknown) => createQueryChain(),
		limit: (_n: number) => createQueryChain(),
		single: () => createQueryChain(),
	};
}

export const supabase = {
	auth: {
		getSession: (): Promise<{ data: AuthSession; error: { message: string } | null }> =>
			Promise.resolve({ data: { session: null }, error: createError('Supabase removed: auth.getSession unavailable') }),
		getUser: (): Promise<{ data: AuthUser; error: { message: string } | null }> =>
			Promise.resolve({ data: { user: null }, error: createError('Supabase removed: auth.getUser unavailable') }),
	},
	functions: {
		invoke: (_name: string, _opts?: unknown): QueryResult =>
			Promise.resolve({ data: null, error: createError('Supabase removed: functions.invoke unavailable') }),
	},
	rpc: (_name: string, _params?: unknown): QueryResult =>
		Promise.resolve({ data: null, error: createError('Supabase removed: rpc unavailable') }),
	from: (_table: string) => createQueryChain(),
};

export default supabase;

