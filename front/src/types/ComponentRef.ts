export interface ComponentRef<E extends HTMLElement = HTMLElement> {
	htmlElement: E;
}

interface FormEmbeddedComponentRefProperty {
	checkErrors: () => void;
}

export type FormEmbeddedComponentRef<E extends HTMLInputElement | HTMLSelectElement = HTMLInputElement | HTMLSelectElement> = ComponentRef<E> & FormEmbeddedComponentRefProperty;
