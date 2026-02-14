export function FlashMessage({
  message,
  tone = "info"
}: {
  message: string;
  tone?: "success" | "info" | "warning" | "danger";
}) {
  const styles: Record<string, string> = {
    success: "border-green-200 bg-green-50 text-green-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-800"
  };

  return <div className={`mb-4 rounded-md border p-3 text-sm ${styles[tone]}`}>{message}</div>;
}
