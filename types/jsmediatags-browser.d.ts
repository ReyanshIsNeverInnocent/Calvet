declare module "jsmediatags/dist/jsmediatags.min.js" {
  export function read(
    location: File,
    callbacks: {
      onSuccess: (data: {
        tags: {
          title?: string;
          artist?: string;
          picture?: { format: string; data: number[] };
        };
      }) => void;
      onError?: (error: { type: string; info: string }) => void;
    }
  ): void;
}
