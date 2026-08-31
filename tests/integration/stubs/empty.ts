/**
 * Stands in for `server-only`, whose sole purpose is to fail the build when a
 * server module is imported from the browser. The integration suite *is* the
 * server, so the guard has nothing to do here.
 */
export {};
