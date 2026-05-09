export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { logger } = await import('./lib/logger');

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('unhandled_rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('uncaught_exception', {
      error: error.message,
      stack: error.stack,
    });
  });

  logger.info('instrumentation_registered', {
    runtime: process.env.NEXT_RUNTIME,
  });
}
