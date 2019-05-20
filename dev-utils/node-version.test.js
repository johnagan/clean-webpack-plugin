'use strict';

test('handles undefined pkg', () => {
    jest.doMock('read-pkg-up', () => ({
        sync: () => ({}),
    }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('8.9.0');
});

test('handles undefined engines', () => {
    jest.doMock('read-pkg-up', () => ({ sync: () => ({ package: {} }) }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('8.9.0');
});

test('handles undefined node', () => {
    jest.doMock('read-pkg-up', () => ({
        sync: () => ({ package: { engines: { npm: '^5.0.0' } } }),
    }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('8.9.0');
});

test('handles non-digit characters', () => {
    jest.doMock('read-pkg-up', () => ({
        sync: () => ({ package: { engines: { node: '>=10.0.0' } } }),
    }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('10.0.0');
});

test('handles empty node', () => {
    jest.doMock('read-pkg-up', () => ({
        sync: () => ({ package: { engines: { node: '' } } }),
    }));

    const nodeVersion = require('./node-version');

    expect(nodeVersion).toEqual('8.9.0');
});
