/** 대시보드·API에서 사용하는 표준 서버 리소스 지표 키입니다. */

export const SERVER_METRIC_KEYS = {
  cpuUsedPercent: "server.cpu.used_percent",
  memoryUsedPercent: "server.memory.used_percent",
  memoryAvailableMb: "server.memory.available_mb",
  memoryTotalMb: "server.memory.total_mb",
  pageLifeExpectancy: "server.memory.page_life_expectancy",
  memoryGrantsPending: "server.memory.grants_pending",
  diskReadIops: "server.disk.read_iops",
  diskWriteIops: "server.disk.write_iops",
  diskReadThroughputKbSec: "server.disk.read_throughput_kb_sec",
  diskWriteThroughputKbSec: "server.disk.write_throughput_kb_sec",
  diskReadLatencyMs: "server.disk.read_latency_ms",
  diskWriteLatencyMs: "server.disk.write_latency_ms",
  storageDataUsedMb: "db.storage.data_used_mb",
  storageDataSizeMb: "db.storage.data_size_mb",
  logUsedPercent: "db.log.used_percent",
  logUsedMb: "db.log.used_mb",
  tempdbUsedMb: "db.tempdb.used_mb",
  batchRequestsPerSec: "server.throughput.batch_requests_per_sec",
  transactionsPerSec: "server.throughput.transactions_per_sec",
  logFlushesPerSec: "server.throughput.log_flushes_per_sec",
  userConnections: "server.session.user_connections",
  processesBlocked: "server.session.processes_blocked",
} as const;

export type ServerMetricKey =
  (typeof SERVER_METRIC_KEYS)[keyof typeof SERVER_METRIC_KEYS];
