import type { EventKeys, Events } from 'alemonjs';
export type FaceSegment = {
    id: string;
    text?: string;
};
export declare const getMediaUrls: <T extends EventKeys>(event: Events[T], type?: "image" | "file") => string[];
export declare const getFirstImage: <T extends EventKeys>(event: Events[T]) => string | null;
export declare const getFaceSegments: <T extends EventKeys>(event: Events[T]) => FaceSegment[];
export declare const formatImageLinks: (urls: string[]) => string;
export declare const formatFaces: (faces: FaceSegment[]) => string;
export declare const formatOcrResult: (data: unknown) => string;
