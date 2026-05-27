/** 파일그룹·데이터파일·테이블 용량 상세 그리드를 표시합니다. */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  extractDataFileStorageRows,
  extractFilegroupStorageRows,
  extractTableSizeRows,
} from "@/lib/monitoring/metric-details";
import type { MetricHistoryRecord } from "@/services/storage/types";

type DbStoragePanelsProps = {
  metrics: MetricHistoryRecord[];
};

const formatMb = (value: number) =>
  `${Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value)} MB`;

const formatPercent = (value: number) =>
  `${Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value)}%`;

const formatCount = (value: number) =>
  Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(value);

const EmptyHint = ({ message }: { message: string }) => (
  <p className="text-muted-foreground text-sm">{message}</p>
);

/**
 * DB 용량 관련 태그 지표를 파일그룹·데이터파일·테이블 그리드로 렌더링합니다.
 */
export const DbStoragePanels = ({ metrics }: DbStoragePanelsProps) => {
  const filegroups = extractFilegroupStorageRows(metrics);
  const dataFiles = extractDataFileStorageRows(metrics);
  const tables = extractTableSizeRows(metrics);

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          파일그룹 사용률 (테이블스페이스)
        </h3>
        {filegroups.length === 0 ? (
          <EmptyHint message="파일그룹 사용률 지표가 아직 수집되지 않았습니다." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>파일그룹</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>전체</TableHead>
                <TableHead>사용</TableHead>
                <TableHead>여유</TableHead>
                <TableHead>사용률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filegroups.map((row) => (
                <TableRow key={row.filegroupName}>
                  <TableCell>{row.filegroupName}</TableCell>
                  <TableCell>{row.typeDesc}</TableCell>
                  <TableCell>{formatMb(row.sizeMb)}</TableCell>
                  <TableCell>{formatMb(row.usedMb)}</TableCell>
                  <TableCell>{formatMb(row.freeMb)}</TableCell>
                  <TableCell>{formatPercent(row.usedPercent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">데이터파일 사용률</h3>
        {dataFiles.length === 0 ? (
          <EmptyHint message="데이터파일 사용률 지표가 아직 수집되지 않았습니다." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>파일명</TableHead>
                <TableHead>파일그룹</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>전체</TableHead>
                <TableHead>사용</TableHead>
                <TableHead>여유</TableHead>
                <TableHead>사용률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataFiles.map((row) => (
                <TableRow key={row.fileName}>
                  <TableCell>{row.fileName}</TableCell>
                  <TableCell>{row.filegroupName}</TableCell>
                  <TableCell>{row.typeDesc}</TableCell>
                  <TableCell>{formatMb(row.sizeMb)}</TableCell>
                  <TableCell>{formatMb(row.usedMb)}</TableCell>
                  <TableCell>{formatMb(row.freeMb)}</TableCell>
                  <TableCell>{formatPercent(row.usedPercent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Top 테이블 용량</h3>
        {tables.length === 0 ? (
          <EmptyHint message="테이블별 용량 지표가 아직 수집되지 않았습니다." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>스키마</TableHead>
                <TableHead>테이블</TableHead>
                <TableHead>데이터</TableHead>
                <TableHead>인덱스</TableHead>
                <TableHead>전체</TableHead>
                <TableHead>행 수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((row) => (
                <TableRow key={`${row.schemaName}.${row.tableName}`}>
                  <TableCell>{row.schemaName}</TableCell>
                  <TableCell>{row.tableName}</TableCell>
                  <TableCell>{formatMb(row.dataMb)}</TableCell>
                  <TableCell>{formatMb(row.indexMb)}</TableCell>
                  <TableCell>{formatMb(row.totalMb)}</TableCell>
                  <TableCell>{formatCount(row.rowCount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
};
