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
  azureDataIoUsedPercent: "azure.sql.data_io.used_percent",
  azureLogWriteUsedPercent: "azure.sql.log_write.used_percent",
  storageDataUsedMb: "db.storage.data_used_mb",
  storageDataSizeMb: "db.storage.data_size_mb",
  logUsedPercent: "db.log.used_percent",
  logUsedMb: "db.log.used_mb",
  tempdbUsedMb: "db.tempdb.used_mb",
  /** QPS — SQL Server Batch Requests/sec */
  batchRequestsPerSec: "server.throughput.batch_requests_per_sec",
  /** TPS — SQL Server Transactions/sec */
  transactionsPerSec: "server.throughput.transactions_per_sec",
  logFlushesPerSec: "server.throughput.log_flushes_per_sec",
  userConnections: "server.session.user_connections",
  processesBlocked: "server.session.processes_blocked",
  sessionTotalCount: "server.session.total_count",
  sessionActiveCount: "server.session.active_count",
  sessionIdleCount: "server.session.idle_count",
  sessionRunningSqlCount: "server.session.running_sql_count",
  filegroupUsedPercent: "db.storage.filegroup.used_percent",
  filegroupSizeMb: "db.storage.filegroup.size_mb",
  filegroupUsedMb: "db.storage.filegroup.used_mb",
  filegroupFreeMb: "db.storage.filegroup.free_mb",
  dataFileUsedPercent: "db.storage.datafile.used_percent",
  dataFileSizeMb: "db.storage.datafile.size_mb",
  dataFileUsedMb: "db.storage.datafile.used_mb",
  dataFileFreeMb: "db.storage.datafile.free_mb",
  tableDataMb: "db.table.data_mb",
  tableIndexMb: "db.table.index_mb",
  tableTotalMb: "db.table.total_mb",
  tableRowCount: "db.table.row_count",
} as const;

export type ServerMetricKey =
  (typeof SERVER_METRIC_KEYS)[keyof typeof SERVER_METRIC_KEYS];
