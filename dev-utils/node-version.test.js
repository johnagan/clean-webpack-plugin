'use strict';

test('handles undefined pkg', () => {
    jest.doMock('read-pkg-up', () => ({
        sync: () => ({}),
    }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('8.9.0');
});

test('handles undefined engines', () => {
    jest.doMock('read-pkg-up', () => ({ sync: () => ({ packageJson: {} }) }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('8.9.0');
});

test('handles undefined node', () => {
    jest.doMock('read-pkg-up', () => ({
        sync: () => ({ packageJson: { engines: { npm: '^5.0.0' } } }),
    }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('8.9.0');
});

test('handles non-digit characters', () => {
    jest.doMock('read-pkg-up', () => ({
        sync: () => ({ packageJson: { engines: { node: '>=10.0.0' } } }),
    }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('10.0.0');
});

test('handles empty node', () => {
    jest.doMock('read-pkg-up', () => ({
        sync: () => ({ packageJson: { engines: { node: '' } } }),
    }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('8.9.0');
});
