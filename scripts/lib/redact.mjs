export const DEFAULT_MAX_OUTPUT = 12_000;

export function redact(value, secrets = [], maxLength = DEFAULT_MAX_OUTPUT) {
  let output = String(value ?? "");
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0)
      output = output.split(secret).join("[REDACTED]");
  }
  output = output
    .replace(/(postgres(?:ql)?:\/\/)[^\s"']+/gi, "$1[REDACTED-DSN]")
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,}]+/gi, "$1[REDACTED]")
    .replace(
      /(\b(?:token|secret|password|passwd|api[_-]?key|key)\b\s*[=:]\s*)[^\s,}]+/gi,
      "$1[REDACTED]",
    );
  if (output.length > maxLength)
    output = `${output.slice(0, maxLength)}…[TRUNCATED]`;
  return output;
}

export function redactObject(value, secrets = []) {
  if (typeof value === "string") return redact(value, secrets);
  if (Array.isArray(value))
    return value.map((item) => redactObject(item, secrets));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        redactObject(item, secrets),
      ]),
    );
  }
  return value;
}
