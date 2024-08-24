/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';
import { container, initializeContainer } from '../../../src/lib/container.mjs';
import { ModelService } from '../../../src/services/modelservice.mjs';
import { TrackingService } from '../../../src/services/trackingservice.mjs';

describe('Container', function () {
    beforeEach(function () {
        return container.dispose();
    });

    describe('initializeContainer', function () {
        it('should initialize the container', function () {
            const container = initializeContainer();

            expect(container.resolve('environment')).to.have.property('NODE_ENV').that.is.a('string');
            expect(container.resolve('logger')).to.respondTo('log');
            expect(container.resolve('tracer')).to.respondTo('startActiveSpan');
            expect(container.resolve('meter')).to.respondTo('createCounter');
            expect(container.resolve('db')).to.be.a('function').that.has.property('name', 'knex');
            expect(container.resolve('manticore')).to.be.null;
            expect(container.resolve('modelService')).to.be.instanceOf(ModelService);
            expect(container.resolve('trackService')).to.be.instanceOf(TrackingService);
        });
    });
});
