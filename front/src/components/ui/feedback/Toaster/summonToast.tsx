import { getRenderedToastContent, summonRawToast } from "./Toaster";
import "./Toast.scss";

type ToastVariant = "success" | "info" | "warning" | "error";


export function summonToast(type: ToastVariant, ...[content, options]: Parameters<typeof summonRawToast>) {
	return summonRawToast((controls) => <div class={`default-toast--${type}`}>{getRenderedToastContent(content, controls)}</div>, options);
}
