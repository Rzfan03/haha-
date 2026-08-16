export function toast(message: string, type: "success" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("haha:toast", { detail: { message, type } }));
}
