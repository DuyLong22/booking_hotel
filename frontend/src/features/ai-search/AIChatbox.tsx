import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Send, X, MapPin, MessageSquare, User } from 'lucide-react';
import apiClient from '../../core/api/client';

interface HotelCard {
  id: string;
  name: string;
  province: string;
  district: string;
  starRating: number;
  priceFrom: number;
  averageRating: number;
  images: { url: string }[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  hotels?: HotelCard[];
  loading?: boolean;
}

const SUGGESTIONS = [
  "Tìm khách sạn Đà Lạt dưới 2 triệu có hồ bơi",
  "Resort sát biển Đà Nẵng cho gia đình 4 người",
  "Villa sang trọng ở Phú Quốc view hoàng hôn"
];

export const AIChatbox: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Tìm kiếm Khách sạn AI. Bạn muốn đi du lịch ở đâu? Hãy thử mô tả cụ thể nhu cầu của bạn (khoảng giá, địa điểm, tiện nghi, số người đi...) để tôi tìm phòng phù hợp nhất giúp bạn!'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiClient.post('/ai/search', { message: textToSend });
      const { success, data } = response.data;

      if (success) {
        const { aiAnalysis, hotels } = data;
        
        let replyText = '';
        if (hotels.length === 0) {
          replyText = 'Tôi đã hiểu các tiêu chí của bạn nhưng hiện tại hệ thống chưa tìm thấy khách sạn nào khớp chính xác. Bạn có muốn đổi từ khóa hoặc điều chỉnh khoảng giá không?';
        } else {
          replyText = `Dựa trên phân tích yêu cầu của bạn (Vị trí: ${aiAnalysis.city || 'Tự do'}, Tiện ích: ${aiAnalysis.amenities.join(', ') || 'Không bắt buộc'}, Ngân sách: ${aiAnalysis.priceMax ? `Dưới ${aiAnalysis.priceMax.toLocaleString('vi-VN')} đ` : 'Tự do'}), tôi đã tìm thấy ${hotels.length} khách sạn phù hợp nhất:`;
        }

        const aiNewMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          hotels: hotels.length > 0 ? hotels : undefined
        };

        setMessages(prev => [...prev, aiNewMessage]);
      }
    } catch (error) {
      console.error('AI Search API error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          sender: 'ai',
          text: 'Rất tiếc, đã có sự cố kết nối tới hệ thống AI. Vui lòng thử lại sau giây lát.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const aiQuery = searchParams.get('aiQuery');
    if (aiQuery) {
      setIsOpen(true);
      handleSendMessage(aiQuery);
      
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('aiQuery');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-[360px] sm:w-[420px] h-[550px] rounded-premium border border-slate-100 shadow-2xl bg-white flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1">
                    Trợ lý AI Search <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-bounce" />
                  </h3>
                  <span className="text-[10px] text-primary-light flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                    Hoạt động trực tuyến
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`px-3.5 py-2.5 rounded-premium text-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10'
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Hotel Cards Carousel */}
                    {msg.hotels && (
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {msg.hotels.map((hotel) => (
                          <div
                            key={hotel.id}
                            className="w-[200px] bg-white border border-slate-150 rounded-premium overflow-hidden shadow-sm shrink-0 flex flex-col justify-between hover-lift cursor-pointer"
                            onClick={() => {
                              setIsOpen(false);
                              navigate(`/hotel/${hotel.id}`);
                            }}
                          >
                            <img
                              src={hotel.images[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                              alt={hotel.name}
                              className="w-full h-24 object-cover"
                            />
                            <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{hotel.name}</h4>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{hotel.district}, {hotel.province}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center text-[10px] bg-primary/5 text-primary font-bold px-1.5 py-0.5 rounded">
                                    ★ {hotel.starRating} sao
                                  </span>
                                  {hotel.averageRating > 0 && (
                                    <span className="text-[10px] bg-green-50 text-green-700 font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                                      ★ {hotel.averageRating}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right border-t border-slate-50 pt-1">
                                  <span className="text-[10px] text-slate-400">Giá từ</span>
                                  <p className="font-bold text-xs text-red-500">
                                    {hotel.priceFrom.toLocaleString('vi-VN')} đ
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 animate-bounce">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-premium rounded-tl-none px-4 py-3 flex gap-1 shadow-sm items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && !isTyping && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 space-y-1.5">
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Ý tưởng gợi ý:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug)}
                      className="text-[11px] text-primary bg-primary-light hover:bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1 text-left transition-colors font-medium"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Tìm khách sạn bằng tiếng Việt..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-premium px-3.5 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
              <button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isTyping}
                className="bg-primary hover:bg-primary-dark disabled:bg-slate-250 text-white p-2 rounded-premium transition-colors shadow-md shadow-primary/15"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-xl hover:shadow-primary/30 transition-all"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-pulse" />}
      </motion.button>
    </div>
  );
};
export default AIChatbox;
