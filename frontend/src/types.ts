export interface Detection {
    class: string;
    confidence: number;
}

export type AnalysisResult = {
    id: string;
    timestamp: string;
    total: number;
    image?: string;
    detections: Detection[];
};