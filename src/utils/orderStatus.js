export function getStatusText(status) {
  if (!status) return "";
  if (typeof status === "string") return status;
  if (typeof status === "object") return status.value;
  return String(status);
}