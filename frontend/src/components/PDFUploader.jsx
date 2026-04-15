import { useRef, useState, useCallback } from "react";
import axios from "axios";
import { quizAPI } from "../api/quiz";
import LoadingSpinner from "./LoadingSpinner";

const STATUS = {
  IDLE: "idle",
  UPLOADING: "uploading",
  PARSING: "parsing",
  DONE: "done",
  ERROR: "error",
};

// props: quizSetId, onComplete
export default function PDFUploader({ quizSetId, onComplete }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [message, setMessage] = useState("");
  const pollingRef = useRef(null);

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function pollStatus(jobId) {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await quizAPI.getParsingStatus(jobId);
        const data = res.data?.job ?? res.data;
        if (data?.status === "completed") {
          stopPolling();
          setStatus(STATUS.DONE);
          setMessage("PDF 파싱이 완료되었습니다. 문제가 추가되었습니다.");
          onComplete?.();
        } else if (data?.status === "failed") {
          stopPolling();
          setStatus(STATUS.ERROR);
          setMessage("PDF 파싱에 실패했습니다. 다시 시도해주세요.");
        }
      } catch {
        stopPolling();
        setStatus(STATUS.ERROR);
        setMessage("파싱 상태 확인 중 오류가 발생했습니다.");
      }
    }, 3000);
  }

  async function handleFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setStatus(STATUS.ERROR);
      setMessage("PDF 파일만 업로드할 수 있습니다.");
      return;
    }

    setStatus(STATUS.UPLOADING);
    setMessage("업로드 중...");

    try {
      // presigned URL 발급
      const res = await quizAPI.uploadPDF({
        quizSetId,
        fileName: file.name,
        contentType: file.type,
      });
      const { uploadUrl, jobId } = res.data;

      // S3에 직접 PUT 업로드
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      setStatus(STATUS.PARSING);
      setMessage("PDF를 분석 중입니다...");
      pollStatus(jobId);
    } catch (err) {
      setStatus(STATUS.ERROR);
      setMessage(err?.response?.data?.message ?? "업로드에 실패했습니다.");
    }
  }

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      handleFile(file);
    },
    [quizSetId],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleInputChange = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const isActive = status === STATUS.UPLOADING || status === STATUS.PARSING;

  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 transition-colors cursor-pointer
          ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"}
          ${isActive ? "pointer-events-none opacity-60" : ""}
        `}
        onClick={() => !isActive && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === "Enter" && !isActive && inputRef.current?.click()
        }
        aria-label="PDF 파일 업로드 영역"
      >
        {isActive ? (
          <LoadingSpinner size="md" className="text-blue-500" />
        ) : (
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {isActive ? message : "PDF 파일을 드래그하거나 클릭하여 업로드"}
          </p>
          {!isActive && (
            <p className="text-xs text-gray-400 mt-1">PDF 파일만 지원됩니다</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {status === STATUS.DONE && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {message}
        </div>
      )}

      {status === STATUS.ERROR && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {message}
          <button
            onClick={() => setStatus(STATUS.IDLE)}
            className="ml-auto text-xs underline hover:no-underline"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
