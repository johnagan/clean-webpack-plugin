'use strict';

const getWebpackVersionTest = () => require('./get-webpack-version')();

describe('webpackVersion', () => {
    test('returns major only and is type number', () => {
        jest.doMock('read-pkg-up', () => ({
            sync: () => ({ package: { version: '4.29.0' } }),
        }));

        const version = getWebpackVersionTest();
        expect(version).toEqual('4.29.0');
    });

    test('handles alpha', () => {
        jest.doMock('read-pkg-up', () => ({
            sync: () => ({ package: { version: '5.0.0-alpha.8' } }),
        }));

        const version = getWebpackVersionTest();
        expect(version).toEqual('5.0.0-alpha.8');
    });

    test('returns null if no version found', () => {
        jest.doMock('read-pkg-up', () => ({ sync: () => ({ package: {} }) }));

        const version = getWebpackVersionTest();
        expect(version).toEqual(null);
    });
});
