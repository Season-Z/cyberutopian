import type { MicroAppProps } from "./types";

const getBrowserDocument = () => {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document;
};

export const resolveMicroAppMountElement = (
  props: Pick<MicroAppProps, "container"> = {},
  selector = "#root",
  documentRef:
    | Pick<Document, "querySelector">
    | undefined = getBrowserDocument(),
): Element | null => {
  if (props.container) {
    return props.container.querySelector(selector);
  }

  return documentRef?.querySelector(selector) ?? null;
};
