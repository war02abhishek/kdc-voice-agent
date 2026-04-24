type Level = "INFO" | "WARN" | "ERROR" | "DEBUG";

function log(level: Level, tag: string, message: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const base = `${ts} [${level}] [${tag}] ${message}`;
  if (meta !== undefined) {
    level === "ERROR" ? console.error(base, meta) : console.log(base, meta);
  } else {
    level === "ERROR" ? console.error(base) : console.log(base);
  }
}

export const logger = {
  info:  (tag: string, msg: string, meta?: unknown) => log("INFO",  tag, msg, meta),
  warn:  (tag: string, msg: string, meta?: unknown) => log("WARN",  tag, msg, meta),
  error: (tag: string, msg: string, meta?: unknown) => log("ERROR", tag, msg, meta),
  debug: (tag: string, msg: string, meta?: unknown) => log("DEBUG", tag, msg, meta),
};
