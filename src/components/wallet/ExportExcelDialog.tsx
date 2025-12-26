import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { exportVendorTransactions } from "@/api/vendordashboard";

interface ExportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportExcelDialog = ({ open, onOpenChange }: ExportExcelDialogProps) => {
  const getDefaultDateRange = () => {
    const now = new Date();
    const to = now.toISOString().split("T")[0];
    const fromDate = new Date(now);
    fromDate.setMonth(now.getMonth() - 1);
    const from = fromDate.toISOString().split("T")[0];
    return { from, to };
  };

  const [dateFrom, setDateFrom] = useState(getDefaultDateRange().from);
  const [dateTo, setDateTo] = useState(getDefaultDateRange().to);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    // Validate dates
    if (!dateFrom || !dateTo) {
      alert("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc");
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      alert("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    try {
      setExporting(true);
      console.log("Exporting transactions from:", dateFrom, "to:", dateTo);
      const blob = await exportVendorTransactions(dateFrom, dateTo);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `LichSuGiaoDich_${dateFrom.replace(
        /-/g,
        ""
      )}_${dateTo.replace(/-/g, "")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close dialog after successful export
      onOpenChange(false);
    } catch (err: any) {
      console.error("Export error:", err);
      alert(
        "Không thể xuất file Excel: " + (err?.message || "Lỗi không xác định")
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xuất lịch sử giao dịch</DialogTitle>
          <DialogDescription>
            Chọn khoảng thời gian để xuất lịch sử giao dịch ra file Excel
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="exportDateFrom">Từ ngày</Label>
            <Input
              id="exportDateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={exporting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exportDateTo">Đến ngày</Label>
            <Input
              id="exportDateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={exporting}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 File Excel sẽ bao gồm tất cả giao dịch trong khoảng thời gian
              đã chọn
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportExcelDialog;
