import {QuizVideoPayload} from './quiz-schema';

export interface RenderAssetPlan {
  videoId: string;
  title: string;
  compositionId: string;
  thumbnailCompositionId: string;
  videoOutputPath: string;
  thumbnailOutputPath: string;
  description: string;
  tags: string[];
}

export const buildRenderCatalog = (videos: QuizVideoPayload[]): RenderAssetPlan[] => {
  return videos.map((payload, index) => {
    const item = String(index + 1).padStart(3, '0');

    return {
      videoId: payload.video.id,
      title: payload.video.title,
      compositionId: `QuizVertical_${item}`,
      thumbnailCompositionId: `QuizThumb_${item}`,
      videoOutputPath: `out/videos/${payload.video.id}.mp4`,
      thumbnailOutputPath: `out/thumbnails/${payload.video.id}.png`,
      description: payload.video.description,
      tags: payload.video.tags,
    };
  });
};
