import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Upload} from "lucide-react";
import {Switch} from "@/components/ui/switch.tsx";
import { Spinner } from "@/components/ui/spinner"

import React, {useState} from "react";
import type {AnalysisResult} from "@/types.ts";
import { toast } from "sonner";
import {Button} from "@/components/ui/button.tsx";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel.tsx";
import {cn} from "@/lib/utils.ts";
import {Badge} from "@/components/ui/badge.tsx";



export  default function DetectionView() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [showProcessed, setShowProcessed] = useState(false);
    const [selectedTestImage, setSelectedTestImage] = useState<string | null>(null);

    const TEST_IMAGES = Array.from({ length: 11 }, (_, i) => ({
        id: i + 1,
        src: `/test_img/${i + 1}.png`,
    }));
    const setTestImageAsFile = async (imgSrc: string) => {
        try {
            const res = await fetch(imgSrc);
            const blob = await res.blob();

            const fileName = imgSrc.split("/").pop() || "test.jpg";
            const file = new File([blob], fileName, {type: blob.type});

            setFile(file);        // ✅ теперь это полноценный File
            setPreview(URL.createObjectURL(file));
            setSelectedTestImage(imgSrc);
            setResult(null);
            setShowProcessed(false);
        } catch (err) {
            console.error("Не удалось загрузить тестовое изображение", err)
        }
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);


        try {
            const response = await fetch("http://localhost:8000/detect", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            const newResult: AnalysisResult = {
                ...data,
                timestamp: new Date().toLocaleString(),
            };

            setResult(newResult);

            setResult(data);
            setShowProcessed(true);
        } catch (error) {
            toast.error("Ошибка сети", {
                // eslint-disable-next-line
                // @ts-expect-error
                description: error.message,
            });
            console.error("Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col h-full">
            <header className="flex-shrink-0">
                <h1 className="text-3xl font-bold">Анализ изображения</h1>
                <p className="text-muted-foreground">
                    Загрузите фото для обнаружения опасных предметов.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 lg:min-h-0 h-full">

                <div className="flex flex-col lg:col-span-2 flex-1 lg:min-h-0 gap-8">
                    {/* IMAGE CARD */}
                    <Card className="flex flex-col flex-1 lg:min-h-0">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Изображение
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 flex flex-col flex-1 lg:min-h-0">
                            {!preview ? (
                                <label
                                    className="border-2 border-dashed rounded-2xl flex flex-1 flex-col items-center justify-center cursor-pointer hover:bg-muted transition">
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={onFileChange}
                                    />
                                    <Upload size={32} className="text-muted-foreground"/>
                                    <p className="mt-4 font-medium">
                                        Нажмите для загрузки фото
                                    </p>
                                </label>
                            ) : (
                                <>
                                    {/* IMAGE */}
                                    <div
                                        className="relative rounded-2xl overflow-hidden bg-muted border flex-1 flex">
                                        <img
                                            src={showProcessed && result ? result.image : preview!}
                                            className="w-full h-auto object-contain"
                                        />

                                        {loading && (
                                            <div
                                                className="absolute inset-0 bg-background/60 rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center">
                                                <Spinner/>
                                                <span className="font-medium animate-pulse">Анализ изображения...</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3 justify-between">
                                        {/* TOGGLE */}
                                        {result && (
                                            <div className="flex items-center gap-3 ">
                                                <Switch
                                                    checked={showProcessed}
                                                    disabled={!result}
                                                    onCheckedChange={setShowProcessed}
                                                />
                                                <span className="text-sm">Показать обработанное</span>
                                            </div>
                                        )}
                                        <div className="flex gap-3 justify-end ml-auto">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setPreview(null);
                                                    setResult(null);
                                                    setSelectedTestImage(null);
                                                }}
                                            >
                                                Сбросить
                                            </Button>
                                            <Button
                                                onClick={handleAnalyze}
                                                disabled={loading || !file  || result != null}
                                            >
                                                {loading ? "Обработка..." : "Начать анализ"}
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    {/*TEST IMG CARD*/}
                    <Card className={"h-fit"}>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Тестовые изображения
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="relative overflow-hidden px-20">
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {TEST_IMAGES.map((img) => (
                                        <CarouselItem
                                            key={img.id}
                                            className="basis-1/2 md:basis-1/4 lg:basis-1/5"
                                        >
                                            <div
                                                className={cn(
                                                    "relative cursor-pointer rounded-xl overflow-hidden border transition-all ",
                                                )}
                                                onClick={() => setTestImageAsFile(img.src)}
                                            >
                                                <img
                                                    src={img.src}
                                                    className="aspect-[4/3] object-cover"
                                                />

                                                {selectedTestImage === img.src && (
                                                    <div
                                                        className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                        <Badge className="text-xs">
                                                            Выбрано
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>

                                <CarouselPrevious/>
                                <CarouselNext/>
                            </Carousel>
                        </CardContent>
                    </Card>
                </div>

                {/* STATS CARD */}
                <Card className="lg:row-start-1 lg:col-start-3 lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            Обнаружено
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {!result ? (
                            <p className="text-sm text-muted-foreground">
                                Нет данных
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {/* TOTAL */}
                                <div className="text-center">
                                    <p className="text-xs uppercase text-muted-foreground font-bold">
                                        Опасных предметов
                                    </p>
                                    <p className="text-4xl font-black mt-1">
                                        {result.detections.length}
                                    </p>
                                </div>

                                {/* PER CLASS */}
                                <div className="space-y-2">
                                    {Object.entries(
                                        result.detections.reduce((acc, d) => {
                                            acc[d.class] = (acc[d.class] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>)
                                    ).map(([cls, count]) => (
                                        <div
                                            key={cls}
                                            className="flex justify-between items-center p-2 rounded-lg bg-muted text-sm"
                                        >
                                            <span>{cls}</span>
                                            <Badge variant="secondary">
                                                {count}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}