export type TranslatorLeafKeys<All extends string, K extends string = All> = K extends unknown
	? Extract<All, `${K}.${string}`> extends never
		? K
		: never
	: never;
