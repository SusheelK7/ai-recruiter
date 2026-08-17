"use client";

import React, { useState, useRef, useEffect } from "react";

interface ApplicationFormProps {
  publicUrl: string;
  jobTitle: string;
  companyName: string;
}

export function ApplicationForm({ publicUrl, jobTitle, companyName }: ApplicationFormProps) {
  // Form fields
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isDragOverResume, setIsDragOverResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [videoMode, setVideoMode] = useState<"record" | "upload">("record");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // MediaRecorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(60);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Submission & UI feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ---------------------------------------------------------------------------
  // Resume File Selection & Drag/Drop Logic
  // ---------------------------------------------------------------------------
  const validateAndSetResume = (file: File) => {
    setResumeError(null);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const allowedExtensions = [".pdf", ".docx", ".doc"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setResumeError("Only PDF or DOCX files are allowed.");
      return;
    }

    if (file.size > MAX_SIZE) {
      setResumeError(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setResumeFile(file);
  };

  const handleResumeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOverResume(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetResume(e.dataTransfer.files[0]);
    }
  };

  // ---------------------------------------------------------------------------
  // MediaRecorder API (In-Browser Camera Recording)
  // ---------------------------------------------------------------------------
  const startCameraStream = async (): Promise<MediaStream | null> => {
    try {
      setIsRequestingCamera(true);
      setVideoError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 24 } },
        audio: true,
      });
      setMediaStream(stream);
      return stream;
    } catch (err: any) {
      console.error("Camera access error:", err);
      setVideoError("Camera/Microphone access was not granted. Please allow permissions in your browser or choose 'Upload File' instead.");
      return null;
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const stopCameraStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  };

  // Connect active media stream to live video preview element
  useEffect(() => {
    if (videoLiveRef.current && mediaStream) {
      videoLiveRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Clean up media tracks when unmounting
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleModeChange = (mode: "record" | "upload") => {
    if (mode !== "record") {
      stopCameraStream();
    }
    setVideoMode(mode);
    setVideoError(null);
  };

  const startRecording = async () => {
    let stream = mediaStream;
    if (!stream) {
      stream = await startCameraStream();
      if (!stream) return;
    }

    setVideoError(null);
    recordedChunksRef.current = [];

    let options: MediaRecorderOptions = { videoBitsPerSecond: 600000 };
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
      options.mimeType = "video/webm;codecs=vp8,opus";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      options.mimeType = "video/webm";
    } else if (MediaRecorder.isTypeSupported("video/mp4")) {
      options.mimeType = "video/mp4";
    }

    try {
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        const file = new File([blob], `intro-video-${Date.now()}.${recorder.mimeType.includes("mp4") ? "mp4" : "webm"}`, {
          type: blob.type,
        });
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(blob));
        stopCameraStream();
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSecondsLeft(60);

      // Countdown timer logic
      timerIntervalRef.current = setInterval(() => {
        setRecordingSecondsLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Failed to start MediaRecorder:", err);
      setVideoError("Failed to start video recording. Try uploading a pre-recorded video.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleReRecord = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoError(null);
  };

  // ---------------------------------------------------------------------------
  // Pre-recorded Video File Upload Logic
  // ---------------------------------------------------------------------------
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setVideoError("Please upload a valid video file.");
      return;
    }

    // Check duration via transient video element
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = URL.createObjectURL(file);

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      if (tempVideo.duration > 60.5) {
        setVideoError(`Video exceeds the 60-second limit (${Math.round(tempVideo.duration)} seconds).`);
        return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    };

    tempVideo.onerror = () => {
      setVideoError("Could not read video metadata. Please select a valid video.");
    };
  };

  // ---------------------------------------------------------------------------
  // Form Submission
  // ---------------------------------------------------------------------------
  const isFormValid =
    candidateName.trim().length >= 2 &&
    candidateEmail.includes("@") &&
    candidatePhone.trim().length >= 7 &&
    resumeFile !== null &&
    videoFile !== null &&
    !isRecording;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionProgress("Preparing application data...");

    try {
      const formData = new FormData();
      formData.append("candidateName", candidateName.trim());
      formData.append("candidateEmail", candidateEmail.trim());
      formData.append("candidatePhone", candidatePhone.trim());
      formData.append("resume", resumeFile as Blob);
      formData.append("video", videoFile as Blob);

      setSubmissionProgress("Uploading resume to R2 & generating video transcript...");

      const response = await fetch(`/api/jobs/${publicUrl}/apply`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Application submission failed.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setSubmitError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render Success Confirmation View
  // ---------------------------------------------------------------------------
  if (isSubmitted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-6 text-center shadow-md dark:border-emerald-900/40 dark:bg-emerald-950/20 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-emerald-950 dark:text-emerald-100 sm:text-3xl">
          Application Submitted!
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed sm:text-base">
          Thank you for applying, <strong className="font-semibold text-emerald-950 dark:text-emerald-50">{candidateName}</strong>! Your application for{" "}
          <strong className="font-semibold text-emerald-950 dark:text-emerald-50">{jobTitle}</strong> at{" "}
          <strong className="font-semibold text-emerald-950 dark:text-emerald-50">{companyName}</strong> has been received successfully.
        </p>

        <div className="mt-6 rounded-xl border border-emerald-200/60 bg-white/60 p-4 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300 sm:text-sm">
          The recruiting team will review your resume and video introduction. You will be notified via email at <strong className="font-semibold">{candidateEmail}</strong> if selected for the next steps.
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render Application Form
  // ---------------------------------------------------------------------------
  return (
    <div className="dashboard-card rounded-2xl p-6 sm:p-8">
      <div className="border-b border-[var(--border-color)] pb-4">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">Apply for Position</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
          Complete candidate profile, attach your resume, and record a 60-second introduction.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 sm:text-sm">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        {/* Candidate Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">1. Candidate Information</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] transition-all focus:border-[var(--brand-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="jane@example.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] transition-all focus:border-[var(--brand-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="+1 (555) 000-0000"
              value={candidatePhone}
              onChange={(e) => setCandidatePhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] transition-all focus:border-[var(--brand-accent)] focus:outline-none sm:max-w-md"
            />
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              2. Resume Upload <span className="text-rose-500">*</span>
            </h4>
            <span className="text-xs text-[var(--text-muted)]">PDF or DOCX only (Max 5MB)</span>
          </div>

          {resumeError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
              ⚠️ {resumeError}
            </div>
          )}

          {resumeFile ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-300/80 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase">
                  {resumeFile.name.split(".").pop()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{resumeFile.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResumeFile(null)}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                Remove
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOverResume(true);
              }}
              onDragLeave={() => setIsDragOverResume(false)}
              onDrop={handleResumeDrop}
              onClick={() => resumeInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isDragOverResume
                  ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]/5"
                  : "border-[var(--border-color)] hover:border-[var(--brand-accent)]/60 bg-[var(--bg-main)]/30"
              }`}
            >
              <svg className="h-8 w-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                Drag & drop your resume here, or <span className="text-[var(--brand-accent)] underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Supports PDF and DOCX format up to 5MB</p>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetResume(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Video Introduction Section */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                3. Video Introduction (Max 60s) <span className="text-rose-500">*</span>
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Introduce yourself, your background, and why you are a great fit for this role.
              </p>
            </div>

            {/* Mode Selector */}
            {!videoFile && (
              <div className="inline-flex rounded-xl bg-[var(--bg-main)] p-1 border border-[var(--border-color)] shrink-0">
                <button
                  type="button"
                  onClick={() => handleModeChange("record")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    videoMode === "record"
                      ? "bg-[var(--brand-accent)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Record Cam
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("upload")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    videoMode === "upload"
                      ? "bg-[var(--brand-accent)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Upload File
                </button>
              </div>
            )}
          </div>

          {videoError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              ⚠️ {videoError}
            </div>
          )}

          {/* Recorded / Selected Video Preview */}
          {videoFile && videoPreviewUrl ? (
            <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
              <div className="relative overflow-hidden rounded-xl bg-black aspect-video max-w-lg mx-auto">
                <video src={videoPreviewUrl} controls className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  Selected Video: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
                <button
                  type="button"
                  onClick={handleReRecord}
                  className="rounded-xl border border-[var(--border-color)] px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/10 transition-colors"
                >
                  🔄 Re-record / Replace
                </button>
              </div>
            </div>
          ) : videoMode === "record" ? (
            /* In-Browser Recording Area */
            <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-zinc-950 p-4 max-w-lg mx-auto text-center shadow-inner">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                {mediaStream ? (
                  <>
                    <video ref={videoLiveRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                    {isRecording ? (
                      <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-rose-600/90 px-3 py-1 text-xs font-bold text-white shadow-lg animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-white"></span>
                        REC 00:{recordingSecondsLeft.toString().padStart(2, "0")}
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-semibold text-white shadow">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                        Camera Active
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300 mb-3 shadow-inner">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-zinc-200">Camera & Microphone Closed</p>
                    <p className="mt-1 text-xs text-zinc-400 max-w-xs">
                      Permissions are only requested when you choose to turn on the camera.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                {!mediaStream ? (
                  <>
                    <button
                      type="button"
                      disabled={isRequestingCamera}
                      onClick={() => startCameraStream()}
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
                      </svg>
                      {isRequestingCamera ? "Requesting Access..." : "Turn On Camera"}
                    </button>
                    <button
                      type="button"
                      disabled={isRequestingCamera}
                      onClick={startRecording}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-white"></span>
                      Start 60s Recording
                    </button>
                  </>
                ) : !isRecording ? (
                  <>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-all"
                    >
                      <span className="h-3 w-3 rounded-full bg-white"></span>
                      Start 60s Recording
                    </button>
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                    >
                      Turn off Camera
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition-all"
                  >
                    ⏹ Stop Recording
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Pre-recorded Video File Upload */
            <div className="rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-main)]/30 p-6 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
                className="block w-full text-xs text-[var(--text-muted)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--brand-accent)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[var(--brand-accent-hover)] cursor-pointer"
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">Max duration 60 seconds (WebM, MP4, MOV)</p>
            </div>
          )}
        </div>

        {/* Submit Application Button */}
        <div className="pt-4 border-t border-[var(--border-color)]">
          {isSubmitting && (
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[var(--brand-accent)] animate-pulse">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{submissionProgress}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full rounded-xl bg-[var(--brand-accent)] py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--brand-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting Application..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
