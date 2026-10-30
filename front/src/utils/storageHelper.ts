export class LocalStorageItem<T> {
	constructor(
		public readonly key: string,
		public readonly defaultValue: T,
		public readonly serializer: (value: T) => string = JSON.stringify,
		public readonly deserializer: (stored: string) => T = JSON.parse,
	) {}

	public get() {
		const stored = localStorage.getItem(this.key);
		if (!stored) return this.defaultValue;
		return this.deserializer(stored);
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
		public readonly defaultValue: T,
		public readonly serializer: (value: T) => string = JSON.stringify,
		public readonly deserializer: (stored: string) => T = JSON.parse,
	) {}

	public get() {
		const stored = sessionStorage.getItem(this.key);
		if (!stored) return this.defaultValue;
		return this.deserializer(stored);
	}

	public set(value: T) {
		sessionStorage.setItem(this.key, this.serializer(value));
	}

	public remove() {
		sessionStorage.removeItem(this.key);
	}
}
