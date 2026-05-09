import { logger } from './logger';

export type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; error: unknown };

export async function safeCalendarOp<T>(
  fn: () => Promise<T>,
  ctx: { op: string; [key: string]: unknown }
): Promise<SafeResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    logger.error('calendar_op_failed', {
      ...ctx,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      code: 'calendar_op_failed',
      error,
    };
  }
}
