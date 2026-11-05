import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { logger } from "../lib/logger";

let sdk: NodeSDK | null = null;

export function setupTelemetry(): void {
  try {
    const prometheusExporter = new PrometheusExporter({ port: 9464 });

    sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: "incident-investigator-api",
        [ATTR_SERVICE_VERSION]: "1.0.0",
      }),
      metricReader: prometheusExporter,
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new PgInstrumentation(),
      ],
    });

    sdk.start();
    logger.info("OpenTelemetry SDK initialized", { metricsPort: 9464 });
  } catch (error) {
    logger.error("Failed to initialize OpenTelemetry", { error });
  }
}

export function shutdownTelemetry(): Promise<void> {
  if (sdk) return sdk.shutdown();
  return Promise.resolve();
}
