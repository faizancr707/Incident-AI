"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTelemetry = setupTelemetry;
exports.shutdownTelemetry = shutdownTelemetry;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const instrumentation_http_1 = require("@opentelemetry/instrumentation-http");
const instrumentation_express_1 = require("@opentelemetry/instrumentation-express");
const instrumentation_pg_1 = require("@opentelemetry/instrumentation-pg");
const exporter_prometheus_1 = require("@opentelemetry/exporter-prometheus");
const logger_1 = require("../lib/logger");
let sdk = null;
function setupTelemetry() {
    try {
        const prometheusExporter = new exporter_prometheus_1.PrometheusExporter({ port: 9464 });
        sdk = new sdk_node_1.NodeSDK({
            resource: new resources_1.Resource({
                [semantic_conventions_1.ATTR_SERVICE_NAME]: "incident-investigator-api",
                [semantic_conventions_1.ATTR_SERVICE_VERSION]: "1.0.0",
            }),
            metricReader: prometheusExporter,
            instrumentations: [
                new instrumentation_http_1.HttpInstrumentation(),
                new instrumentation_express_1.ExpressInstrumentation(),
                new instrumentation_pg_1.PgInstrumentation(),
            ],
        });
        sdk.start();
        logger_1.logger.info("OpenTelemetry SDK initialized", { metricsPort: 9464 });
    }
    catch (error) {
        logger_1.logger.error("Failed to initialize OpenTelemetry", { error });
    }
}
function shutdownTelemetry() {
    if (sdk)
        return sdk.shutdown();
    return Promise.resolve();
}
//# sourceMappingURL=setup.js.map