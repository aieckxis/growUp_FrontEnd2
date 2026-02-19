"use client"

import { Camera, X, Download, Trash2, Maximize2, Home, BarChart3, Settings } from "lucide-react"
import React, { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

/* --- CONFIGURATION & TYPES (API Ready) --- */
// 🌟 RASPI API BASE URL - Updated for video stream
const RASPI_API_BASE_URL = process.env.NEXT_PUBLIC_RASPI_API_URL || "http://192.168.210.142:8000/video_feed";
const VIDEO_STREAM_URL = `${RASPI_API_BASE_URL}/video_feed`; // Direct stream URL

interface PlantDetection { name: string; status: string; color: 'emerald' | 'amber'; }
interface Snapshot { id: number; date: string; time: string; thumbnail: string; }
interface CameraSettingsState {
    resolution: string;
    fps: number;
    brightness: number;
    contrast: number;
    detectionSensitivity: number;
    autoFocus: boolean;
    nightMode: boolean;
    motionDetection: boolean;
}
interface ToastProps { message: string; visible: boolean; color: 'success' | 'info' | 'warning' | 'default' | 'error'; onClose: () => void; }

// --- MOCK DATA (Remains for UI structure/AI results) ---
const PLANT_DETECTIONS: PlantDetection[] = [
    { name: "Kale #1", status: "Growing", color: "emerald" },
    { name: "Kale #2", status: "Growing", color: "emerald" },
    { name: "Kale #3", status: "Growing", color: "emerald" },
    { name: "Kale #4", status: "Growing", color: "emerald" }
]

const GALLERY_SNAPSHOTS_MOCK: Snapshot[] = [
    { id: 1, date: "2024-11-19", time: "08:00 AM", thumbnail: "🌱" },
    { id: 2, date: "2024-11-18", time: "08:00 AM", thumbnail: "🌿" },
    { id: 3, date: "2024-11-17", time: "08:00 AM", thumbnail: "🥬" },
    { id: 4, date: "2024-11-16", time: "08:00 AM", thumbnail: "🍃" },
    { id: 5, date: "2024-11-15", time: "08:00 AM", thumbnail: "🌱" },
    { id: 6, date: "2024-11-14", time: "08:00 AM", thumbnail: "🌿" },
]

const INITIAL_CAMERA_SETTINGS: CameraSettingsState = {
    resolution: "1080p", fps: 30, brightness: 50, contrast: 50,
    detectionSensitivity: 75, autoFocus: true, nightMode: false, motionDetection: true,
}

/* --- RASPI API IMPLEMENTATIONS --- */

/**
 * 🌟 RASPI API: Fetch camera settings and initial state.
 */
const fetchCameraSettingsFromAPI = async (): Promise<{ settings: CameraSettingsState, isRecording: boolean }> => {
    try {
        const response = await fetch(`${RASPI_API_BASE_URL}/camera/settings`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        return {
            settings: { ...INITIAL_CAMERA_SETTINGS, ...data.settings },
            isRecording: data.isRecording ?? false
        };
    } catch (error) {
        console.error('RASPI API ERROR: Failed to fetch camera settings:', error);
        return { settings: INITIAL_CAMERA_SETTINGS, isRecording: false };
    }
};

/**
 * 🌟 RASPI API: Save camera settings.
 */
const saveCameraSettingsToAPI = async (settings: CameraSettingsState): Promise<boolean> => {
    try {
        const response = await fetch(`${RASPI_API_BASE_URL}/camera/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return true;
    } catch (error) {
        console.error('RASPI API ERROR: Failed to save camera settings:', error);
        return false;
    }
};

/**
 * 🌟 RASPI API: Toggle recording state.
 */
const toggleRecordingAPI = async (shouldRecord: boolean): Promise<boolean> => {
    try {
        const response = await fetch(`${RASPI_API_BASE_URL}/camera/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: shouldRecord ? 'start' : 'stop' }),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return true;
    } catch (error) {
        console.error('RASPI API ERROR: Failed to toggle recording:', error);
        return false;
    }
};

/**
 * 🌟 RASPI API: Capture a snapshot from the video stream.
 */
const captureSnapshotAPI = async (): Promise<{ success: boolean; snapshotId?: number; url?: string }> => {
    try {
        const response = await fetch(`${RASPI_API_BASE_URL}/camera/snapshot`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return { success: true, snapshotId: data.id, url: data.url };
    } catch (error) {
        console.error('RASPI API ERROR: Failed to capture snapshot:', error);
        return { success: false };
    }
};

/**
 * 🌟 RASPI API: Delete a snapshot.
 */
const deleteSnapshotAPI = async (snapshotId: number): Promise<boolean> => {
    try {
        const response = await fetch(`${RASPI_API_BASE_URL}/camera/snapshot/${snapshotId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return true;
    } catch (error) {
        console.error(`RASPI API ERROR: Failed to delete snapshot ${snapshotId}:`, error);
        return false;
    }
};

const simulateDownloadFn = (mimeType: string, filename: string, contentLabel: string, duration?: number): void => {
    let mockContent = `Mock ${contentLabel} data captured at ${new Date().toLocaleString()}.`;
    if (duration) { mockContent += ` Duration: ${formatDuration(duration)}.`; }
    const blob = new Blob([mockContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);

    setTimeout(() => {
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 10);
}

const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const formatted = [h, m, s]
        .map(v => v.toString().padStart(2, '0'))
        .filter((v, i) => v !== "00" || i > 0 || h > 0)
        .join(":");
    return formatted.startsWith("0") && formatted.length > 2 ? formatted.substring(1) : formatted;
}

/* --- CUSTOM HOOK (API READY) --- */
const useCameraSettings = (showToast: (message: string, color: 'success' | 'info' | 'warning' | 'default' | 'error') => void) => {
    const [settings, setSettings] = useState<CameraSettingsState>(INITIAL_CAMERA_SETTINGS);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    const loadInitialState = useCallback(async () => {
        setIsLoading(true);
        const { settings: loadedSettings, isRecording: initialRecordingStatus } = await fetchCameraSettingsFromAPI();
        setSettings(loadedSettings);
        setIsRecording(initialRecordingStatus);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadInitialState();
    }, [loadInitialState]);

    const handleSettingChange = (key: keyof CameraSettingsState, value: string | number | boolean): void => {
        setSettings(prev => ({ ...prev, [key]: value as any }));
        setHasChanges(true);
    }

    const handleSave = async (): Promise<boolean> => {
        const success = await saveCameraSettingsToAPI(settings);
        if (success) {
            setHasChanges(false);
            showToast("✅ Camera settings saved to Raspberry Pi!", 'success');
        } else {
            showToast("❌ Failed to save settings to Raspi.", 'error');
        }
        return success;
    };

    const handleToggleRecord = async (shouldRecord: boolean): Promise<boolean> => {
        const success = await toggleRecordingAPI(shouldRecord);
        if (success) {
            setIsRecording(shouldRecord);
            if (shouldRecord) {
                showToast("🎥 Recording command sent to Raspi.", 'info');
            } else {
                showToast("⏹️ Stop recording command sent. File is processing...", 'success');
            }
        } else {
            showToast("❌ Failed to send recording command to Raspi.", 'error');
        }
        return success;
    };

    return {
        settings, isRecording, isLoading, hasChanges,
        handleSettingChange, handleSave, handleToggleRecord
    };
};

/* --- UI COMPONENTS --- */
const Toast: React.FC<ToastProps> = ({ message, visible, color, onClose }) => {
    if (!visible) return null;
    const baseClasses = "fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 z-[100] flex items-center space-x-3";
    let colorClasses = "";
    switch (color) {
        case 'success': colorClasses = "bg-emerald-600 text-white"; break;
        case 'info': colorClasses = "bg-blue-600 text-white"; break;
        case 'warning': colorClasses = "bg-amber-600 text-white"; break;
        case 'error': colorClasses = "bg-red-600 text-white"; break;
        default: colorClasses = "bg-gray-800 text-white";
    }
    return (
        <div className={`${baseClasses} ${colorClasses}`}>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20"><X className="w-4 h-4" /></button>
        </div>
    );
};

const Navbar: React.FC<{ time: string }> = ({ time }) => (
    <div className="bg-white px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 sticky top-0 z-40">
        <span className="font-bold text-gray-900">GROWUP</span>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">{time}</span>
        </div>
    </div>
);

const BottomNavigation = () => {
    const pathname = usePathname();
    const tabs = [
        { id: "dashboard", label: "Home", href: "/dashboard", icon: Home },
        { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
        { id: "camera", label: "Camera", href: "/camera", icon: Camera },
        { id: "settings", label: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="flex items-center justify-around py-3">
                {tabs.map((tab) => {
                    const isActive = pathname?.startsWith(tab.href);
                    const Icon = tab.icon;
                    return (
                        <Link key={tab.id} href={tab.href} className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:text-gray-700"}`}>
                            <Icon className="w-5 h-5 mb-1" />
                            <span className="text-xs font-semibold">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

/* --- Main App Component with VIDEO STREAM --- */

export default function App() {
    // Video Stream State
    const [streamError, setStreamError] = useState<boolean>(false);
    const [streamLoading, setStreamLoading] = useState<boolean>(true);
    const videoRef = useRef<HTMLImageElement>(null);

    // Local UI State
    const [currentTime, setCurrentTime] = useState<Date>(new Date())
    const [showSettings, setShowSettings] = useState<boolean>(false)
    const [showGallery, setShowGallery] = useState<boolean>(false)
    const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null)
    const [recordingDuration, setRecordingDuration] = useState<number>(0);
    const [zoomLevel, setZoomLevel] = useState<number>(1.0);
    const [showZoomControls, setShowZoomControls] = useState<boolean>(false);
    const [gallerySnapshots, setGallerySnapshots] = useState<Snapshot[]>(GALLERY_SNAPSHOTS_MOCK);

    // Toast State
    const [toast, setToast] = useState<{ message: string; visible: boolean; color: 'success' | 'info' | 'warning' | 'default' | 'error' }>({ 
        message: '', visible: false, color: 'info' 
    });

    const showToast = useCallback((message: string, color: 'success' | 'info' | 'warning' | 'default' | 'error' = 'info'): void => {
        setToast({ message, visible: true, color });
        setTimeout(() => { setToast(prev => ({ ...prev, visible: false })); }, 3000);
    }, []);

    // Load camera settings
    const {
        settings, isRecording, isLoading, hasChanges,
        handleSettingChange, handleSave, handleToggleRecord
    } = useCameraSettings(showToast);

    // Video Stream Error Handling
    const handleStreamLoad = useCallback(() => {
        setStreamLoading(false);
        setStreamError(false);
        showToast("📹 Video stream connected!", 'success');
    }, [showToast]);

    const handleStreamError = useCallback(() => {
        setStreamLoading(false);
        setStreamError(true);
        showToast("⚠️ Cannot connect to camera stream. Check Raspberry Pi connection.", 'error');
    }, [showToast]);

    // Time and Recording Duration Ticker
    useEffect(() => {
        const timeInterval = setInterval(() => { setCurrentTime(new Date()) }, 1000)
        let recordInterval: NodeJS.Timeout | null = null;

        if (isRecording) {
            recordInterval = setInterval(() => { setRecordingDuration(prevDuration => prevDuration + 1); }, 1000);
        } else if (!isRecording && recordingDuration > 0) {
            if (recordingDuration < 3) {
                showToast("Recording too short, file discarded.", 'warning');
            }
            setRecordingDuration(0);
        }

        return () => {
            clearInterval(timeInterval);
            if (recordInterval) clearInterval(recordInterval);
        };
    }, [isRecording, recordingDuration, showToast]);

    const handleSaveSettings = async (): Promise<void> => {
        const success = await handleSave();
        if (success) {
            setShowSettings(false);
        }
    }

    const handleRecord = async (): Promise<void> => {
        await handleToggleRecord(!isRecording);
    }

    const handleSnapshot = async (): Promise<void> => {
        showToast("📸 Capturing snapshot...", 'info');
        const result = await captureSnapshotAPI();
        if (result.success) {
            showToast("✅ Snapshot saved to gallery!", 'success');
            // Optionally refresh gallery here
        } else {
            showToast("❌ Failed to capture snapshot", 'error');
        }
    }

    const handleZoomToggle = (): void => {
        setShowZoomControls(prev => !prev);
        if (!showZoomControls) {
            showToast("🔍 Zoom controls enabled. Adjust the slider for magnification.", 'info');
        } else {
            showToast("🔍 Zoom controls disabled.", 'info');
        }
    }

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setZoomLevel(Number(e.target.value));
    }

    const handleGalleryDownload = (snapshot: Snapshot): void => {
        simulateDownloadFn('image/png', `kale_gallery_snapshot_${snapshot.id}_${snapshot.date.replace(/-/g, '')}.png`, `Gallery Snapshot ID ${snapshot.id}`);
        showToast(`Downloaded & saved: ${snapshot.date}`, 'success');
    }

    const handleDelete = async (): Promise<void> => {
        if (!selectedSnapshot) return;

        const success = await deleteSnapshotAPI(selectedSnapshot.id);
        if (success) {
            setGallerySnapshots(prev => prev.filter(s => s.id !== selectedSnapshot.id));
            showToast("🗑️ Snapshot deleted successfully from Raspi.", 'warning');
            setSelectedSnapshot(null);
        } else {
            showToast("❌ Failed to delete snapshot on Raspi.", 'error');
        }
    }

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center max-w-md mx-auto bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                    <p className="text-gray-700 font-semibold">Loading camera configuration from Raspberry Pi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
            <Navbar time={currentTime.toLocaleTimeString()} />

            <div className="space-y-5 pb-24 px-4 py-5">
                <h1 className="text-3xl font-extrabold text-gray-800 pt-2">
                    Camera Monitor
                </h1>
                <p className="text-gray-500 -mt-3">Real-time surveillance and health analysis for your Kale Tower.</p>

                {/* 🌟 LIVE VIDEO STREAM FEED */}
                <div className="bg-gray-900 rounded-2xl aspect-square relative overflow-hidden group shadow-xl">
                    {/* Zoom Wrapper */}
                    <div
                        className="absolute inset-0 transition-transform duration-300 ease-in-out"
                        style={{ transform: `scale(${zoomLevel})` }}
                    >
                        {/* ACTUAL VIDEO STREAM */}
                        {!streamError ? (
                            <img
                                ref={videoRef}
                                src={VIDEO_STREAM_URL}
                                alt="Live Kale Tower Feed"
                                className="w-full h-full object-cover"
                                onLoad={handleStreamLoad}
                                onError={handleStreamError}
                            />
                        ) : (
                            // Fallback UI when stream fails
                            <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-orange-900/30 flex items-center justify-center">
                                <div className="text-center text-white p-6">
                                    <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <div className="text-lg font-semibold">Camera Stream Unavailable</div>
                                    <div className="text-sm opacity-70 mt-2">Check Raspberry Pi connection</div>
                                    <div className="text-xs opacity-50 mt-3 font-mono">{VIDEO_STREAM_URL}</div>
                                </div>
                            </div>
                        )}

                        {/* Loading Overlay */}
                        {streamLoading && !streamError && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                                    <div className="text-lg font-semibold">Connecting to camera...</div>
                                </div>
                            </div>
                        )}

                        {/* Recording Duration Indicator */}
                        {isRecording && (
                            <div className="absolute top-4 left-4 bg-red-600/90 text-white px-3 py-1 rounded-xl font-bold text-sm shadow-md backdrop-blur-sm z-10">
                                REC {formatDuration(recordingDuration)}
                            </div>
                        )}

                        {/* Live/Recording indicator */}
                        <div className={`absolute top-4 right-4 w-4 h-4 rounded-full shadow-md z-10 ${
                            isRecording ? 'bg-red-600 animate-pulse' : streamError ? 'bg-gray-500' : 'bg-green-500'
                        }`}></div>

                        {/* Time and Specs Overlay */}
                        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg text-white backdrop-blur-sm z-10">
                            <div className="text-sm font-semibold font-mono">
                                {currentTime.toLocaleTimeString()}
                            </div>
                            <div className="text-xs text-gray-300">
                                {settings.resolution} • {settings.fps}fps • {isRecording ? 'Recording' : streamError ? 'Offline' : 'Live'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zoom Slider Controls */}
                {showZoomControls && (
                    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900 mb-4 border-b pb-2">
                            Zoom Level: <span className="text-purple-600">{zoomLevel.toFixed(1)}x</span>
                        </h3>
                        <input
                            type="range"
                            min="1.0"
                            max="4.0"
                            step="0.1"
                            value={zoomLevel}
                            onChange={handleZoomChange}
                            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-2">
                            <span>1x (Wide)</span>
                            <span>4x (Macro)</span>
                        </div>
                    </div>
                )}

                {/* AI Detection Results */}
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 border-b pb-2">
                        <span className="text-emerald-500">AI</span> Plant Health Status
                    </h3>
                    <div className="space-y-3">
                        {PLANT_DETECTIONS.map((plant, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center justify-between p-3 rounded-xl transition-shadow ${
                                    plant.color === "emerald"
                                        ? "bg-emerald-50 border border-emerald-200 hover:shadow-md"
                                        : "bg-amber-50 border border-amber-200 hover:shadow-md"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-3 h-3 rounded-full shadow-inner ${
                                            plant.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"
                                        }`}
                                    ></div>
                                    <span className="font-medium text-gray-900">{plant.name}</span>
                                </div>
                                <span
                                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                        plant.color === "emerald" 
                                            ? "text-emerald-800 bg-emerald-200" 
                                            : "text-amber-800 bg-amber-200"
                                    }`}
                                >
                                    {plant.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Camera Controls */}
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 border-b pb-2">
                        Action Center
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSnapshot}
                            disabled={streamError}
                            className={`p-4 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${
                                streamError 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-pink-100 hover:bg-pink-200 text-pink-700'
                            }`}
                        >
                            📸 Snapshot
                        </button>
                        <button
                            onClick={() => setShowGallery(true)}
                            className="p-4 bg-emerald-100 hover:bg-emerald-200 rounded-xl font-bold text-emerald-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                        >
                            🖼️ Gallery
                        </button>
                        <button
                            onClick={handleRecord}
                            disabled={streamError}
                            className={`p-4 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${
                                streamError 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : isRecording
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                            }`}
                        >
                            {isRecording ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="animate-ping inline-block w-3 h-3 bg-white rounded-full"></span>
                                    STOP ({formatDuration(recordingDuration)})
                                </span>
                            ) : (
                                "🎥 Record"
                            )}
                        </button>
                        <button
                            onClick={handleZoomToggle}
                            disabled={streamError}
                            className={`p-4 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${
                                streamError
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : showZoomControls
                                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                                    : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                            }`}
                        >
                            🔍 Zoom ({zoomLevel.toFixed(1)}x)
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-4 bg-orange-100 hover:bg-orange-200 rounded-xl font-bold text-orange-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98] col-span-2"
                        >
                            ⚙️ Settings
                        </button>
                    </div>
                </div>
            </div>

            <BottomNavigation />

            {/* Toast Notification */}
            <Toast
                message={toast.message}
                visible={toast.visible}
                color={toast.color}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* Settings Modal - SAME AS BEFORE */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900">Camera Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 space-y-6">
                            {/* Resolution */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution</label>
                                <select 
                                    value={settings.resolution} 
                                    onChange={(e) => handleSettingChange("resolution", e.target.value)} 
                                    className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="720p">720p (HD)</option>
                                    <option value="1080p">1080p (Full HD)</option>
                                </select>
                            </div>
                            {/* FPS */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Frame Rate (FPS)</label>
                                <select 
                                    value={settings.fps} 
                                    onChange={(e) => handleSettingChange("fps", Number(e.target.value))} 
                                    className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value={15}>15 FPS</option>
                                    <option value={30}>30 FPS</option>
                                </select>
                            </div>
                            {/* Brightness */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Brightness: <span className="text-emerald-600 font-bold">{settings.brightness}%</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={settings.brightness} 
                                    onChange={(e) => handleSettingChange("brightness", Number(e.target.value))} 
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-emerald-500" 
                                />
                            </div>
                            {/* Contrast */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Contrast: <span className="text-emerald-600 font-bold">{settings.contrast}%</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={settings.contrast} 
                                    onChange={(e) => handleSettingChange("contrast", Number(e.target.value))} 
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                                />
                            </div>
                            {/* AI Sensitivity */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    AI Detection Sensitivity: <span className="text-emerald-600 font-bold">{settings.detectionSensitivity}%</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={settings.detectionSensitivity} 
                                    onChange={(e) => handleSettingChange("detectionSensitivity", Number(e.target.value))} 
                                    className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                                />
                                <p className="text-xs text-gray-500 mt-1">Higher sensitivity detects more kale but may increase false positives</p>
                            </div>
                            {/* Motion Detection Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div>
                                    <div className="font-semibold text-gray-900">Motion Detection</div>
                                    <div className="text-xs text-gray-500">Alert on movement detection</div>
                                </div>
                                <label className="relative inline-block w-12 h-6">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.motionDetection} 
                                        onChange={(e) => handleSettingChange("motionDetection", e.target.checked)} 
                                        className="sr-only peer" 
                                    />
                                    <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>
                            {/* Save and Close Buttons */}
                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={!hasChanges}
                                    className={`w-full p-4 font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl active:scale-[0.99] ${
                                        hasChanges 
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {hasChanges ? 'Save Changes to Raspi' : 'Settings Synced'}
                                </button>
                                <button 
                                    onClick={() => setShowSettings(false)} 
                                    className="w-full p-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors active:scale-[0.99]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Modal - SAME AS BEFORE */}
            {showGallery && !selectedSnapshot && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Snapshot Gallery</h2>
                                <p className="text-sm text-gray-500">Automatic 8:00 AM captures</p>
                            </div>
                            <button onClick={() => setShowGallery(false)} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {gallerySnapshots.map((snapshot) => (
                                    <div 
                                        key={snapshot.id} 
                                        onClick={() => setSelectedSnapshot(snapshot)} 
                                        className="bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-emerald-400 transition-all cursor-pointer shadow-md"
                                    >
                                        <div className="aspect-square bg-gradient-to-br from-emerald-50/50 to-teal-100/50 flex items-center justify-center text-5xl sm:text-6xl">
                                            {snapshot.thumbnail}
                                        </div>
                                        <div className="p-3 bg-white">
                                            <div className="font-semibold text-gray-900 text-sm">{snapshot.date}</div>
                                            <div className="text-xs text-gray-500">{snapshot.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => setShowGallery(false)} 
                                className="w-full mt-4 p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors active:scale-[0.99]"
                            >
                                Close Gallery
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full View Modal for Gallery Snapshot */}
            {selectedSnapshot && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="max-w-md w-full h-full max-h-[95vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <button 
                                onClick={() => setSelectedSnapshot(null)} 
                                className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors font-semibold"
                            >
                                <span className="text-2xl">←</span>Back to Gallery
                            </button>
                            <button 
                                onClick={() => { setSelectedSnapshot(null); setShowGallery(false); }} 
                                className="text-white hover:text-red-500 transition-colors p-2 rounded-full"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl shadow-2xl overflow-y-auto flex-grow min-h-0">
                            <div className="aspect-square bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-[8rem] sm:text-[10rem]">
                                {selectedSnapshot.thumbnail}
                            </div>
                            <div className="p-6 bg-white">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Snapshot - {selectedSnapshot.date}</h3>
                                <p className="text-gray-500 mb-4">Captured at {selectedSnapshot.time}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => handleGalleryDownload(selectedSnapshot)} 
                                        className="p-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        <Download className="w-5 h-5" />Download
                                    </button>
                                    <button 
                                        onClick={handleDelete} 
                                        className="p-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        <Trash2 className="w-5 h-5" />Delete
                                    </button>
                                </div>
                                <button 
                                    onClick={() => { setSelectedSnapshot(null); setShowGallery(false); }} 
                                    className="w-full mt-4 p-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors active:scale-[0.99]"
                                >
                                    Close & Exit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
