'use strict';

/**
 * webpack and test setup can take a long time on CI
 *
 * Use higher than normal jest timeout to fix issue
 */
jest.setTimeout(60000);
