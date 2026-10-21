/**
 * In-memory stand-ins for Firestore and Cloud Storage, shared by the upload
 * behaviour tests. They keep just enough of the Admin SDK surface the upload
 * routes use, so the tests run without network or emulators.
 *
 * Use from a test file:
 *   vi.mock("../../server/useFirebaseAdmin", async () => (await import("../helpers/fakeFirebaseAdmin")).fakeFirebaseAdmin);
 */

type DocData = Record<string, any>;

interface SetOptions {
	merge?: boolean;
}

const clone = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

export const fakeFirestoreState = new Map<string, DocData>();
export const fakeStorageState = new Map<string, { buffer: Buffer; options: unknown }>();

export const fakeHooks: {
	beforeStorageSave?: (path: string) => Promise<void> | void;
} = {};

const createDocRef = (collectionName: string, id: string) => {
	const key = `${collectionName}/${id}`;

	return {
		id,
		path: key,
		async get() {
			const data = fakeFirestoreState.get(key);
			return {
				id,
				ref: createDocRef(collectionName, id),
				exists: Boolean(data),
				data: () => clone(data),
			};
		},
		async set(data: DocData, options: SetOptions = {}) {
			const previous = options.merge ? fakeFirestoreState.get(key) || {} : {};
			fakeFirestoreState.set(key, clone({ ...previous, ...data }));
		},
		async update(data: DocData) {
			const previous = fakeFirestoreState.get(key);
			if (!previous) {
				throw new Error(`NOT_FOUND: ${key}`);
			}
			fakeFirestoreState.set(key, clone({ ...previous, ...data }));
		},
		async delete() {
			fakeFirestoreState.delete(key);
		},
	};
};

type DocRef = ReturnType<typeof createDocRef>;

const createQuery = (collectionName: string, filters: [string, string, unknown][] = [], max?: number): any => ({
	where(field: string, operator: string, value: unknown) {
		return createQuery(collectionName, [...filters, [field, operator, value]], max);
	},
	orderBy() {
		return createQuery(collectionName, filters, max);
	},
	limit(value: number) {
		return createQuery(collectionName, filters, value);
	},
	async get() {
		const docs = [...fakeFirestoreState.entries()]
			.filter(([key]) => key.startsWith(`${collectionName}/`) && !key.slice(collectionName.length + 1).includes("/"))
			.filter(([, data]) => filters.every(([field, operator, value]) => {
				if (operator === "==") return data[field] === value;
				if (operator === "in") return Array.isArray(value) && value.includes(data[field]);
				if (operator === "array-contains") return Array.isArray(data[field]) && data[field].includes(value);
				return true;
			}))
			.slice(0, max)
			.map(([key, data]) => {
				const id = key.slice(collectionName.length + 1);
				return { id, ref: createDocRef(collectionName, id), exists: true, data: () => clone(data) };
			});
		return { docs, empty: docs.length === 0, size: docs.length, forEach: (cb: (doc: unknown) => void) => docs.forEach(cb) };
	},
});

let transactionQueue: Promise<unknown> = Promise.resolve();

export const fakeDb = {
	collection(collectionName: string) {
		return {
			...createQuery(collectionName),
			doc: (id: string) => createDocRef(collectionName, id),
		};
	},
	async getAll(...refs: DocRef[]) {
		return Promise.all(refs.map((ref) => ref.get()));
	},
	/** Transactions run one after the other, like Firestore's optimistic retries would end up. */
	runTransaction<T>(fn: (transaction: any) => Promise<T>): Promise<T> {
		const run = async () => {
			const writes: (() => Promise<void>)[] = [];
			const transaction = {
				get: (ref: DocRef) => ref.get(),
				set: (ref: DocRef, data: DocData, options?: SetOptions) => {
					writes.push(() => ref.set(data, options));
					return transaction;
				},
				update: (ref: DocRef, data: DocData) => {
					writes.push(() => ref.update(data));
					return transaction;
				},
				delete: (ref: DocRef) => {
					writes.push(() => ref.delete());
					return transaction;
				},
			};
			const result = await fn(transaction);
			for (const write of writes) {
				await write();
			}
			return result;
		};

		const next = transactionQueue.then(run, run);
		transactionQueue = next.catch(() => undefined);
		return next;
	},
};

export const fakeBucket = {
	name: "test-bucket",
	file(path: string) {
		return {
			name: path,
			async save(buffer: Buffer, options?: unknown) {
				await fakeHooks.beforeStorageSave?.(path);
				fakeStorageState.set(path, { buffer: Buffer.from(buffer), options });
			},
			async download() {
				const stored = fakeStorageState.get(path);
				if (!stored) throw new Error(`No such object: ${path}`);
				return [Buffer.from(stored.buffer)];
			},
			async exists() {
				return [fakeStorageState.has(path)];
			},
			async delete() {
				fakeStorageState.delete(path);
			},
			async makePublic() {
				return [{}];
			},
			async getSignedUrl() {
				return [`https://storage.test/${encodeURIComponent(path)}`];
			},
			async getMetadata() {
				return [{ metadata: {} }];
			},
			async setMetadata() {
				return [{}];
			},
		};
	},
	async getFiles() {
		return [[]];
	},
};

export const fakeFirebaseAdmin = {
	auth: {},
	db: fakeDb,
	storage: {
		bucket: () => fakeBucket,
	},
};

export function resetFakeFirebase() {
	fakeFirestoreState.clear();
	fakeStorageState.clear();
	delete fakeHooks.beforeStorageSave;
	transactionQueue = Promise.resolve();
}

export function seedDoc(collectionName: string, id: string, data: DocData) {
	fakeFirestoreState.set(`${collectionName}/${id}`, clone(data));
}

export function readDoc(collectionName: string, id: string): DocData | undefined {
	return clone(fakeFirestoreState.get(`${collectionName}/${id}`));
}

export function listDocs(collectionName: string): DocData[] {
	return [...fakeFirestoreState.entries()]
		.filter(([key]) => key.startsWith(`${collectionName}/`))
		.map(([, data]) => clone(data));
}
