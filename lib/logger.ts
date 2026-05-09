type Level = 'info' | 'warn' | 'error';

function log(level: Level, event: string, ctx?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...ctx,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, ctx?: Record<string, unknown>) => log('info', event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => log('warn', event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => log('error', event, ctx),
};
