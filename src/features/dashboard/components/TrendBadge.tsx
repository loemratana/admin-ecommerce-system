import Badge from "@/components/ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";

// Shows a month-over-month change; null means there was nothing to compare against.
export default function TrendBadge({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value === null) return <Badge color="light">New</Badge>;
  const up = value >= 0;
  return (
    <Badge color={up ? "success" : "error"}>
      {up ? <ArrowUpIcon /> : <ArrowDownIcon />}
      {Math.abs(value).toFixed(1)}%{suffix ? ` ${suffix}` : ""}
    </Badge>
  );
}
