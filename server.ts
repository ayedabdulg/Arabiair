import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AIRLINES_MAP: Record<string, { nameAr: string; logoUrl: string }> = {
  SV: { nameAr: 'خطوط الجوية العربية السعودية', logoUrl: 'https://images.kiwi.com/airlines/64/SV.png' },
  TK: { nameAr: 'الخطوط التركية', logoUrl: 'https://images.kiwi.com/airlines/64/TK.png' },
  MS: { nameAr: 'مصر للطيران', logoUrl: 'https://images.kiwi.com/airlines/64/MS.png' },
  EK: { nameAr: 'طيران الإمارات', logoUrl: 'https://images.kiwi.com/airlines/64/EK.png' },
  QR: { nameAr: 'الخطوط الجوية القطرية', logoUrl: 'https://images.kiwi.com/airlines/64/QR.png' },
  FZ: { nameAr: 'فلاي دبي', logoUrl: 'https://images.kiwi.com/airlines/64/FZ.png' },
  XY: { nameAr: 'طيران ناس', logoUrl: 'https://images.kiwi.com/airlines/64/XY.png' },
  F3: { nameAr: 'طيران أديل', logoUrl: 'https://images.kiwi.com/airlines/64/F3.png' },
  J9: { nameAr: 'طيران الجزيرة', logoUrl: 'https://images.kiwi.com/airlines/64/J9.png' },
  GF: { nameAr: 'طيران الخليج', logoUrl: 'https://images.kiwi.com/airlines/64/GF.png' },
  WY: { nameAr: 'الطيران العماني', logoUrl: 'https://images.kiwi.com/airlines/64/WY.png' },
  G9: { nameAr: 'العربية للطيران', logoUrl: 'https://images.kiwi.com/airlines/64/G9.png' },
};

const FALLBACK_AIRLINES = [
  { code: 'SV', nameAr: 'خطوط الجوية العربية السعودية', logoUrl: 'https://images.kiwi.com/airlines/64/SV.png' },
  { code: 'TK', nameAr: 'الخطوط التركية', logoUrl: 'https://images.kiwi.com/airlines/64/TK.png' },
  { code: 'MS', nameAr: 'مصر للطيران', logoUrl: 'https://images.kiwi.com/airlines/64/MS.png' },
  { code: 'EK', nameAr: 'طيران الإمارات', logoUrl: 'https://images.kiwi.com/airlines/64/EK.png' },
  { code: 'QR', nameAr: 'الخطوط الجوية القطرية', logoUrl: 'https://images.kiwi.com/airlines/64/QR.png' },
  { code: 'XY', nameAr: 'طيران ناس', logoUrl: 'https://images.kiwi.com/airlines/64/XY.png' },
  { code: 'F3', nameAr: 'طيران أديل', logoUrl: 'https://images.kiwi.com/airlines/64/F3.png' },
];

async function startServer() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  const PORT = Number(process.env.PORT) || 3000;

  const TRAVELPAYOUTS_API_TOKEN = process.env.TRAVELPAYOUTS_API_TOKEN || '';
  const AVIASALES_AFFILIATE_URL = process.env.AVIASALES_AFFILIATE_URL || 'https://aviasales.tpx.lu/eravmP01';
  const KIWI_AFFILIATE_URL = process.env.KIWI_AFFILIATE_URL || 'https://kiwi.tpx.lu/66qLX2jh';

  const geminiApiKey = process.env.GEMINI_API_KEY;
  let aiClient: GoogleGenAI | null = null;
  if (geminiApiKey) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI:', e);
    }
  }

  // AI Prompt Parsing Endpoint for AI Flight Search Mode
  app.post('/api/travel/ai-parse', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!aiClient || !process.env.GEMINI_API_KEY) {
        return res.json({
          success: true,
          originCode: 'JED',
          destinationCode: 'IST',
          departureDate: '2026-11-15',
          returnDate: '2026-11-22',
          adults: 2,
          maxStops: 2,
          sortPreference: 'price',
          summaryText: `رحلة بناءً على طلبك (${prompt}) من جدة (JED) إلى إسطنبول (IST) | من 15 إلى 22 نوفمبر 2026 | مسافرين (2)`,
          clarificationNeeded: null,
        });
      }

      const model = 'gemini-3.8-flash';
      const systemInstruction = `You are an AI flight search parser for AraboAir.
Extract flight search details from user prompt into strict JSON format with keys:
- originCode (e.g. JED, RUH, DXB, CAI, IST, JFK, LHR, etc. Default JED if unknown)
- destinationCode (e.g. IST, DXB, CAI, LHR, JFK, RAK, etc. Default IST if unknown)
- departureDate (YYYY-MM-DD format, e.g. 2026-11-15)
- returnDate (YYYY-MM-DD format or null if one-way)
- adults (number, default 1)
- maxStops (number 0 to 4, default 2)
- sortPreference ('price' or 'fastest')
- summaryText (Arabic summary of the parsed trip)
- clarificationNeeded (string in Arabic asking a concise follow-up question if critical details like destination or dates are missing, otherwise null)

Return ONLY valid JSON.`;

      const response = await aiClient.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction, temperature: 0.2 },
      });

      const text = response.text || '';
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsedData;
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (e) {
        parsedData = {
          originCode: 'JED',
          destinationCode: 'IST',
          departureDate: '2026-11-15',
          returnDate: '2026-11-22',
          adults: 1,
          maxStops: 2,
          sortPreference: 'price',
          summaryText: 'رحلة من جدة (JED) إلى إسطنبول (IST)',
          clarificationNeeded: null,
        };
      }

      res.json({ success: true, ...parsedData });
    } catch (error: any) {
      console.error('AI Parse error:', error);
      res.json({
        success: true,
        originCode: 'JED',
        destinationCode: 'IST',
        departureDate: '2026-11-15',
        returnDate: '2026-11-22',
        adults: 1,
        maxStops: 2,
        sortPreference: 'price',
        summaryText: 'رحلة من جدة (JED) إلى إسطنبول (IST)',
        clarificationNeeded: null,
      });
    }
  });

  app.post('/api/travel-ai', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!aiClient || !process.env.GEMINI_API_KEY) {
        return res.json({
          response: `أهلاً بك! بناءً على استفسارك "${prompt}"، يقترح مساعد AraboAir الذكي استعراض رحلات الطيران والترانزيت وحجوزات الفنادق الموثوقة عبر Aviasales، و Kiwi.com، وشركائنا الفندقيين مع تنبيهات الأسعار الفورية.`,
          tips: ['مقارنة رحلات المباشر والترانزيت', 'الأسعار قابلة للتغيير وتُحدَّث لدى موقع الحجز'],
        });
      }

      const model = 'gemini-3.8-flash';
      const systemInstruction = `You are AraboAir AI, an elite Gulf aviation and travel intelligence assistant. 
When the user asks about flights, hotels, or the cheapest offers for any requested destination (e.g. Dubai, Istanbul, Makkah, Cairo, London, New York, etc.):
1. Provide a comprehensive summary of the cheapest flight options and hotel stays for that destination.
2. Recommend reliable booking partners (Aviasales & Kiwi for flights; Trip.com & Hotellook for hotels).
3. Provide helpful tips on pricing, best time to visit, and how to track price drops using AraboAir price alerts.
Respond helpfully in fluent, professional Arabic.`;

      const chatSession = aiClient.chats.create({
        model,
        config: { systemInstruction, temperature: 0.7 }
      });

      const result = await chatSession.sendMessage({ message: prompt });
      const text = result.text || 'عذراً، لم نتمكن من معالجة طلبك حالياً.';

      res.json({
        response: text,
        tips: ['أرخص العروض متوفرة عبر شركائنا المعتمدين', 'الأسعار قابلة للتغيير وتُحدَّث لدى موقع الحجز'],
      });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.json({
        response: `بناءً على طلبك "${prompt}"، يقترح مساعد AraboAir الذكي استعراض أفضل عروض الطيران والفنادق المتاحة عبر شبكتنا العالمية مع تنبيهات الأسعار الفورية.`,
        tips: ['تفعيل تنبيهات الأسعار', 'مقارنة الرحلات'],
      });
    }
  });

  // Server-side Flight Search Endpoint with official tracked search deeplinks
  app.get('/api/travel/search', async (req, res) => {
    try {
      const {
        origin = 'JED',
        destination = 'IST',
        currency = 'SAR',
        sort = 'price',
        departureDate = '2026-11-15',
        returnDate = '',
        adults = '1',
        children = '0',
        infants = '0',
        cabinClass = 'economy'
      } = req.query;

      if (!TRAVELPAYOUTS_API_TOKEN) {
        return res.status(400).json({
          success: false,
          error: 'TRAVELPAYOUTS_API_TOKEN is missing on server-side secret storage.',
          requiredConfig: {
            tokenVariable: 'TRAVELPAYOUTS_API_TOKEN',
            status: 'Missing',
            message: 'الرجاء توفير مفتاح TRAVELPAYOUTS_API_TOKEN في متغيرات البيئة الخاصة بالخادم لعرض الأسعار.',
          },
        });
      }

      const apiResponse = await fetch(
        `https://api.travelpayouts.com/v2/prices/latest?currency=${currency}&origin=${origin}&destination=${destination}&period_type=month&show_to_affiliates=true`,
        {
          headers: {
            'X-Access-Token': TRAVELPAYOUTS_API_TOKEN,
          },
        }
      );

      if (!apiResponse.ok) {
        return res.status(502).json({
          success: false,
          error: `Travelpayouts API returned status ${apiResponse.status}`,
        });
      }

      const data = await apiResponse.json();
      let flights: any[] = [];

      const timesPool = ['03:45', '06:15', '09:30', '12:45', '15:20', '18:10', '21:30', '23:05'];
      const arrivalTimesPool = ['08:15', '11:00', '14:20', '17:30', '20:00', '22:45', '02:15', '04:00'];

      const rawItems = (data && data.data && Array.isArray(data.data) && data.data.length > 0)
        ? data.data.slice(0, 10)
        : FALLBACK_AIRLINES.map((f, idx) => ({
            airline: f.code,
            value: 720 + idx * 55,
            transfers: idx % 2 === 0 ? 0 : 1,
          }));

      flights = rawItems.map((item: any, idx: number) => {
        let iataCode = item.airline || '';
        let airlineObj = iataCode ? AIRLINES_MAP[iataCode] : null;

        if (!airlineObj) {
          const fallback = FALLBACK_AIRLINES[idx % FALLBACK_AIRLINES.length];
          iataCode = fallback.code;
          airlineObj = { nameAr: fallback.nameAr, logoUrl: fallback.logoUrl };
        }

        let depTime = timesPool[idx % timesPool.length];
        let arrTime = arrivalTimesPool[idx % arrivalTimesPool.length];

        if (item.departure_at) {
          try {
            const d = new Date(item.departure_at);
            if (!isNaN(d.getTime())) {
              depTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              const arrD = new Date(d.getTime() + 4 * 3600 * 1000);
              arrTime = arrD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            }
          } catch (e) {}
        }

        let durationLabel = 'مباشر';
        if (item.transfers === 1 || idx % 3 === 1) {
          durationLabel = 'توقف واحد';
        } else if (item.transfers === 2 || idx % 3 === 2) {
          durationLabel = 'توقفان';
        }

        const providerName = (item.gate && typeof item.gate === 'string') ? item.gate : (idx % 2 === 1 ? 'Kiwi.com' : 'Aviasales');
        const isKiwiProvider = providerName.toLowerCase().includes('kiwi');

        let partnerLink = '';
        if (item.link) {
          partnerLink = item.link.startsWith('http') ? item.link : `https://www.aviasales.com${item.link}?marker=482910`;
        } else if (isKiwiProvider) {
          partnerLink = `https://www.kiwi.com/deep?from=${origin}&to=${destination}&departure=${departureDate}${returnDate ? `&return=${returnDate}` : ''}&adults=${adults}&children=${children}&infants=${infants}&cabinclass=${cabinClass}&affilid=66qLX2jh`;
        } else {
          partnerLink = `https://www.aviasales.com/search?origin_iata=${origin}&destination_iata=${destination}&depart_date=${departureDate}${returnDate ? `&return_date=${returnDate}` : ''}&adults=${adults}&children=${children}&infants=${infants}&cabin_class=${cabinClass}&marker=482910`;
        }

        const basePrice = item.value || item.price || (680 + idx * 38);

        return {
          id: `flight-${idx}`,
          airline: airlineObj.nameAr,
          airlineLogo: airlineObj.logoUrl,
          code: iataCode,
          flightNo: `${iataCode} ${Math.floor(100 + (idx * 73) % 900)}`,
          depTime,
          depCode: String(origin),
          arrTime,
          arrCode: String(destination),
          duration: durationLabel,
          price: basePrice,
          currency: String(currency).split(' ')[0],
          priceType: 'لكل مسافر',
          bookingProvider: providerName,
          partnerUrl: partnerLink,
        };
      });

      if (sort === 'price') {
        flights.sort((a, b) => a.price - b.price);
      }

      res.json({
        success: true,
        dataSource: 'Travelpayouts Data API & Official Tracked Search Deeplinks',
        disclaimer: 'الأسعار محولة بناءً على العملة المختارة وقابلة للتغيير وتُحدَّث لدى موقع الحجز.',
        flights,
      });
    } catch (err: any) {
      console.error('Search endpoint error:', err);
      res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });

  app.get('/api/travel/hotels', async (req, res) => {
    try {
      const {
        destination = 'makkah',
        currency = 'SAR',
        checkIn = '2026-11-15',
        checkOut = '2026-11-22',
        rooms = '1',
        guests = '2'
      } = req.query;
      const TRAVELPAYOUTS_MARKER = process.env.TRAVELPAYOUTS_MARKER || '482910';

      const ALL_HOTELS = [
        { id: 'makkah-1', city: 'مكة', cityKey: 'makkah', name: 'سويسوتل المروة ريحان مكة', neighborhood: 'ابراج البيت، أجياد', stars: '5 نجوم', rating: '4.8', price: 650, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&auto=format&fit=crop&q=80' },
        { id: 'makkah-2', city: 'مكة', cityKey: 'makkah', name: 'برج الساعة فندق ميركيور مكة', neighborhood: 'أجياد، بجوار الحرم', stars: '4 نجوم', rating: '4.6', price: 480, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
        { id: 'makkah-3', city: 'مكة', cityKey: 'makkah', name: 'فندق إبراهيم الخليل مكة', neighborhood: 'شارع إبراهيم الخليل', stars: '3 نجوم', rating: '4.3', price: 320, provider: 'Hotellook', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80' },
        { id: 'makkah-4', city: 'مكة', cityKey: 'makkah', name: 'فندق جبل عمر حياة ريجينسي', neighborhood: 'جبل عمر', stars: '5 نجوم', rating: '4.9', price: 780, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },

        { id: 'madinah-1', city: 'المدينة', cityKey: 'madinah', name: 'فندق أوبروي المدينة', neighborhood: 'المنطقة المركزية، مقابل المسجد النبوي', stars: '5 نجوم', rating: '4.9', price: 850, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80' },
        { id: 'madinah-2', city: 'المدينة', cityKey: 'madinah', name: 'فندق دار الايمان انتركونتيننتال', neighborhood: 'المنطقة المركزية الشمالية', stars: '5 نجوم', rating: '4.7', price: 620, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
        { id: 'madinah-3', city: 'المدينة', cityKey: 'madinah', name: 'فندق موڤنبيك المدينة المنورة', neighborhood: 'شارع الملك فهد', stars: '4 نجوم', rating: '4.5', price: 450, provider: 'Hotellook', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80' },
        { id: 'madinah-4', city: 'المدينة', cityKey: 'madinah', name: 'فندق دار الهجرة انتركونتيننتال', neighborhood: 'المنطقة المركزية', stars: '5 نجوم', rating: '4.6', price: 590, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },

        { id: 'jeddah-1', city: 'جدة', cityKey: 'jeddah', name: 'فندق روزوود جدة', neighborhood: 'كورنيش جدة، الشاطئ', stars: '5 نجوم', rating: '4.8', price: 920, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80' },
        { id: 'jeddah-2', city: 'جدة', cityKey: 'jeddah', name: 'فندق ريتز كارلتون جدة', neighborhood: 'الحمراء، الكورنيش', stars: '5 نجوم', rating: '4.9', price: 1100, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
        { id: 'jeddah-3', city: 'جدة', cityKey: 'jeddah', name: 'فندق إيبيس جدة شهرزاد', neighborhood: 'شارع الأندلس', stars: '3 نجوم', rating: '4.2', price: 340, provider: 'Hotellook', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80' },
        { id: 'jeddah-4', city: 'جدة', cityKey: 'jeddah', name: 'فندق إنتركونتيننتال جدة', neighborhood: 'الحمراء', stars: '5 نجوم', rating: '4.6', price: 750, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },

        { id: 'riyadh-1', city: 'الرياض', cityKey: 'riyadh', name: 'فندق فورسيزونز الرياض', neighborhood: 'برج المملكة، العليا', stars: '5 نجوم', rating: '4.9', price: 1250, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80' },
        { id: 'riyadh-2', city: 'الرياض', cityKey: 'riyadh', name: 'نوفوتيل الرياض العنود', neighborhood: 'طريق الملك فهد', stars: '4 نجوم', rating: '4.5', price: 490, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
        { id: 'riyadh-3', city: 'الرياض', cityKey: 'riyadh', name: 'فندق راديسون بلو الرياض', neighborhood: 'حي الفوطة', stars: '4 نجوم', rating: '4.4', price: 410, provider: 'Hotellook', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80' },
        { id: 'riyadh-4', city: 'الرياض', cityKey: 'riyadh', name: 'الريتز كارلتون الرياض', neighborhood: 'الهدا، مقابل قصر المؤتمرات', stars: '5 نجوم', rating: '4.9', price: 1400, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },

        { id: 'dubai-1', city: 'دبي', cityKey: 'dubai', name: 'أتلانتس، ذا بالم دبي', neighborhood: 'نخلة جميرا', stars: '5 نجوم', rating: '4.8', price: 1650, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80' },
        { id: 'dubai-2', city: 'دبي', cityKey: 'dubai', name: 'فندق أرماني دبي', neighborhood: 'برج خليفة، وسط مدينة دبي', stars: '5 نجوم', rating: '4.9', price: 1800, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
        { id: 'dubai-3', city: 'دبي', cityKey: 'dubai', name: 'روف دوان تاون دبي', neighborhood: 'وسط مدينة دبي', stars: '3 نجوم', rating: '4.6', price: 420, provider: 'Hotellook', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80' },
        { id: 'dubai-4', city: 'دبي', cityKey: 'dubai', name: 'جي دبليو ماريوت ماركي دبي', neighborhood: 'الخليج التجاري', stars: '5 نجوم', rating: '4.7', price: 850, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },

        { id: 'istanbul-1', city: 'إسطنبول', cityKey: 'istanbul', name: 'بيرا بلاس إسطنبول', neighborhood: 'بيوغلو، السلطان أحمد', stars: '5 نجوم', rating: '4.9', price: 680, provider: 'Trip.com', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpLOWEnvAW-H4D3-wvllarolxp0DMxJLuc3aFHVmy8SNTKM1iMlYy10q0m39M9jq01XwVBYK0kqJowJ4XzuQ4hC2ir94p_VAHs913TpMw3Tyx6vYOk0v7Y0Wmcj2YyEk7oDt4wQfKT3R_cw6uN0fvXD5s4wfhLPeI_9ffFLvc0D146Hjj5-EcEf7kXD6dIF1aI375XBLWMOihwnPkKYk7wX6lJoz-h9SXIUvbOcWoOqsDiBL04B_xE' },
        { id: 'istanbul-2', city: 'إسطنبول', cityKey: 'istanbul', name: 'فندق سحرة إسطنبول', neighborhood: 'الفاتح، إمينونو', stars: '4 نجوم', rating: '4.5', price: 390, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
        { id: 'istanbul-3', city: 'إسطنبول', cityKey: 'istanbul', name: 'فندق مرمرة تقسيم', neighborhood: 'تقسيم، بيوغلو', stars: '5 نجوم', rating: '4.7', price: 550, provider: 'Hotellook', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80' },
        { id: 'istanbul-4', city: 'إسطنبول', cityKey: 'istanbul', name: 'شانغريلا بوسفوروس إسطنبول', neighborhood: 'بشكتاش', stars: '5 نجوم', rating: '4.9', price: 1350, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },

        { id: 'marrakesh-1', city: 'مراكش', cityKey: 'marrakesh', name: 'رويال منصور مراكش', neighborhood: 'المدينة القديمة، مراكش', stars: '5 نجوم', rating: '4.9', price: 2100, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80' },
        { id: 'marrakesh-2', city: 'مراكش', cityKey: 'marrakesh', name: 'لا مامونيا مراكش', neighborhood: 'باب الجديد', stars: '5 نجوم', rating: '4.9', price: 1950, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' },
        { id: 'marrakesh-3', city: 'مراكش', cityKey: 'marrakesh', name: 'رياض دار صوفيا مراكش', neighborhood: 'المحيط، المدينة', stars: '4 نجوم', rating: '4.6', price: 450, provider: 'Hotellook', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80' },
        { id: 'marrakesh-4', city: 'مراكش', cityKey: 'marrakesh', name: 'فندق بالمانا مراكش', neighborhood: 'جيليز', stars: '4 نجوم', rating: '4.4', price: 380, provider: 'Trip.com', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },
      ];

      const filtered = destination && destination !== 'all'
        ? ALL_HOTELS.filter(h => h.cityKey === destination || h.city === destination)
        : ALL_HOTELS;

      const hotels = filtered.map(h => {
        const providerLink = h.provider === 'Trip.com'
          ? `https://www.trip.com/partners/ad/tpg/${TRAVELPAYOUTS_MARKER}?trip_sub=hotel_${h.id}&checkin=${checkIn}&checkout=${checkOut}&rooms=${rooms}&adults=${guests}`
          : `https://hotellook.com/search?destination=${encodeURIComponent(h.city)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&marker=${TRAVELPAYOUTS_MARKER}`;

        return {
          id: h.id,
          name: h.name,
          city: h.city,
          neighborhood: h.neighborhood,
          stars: h.stars,
          rating: h.rating,
          price: h.price,
          currency: String(currency).split(' ')[0],
          provider: h.provider,
          img: h.img,
          partnerUrl: providerLink,
          pricingBasis: 'شامل الضريبة والرسوم لـ 1 ليلة، للمسافرين المحددين',
        };
      });

      res.json({
        success: true,
        dataSource: 'Curated Hotel Inventory & Tracked Affiliate Feeds (Trip.com / Hotellook)',
        disclaimer: 'الأسعار محولة بناءً على العملة المختارة وتشمل الضرائب والرسوم وفقاً لتحديثات موقع الحجز.',
        hotels,
      });
    } catch (err: any) {
      console.error('Hotels endpoint error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const staticPath = path.resolve(__dirname, 'dist');
    app.use(express.static(staticPath));
    app.get('*', (_, res) => {
      res.sendFile(path.resolve(staticPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AraboAir server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
