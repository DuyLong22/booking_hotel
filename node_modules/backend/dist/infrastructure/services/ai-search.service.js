"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSearchService = void 0;
const axios_1 = __importDefault(require("axios"));
const ai_config_1 = __importDefault(require("../../config/ai.config"));
const AMENITY_LIST = [
    'Wifi miễn phí',
    'Hồ bơi',
    'Bãi đỗ xe',
    'Phòng Gym / Thể hình',
    'Điều hòa nhiệt độ',
    'Nhà hàng ăn uống',
    'Dịch vụ Spa / Massage',
    'Quầy bar / Lounge'
];
class AiSearchService {
    getSystemPrompt() {
        return `Bạn là một trợ lý AI thông minh chuyên phân tích câu truy vấn tìm kiếm khách sạn bằng tiếng Việt.
Nhiệm vụ của bạn là đọc câu hỏi của người dùng và bóc tách các tiêu chí tìm kiếm thành một đối tượng JSON có cấu trúc chính xác như sau:

{
  "city": string | null,        // Tên Tỉnh/Thành phố (ví dụ: "Đà Lạt", "Đà Nẵng", "Nha Trang", "Hồ Chí Minh", "Hà Nội")
  "priceMin": number | null,    // Khoảng giá tối thiểu (đơn vị VNĐ, ví dụ: 1000000)
  "priceMax": number | null,    // Khoảng giá tối đa (đơn vị VNĐ, ví dụ: 2000000)
  "starRating": number | null,  // Xếp hạng sao (từ 1 đến 5)
  "amenities": string[],        // Mảng các tiện ích, CHỈ ĐƯỢC CHỌN từ danh sách sau nếu người dùng đề cập:
                                // ["Wifi miễn phí", "Hồ bơi", "Bãi đỗ xe", "Phòng Gym / Thể hình", "Điều hòa nhiệt độ", "Nhà hàng ăn uống", "Dịch vụ Spa / Massage", "Quầy bar / Lounge"]
                                // (Ví dụ: "có hồ bơi" -> "Hồ bơi", "chỗ đậu xe" -> "Bãi đỗ xe")
  "capacity": number | null,    // Sức chứa tối thiểu của phòng (Số lượng khách tối đa, ví dụ: đi 2 người lớn 2 trẻ em -> 4, đi gia đình -> 4, đi cặp đôi -> 2)
  "landmark": string | null     // Địa danh cụ thể gần đó được nhắc tới (ví dụ: "Hồ Xuân Hương", "Chợ Bến Thành", "Sân bay", "bãi biển Mỹ Khê")
}

Quy tắc bóc tách:
1. Hãy trả về CHỈ một chuỗi JSON thuần túy, không có thẻ markdown \`\`\`json hay bất kỳ văn bản nào khác.
2. Nếu thông tin nào người dùng không nhắc tới, hãy đặt giá trị là null (hoặc mảng rỗng [] đối với amenities).
3. Đổi các cụm từ chỉ giá cả như "dưới 2 triệu" -> priceMax = 2000000, "khoảng 1.5 triệu" -> priceMin = 1300000, priceMax = 1700000.`;
    }
    async parseQuery(queryText) {
        const provider = ai_config_1.default.preferProvider;
        console.log(`[AiSearchService]: Sử dụng nhà cung cấp AI: ${provider}`);
        try {
            if (provider === 'gemini') {
                return await this.callGemini(queryText);
            }
            else if (provider === 'openai') {
                return await this.callOpenAI(queryText);
            }
            else {
                return this.parseMock(queryText);
            }
        }
        catch (error) {
            console.error('[AiSearchService Error]: Gọi AI thất bại, đang chuyển sang chế độ fallback:', error);
            return this.parseMock(queryText);
        }
    }
    async callGemini(queryText) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ai_config_1.default.geminiApiKey}`;
        const response = await axios_1.default.post(url, {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `${this.getSystemPrompt()}\n\nHãy phân tích câu truy vấn sau:\n"${queryText}"` }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });
        const textOutput = response.data.candidates[0].content.parts[0].text;
        return JSON.parse(textOutput.trim());
    }
    async callOpenAI(queryText) {
        const url = 'https://api.openai.com/v1/chat/completions';
        const response = await axios_1.default.post(url, {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: this.getSystemPrompt() },
                { role: 'user', content: queryText }
            ],
            response_format: { type: 'json_object' }
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ai_config_1.default.openaiApiKey}`
            }
        });
        const content = response.data.choices[0].message.content;
        return JSON.parse(content.trim());
    }
    // Phương thức phân tích regex giả lập phòng hờ trường hợp không có API Key
    parseMock(queryText) {
        const text = queryText.toLowerCase();
        const result = {
            city: null,
            priceMin: null,
            priceMax: null,
            starRating: null,
            amenities: [],
            capacity: null,
            landmark: null
        };
        // Tìm thành phố
        if (text.includes('đà lạt') || text.includes('dalat'))
            result.city = 'Đà Lạt';
        else if (text.includes('đà nẵng') || text.includes('da nang'))
            result.city = 'Đà Nẵng';
        else if (text.includes('nha trang'))
            result.city = 'Nha Trang';
        else if (text.includes('phú quốc') || text.includes('phu quoc'))
            result.city = 'Phú Quốc';
        else if (text.includes('hồ chí minh') || text.includes('sài gòn') || text.includes('hcm'))
            result.city = 'Thành phố Hồ Chí Minh';
        else if (text.includes('hà nội') || text.includes('ha noi'))
            result.city = 'Thành phố Hà Nội';
        // Tìm giá
        const priceMatch = text.match(/(dưới|trên|khoảng)?\s*(\d+(\.\d+)?)\s*(triệu|tr)/);
        if (priceMatch) {
            const value = parseFloat(priceMatch[2]) * 1000000;
            const type = priceMatch[1];
            if (type === 'dưới') {
                result.priceMax = value;
            }
            else if (type === 'trên') {
                result.priceMin = value;
            }
            else {
                result.priceMin = value - 300000;
                result.priceMax = value + 300000;
            }
        }
        // Tìm tiện ích
        if (text.includes('hồ bơi') || text.includes('bể bơi'))
            result.amenities.push('Hồ bơi');
        if (text.includes('đậu xe') || text.includes('đỗ xe') || text.includes('ô tô'))
            result.amenities.push('Bãi đỗ xe');
        if (text.includes('wifi') || text.includes('mạng'))
            result.amenities.push('Wifi miễn phí');
        if (text.includes('gym') || text.includes('thể hình'))
            result.amenities.push('Phòng Gym / Thể hình');
        if (text.includes('điều hòa') || text.includes('máy lạnh'))
            result.amenities.push('Điều hòa nhiệt độ');
        if (text.includes('ăn sáng') || text.includes('nhà hàng'))
            result.amenities.push('Nhà hàng ăn uống');
        if (text.includes('spa') || text.includes('massage'))
            result.amenities.push('Dịch vụ Spa / Massage');
        if (text.includes('bar') || text.includes('rượu'))
            result.amenities.push('Quầy bar / Lounge');
        // Tìm sức chứa
        if (text.includes('gia đình') || text.includes('trẻ em') || text.includes('con nhỏ')) {
            result.capacity = 4;
        }
        else if (text.includes('cặp đôi') || text.includes('2 người')) {
            result.capacity = 2;
        }
        // Tìm địa danh
        if (text.includes('hồ xuân hương') || text.includes('xuan huong'))
            result.landmark = 'Hồ Xuân Hương';
        if (text.includes('sân bay'))
            result.landmark = 'Sân bay';
        if (text.includes('bãi biển') || text.includes('gần biển'))
            result.landmark = 'bãi biển';
        console.log('[AiSearchService Mock Fallback Output]:', result);
        return result;
    }
}
exports.AiSearchService = AiSearchService;
exports.default = new AiSearchService();
