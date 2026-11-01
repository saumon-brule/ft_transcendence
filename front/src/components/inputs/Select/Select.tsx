import { createSignal, createUniqueId, JSX, JSXElement, onCleanup, Show, splitProps } from "solid-js";

import "./Select.scss";
import { Translator, useTranslation } from "~/i18n/context";
import { FormEmbeddedComponentRef } from "~/types/ComponentRef";
import { useFormContext } from "../Form/Form";

type SelectProps = Omit<JSX.IntrinsicElements["select"], keyof SelectComponentProps> & SelectComponentProps;

interface SelectComponentProps {
	ref?: FormEmbeddedComponentRef<HTMLSelectElement> | ((ref: FormEmbeddedComponentRef<HTMLSelectElement>) => void);
	/** Callback utilisé par `checkErrors` pour valider la valeur sélectionnée.
	 * Le JSXElement retourné est affiché s'il est truthy. */
	validator?: (element: HTMLSelectElement) => JSXElement;
	/** Texte de l'option vide (valeur ""). Si omis, aucune option vide n'est rendue. */
	placeholder?: string;
	onInvalid?: JSX.EventHandler<HTMLSelectElement, Event>;
	onChange?: JSX.EventHandler<HTMLSelectElement, Event>;
}

type InvalidHandler = JSX.EventHandler<HTMLSelectElement, Event>;
type ChangeHandler = JSX.EventHandler<HTMLSelectElement, Event>;

function getValidationMessage(select: HTMLSelectElement, t: Translator): string {
	const validity = select.validity;

	if (validity.customError) return select.validationMessage;
	if (validity.valueMissing) return t("errors.input.select.valueMissing");

	return select.validationMessage;
}

function useSelectFormContext(): ReturnType<typeof useFormContext> | null {
	try {
		return useFormContext();
	} catch (_) {
		return null;
	}
}

export default function Select(props: SelectProps) {
	const [invalidMessage, setInvalidMessage] = createSignal<JSXElement>(null);
	const { t } = useTranslation();
	const formContext = useSelectFormContext();
	const [local, rest] = splitProps(props, [
		"class",
		"children",
		"placeholder",
		"validator",
		"onInvalid",
		"onChange",
		"ref",
	]);

	let componentRef!: FormEmbeddedComponentRef<HTMLSelectElement>;

	onCleanup(() => formContext?.unregister(componentRef));

	const handleInvalid: InvalidHandler = (event) => {
		if (local.onInvalid) local.onInvalid(event);

		const select = event.currentTarget;
		setInvalidMessage(getValidationMessage(select, t));
		select.setCustomValidity("");

		if (event.defaultPrevented) return;
		event.preventDefault();
	};

	const handleChange: ChangeHandler = (event) => {
		if (local.onChange) local.onChange(event);
		if (event.defaultPrevented) return;
		setInvalidMessage(null);
	};

	function checkErrors() {
		let error: JSXElement;
		if (rest.required && !componentRef.htmlElement.value) {
			error = t("errors.input.select.valueMissing");
		} else {
			error = local.validator?.(componentRef.htmlElement);
		}
		setInvalidMessage(error);
		return !!error;
	}

	const isInvalid = () => !!invalidMessage();
	const ariaMessageId = createUniqueId();
	const fallbackId = createUniqueId();

	return <div class={`select ${local.class ?? ""}`}>
		<div class="select-field">
			<select
				onInvalid={handleInvalid}
				onChange={handleChange}
				aria-invalid={isInvalid()}
				aria-describedby={isInvalid() ? ariaMessageId : undefined}
				id={rest.id ?? rest.name ?? fallbackId}
				name={rest.name ?? fallbackId}
				ref={(el) => {
					componentRef = { htmlElement: el, checkErrors };
					formContext?.register(componentRef);
					if (typeof local.ref === "function") {
						local.ref(componentRef);
					}
				}}
				{...rest}
			>
				<Show when={local.placeholder !== undefined}>
					<option value="" disabled={rest.required} selected hidden={rest.required}>
						{local.placeholder}
					</option>
				</Show>
				{local.children}
			</select>
		</div>
		<Show when={isInvalid()}>
			<p class="invalid-message" id={ariaMessageId} aria-live="polite">
				{invalidMessage()}
			</p>
		</Show>
	</div>;
}
