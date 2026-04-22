import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Mic, Smile, Image as ImageIcon, File, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../design-system/Button';
import { cn } from '../../utils/cn';

interface MessageInputProps {
    onSend: (text: string) => void;
    onUpload?: (file: File) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend, onUpload }) => {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    }, [text]);

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text);
        setText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 relative z-20">
            <div className="max-w-4xl mx-auto flex items-end gap-3">
                {/* Attach Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                            showAttachMenu ? "bg-sapphire text-white rotate-45" : "bg-gray-50 text-secondary-text hover:bg-gray-100"
                        )}
                    >
                        <PlusIcon size={22} className={showAttachMenu ? "rotate-0" : "rotate-0 transition-transform"} />
                    </button>

                    <AnimatePresence>
                        {showAttachMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-16 left-0 w-48 bg-white rounded-2xl shadow-soft-xl border border-gray-100 py-2 overflow-hidden"
                            >
                                <AttachmentItem icon={<ImageIcon size={18} />} label="Photo" onClick={() => fileInputRef.current?.click()} />
                                <AttachmentItem icon={<File size={18} />} label="Document" onClick={() => { }} />
                                <AttachmentItem icon={<MapPin size={18} />} label="Location" onClick={() => { }} />
                                <AttachmentItem icon={<Mic size={18} />} label="Voice" onClick={() => setIsRecording(true)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Field */}
                <div className="flex-1 flex flex-col bg-gray-50 rounded-[24px] border border-gray-100 focus-within:bg-white focus-within:border-sapphire/20 focus-within:ring-4 focus-within:ring-sapphire/5 transition-all px-2 py-2">
                    <div className="flex items-end">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-medium py-2.5 px-3 resize-none max-h-40 text-primary-text placeholder:text-gray-400 outline-none custom-scrollbar"
                        />
                        <button className="p-2.5 text-secondary-text/40 hover:text-sapphire transition-colors">
                            <Smile size={22} />
                        </button>
                    </div>
                </div>

                {/* Right Action (Mic or Send) */}
                <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                        {text.trim() ? (
                            <motion.button
                                key="send"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                onClick={handleSend}
                                className="w-12 h-12 rounded-full bg-gradient-to-r from-sapphire-start to-sapphire-end text-white shadow-lg shadow-sapphire/20 flex items-center justify-center hover:shadow-glow active:scale-95 transition-all"
                            >
                                <Send size={20} className="ml-0.5" />
                            </motion.button>
                        ) : (
                            <motion.button
                                key="mic"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="w-12 h-12 rounded-full bg-gray-50 text-secondary-text flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all"
                            >
                                <Mic size={20} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUpload) onUpload(file);
                }}
            />
        </div>
    );
};

const PlusIcon = ({ size, className }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const AttachmentItem = ({ icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        className="w-full px-4 py-2.5 flex items-center gap-3 text-secondary-text hover:bg-gray-50 hover:text-primary-text transition-all text-sm font-bold"
    >
        <span className="text-sapphire">{icon}</span>
        {label}
    </button>
);
