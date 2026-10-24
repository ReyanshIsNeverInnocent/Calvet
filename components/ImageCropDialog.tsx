"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";

type ImageCropDialogProps = {
  imageUrl: string;
  aspectRatio: number;
  title: string;
  onCancel: () => void;
  onSave: (image: Blob) => Promise<void>;
};

type Dimensions = {
  width: number;
  height: number;
};

type Position = {
  x: number;
  y: number;
};

export default function ImageCropDialog({
  imageUrl,
  aspectRatio,
  title,
  onCancel,
  onSave
}: ImageCropDialogProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragOrigin = useRef<{ pointerX: number; pointerY: number; position: Position } | null>(
    null
  );
  const [frame, setFrame] = useState<Dimensions>({ width: 0, height: 0 });
  const [image, setImage] = useState<Dimensions>({ width: 0, height: 0 });
  const [position, setPosition] = useState<Position | null>(null);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setFrame({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale =
    image.width > 0 && frame.width > 0
      ? Math.max(frame.width / image.width, frame.height / image.height) * zoom
      : 1;
  const renderedWidth = image.width * scale;
  const renderedHeight = image.height * scale;
  const cropPosition = position
    ? clampPosition(position)
    : {
        x: (frame.width - renderedWidth) / 2,
        y: (frame.height - renderedHeight) / 2
      };

  function clampPosition(next: Position, nextScale = scale) {
    const width = image.width * nextScale;
    const height = image.height * nextScale;
    return {
      x: Math.min(0, Math.max(frame.width - width, next.x)),
      y: Math.min(0, Math.max(frame.height - height, next.y))
    };
  }

  function handleZoom(nextZoom: number) {
    if (!image.width || !frame.width) return;

    const currentScale = scale;
    const nextScale = Math.max(frame.width / image.width, frame.height / image.height) * nextZoom;
    const imageCenterX = (frame.width / 2 - cropPosition.x) / currentScale;
    const imageCenterY = (frame.height / 2 - cropPosition.y) / currentScale;
    setZoom(nextZoom);
    setPosition(
      clampPosition(
        {
          x: frame.width / 2 - imageCenterX * nextScale,
          y: frame.height / 2 - imageCenterY * nextScale
        },
        nextScale
      )
    );
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (saving) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      position: cropPosition
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    setPosition(
      clampPosition({
        x: dragOrigin.current.position.x + event.clientX - dragOrigin.current.pointerX,
        y: dragOrigin.current.position.y + event.clientY - dragOrigin.current.pointerY
      })
    );
  }

  async function saveCrop() {
    const sourceImage = imageRef.current;
    if (!sourceImage || !frame.width || !frame.height) return;

    setSaving(true);
    setError("");
    try {
      const outputWidth = aspectRatio === 1 ? 512 : 1600;
      const outputHeight = Math.round(outputWidth / aspectRatio);
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare the cropped image.");

      const sourceX = -cropPosition.x / scale;
      const sourceY = -cropPosition.y / scale;
      const sourceWidth = frame.width / scale;
      const sourceHeight = sourceWidth / aspectRatio;
      context.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const croppedImage = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(blob)
              : reject(new Error("Your browser could not export the cropped image.")),
          "image/png"
        );
      });
      await onSave(croppedImage);
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "Could not crop this image. Please try another file."
      );
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#17151d] p-5 text-white shadow-2xl sm:p-7"
      >
        <h2 id="image-crop-title" className="text-xl font-semibold">
          Crop {title}
        </h2>
        <p className="mt-1 text-sm text-white/55">
          Drag the image to reposition it, then adjust the zoom.
        </p>

        <div
          ref={frameRef}
          className="mx-auto mt-5 touch-none overflow-hidden rounded-2xl bg-black/50"
          style={{
            width:
              aspectRatio === 1
                ? "min(100%, 55vh)"
                : `min(100%, ${aspectRatio * 55}vh)`,
            aspectRatio
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => {
            dragOrigin.current = null;
          }}
          onPointerCancel={() => {
            dragOrigin.current = null;
          }}
        >
          {imageUrl && (
            <Image
              ref={imageRef}
              src={imageUrl}
              alt="Image crop preview"
              width={Math.max(1, Math.ceil(renderedWidth))}
              height={Math.max(1, Math.ceil(renderedHeight))}
              unoptimized
              onLoad={(event) =>
                setImage({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight
                })
              }
              className="pointer-events-none max-w-none select-none"
              style={{
                position: "relative",
                left: cropPosition.x,
                top: cropPosition.y,
                width: renderedWidth,
                height: renderedHeight,
                maxWidth: "none"
              }}
            />
          )}
        </div>

        <label className="mt-5 block text-sm font-medium">
          Zoom
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            disabled={!image.width}
            onChange={(event) => handleZoom(Number(event.target.value))}
            className="mt-2 w-full accent-violet-500"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void saveCrop()}
            disabled={saving || !image.width}
            className="rounded-xl bg-violet-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-violet-300 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Use cropped image"}
          </button>
        </div>
      </section>
    </div>
  );
}
