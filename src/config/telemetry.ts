import { Logger } from '@nestjs/common';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

let telemetrySdk: NodeSDK | null = null;
const logger = new Logger('Telemetry');

export async function startTelemetry(): Promise<void> {
  if (process.env.OTEL_ENABLED !== 'true' || telemetrySdk) {
    return;
  }

  telemetrySdk = new NodeSDK({
    serviceName:
      process.env.OTEL_SERVICE_NAME ?? 'digital-notary-verification-api',
    traceExporter: new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        'http://localhost:4318/v1/traces',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await telemetrySdk.start();
  logger.log('OpenTelemetry SDK started');
}

export async function stopTelemetry(): Promise<void> {
  if (!telemetrySdk) {
    return;
  }

  await telemetrySdk.shutdown();
  logger.log('OpenTelemetry SDK stopped');
  telemetrySdk = null;
}
