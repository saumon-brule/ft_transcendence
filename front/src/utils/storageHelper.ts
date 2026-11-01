export class LocalStorageItem<T> {
	constructor(
		public readonly key: string,
		public readonly defaultFactory: () => T,
		public readonly serializer: (value: T) => string = JSON.stringify,
		public readonly deserializer: (stored: string, defaultValue: () => T) => T = ((stored) => JSON.parse(stored) as T),
	) {}

	public get(): T {
		const stored = localStorage.getItem(this.key);
		if (!stored) return this.defaultFactory();
		try {
			return this.deserializer(stored, this.defaultFactory);
		} catch (_) {
			return this.defaultFactory();
		}
	}

	public set(value: T) {
		localStorage.setItem(this.key, this.serializer(value));
	}

	public remove() {
		localStorage.removeItem(this.key);
	}
}

export class SessionStorageItem<T> {
	constructor(
		public readonly key: string,
		public readonly defaultFactory: () => T,
		public readonly serializer: (value: T) => string = JSON.stringify,
		public readonly deserializer: (stored: string, defaultValue: () => T) => T = ((stored) => JSON.parse(stored) as T),
	) {}

	public get(): T {
		const stored = sessionStorage.getItem(this.key);
		if (!stored) return this.defaultFactory();
		try {
			return this.deserializer(stored, this.defaultFactory);
		} catch (_) {
			return this.defaultFactory();
		}
	}

	public set(value: T) {
		sessionStorage.setItem(this.key, this.serializer(value));
	}

	public remove() {
		sessionStorage.removeItem(this.key);
	}
}
