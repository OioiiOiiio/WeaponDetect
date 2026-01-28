import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {Spinner} from "@/components/ui/spinner";
import {Eye} from "lucide-react";
import {Button} from "@/components/ui/button";

import {useEffect, useState} from "react";
import {toast} from "sonner";
import type {AnalysisResult} from "@/types";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";

export default function HistoryView() {
    const [history, setHistory] = useState<AnalysisResult[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loadingPDF, setLoadingPDF] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("http://localhost:8000/history");

                if (!res.ok) {
                    throw new Error("Не удалось загрузить статистику");
                }

                const data: AnalysisResult[] = await res.json();
                setHistory(data);
            } catch (error) {
                toast.error("Ошибка загрузки статистики", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Неизвестная ошибка",
                });
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, []);

    const fetchReportPDF = async () => {
        try {
            setLoadingPDF(true);
            const res = await fetch("http://localhost:8000/history/report/pdf");

            if (!res.ok) {
                throw new Error(res.status + " " + res.statusText);
            }


            const disposition = res.headers.get('Content-Disposition');
            let filename = `report_${new Date().getTime()}.pdf`;

            if (disposition && disposition.includes('filename=')) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // 2. Получаем данные в виде Blob
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            // 3. Скачивание
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("Отчёт успешно загружен");

        } catch (error) {
            toast.error("Ошибка загрузки отчёта", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Неизвестная ошибка",
            });
        } finally {
            setLoadingPDF(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <header className="flex-shrink-0">
                <h1 className="text-3xl font-bold">Статистика запросов</h1>
                <p className="text-muted-foreground">
                    Здесь отображается информация о ваших запросах и их результатах.
                </p>
            </header>
            <Button className={"w-fit flex-shrink-0"} disabled={loadingPDF || loadingHistory || history.length == 0}
                    onClick={() => {
                        fetchReportPDF();
                    }}>
                {loadingPDF && <Spinner className="h-4 w-4 animate-spin"/>}
                Сохранить в отчёт PDF
            </Button>
            <Card className={"flex flex-1 lg:min-h-0 h-full"}>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Таблица запросов
                    </CardTitle>
                </CardHeader>

                <CardContent  className={"flex-1 lg:min-h-0 h-full"}>
                    <ScrollArea  className={"flex-1 lg:min-h-0 h-full"}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">
                                        Изображение
                                    </TableHead>
                                    <TableHead>Дата</TableHead>
                                    <TableHead>Найдено</TableHead>
                                    <TableHead>Классы</TableHead>
                                    <TableHead className="text-center">
                                        Уверенность
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {history.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center py-20 text-muted-foreground  justify-center content-center"
                                        >
                                            {loadingHistory ? (
                                                <Spinner className={"m-auto size-7"}/>) : ("История пуста")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((item) => {
                                        const avgConfidence =
                                            item.detections.length === 0
                                                ? 0
                                                : item.detections.reduce(
                                                (acc, d) =>
                                                    acc + d.confidence,
                                                0
                                            ) / item.detections.length;

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-left">
                                                    {item.image ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="py-5 group gap-2 dark:hover:bg-primary/10"
                                                            onClick={() => {
                                                                const w = window.open("");
                                                                w!.document.write(`<img src="${item.image}" style="max-width:100%; height:auto;">`);
                                                            }}>
                                                            <div
                                                                className="w-8 h-8 rounded-md overflow-hidden border bg-muted flex-shrink-0">
                                                                <img
                                                                    src={item.image}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                                    alt="preview"
                                                                />
                                                            </div>
                                                            <span className="font-medium text-xs">Просмотр</span>
                                                            <Eye size={14}
                                                                 className="text-muted-foreground group-hover:text-primary"/>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        item.timestamp
                                                    ).toLocaleString()}
                                                </TableCell>

                                                <TableCell className={"text-center"}>
                                                    {item.total}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {[
                                                            ...new Set(
                                                                item.detections.map(
                                                                    (d) =>
                                                                        d.class
                                                                )
                                                            ),
                                                        ]
                                                            .slice(0, 4)
                                                            .map((c) => (
                                                                <Badge
                                                                    key={c}
                                                                    variant="outline"
                                                                    className="text-[10px]"
                                                                >
                                                                    {c}
                                                                </Badge>
                                                            ))}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center font-mono">
                                                    {(avgConfidence * 100).toFixed(
                                                        0
                                                    )}
                                                    %
                                                </TableCell>


                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
