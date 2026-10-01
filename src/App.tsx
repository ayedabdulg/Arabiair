/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface BookedTrip {
  id: string;
  airline: string;
  flightNo: string;
  origin: string;
  destination: string;
  date: string;
  price: number;
  passengerName: string;
  seat: string;
  status: string;
}

interface PriceAlert {
  id: string;
  type: 'flight' | 'hotel';
  title: string;
  targetQuery: string;
  currentPrice: number;
  trackedPrice: number;
  priceDropPercentage?: number;
  currency: string;
  createdAt: string;
  statusText: string;
}

interface MultiCitySegment {
  id: string;
  origin: Airport;
  destination: Airport;
  date: Date | null;
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  tips?: string[];
  timestamp: string;
}

interface Airport {
  code: string;
  cityAr: string;
  nameAr: string;
  countryAr: string;
  cityEn: string;
  countryEn: string;
  nameEn?: string;
}

interface CurrencyOption {
  code: string;
  nameAr: string;
  symbol: string;
  rateToSar: number;
}

const CURRENCIES_DATA: CurrencyOption[] = [
  { code: 'SAR', nameAr: 'ريال سعودي', symbol: 'ر.س', rateToSar: 1.0 },
  { code: 'AED', nameAr: 'درهم إماراتي', symbol: 'د.إ', rateToSar: 0.98 },
  { code: 'KWD', nameAr: 'دينار كويتي', symbol: 'د.ك', rateToSar: 0.082 },
  { code: 'OMR', nameAr: 'ريال عماني', symbol: 'ر.ع', rateToSar: 0.102 },
  { code: 'BHD', nameAr: 'دينار بحريني', symbol: 'د.ب', rateToSar: 0.10 },
  { code: 'QAR', nameAr: 'ريال قطري', symbol: 'ر.ق', rateToSar: 0.97 },
  { code: 'USD', nameAr: 'دولار أمريكي', symbol: '$', rateToSar: 0.27 },
  { code: 'EUR', nameAr: 'يورو', symbol: '€', rateToSar: 0.25 },
];

const AIRPORTS_DATA: Airport[] = [
  // Saudi Arabia
  { code: 'JED', cityAr: 'جدة', nameAr: 'مطار الملك عبد العزيز الدولي', countryAr: 'المملكة العربية السعودية', cityEn: 'Jeddah', countryEn: 'Saudi Arabia' },
  { code: 'RUH', cityAr: 'الرياض', nameAr: 'مطار الملك خالد الدولي', countryAr: 'المملكة العربية السعودية', cityEn: 'Riyadh', countryEn: 'Saudi Arabia' },
  { code: 'DMM', cityAr: 'الدمام', nameAr: 'مطار الملك فهد الدولي', countryAr: 'المملكة العربية السعودية', cityEn: 'Dammam', countryEn: 'Saudi Arabia' },
  { code: 'MED', cityAr: 'المدينة المنورة', nameAr: 'مطار الأمير محمد بن عبد العزيز الدولي', countryAr: 'المملكة العربية السعودية', cityEn: 'Medina', countryEn: 'Saudi Arabia' },
  { code: 'TIF', cityAr: 'الطائف', nameAr: 'مطار الطائف الدولي', countryAr: 'المملكة العربية السعودية', cityEn: 'Taif', countryEn: 'Saudi Arabia' },
  { code: 'AHB', cityAr: 'أبها', nameAr: 'مطار أبها الدولي', countryAr: 'المملكة العربية السعودية', cityEn: 'Abha', countryEn: 'Saudi Arabia' },
  { code: 'ELQ', cityAr: 'القصيم', nameAr: 'مطار الأمير نايف بن عبد العزيز الدولي', countryAr: 'المملكة العربية السعودية', cityEn: 'Qassim', countryEn: 'Saudi Arabia' },

  // UAE & GCC
  { code: 'DXB', cityAr: 'دبي', nameAr: 'مطار دبي الدولي', countryAr: 'الإمارات العربية المتحدة', cityEn: 'Dubai', countryEn: 'UAE' },
  { code: 'AUH', cityAr: 'أبوظبي', nameAr: 'مطار زايد الدولي', countryAr: 'الإمارات العربية المتحدة', cityEn: 'Abu Dhabi', countryEn: 'UAE' },
  { code: 'SHJ', cityAr: 'الشارقة', nameAr: 'مطار الشارقة الدولي', countryAr: 'الإمارات العربية المتحدة', cityEn: 'Sharjah', countryEn: 'UAE' },
  { code: 'DOH', cityAr: 'الدوحة', nameAr: 'مطار حمد الدولي', countryAr: 'قطر', cityEn: 'Doha', countryEn: 'Qatar' },
  { code: 'KWI', cityAr: 'الكويت', nameAr: 'مطار الكويت الدولي', countryAr: 'الكويت', cityEn: 'Kuwait City', countryEn: 'Kuwait' },
  { code: 'BAH', cityAr: 'المنامة', nameAr: 'مطار البحرين الدولي', countryAr: 'البحرين', cityEn: 'Bahrain', countryEn: 'Bahrain' },
  { code: 'MCT', cityAr: 'مسقط', nameAr: 'مطار مسقط الدولي', countryAr: 'عمان', cityEn: 'Muscat', countryEn: 'Oman' },
  { code: 'AMM', cityAr: 'عمان', nameAr: 'مطار الملكة علياء الدولي', countryAr: 'الأردن', cityEn: 'Amman', countryEn: 'Jordan' },
  { code: 'BEY', cityAr: 'بيروت', nameAr: 'مطار بيروت رفيق الحريري الدولي', countryAr: 'لبنان', cityEn: 'Beirut', countryEn: 'Lebanon' },

  // USA (All major states & hubs)
  { code: 'JFK', cityAr: 'نيويورك', nameAr: 'مطار جون إف كينيدي الدولي', countryAr: 'الولايات المتحدة', cityEn: 'New York', countryEn: 'USA' },
  { code: 'LGA', cityAr: 'نيويورك', nameAr: 'مطار لاغوارديا', countryAr: 'الولايات المتحدة', cityEn: 'New York', countryEn: 'USA' },
  { code: 'EWR', cityAr: 'نيويورك / نيوارك', nameAr: 'مطار نيوارك ليبرتي الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Newark', countryEn: 'USA' },
  { code: 'LAX', cityAr: 'لوس أنجلوس', nameAr: 'مطار لوس أنجلوس الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Los Angeles', countryEn: 'USA' },
  { code: 'ORD', cityAr: 'شيكاغو', nameAr: 'مطار أوهير الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Chicago', countryEn: 'USA' },
  { code: 'MDW', cityAr: 'شيكاغو', nameAr: 'مطار ميدواي الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Chicago', countryEn: 'USA' },
  { code: 'IAD', cityAr: 'واشنطن العاصمة', nameAr: 'مطار دالاس الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Washington DC', countryEn: 'USA' },
  { code: 'DCA', cityAr: 'واشنطن العاصمة', nameAr: 'مطار رونالد ريغان الوطني', countryAr: 'الولايات المتحدة', cityEn: 'Washington DC', countryEn: 'USA' },
  { code: 'MIA', cityAr: 'ميامي', nameAr: 'مطار ميامي الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Miami', countryEn: 'USA' },
  { code: 'FLL', cityAr: 'فورت لودرديل', nameAr: 'مطار فورت لودرديل هوليوود الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Fort Lauderdale', countryEn: 'USA' },
  { code: 'SFO', cityAr: 'سان فرانسيسكو', nameAr: 'مطار سان فرانسيسكو الدولي', countryAr: 'الولايات المتحدة', cityEn: 'San Francisco', countryEn: 'USA' },
  { code: 'BOS', cityAr: 'بوسطن', nameAr: 'مطار لوجان الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Boston', countryEn: 'USA' },
  { code: 'ATL', cityAr: 'أتلانتا', nameAr: 'مطار هارتسفيلد جاكسون أتلانتا الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Atlanta', countryEn: 'USA' },
  { code: 'DFW', cityAr: 'دالاس / فورت وورث', nameAr: 'مطار دالاس فورت وورث الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Dallas', countryEn: 'USA' },
  { code: 'IAH', cityAr: 'هيوستن', nameAr: 'مطار جورج بوش الإنتريكونتيننتال', countryAr: 'الولايات المتحدة', cityEn: 'Houston', countryEn: 'USA' },
  { code: 'SEA', cityAr: 'سياتل', nameAr: 'مطار سياتل تاكوما الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Seattle', countryEn: 'USA' },
  { code: 'LAS', cityAr: 'لاس فيغاس', nameAr: 'مطار هاري ريد الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Las Vegas', countryEn: 'USA' },
  { code: 'MCO', cityAr: 'أورلاندو', nameAr: 'مطار أورلاندو الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Orlando', countryEn: 'USA' },
  { code: 'DEN', cityAr: 'دنفر', nameAr: 'مطار دنفر الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Denver', countryEn: 'USA' },
  { code: 'PHX', cityAr: 'فينيكس', nameAr: 'مطار فينيكس سكاي هاربر الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Phoenix', countryEn: 'USA' },
  { code: 'SAN', cityAr: 'سان دييغو', nameAr: 'مطار سان دييغو الدولي', countryAr: 'الولايات المتحدة', cityEn: 'San Diego', countryEn: 'USA' },
  { code: 'TPA', cityAr: 'تامبا', nameAr: 'مطار تامبا الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Tampa', countryEn: 'USA' },
  { code: 'PDX', cityAr: 'بورتلاند', nameAr: 'مطار بورتلاند الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Portland', countryEn: 'USA' },
  { code: 'HNL', cityAr: 'هونولولو', nameAr: 'مطار دانيل ك. إينوي الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Honolulu', countryEn: 'USA' },
  { code: 'SLC', cityAr: 'سولت ليك سيتي', nameAr: 'مطار سولت ليك سيتي الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Salt Lake City', countryEn: 'USA' },
  { code: 'DTW', cityAr: 'ديترويت', nameAr: 'مطار ديترويت متروبوليتان', countryAr: 'الولايات المتحدة', cityEn: 'Detroit', countryEn: 'USA' },
  { code: 'MSP', cityAr: 'مينابوليس', nameAr: 'مطار منيابولس سانت بول الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Minneapolis', countryEn: 'USA' },
  { code: 'PHL', cityAr: 'فيلادلفيا', nameAr: 'مطار فيلادلفيا الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Philadelphia', countryEn: 'USA' },
  { code: 'CLT', cityAr: 'شارلوت', nameAr: 'مطار شارلوت دوغلاس الدولي', countryAr: 'الولايات المتحدة', cityEn: 'Charlotte', countryEn: 'USA' },

  // Europe (UK, France, Germany, Spain, Italy, etc.)
  { code: 'LHR', cityAr: 'لندن', nameAr: 'مطار هيترو لندن', countryAr: 'المملكة المتحدة', cityEn: 'London', countryEn: 'UK' },
  { code: 'LGW', cityAr: 'لندن', nameAr: 'مطار جاتويك لندن', countryAr: 'المملكة المتحدة', cityEn: 'London', countryEn: 'UK' },
  { code: 'STN', cityAr: 'لندن', nameAr: 'مطار ستانستد لندن', countryAr: 'المملكة المتحدة', cityEn: 'London', countryEn: 'UK' },
  { code: 'LCY', cityAr: 'لندن', nameAr: 'مطار لندن سيتي', countryAr: 'المملكة المتحدة', cityEn: 'London', countryEn: 'UK' },
  { code: 'CDG', cityAr: 'باريس', nameAr: 'مطار شارل ديغول الدولي', countryAr: 'فرنسا', cityEn: 'Paris', countryEn: 'France' },
  { code: 'ORY', cityAr: 'باريس', nameAr: 'مطار أورلي', countryAr: 'فرنسا', cityEn: 'Paris', countryEn: 'France' },
  { code: 'FCO', cityAr: 'روما', nameAr: 'مطار ليوناردو دا فينشي فيوميچينو', countryAr: 'إيطاليا', cityEn: 'Rome', countryEn: 'Italy' },
  { code: 'CIA', cityAr: 'روما', nameAr: 'مطار روما شيامبينو', countryAr: 'إيطاليا', cityEn: 'Rome', countryEn: 'Italy' },
  { code: 'MAD', cityAr: 'مدريد', nameAr: 'مطار أدولفو سواريز مدريد باراخاس', countryAr: 'إسبانيا', cityEn: 'Madrid', countryEn: 'Spain' },
  { code: 'BCN', cityAr: 'بارسلونا', nameAr: 'مطار بارسلونا إل برات', countryAr: 'إسبانيا', cityEn: 'Barcelona', countryEn: 'Spain' },
  { code: 'FRA', cityAr: 'فرانكفورت', nameAr: 'مطار فرانكفورت الدولي', countryAr: 'ألمانيا', cityEn: 'Frankfurt', countryEn: 'Germany' },
  { code: 'MUC', cityAr: 'ميونخ', nameAr: 'مطار ميونخ الدولي', countryAr: 'ألمانيا', cityEn: 'Munich', countryEn: 'Germany' },
  { code: 'AMS', cityAr: 'أمستردام', nameAr: 'مطار سخيبول أمستردام', countryAr: 'هولندا', cityEn: 'Amsterdam', countryEn: 'Netherlands' },
  { code: 'ZRH', cityAr: 'زيورخ', nameAr: 'مطار زيورخ الدولي', countryAr: 'سويسرا', cityEn: 'Zurich', countryEn: 'Switzerland' },
  { code: 'VIE', cityAr: 'فيينا', nameAr: 'مطار فيينا الدولي', countryAr: 'النمسا', cityEn: 'Vienna', countryEn: 'Austria' },
  { code: 'BRU', cityAr: 'بروكسل', nameAr: 'مطار بروكسل الدولي', countryAr: 'بلجيكا', cityEn: 'Brussels', countryEn: 'Belgium' },
  { code: 'ATH', cityAr: 'أثينا', nameAr: 'مطار أثينا الدولي', countryAr: 'اليونان', cityEn: 'Athens', countryEn: 'Greece' },
  { code: 'LIS', cityAr: 'لشبونة', nameAr: 'مطار لشبونة هومبرتو دلجادو', countryAr: 'البرتغال', cityEn: 'Lisbon', countryEn: 'Portugal' },
  { code: 'DUB', cityAr: 'دوبلن', nameAr: 'مطار دوبلن الدولي', countryAr: 'أيرلندا', cityEn: 'Dublin', countryEn: 'Ireland' },
  { code: 'WAW', cityAr: 'وارسو', nameAr: 'مطار شوپن وارسو', countryAr: 'بولندا', cityEn: 'Warsaw', countryEn: 'Poland' },
  { code: 'ARN', cityAr: 'ستوكهولم', nameAr: 'مطار ستوكهولم أرلاندا', countryAr: 'السويد', cityEn: 'Stockholm', countryEn: 'Sweden' },
  { code: 'CPH', cityAr: 'كوبنهاغن', nameAr: 'مطار كوبنهاغن', countryAr: 'الدنمارك', cityEn: 'Copenhagen', countryEn: 'Denmark' },

  // Morocco (All major passenger airports requested)
  { code: 'CMN', cityAr: 'الدار البيضاء', nameAr: 'مطار محمد الخامس الدولي', countryAr: 'المغرب', cityEn: 'Casablanca', countryEn: 'Morocco' },
  { code: 'RAK', cityAr: 'مراكش', nameAr: 'مطار مراكش المنارة الدولي', countryAr: 'المغرب', cityEn: 'Marrakech', countryEn: 'Morocco' },
  { code: 'RBA', cityAr: 'الرباط', nameAr: 'مطار الرباط سلا', countryAr: 'المغرب', cityEn: 'Rabat', countryEn: 'Morocco' },
  { code: 'AGA', cityAr: 'أغادير', nameAr: 'مطار أغادير المسيرة', countryAr: 'المغرب', cityEn: 'Agadir', countryEn: 'Morocco' },
  { code: 'TNG', cityAr: 'طنجة', nameAr: 'مطار طنجة ابن بطوطة الدولي', countryAr: 'المغرب', cityEn: 'Tangier', countryEn: 'Morocco' },
  { code: 'FEZ', cityAr: 'فاس', nameAr: 'مطار فاس سايس الدولي', countryAr: 'المغرب', cityEn: 'Fez', countryEn: 'Morocco' },
  { code: 'OUD', cityAr: 'وجدة', nameAr: 'مطار وجدة أنجاد الدولي', countryAr: 'المغرب', cityEn: 'Oujda', countryEn: 'Morocco' },
  { code: 'NDR', cityAr: 'الناظور', nameAr: 'مطار الناظور العروي', countryAr: 'المغرب', cityEn: 'Nador', countryEn: 'Morocco' },

  // Africa (Cairo, Johannesburg, Nairobi, Lagos, Dakar, Addis Ababa, etc.)
  { code: 'CAI', cityAr: 'القاهرة', nameAr: 'مطار القاهرة الدولي', countryAr: 'مصر', cityEn: 'Cairo', countryEn: 'Egypt' },
  { code: 'SSH', cityAr: 'شرم الشيخ', nameAr: 'مطار شرم الشيخ الدولي', countryAr: 'مصر', cityEn: 'Sharm El Sheikh', countryEn: 'Egypt' },
  { code: 'HRG', cityAr: 'الغردقة', nameAr: 'مطار الغردقة الدولي', countryAr: 'مصر', cityEn: 'Hurghada', countryEn: 'Egypt' },
  { code: 'LXR', cityAr: 'الأقصر', nameAr: 'مطار الأقصر الدولي', countryAr: 'مصر', cityEn: 'Luxor', countryEn: 'Egypt' },
  { code: 'JNB', cityAr: 'جوهانسبرغ', nameAr: 'مطار أور تامبو الدولي', countryAr: 'جنوب أفريقيا', cityEn: 'Johannesburg', countryEn: 'South Africa' },
  { code: 'CPT', cityAr: 'كيب تاون', nameAr: 'مطار كيب تاون الدولي', countryAr: 'جنوب أفريقيا', cityEn: 'Cape Town', countryEn: 'South Africa' },
  { code: 'NBO', cityAr: 'نيروبي', nameAr: 'مطار جومو كينياتا الدولي', countryAr: 'كينيا', cityEn: 'Nairobi', countryEn: 'Kenya' },
  { code: 'LOS', cityAr: 'لاغوس', nameAr: 'مطار مورتالا محمد الدولي', countryAr: 'نيجيريا', cityEn: 'Lagos', countryEn: 'Nigeria' },
  { code: 'DSS', cityAr: 'داكار', nameAr: 'مطار بليز دياني الدولي', countryAr: 'السنغال', cityEn: 'Dakar', countryEn: 'Senegal' },
  { code: 'ADD', cityAr: 'أديس أبابا', nameAr: 'مطار أديس أبابا بول الدولي', countryAr: 'إثيوبيا', cityEn: 'Addis Ababa', countryEn: 'Ethiopia' },
  { code: 'TUN', cityAr: 'تونس', nameAr: 'مطار تونس قرطاج الدولي', countryAr: 'تونس', cityEn: 'Tunis', countryEn: 'Tunisia' },
  { code: 'ALG', cityAr: 'الجزائر', nameAr: 'مطار هواري بومدين الدولي', countryAr: 'الجزائر', cityEn: 'Algiers', countryEn: 'Algeria' },
  { code: 'DAR', cityAr: 'دار السلام', nameAr: 'مطار جوليوس نيريري الدولي', countryAr: 'تنزانيا', cityEn: 'Dar es Salaam', countryEn: 'Tanzania' },
  { code: 'ACC', cityAr: 'أكرا', nameAr: 'مطار كوتوكا الدولي', countryAr: 'غانا', cityEn: 'Accra', countryEn: 'Ghana' },
  { code: 'EBB', cityAr: 'عنتيبي', nameAr: 'مطار عنتيبي الدولي', countryAr: 'أوغندا', cityEn: 'Entebbe', countryEn: 'Uganda' },

  // Turkey, Asia, and Pacific
  { code: 'IST', cityAr: 'إسطنبول', nameAr: 'مطار إسطنبول الدولي', countryAr: 'تركيا', cityEn: 'Istanbul', countryEn: 'Turkey' },
  { code: 'SAW', cityAr: 'إسطنبول', nameAr: 'مطار صبيحة كوكجن الدولي', countryAr: 'تركيا', cityEn: 'Istanbul', countryEn: 'Turkey' },
  { code: 'AYT', cityAr: 'أنطاليا', nameAr: 'مطار أنطاليا الدولي', countryAr: 'تركيا', cityEn: 'Antalya', countryEn: 'Turkey' },
  { code: 'BKK', cityAr: 'بانكوك', nameAr: 'مطار سوفارنابومي الدولي', countryAr: 'تايلاند', cityEn: 'Bangkok', countryEn: 'Thailand' },
  { code: 'SIN', cityAr: 'سنغافورة', nameAr: 'مطار شانغي سنغافورة', countryAr: 'سنغافورة', cityEn: 'Singapore', countryEn: 'Singapore' },
  { code: 'KUL', cityAr: 'كوالالمبور', nameAr: 'مطار كوالالمبور الدولي', countryAr: 'ماليزيا', cityEn: 'Kuala Lumpur', countryEn: 'Malaysia' },
  { code: 'HND', cityAr: 'طوكيو', nameAr: 'مطار هانيدا الدولي', countryAr: 'اليابان', cityEn: 'Tokyo', countryEn: 'Japan' },
  { code: 'NRT', cityAr: 'طوكيو', nameAr: 'مطار ناريتا الدولي', countryAr: 'اليابان', cityEn: 'Tokyo', countryEn: 'Japan' },
  { code: 'ICN', cityAr: 'سيول', nameAr: 'مطار إنتشون الدولي', countryAr: 'كوريا الجنوبية', cityEn: 'Seoul', countryEn: 'South Korea' },
  { code: 'PEK', cityAr: 'بكين', nameAr: 'مطار بكين العاصمة الدولي', countryAr: 'الصين', cityEn: 'Beijing', countryEn: 'China' },
  { code: 'PVG', cityAr: 'شانغهاي', nameAr: 'مطار شانغهاي بودنغ الدولي', countryAr: 'الصين', cityEn: 'Shanghai', countryEn: 'China' },
  { code: 'HKG', cityAr: 'هونغ كونغ', nameAr: 'مطار هونغ كونغ الدولي', countryAr: 'هونغ كونغ', cityEn: 'Hong Kong', countryEn: 'Hong Kong' },
  { code: 'DEL', cityAr: 'نيودلهي', nameAr: 'مطار أنديرا غاندي الدولي', countryAr: 'الهند', cityEn: 'New Delhi', countryEn: 'India' },
  { code: 'BOM', cityAr: 'مومباي', nameAr: 'مطار تشاتراباتي شيفاجي الدولي', countryAr: 'الهند', cityEn: 'Mumbai', countryEn: 'India' },
  { code: 'SYD', cityAr: 'سيدني', nameAr: 'مطار سيدني كينغسفورد سميث', countryAr: 'أستراليا', cityEn: 'Sydney', countryEn: 'Australia' },
  { code: 'MEL', cityAr: 'ملبورن', nameAr: 'مطار ملبورن الدولي', countryAr: 'أستراليا', cityEn: 'Melbourne', countryEn: 'Australia' },
  { code: 'AKL', cityAr: 'أوكلاند', nameAr: 'مطار أوكلاند الدولي', countryAr: 'نيوزيلندا', cityEn: 'Auckland', countryEn: 'New Zealand' },
];

export default function App() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<'home' | 'flights' | 'hotels' | 'ai-assistant' | 'price-alerts' | 'my-trips'>('home');
  const [searchModeTab, setSearchModeTab] = useState<'normal' | 'ai'>('normal');
  const [searchServiceTab, setSearchServiceTab] = useState<'flight' | 'hotel' | 'ai'>('flight');
  const [tripType, setTripType] = useState<'round' | 'one-way' | 'multi-city'>('round');

  // Multi-city Segments State
  const [multiCitySegments, setMultiCitySegments] = useState<MultiCitySegment[]>([
    { id: 'seg-1', origin: AIRPORTS_DATA[0], destination: AIRPORTS_DATA[11], date: new Date(2026, 9, 12) }, // JED -> IST
    { id: 'seg-2', origin: AIRPORTS_DATA[11], destination: AIRPORTS_DATA[4], date: new Date(2026, 9, 18) }, // IST -> DXB
  ]);

  // Currency State
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyOption>(CURRENCIES_DATA[0]); // SAR
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);

  // Airport Selection State
  const [originAirport, setOriginAirport] = useState<Airport>(AIRPORTS_DATA[0]); // JED
  const [destinationAirport, setDestinationAirport] = useState<Airport>(AIRPORTS_DATA[11]); // IST

  // Airport Picker Modal state
  const [airportPickerOpen, setAirportPickerOpen] = useState(false);
  const [airportPickerType, setAirportPickerType] = useState<'origin' | 'destination' | null>(null);
  const [activeMultiCityIndex, setActiveMultiCityIndex] = useState<{ index: number; field: 'origin' | 'destination' } | null>(null);
  const [airportSearchQuery, setAirportSearchQuery] = useState('');
  const [airportLoading, setAirportLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calendar Date Range State
  const [departureDate, setDepartureDate] = useState<Date | null>(new Date(2026, 9, 12));
  const [returnDate, setReturnDate] = useState<Date | null>(new Date(2026, 9, 19));

  // Calendar Modal state
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [tempDeparture, setTempDeparture] = useState<Date | null>(null);
  const [tempReturn, setTempReturn] = useState<Date | null>(null);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(9);

  // Travelers & Cabin State
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<'economy' | 'premium_economy' | 'business' | 'first'>('economy');

  const [travelersModalOpen, setTravelersModalOpen] = useState(false);
  const [tempAdults, setTempAdults] = useState(1);
  const [tempChildren, setTempChildren] = useState(0);
  const [tempInfants, setTempInfants] = useState(0);
  const [tempCabinClass, setTempCabinClass] = useState<'economy' | 'premium_economy' | 'business' | 'first'>('economy');

  const openTravelersModal = () => {
    setTempAdults(adults);
    setTempChildren(childrenCount);
    setTempInfants(infants);
    setTempCabinClass(cabinClass);
    setTravelersModalOpen(true);
  };

  const getCabinLabel = (c: string) => {
    if (language === 'en') {
      switch(c) {
        case 'premium_economy': return 'Premium Economy';
        case 'business': return 'Business Class';
        case 'first': return 'First Class';
        default: return 'Economy';
      }
    }
    switch(c) {
      case 'premium_economy': return 'اقتصادية مميزة';
      case 'business': return 'رجال الأعمال';
      case 'first': return 'الدرجة الأولى';
      default: return 'اقتصادية';
    }
  };

  const travelersDisplayString = (() => {
    const total = adults + childrenCount + infants;
    if (language === 'en') {
      if (total === 1 && adults === 1) {
        return `1 Traveler · ${getCabinLabel(cabinClass)}`;
      }
      const parts = [];
      if (adults > 0) parts.push(`${adults} ${adults === 1 ? 'Adult' : 'Adults'}`);
      if (childrenCount > 0) parts.push(`${childrenCount} ${childrenCount === 1 ? 'Child' : 'Children'}`);
      if (infants > 0) parts.push(`${infants} ${infants === 1 ? 'Infant' : 'Infants'}`);
      return `${parts.join(', ')} · ${getCabinLabel(cabinClass)}`;
    }
    if (total === 1 && adults === 1) {
      return `مسافر واحد · ${getCabinLabel(cabinClass)}`;
    }
    const parts = [];
    if (adults > 0) parts.push(`${adults} ${adults === 1 ? 'بالغ' : 'بالغين'}`);
    if (childrenCount > 0) parts.push(`${childrenCount} ${childrenCount === 1 ? 'طفل' : 'أطفال'}`);
    if (infants > 0) parts.push(`${infants} ${infants === 1 ? 'رضيع' : 'رضع'}`);
    return `${parts.join('، ')} · ${getCabinLabel(cabinClass)}`;
  })();

  // AI Flight Search Tab State
  const [aiSearchPrompt, setAiSearchPrompt] = useState('أريد رحلة من جدة إلى إسطنبول من 15 إلى 22 نوفمبر 2026، لمسافرين، بأقل سعر ومع توقفين كحد أقصى.');
  const [aiSelectedChips, setAiSelectedChips] = useState<string[]>(['مباشر', 'ذهاب وعودة', 'الأرخص']);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiSummaryModal, setAiSummaryModal] = useState<{
    summaryText: string;
    originCode: string;
    destinationCode: string;
    departureDate: string;
    returnDate: string;
    maxStops: number;
    sortPreference: string;
    clarificationNeeded: string | null;
  } | null>(null);

  // Homepage Expanded Hotels Section State
  const [homepageHotelDest, setHomepageHotelDest] = useState('makkah');
  const [homepageHotelsLimit, setHomepageHotelsLimit] = useState(12);
  const [homepageHotelsList, setHomepageHotelsList] = useState<any[]>([]);
  const [homepageHotelsLoading, setHomepageHotelsLoading] = useState(false);
  const [homepageHotelsError, setHomepageHotelsError] = useState<string | null>(null);

  const hotelDestinationTabs = [
    { key: 'makkah', label: 'مكة' },
    { key: 'madinah', label: 'المدينة' },
    { key: 'jeddah', label: 'جدة' },
    { key: 'riyadh', label: 'الرياض' },
    { key: 'dubai', label: 'دبي' },
    { key: 'istanbul', label: 'إسطنبول' },
    { key: 'marrakesh', label: 'مراكش' },
  ];

  useEffect(() => {
    fetchHomepageHotels(homepageHotelDest);
  }, [homepageHotelDest, currentCurrency]);

  const fetchHomepageHotels = async (dest: string) => {
    setHomepageHotelsLoading(true);
    setHomepageHotelsError(null);
    try {
      const res = await fetch(`/api/travel/hotels?destination=${dest}&currency=${currentCurrency.code}`);
      const data = await res.json();
      if (data.success) {
        setHomepageHotelsList(data.hotels || []);
      } else {
        setHomepageHotelsError('تعذر جلب الفنادق.');
      }
    } catch (e) {
      setHomepageHotelsError('حدث خطأ في الاتصال بخدمة الفنادق.');
    } finally {
      setHomepageHotelsLoading(false);
    }
  };

  const getHotelDestDisplay = (key: string, defaultName: string) => {
    if (language === 'en') {
      switch (key) {
        case 'makkah': return 'Makkah';
        case 'madinah': return 'Madinah';
        case 'jeddah': return 'Jeddah';
        case 'riyadh': return 'Riyadh';
        case 'dubai': return 'Dubai';
        case 'istanbul': return 'Istanbul';
        case 'marrakesh': return 'Marrakesh';
        default: return 'Makkah';
      }
    }
    return defaultName;
  };

  // Dedicated Hotel Search Tab States
  const [hotelTabDest, setHotelTabDest] = useState('مكة المكرمة');
  const [hotelTabDestKey, setHotelTabDestKey] = useState('makkah');
  const [hotelTabCheckIn, setHotelTabCheckIn] = useState<Date>(new Date(Date.now() + 7 * 86400000));
  const [hotelTabCheckOut, setHotelTabCheckOut] = useState<Date>(new Date(Date.now() + 14 * 86400000));
  const [hotelTabRooms, setHotelTabRooms] = useState(1);
  const [hotelTabAdults, setHotelTabAdults] = useState(2);
  const [hotelTabChildren, setHotelTabChildren] = useState(0);

  const [hotelTabResults, setHotelTabResults] = useState<any[]>([]);
  const [hotelTabSearching, setHotelTabSearching] = useState(false);
  const [hotelTabSearched, setHotelTabSearched] = useState(false);
  const [hotelTabError, setHotelTabError] = useState<string | null>(null);

  const [hotelDestPickerOpen, setHotelDestPickerOpen] = useState(false);
  const [hotelGuestsModalOpen, setHotelGuestsModalOpen] = useState(false);

  const handlePerformHotelSearch = async () => {
    setHotelTabSearching(true);
    setHotelTabError(null);
    setHotelTabSearched(true);
    try {
      const checkInStr = formatDateToYYYYMMDD(hotelTabCheckIn);
      const checkOutStr = formatDateToYYYYMMDD(hotelTabCheckOut);
      const res = await fetch(`/api/travel/hotels?destination=${hotelTabDestKey}&currency=${currentCurrency.code}&checkIn=${checkInStr}&checkOut=${checkOutStr}&rooms=${hotelTabRooms}&guests=${hotelTabAdults + hotelTabChildren}`);
      const data = await res.json();
      if (data.success) {
        setHotelTabResults(data.hotels || []);
      } else {
        setHotelTabError('تعذر جلب نتائج الفنادق.');
        setHotelTabResults([]);
      }
    } catch (err) {
      setHotelTabError('حدث خطأ في الاتصال بخدمة الفنادق.');
      setHotelTabResults([]);
    } finally {
      setHotelTabSearching(false);
    }
  };

  // Search Results State
  const [flightsList, setFlightsList] = useState<any[]>([]);
  const [hotelsList, setHotelsList] = useState<any[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [hotelError, setHotelError] = useState<string | null>(null);
  const [searchingFlights, setSearchingFlights] = useState(false);
  const [flightSearchPerformed, setFlightSearchPerformed] = useState(false);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [configErrorDetails, setConfigErrorDetails] = useState<any | null>(null);
  const [dataSourceNotice, setDataSourceNotice] = useState<string>('');
  const [searchSeq, setSearchSeq] = useState(0);

  // Price Alerts & In-App Notifications State (Stored in localStorage)
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);

  // AI Assistant state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'أهلاً بك! أنا مساعد AraboAir الذكي. يمكنك متابعة تنبيهات الأسعار الفورية والإشعارات الداخلية من جرس الإشعارات العلوي.',
      tips: ['تنبيهات الأسعار', 'حساب المستخدم', 'رحلات متعددة الوجهات'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // My Trips saved in localStorage
  const [myTrips, setMyTrips] = useState<BookedTrip[]>([]);

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const arabicWeekdays = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

  useEffect(() => {
    const savedTrips = localStorage.getItem('araboair_trips');
    if (savedTrips) {
      try {
        setMyTrips(JSON.parse(savedTrips));
      } catch (e) {
        console.error(e);
      }
    }

    const savedAlerts = localStorage.getItem('araboair_price_alerts');
    if (savedAlerts) {
      try {
        setPriceAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default sample alert for demonstration
      const initialAlerts: PriceAlert[] = [
        {
          id: 'alert-demo-1',
          type: 'flight',
          title: 'رحلة من جدة إلى إسطنبول',
          targetQuery: 'JED-IST',
          currentPrice: 720,
          trackedPrice: 850,
          priceDropPercentage: 15,
          currency: 'SAR',
          createdAt: '2026-09-28',
          statusText: '📉 انخفض السعر بنسبة 15% منذ متابعتك!',
        },
        {
          id: 'alert-demo-2',
          type: 'hotel',
          title: 'فندق بيرا بلاس إسطنبول',
          targetQuery: 'Istanbul',
          currentPrice: 480,
          trackedPrice: 550,
          priceDropPercentage: 12,
          currency: 'SAR',
          createdAt: '2026-09-29',
          statusText: '📉 انخفض السعر بمقدار 70 ر.س للفيلة!',
        },
      ];
      setPriceAlerts(initialAlerts);
      localStorage.setItem('araboair_price_alerts', JSON.stringify(initialAlerts));
    }

    fetchHotelsData();
  }, [destinationAirport, currentCurrency]);

  useEffect(() => {
    if (flightSearchPerformed) {
      handlePerformFlightSearch('price');
    }
  }, [currentCurrency]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (airportPickerOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [airportPickerOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAirportPickerOpen(false);
        setCalendarModalOpen(false);
        setAiSummaryModal(null);
        setCurrencyModalOpen(false);
        setNotificationsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatDateToYYYYMMDD = (date: Date | null) => {
    if (!date) return '2026-11-15';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handlePerformFlightSearch = async (sortPref = 'price') => {
    const currentSeq = searchSeq + 1;
    setSearchSeq(currentSeq);
    setSearchingFlights(true);
    setFlightError(null);
    setConfigErrorDetails(null);
    setFlightSearchPerformed(true);

    try {
      let searchOrigin = originAirport.code;
      let searchDest = destinationAirport.code;
      let depStr = formatDateToYYYYMMDD(departureDate);
      let retStr = formatDateToYYYYMMDD(returnDate);

      if (tripType === 'multi-city' && multiCitySegments.length > 0) {
        searchOrigin = multiCitySegments[0].origin.code;
        searchDest = multiCitySegments[multiCitySegments.length - 1].destination.code;
        if (multiCitySegments[0].date) {
          depStr = formatDateToYYYYMMDD(multiCitySegments[0].date);
        }
      }

      const res = await fetch(`/api/travel/search?origin=${searchOrigin}&destination=${searchDest}&currency=${currentCurrency.code}&sort=${sortPref}&departureDate=${depStr}&returnDate=${tripType === 'one-way' ? '' : retStr}&adults=${adults}&children=${childrenCount}&infants=${infants}&cabinClass=${cabinClass}`);
      const data = await res.json();

      if (currentSeq !== searchSeq + 1) return;

      if (data.success) {
        setFlightsList(data.flights || []);
        setDataSourceNotice(data.disclaimer || '');
      } else {
        setFlightError(data.error || 'تعذر جلب بيانات الرحلات.');
        if (data.requiredConfig) {
          setConfigErrorDetails(data.requiredConfig);
        }
        setFlightsList([]);
      }
    } catch (err: any) {
      if (currentSeq === searchSeq + 1) {
        setFlightError('حدث خطأ في الاتصال بخدمة البحث.');
        setFlightsList([]);
      }
    } finally {
      if (currentSeq === searchSeq + 1) {
        setSearchingFlights(false);
      }
    }
  };

  const handleAiSearchSubmit = async () => {
    if (!aiSearchPrompt.trim()) return;
    setAiParsing(true);
    try {
      const res = await fetch('/api/travel/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiSearchPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSummaryModal(data);
      } else {
        alert('تعذر تحليل الطلب عبر الذكاء الاصطناعي.');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي.');
    } finally {
      setAiParsing(false);
    }
  };

  const confirmAiSearch = () => {
    if (!aiSummaryModal) return;
    const { originCode, destinationCode, departureDate: depStr, returnDate: retStr, sortPreference } = aiSummaryModal;

    const foundOrigin = AIRPORTS_DATA.find((a) => a.code === originCode);
    const foundDest = AIRPORTS_DATA.find((a) => a.code === destinationCode);

    if (foundOrigin) setOriginAirport(foundOrigin);
    if (foundDest) setDestinationAirport(foundDest);

    if (depStr) {
      const parsedDep = new Date(depStr);
      if (!isNaN(parsedDep.getTime())) setDepartureDate(parsedDep);
    }
    if (retStr) {
      const parsedRet = new Date(retStr);
      if (!isNaN(parsedRet.getTime())) {
        setReturnDate(parsedRet);
        setTripType('round');
      }
    }

    setAiSummaryModal(null);
    handlePerformFlightSearch(sortPreference || 'price');
  };

  const toggleAiChip = (chip: string) => {
    if (aiSelectedChips.includes(chip)) {
      setAiSelectedChips(aiSelectedChips.filter((c) => c !== chip));
    } else {
      setAiSelectedChips([...aiSelectedChips, chip]);
    }
  };

  const subscribePriceAlert = (type: 'flight' | 'hotel', title: string, targetQuery: string, currentPrice: number) => {
    const tracked = Math.round(currentPrice * 1.12); // Simulated initial tracked higher price for drop notification
    const dropPct = 10;
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      type,
      title,
      targetQuery,
      currentPrice,
      trackedPrice: tracked,
      priceDropPercentage: dropPct,
      currency: currentCurrency.code,
      createdAt: new Date().toLocaleDateString('ar-SA'),
      statusText: `📉 انخفاض متوقع في السعر بنسبة ${dropPct}%!`,
    };

    const updated = [newAlert, ...priceAlerts];
    setPriceAlerts(updated);
    localStorage.setItem('araboair_price_alerts', JSON.stringify(updated));

    setAlertSuccessMsg(`تم تفعيل تنبيه الأسعار بنجاح لـ "${title}". سنخطرك داخلياً فور انخفاض السعر!`);
    setTimeout(() => setAlertSuccessMsg(null), 4000);
  };

  const removePriceAlert = (id: string) => {
    const updated = priceAlerts.filter((a) => a.id !== id);
    setPriceAlerts(updated);
    localStorage.setItem('araboair_price_alerts', JSON.stringify(updated));
  };

  const fetchHotelsData = async () => {
    setLoadingHotels(true);
    setHotelError(null);
    try {
      const res = await fetch(`/api/travel/hotels?destination=${destinationAirport.cityEn}&currency=${currentCurrency.code}`);
      const data = await res.json();
      if (data.success) {
        setHotelsList(data.hotels);
      } else {
        setHotelError('تعذر جلب عروض الفنادق.');
      }
    } catch (err) {
      setHotelError('حدث خطأ في الاتصال بخدمة الفنادق.');
    } finally {
      setLoadingHotels(false);
    }
  };

  const handleSendChatMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    try {
      const res = await fetch('/api/travel-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: data.response || 'عذراً، لم أتمكن من الرد حالياً.',
        tips: data.tips || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        sender: 'ai',
        text: 'عذراً، حدث خطأ في الاتصال بالمساعد الذكي.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    }
  };

  const openAirportPicker = (type: 'origin' | 'destination', multiCityIndex?: number, field?: 'origin' | 'destination') => {
    if (multiCityIndex !== undefined && field) {
      setActiveMultiCityIndex({ index: multiCityIndex, field });
      setAirportPickerType(null);
    } else {
      setAirportPickerType(type);
      setActiveMultiCityIndex(null);
    }
    setAirportSearchQuery('');
    setAirportLoading(true);
    setAirportPickerOpen(true);
    setTimeout(() => setAirportLoading(false), 200);
  };

  const selectAirport = (airport: Airport) => {
    if (activeMultiCityIndex !== null) {
      const { index, field } = activeMultiCityIndex;
      const updated = [...multiCitySegments];
      updated[index] = {
        ...updated[index],
        [field]: airport,
      };
      setMultiCitySegments(updated);
    } else if (airportPickerType === 'origin') {
      if (airport.code === destinationAirport.code) {
        alert('لا يمكن اختيار نفس المطار للمغادرة والوصول.');
        return;
      }
      setOriginAirport(airport);
    } else if (airportPickerType === 'destination') {
      if (airport.code === originAirport.code) {
        alert('لا يمكن اختيار نفس المطار للمغادرة والوصول.');
        return;
      }
      setDestinationAirport(airport);
    }
    setAirportPickerOpen(false);
    setAirportPickerType(null);
    setActiveMultiCityIndex(null);
  };

  const addMultiCitySegment = () => {
    if (multiCitySegments.length >= 4) {
      alert('الحد الأقصى لمحطات الرحلة متعددة الوجهات هو 4 محطات.');
      return;
    }
    const lastSeg = multiCitySegments[multiCitySegments.length - 1];
    const newOrigin = lastSeg ? lastSeg.destination : AIRPORTS_DATA[11];
    const newDest = AIRPORTS_DATA[4];
    setMultiCitySegments([
      ...multiCitySegments,
      {
        id: `seg-${Date.now()}`,
        origin: newOrigin,
        destination: newDest,
        date: new Date(Date.now() + 7 * 86400000),
      },
    ]);
  };

  const removeMultiCitySegment = (id: string) => {
    if (multiCitySegments.length <= 1) {
      alert('يجب أن تحتوي الرحلة على محطة واحدة على الأقل.');
      return;
    }
    setMultiCitySegments(multiCitySegments.filter((s) => s.id !== id));
  };

  const filteredAirports = AIRPORTS_DATA.filter((a) => {
    const q = airportSearchQuery.toLowerCase();
    return (
      a.cityAr.toLowerCase().includes(q) ||
      a.nameAr.toLowerCase().includes(q) ||
      a.countryAr.toLowerCase().includes(q) ||
      a.cityEn.toLowerCase().includes(q) ||
      a.countryEn.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q)
    );
  });

  const openCalendarModal = () => {
    setTempDeparture(departureDate);
    setTempReturn(returnDate);
    if (departureDate) {
      setViewYear(departureDate.getFullYear());
      setViewMonth(departureDate.getMonth());
    }
    setCalendarModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    if (tripType === 'one-way') {
      setTempDeparture(date);
      setTempReturn(null);
    } else {
      if (!tempDeparture || (tempDeparture && tempReturn)) {
        setTempDeparture(date);
        setTempReturn(null);
      } else if (tempDeparture && !tempReturn) {
        if (date < tempDeparture) {
          setTempDeparture(date);
        } else {
          setTempReturn(date);
        }
      }
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    const days = [];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const englishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatDateDisplay = (d: Date | null) => {
    if (!d) return '';
    const day = d.getDate();
    const monthName = language === 'ar' ? arabicMonths[d.getMonth()] : englishMonths[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${monthName} ${year}`;
  };

  const formattedDatesDisplay = (() => {
    if (!departureDate) return language === 'ar' ? 'اختر تواريخ الرحلة' : 'Select trip dates';
    if (language === 'en') {
      const depStr = `${departureDate.getDate()} ${englishMonths[departureDate.getMonth()]}`;
      if (tripType === 'one-way' || !returnDate) return depStr;
      const retStr = `${returnDate.getDate()} ${englishMonths[returnDate.getMonth()]}`;
      return `${depStr} – ${retStr}`;
    }
    if (tripType === 'one-way' || !returnDate) {
      return `${departureDate.getDate()} ${arabicMonths[departureDate.getMonth()]}`;
    }
    return `${departureDate.getDate()} ${arabicMonths[departureDate.getMonth()]} – ${returnDate.getDate()} ${arabicMonths[returnDate.getMonth()]}`;
  })();

  return (
    <div className="bg-[#f9f9ff] font-sans text-[#151c27] antialiased selection:bg-[#005ab4] selection:text-white min-h-screen flex flex-col relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#f9f9ff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 w-full px-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <img
                alt="AraboAir Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9VTD7h38kB8TmiR3eIHw3iJBI0xbFWzo4Hawh5TqAI6nHkMC4cP4Yquac2bJw5XN3XA3iEgrewgQK5M9eRfEp8CF2HVzAFHDR5Iz6SjdreKw5I0B3xJHbu6D4O4q6Xib8dhk6wZnMwTdAq3Tyffvq1JQEMHCwyZYtPLQcNlVtkdrmuaEQYbUHGTymF6Jic_DQEYHxEE35rfgfBrH_umFgxDGUp4a_m_ALi4ECXq_gDKQ_owrnLdne"
              />
              <span className="font-bold text-lg text-[#005ab4] tracking-tight">AraboAir</span>
            </div>
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { id: 'home', label: language === 'ar' ? 'الرئيسية' : 'Home' },
                { id: 'flights', label: language === 'ar' ? 'رحلات الطيران' : 'Flights' },
                { id: 'hotels', label: language === 'ar' ? 'الفنادق' : 'Hotels' },
                { id: 'price-alerts', label: language === 'ar' ? `🔔 تنبيهات الأسعار (${priceAlerts.length})` : `🔔 Price Alerts (${priceAlerts.length})` },
                { id: 'ai-assistant', label: language === 'ar' ? 'المساعد الذكي AI' : 'AI Assistant' },
                { id: 'my-trips', label: language === 'ar' ? `رحلاتي (${myTrips.length})` : `My Trips (${myTrips.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#0072e2] text-white shadow-sm'
                      : 'text-[#414753] hover:bg-[#e2e8f8] hover:text-[#151c27]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
                className="w-10 h-10 rounded-xl bg-[#f0f3ff] text-[#005ab4] hover:bg-[#e2e8f8] transition-colors flex items-center justify-center relative shadow-2xs"
                title="الإشعارات وتغيرات الأسعار"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {priceAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {priceAlerts.length}
                  </span>
                )}
              </button>

              {notificationsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl p-4 border border-slate-200/80 z-50 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-[#151c27]">إشعارات تغيرات الأسعار</h4>
                    <button
                      onClick={() => {
                        setNotificationsDropdownOpen(false);
                        setActiveTab('price-alerts');
                      }}
                      className="text-xs text-[#005ab4] font-bold hover:underline"
                    >
                      إدارة الكل
                    </button>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {priceAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 rounded-xl bg-[#f0f3ff]/60 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#151c27]">{alert.title}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {alert.currency} {Math.round(alert.currentPrice * currentCurrency.rateToSar)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#006578] font-semibold">{alert.statusText}</p>
                        <span className="text-[9px] text-slate-400 block">{alert.createdAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0f3ff] text-[#005ab4] hover:bg-[#e2e8f8] transition-colors text-sm font-bold shadow-2xs"
            >
              <span className="material-symbols-outlined text-[18px]">language</span>
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            <button
              onClick={() => setCurrencyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f0f3ff] text-[#005ab4] hover:bg-[#e2e8f8] transition-colors text-sm font-bold shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>{currentCurrency.code} ({currentCurrency.symbol})</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#005ab4] flex items-center justify-center text-white cursor-pointer" onClick={() => setActiveTab('my-trips')}>
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="w-full pt-20 bg-[#f9f9ff] flex-1">
        {alertSuccessMsg && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#005ab4] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            <span className="text-sm font-bold">{alertSuccessMsg}</span>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="flex flex-col w-full">
            {/* Hero Visual Banner with Shell Bleed */}
            <section className="relative w-full -mt-20 overflow-hidden bg-white">
              <div
                className="absolute inset-0 w-full h-[620px] bg-cover bg-center"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCBcnroO1cJXglgWQ2a2jQAbcN68UbBuk4-BU0PpYwXcV6_ULCaIcXwwg65-Wjlk_JVOnVeE-JKvdWR5CHv5YdT1AdXctsMTu6qaYqaA9XzZnu-KJfb77mwedKVFIiMGWJyi_kaoFlQ7mqa41mS0yyX7yGJHu5CGvp4cU6N6AnvytuzlxhYSj1iBbfX9NkQe4UwLY6wbhWhSFZCY1RHiv7k03eXvJBqeq1aaVXJqMcceYJwu3gqXNlY')`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#151c27]/40 via-[#f9f9ff]/40 to-[#f9f9ff]"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#005ab4]/20 via-transparent to-[#006578]/15"></div>
              </div>

              <div className="relative w-full max-w-7xl mx-auto px-5 pt-28 pb-12 flex flex-col gap-6">
                <div className="flex flex-col gap-2 max-w-3xl text-[#151c27] drop-shadow-sm">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm self-start">
                    <span className="material-symbols-outlined text-[#005ab4] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    <span className="text-xs text-[#005ab4] font-bold">
                      {language === 'ar' ? 'منصة ذكاء السفر الفاخر وتنبيهات الأسعار الداخلية' : 'Luxury Travel Intelligence & Price Alerts Platform'}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-[#151c27] tracking-tight mt-1">
                    {language === 'ar'
                      ? `ابحث عن رحلاتك وفنادقك وتابع إشعارات انخفاض الأسعار (${currentCurrency.code})`
                      : `Search Flights & Hotels and Track Price Alerts (${currentCurrency.code})`}
                  </h1>
                  <p className="text-base text-[#414753] font-normal leading-relaxed">
                    {language === 'ar'
                      ? 'مقارنة فورية وعروض أسعار موثوقة مع إشعارات داخلية فورية عند تغير أسعار رحلاتك المتابعة.'
                      : 'Instant comparison and reliable price offers with real-time notifications for tracked trips.'}
                  </p>
                </div>

                {/* Rounded Service Tabs: رحلات الطيران | فنادق | المساعد الذكي */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60">
                    <button
                      onClick={() => { setSearchServiceTab('flight'); setSearchModeTab('normal'); }}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        searchServiceTab === 'flight' && searchModeTab === 'normal'
                          ? 'bg-[#005ab4] text-white shadow-sm'
                          : 'text-[#414753] hover:bg-slate-100'
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                      <span>{language === 'ar' ? 'رحلات الطيران' : 'Flights'}</span>
                    </button>
                    <button
                      onClick={() => { setSearchServiceTab('hotel'); setSearchModeTab('normal'); }}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        searchServiceTab === 'hotel' && searchModeTab === 'normal'
                          ? 'bg-[#005ab4] text-white shadow-sm'
                          : 'text-[#414753] hover:bg-slate-100'
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">hotel</span>
                      <span>{language === 'ar' ? 'فنادق' : 'Hotels'}</span>
                    </button>
                    <button
                      onClick={() => { setSearchServiceTab('ai'); setSearchModeTab('ai'); }}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        searchServiceTab === 'ai' || searchModeTab === 'ai'
                          ? 'bg-[#005ab4] text-white shadow-sm'
                          : 'text-[#414753] hover:bg-slate-100'
                      }`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      <span>{language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}</span>
                    </button>
                  </div>

                  {searchServiceTab === 'flight' && (
                    <button
                      onClick={() => {
                        const title = language === 'ar' ? `رحلة من ${originAirport.cityAr} إلى ${destinationAirport.cityAr}` : `Flight from ${originAirport.cityEn} to ${destinationAirport.cityEn}`;
                        const query = `${originAirport.code}-${destinationAirport.code}`;
                        subscribePriceAlert('flight', title, query, flightsList[0]?.price || 750);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-[#005ab4] text-xs font-bold shadow-sm border border-[#005ab4]/20 transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                      <span>{language === 'ar' ? 'تفعيل تنبيه سعر هذا المسار' : 'Enable Price Alert for Route'}</span>
                    </button>
                  )}
                </div>

                {/* Search Panels based on Service Tab */}
                {searchServiceTab === 'flight' && searchModeTab === 'normal' ? (
                  <div className="w-full bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col gap-4 relative animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e7eefe] pb-3">
                      <div className="text-sm font-bold text-[#151c27] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#005ab4]">flight</span>
                        <span>{language === 'ar' ? 'البحث عن رحلات الطيران' : 'Flight Search'}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-[#151c27]">
                          <input
                            type="radio"
                            name="trip_type"
                            checked={tripType === 'round'}
                            onChange={() => setTripType('round')}
                            className="accent-[#005ab4] w-4 h-4 cursor-pointer"
                          />
                          <span>{language === 'ar' ? 'ذهاب وعودة' : 'Round Trip'}</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#414753] hover:text-[#151c27]">
                          <input
                            type="radio"
                            name="trip_type"
                            checked={tripType === 'one-way'}
                            onChange={() => setTripType('one-way')}
                            className="accent-[#005ab4] w-4 h-4 cursor-pointer"
                          />
                          <span>{language === 'ar' ? 'ذهاب فقط' : 'One Way'}</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#414753] hover:text-[#151c27]">
                          <input
                            type="radio"
                            name="trip_type"
                            checked={tripType === 'multi-city'}
                            onChange={() => setTripType('multi-city')}
                            className="accent-[#005ab4] w-4 h-4 cursor-pointer"
                          />
                          <span>{language === 'ar' ? 'رحلة متعددة الوجهات' : 'Multi-City'}</span>
                        </label>
                      </div>
                    </div>

                    {tripType === 'multi-city' ? (
                      <div className="flex flex-col gap-3 py-2">
                        <div className="text-xs text-[#005ab4] font-bold flex items-center justify-between">
                          <span>أضف حتى 4 محطات لرحلتك المتعددة:</span>
                          <button
                            onClick={addMultiCitySegment}
                            className="px-3 py-1 bg-[#005ab4] text-white text-xs rounded-lg font-bold hover:bg-[#00458d] transition-colors flex items-center gap-1"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            <span>إضافة محطة</span>
                          </button>
                        </div>

                        {multiCitySegments.map((seg, idx) => (
                          <div key={seg.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-[#f0f3ff] p-3 rounded-xl border border-[#dce2f3]">
                            <div className="md:col-span-1 text-xs font-bold text-[#005ab4] text-center">
                              محطة {idx + 1}
                            </div>
                            <div
                              onClick={() => openAirportPicker('origin', idx, 'origin')}
                              className="md:col-span-4 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:border-[#005ab4]"
                            >
                              <span className="text-[10px] text-slate-400 block">المغادرة (من)</span>
                              <span className="text-sm font-bold text-[#151c27]">{seg.origin.cityAr} ({seg.origin.code})</span>
                            </div>
                            <div
                              onClick={() => openAirportPicker('destination', idx, 'destination')}
                              className="md:col-span-4 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:border-[#005ab4]"
                            >
                              <span className="text-[10px] text-slate-400 block">الوصول (إلى)</span>
                              <span className="text-sm font-bold text-[#151c27]">{seg.destination.cityAr} ({seg.destination.code})</span>
                            </div>
                            <div className="md:col-span-2 bg-white p-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-[#151c27]">
                              <span className="text-[10px] text-slate-400 block">التاريخ</span>
                              <span>{seg.date ? formatDateDisplay(seg.date) : 'اختر تاريخ'}</span>
                            </div>
                            <div className="md:col-span-1 flex justify-center">
                              {multiCitySegments.length > 1 && (
                                <button
                                  onClick={() => removeMultiCitySegment(seg.id)}
                                  className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                  title="حذف المحطة"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center relative">
                        <div
                          onClick={() => openAirportPicker('origin')}
                          className="lg:col-span-3 relative flex flex-col justify-center px-4 py-2.5 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer group"
                        >
                          <span className="text-xs text-[#414753]">{language === 'ar' ? 'محطة المغادرة (من أين؟)' : 'Departure (From where?)'}</span>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="text-base font-bold text-[#151c27] truncate">
                              {language === 'ar' ? originAirport.cityAr : originAirport.cityEn} (<span dir="ltr">{originAirport.code}</span>)
                            </span>
                          </div>
                          <span className="text-xs text-[#414753] truncate">{language === 'ar' ? originAirport.nameAr : `${originAirport.cityEn} Airport (${originAirport.code})`}</span>
                        </div>

                        <div className="flex items-center justify-center lg:col-span-1 -my-2 lg:my-0">
                          <button
                            onClick={() => {
                              const temp = originAirport;
                              setOriginAirport(destinationAirport);
                              setDestinationAirport(temp);
                            }}
                            aria-label={language === 'ar' ? 'تبديل الوجهة والمغادرة' : 'Swap origin and destination'}
                            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[#005ab4] hover:bg-[#d6e3ff] transition-transform active:scale-95"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                          </button>
                        </div>

                        <div
                          onClick={() => openAirportPicker('destination')}
                          className="lg:col-span-3 relative flex flex-col justify-center px-4 py-2.5 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer group"
                        >
                          <span className="text-xs text-[#414753]">{language === 'ar' ? 'الوجهة المستهدفة (إلى أين؟)' : 'Destination (To where?)'}</span>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="text-base font-bold text-[#151c27] truncate">
                              {language === 'ar' ? destinationAirport.cityAr : destinationAirport.cityEn} (<span dir="ltr">{destinationAirport.code}</span>)
                            </span>
                          </div>
                          <span className="text-xs text-[#414753] truncate">{language === 'ar' ? destinationAirport.nameAr : `${destinationAirport.cityEn} Airport (${destinationAirport.code})`}</span>
                        </div>

                        <div
                          onClick={openCalendarModal}
                          className="lg:col-span-3 flex flex-col justify-center px-4 py-2.5 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer"
                        >
                          <span className="text-xs text-[#414753]">{language === 'ar' ? `تواريخ الرحلة (${tripType === 'round' ? 'ذهاب - عودة' : 'ذهاب فقط'})` : `Trip Dates (${tripType === 'round' ? 'Round-trip' : 'One-way'})`}</span>
                          <div className="flex items-center gap-1 mt-0.5 text-base font-semibold text-[#151c27]">
                            <span className="material-symbols-outlined text-[#005ab4] text-[18px]">calendar_today</span>
                            <span className="truncate">{formattedDatesDisplay}</span>
                          </div>
                          <span className="text-xs text-[#006578]">{language === 'ar' ? 'اختر التواريخ بدقة' : 'Select dates'}</span>
                        </div>

                        <div
                          onClick={openTravelersModal}
                          className="lg:col-span-2 flex flex-col justify-center px-4 py-2.5 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer"
                        >
                          <span className="text-xs text-[#414753]">{language === 'ar' ? 'المسافرون ودرجة السفر' : 'Travelers & Cabin'}</span>
                          <div className="flex items-center gap-1 mt-0.5 text-base font-semibold text-[#151c27] truncate">
                            <span className="material-symbols-outlined text-[#414753] text-[18px]">group</span>
                            <span className="truncate">{travelersDisplayString}</span>
                          </div>
                          <span className="text-xs text-[#006578]">{language === 'ar' ? 'اضغط لتعديل الركاب والدرجة' : 'Click to edit'}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="flex flex-wrap items-center gap-2 text-[#414753] text-xs">
                        <span className="flex items-center gap-1 text-[#006578] font-semibold">
                          <span className="material-symbols-outlined text-[16px]">verified</span> {language === 'ar' ? `بحث فوري بالعملة (${currentCurrency.code})` : `Instant search in (${currentCurrency.code})`}
                        </span>
                        <span>•</span>
                        <span>{language === 'ar' ? 'مقارنة الأسعار والترانزيت' : 'Price & transit comparison'}</span>
                      </div>
                      <button
                        onClick={() => handlePerformFlightSearch('price')}
                        disabled={searchingFlights}
                        className="w-full sm:w-auto min-w-[260px] h-[52px] px-8 rounded-xl bg-[#005ab4] text-white text-base font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#00458d] transition-all active:scale-[0.99] disabled:opacity-60"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[22px]">search</span>
                        <span>{searchingFlights ? (language === 'ar' ? 'جاري البحث...' : 'Searching...') : (language === 'ar' ? 'ابحث عن رحلات' : 'Search Flights')}</span>
                      </button>
                    </div>
                  </div>
                ) : searchServiceTab === 'hotel' && searchModeTab === 'normal' ? (
                  /* Dedicated Rounded Hotel Search Panel */
                  <div className="w-full bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col gap-4 relative animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[#e7eefe] pb-3">
                      <div className="text-sm font-bold text-[#151c27] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#005ab4]">hotel</span>
                        <span>{language === 'ar' ? 'البحث عن الفنادق وأماكن الإقامة' : 'Hotel Search & Accommodation'}</span>
                      </div>
                      <span className="text-xs text-[#414753]">{language === 'ar' ? 'اختر وجهتك وتواريخ الإقامة والنزلاء' : 'Select destination, stay dates & guests'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center relative">
                      {/* 1. المدينة أو الوجهة */}
                      <div
                        onClick={() => setHotelDestPickerOpen(true)}
                        className="flex flex-col justify-center px-4 py-3 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer"
                      >
                        <span className="text-xs text-[#414753]">{language === 'ar' ? 'المدينة أو الوجهة' : 'City or Destination'}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-base font-bold text-[#151c27]">
                          <span className="material-symbols-outlined text-[#005ab4] text-[18px]">location_on</span>
                          <span className="truncate">{getHotelDestDisplay(hotelTabDestKey, hotelTabDest)}</span>
                        </div>
                        <span className="text-[11px] text-[#006578]">{language === 'ar' ? 'اختر وجهتك المفضلة' : 'Choose destination'}</span>
                      </div>

                      {/* 2 & 3. تاريخ الوصول وتاريخ المغادرة */}
                      <div
                        onClick={openCalendarModal}
                        className="flex flex-col justify-center px-4 py-3 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer"
                      >
                        <span className="text-xs text-[#414753]">{language === 'ar' ? 'تاريخ الوصول - المغادرة' : 'Check-in – Check-out'}</span>
                        <div className="flex items-center gap-1 mt-0.5 text-sm font-semibold text-[#151c27]">
                          <span className="material-symbols-outlined text-[#005ab4] text-[18px]">calendar_today</span>
                          <span className="truncate">
                            {hotelTabCheckIn.getDate()} {language === 'ar' ? arabicMonths[hotelTabCheckIn.getMonth()] : hotelTabCheckIn.toLocaleString('en', { month: 'short' })} – {hotelTabCheckOut.getDate()} {language === 'ar' ? arabicMonths[hotelTabCheckOut.getMonth()] : hotelTabCheckOut.toLocaleString('en', { month: 'short' })}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#006578]">{language === 'ar' ? 'انقر لتعديل التواريخ' : 'Click to edit'}</span>
                      </div>

                      {/* 4. الغرف والضيوف */}
                      <div
                        onClick={() => setHotelGuestsModalOpen(true)}
                        className="flex flex-col justify-center px-4 py-3 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer"
                      >
                        <span className="text-xs text-[#414753]">{language === 'ar' ? 'الغرف والضيوف' : 'Rooms & Guests'}</span>
                        <div className="flex items-center gap-1 mt-0.5 text-sm font-semibold text-[#151c27]">
                          <span className="material-symbols-outlined text-[#005ab4] text-[18px]">group</span>
                          <span className="truncate">{language === 'ar' ? `${hotelTabRooms} غرفة، ${hotelTabAdults + hotelTabChildren} ضيوف` : `${hotelTabRooms} Room, ${hotelTabAdults + hotelTabChildren} Guests`}</span>
                        </div>
                        <span className="text-[11px] text-[#414753]">{language === 'ar' ? 'تعديل الغرف والنزلاء' : 'Edit rooms & guests'}</span>
                      </div>

                      {/* 5. A large green “ابحث عن فنادق” button */}
                      <div className="flex items-end">
                        <button
                          onClick={handlePerformHotelSearch}
                          disabled={hotelTabSearching}
                          className="w-full h-[54px] rounded-xl bg-[#00a86b] hover:bg-[#00925d] text-white text-base font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[20px]">search</span>
                          <span>{hotelTabSearching ? (language === 'ar' ? 'جاري البحث...' : 'Searching...') : (language === 'ar' ? 'ابحث عن فنادق' : 'Search Hotels')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* AI Search Tab */
                  <div className="w-full bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-6 animate-in fade-in duration-200 border border-[#afecff]">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-xl font-bold text-[#151c27]">{language === 'ar' ? 'صف رحلتك' : 'Describe Your Trip'}</h2>
                      <p className="text-xs text-[#414753]">{language === 'ar' ? 'اكتب وجهتك وتواريخك وتفضيلاتك بكلماتك بالعملة المفضلة.' : 'Write your destination, dates & preferences in your own words in your preferred currency.'}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(language === 'ar' ? ['مباشر', 'ذهاب وعودة', 'الأرخص'] : ['Direct', 'Round Trip', 'Cheapest']).map((chip) => {
                        const isSelected = aiSelectedChips.includes(chip);
                        return (
                          <button
                            key={chip}
                            onClick={() => toggleAiChip(chip)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-[#005ab4] text-white shadow-xs'
                                : 'bg-[#f0f3ff] text-[#414753] hover:bg-[#e2e8f8]'
                            }`}
                            type="button"
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                      <textarea
                        rows={3}
                        value={aiSearchPrompt}
                        onChange={(e) => setAiSearchPrompt(e.target.value)}
                        placeholder={language === 'ar' ? 'أريد رحلة من جدة إلى إسطنبول من 15 إلى 22 نوفمبر 2026، لمسافرين، بأقل سعر ومع توقفين كحد أقصى.' : 'I want a flight from Jeddah to Istanbul from Nov 15 to Nov 22, 2026, for 2 travelers, at the cheapest price with max 2 stops.'}
                        className="flex-1 p-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#005ab4] bg-slate-50/50 leading-relaxed resize-none"
                      />
                      <button
                        onClick={handleAiSearchSubmit}
                        disabled={aiParsing || searchingFlights}
                        className="h-auto min-h-[52px] lg:w-60 px-6 rounded-xl bg-[#005ab4] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#00458d] transition-all disabled:opacity-60"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                        <span>{aiParsing ? (language === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (language === 'ar' ? 'ابحث عن رحلات' : 'Search Flights')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hotel Search Results Section (Displayed when searching from Hotel Tab) */}
                {searchServiceTab === 'hotel' && hotelTabSearched && (
                  <div className="w-full bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-6 mt-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-xl font-bold text-[#151c27]">
                          {language === 'ar'
                            ? `نتائج البحث في ${hotelTabDest} (${currentCurrency.code})`
                            : `Search Results in ${getHotelDestDisplay(hotelTabDestKey, hotelTabDest)} (${currentCurrency.code})`}
                        </h2>
                        <p className="text-xs text-[#414753]">
                          {language === 'ar'
                            ? `الفترة: ${hotelTabCheckIn.getDate()} ${arabicMonths[hotelTabCheckIn.getMonth()]} – ${hotelTabCheckOut.getDate()} ${arabicMonths[hotelTabCheckOut.getMonth()]} • ${hotelTabRooms} غرفة، ${hotelTabAdults + hotelTabChildren} ضيوف`
                            : `Period: ${hotelTabCheckIn.getDate()} ${englishMonths[hotelTabCheckIn.getMonth()]} – ${hotelTabCheckOut.getDate()} ${englishMonths[hotelTabCheckOut.getMonth()]} • ${hotelTabRooms} Room, ${hotelTabAdults + hotelTabChildren} Guests`}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-[#f0f3ff] text-[#005ab4] text-xs font-bold rounded-full">
                        {language === 'ar' ? `${hotelTabResults.length} فنادق متاحة` : `${hotelTabResults.length} Hotels available`}
                      </span>
                    </div>

                    {hotelTabSearching ? (
                      <div className="py-16 text-center space-y-3">
                        <div className="w-10 h-10 border-4 border-[#005ab4] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm text-[#414753]">
                          {language === 'ar'
                            ? `جاري البحث عن أفضل الفنادق المتاحة في ${hotelTabDest}...`
                            : `Searching for best available hotels in ${getHotelDestDisplay(hotelTabDestKey, hotelTabDest)}...`}
                        </p>
                      </div>
                    ) : hotelTabError ? (
                      <div className="py-12 text-center bg-slate-50 rounded-2xl p-6 space-y-3 border border-red-100">
                        <p className="text-sm text-red-600 font-bold">{hotelTabError}</p>
                        <button
                          onClick={handlePerformHotelSearch}
                          className="px-6 py-2.5 bg-[#005ab4] text-white text-xs font-bold rounded-xl"
                          type="button"
                        >
                          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                        </button>
                      </div>
                    ) : hotelTabResults.length === 0 ? (
                      <div className="py-16 text-center bg-slate-50 rounded-2xl p-6 space-y-3">
                        <span className="material-symbols-outlined text-slate-300 text-[40px]">hotel</span>
                        <h3 className="text-base font-bold text-slate-700">
                          {language === 'ar' ? 'لا توجد فنادق متاحة لهذه الوجهة' : 'No hotels available for this destination'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {language === 'ar' ? 'جرب تغيير تواريخ الوصول والمغادرة أو اختيار وجهة أخرى.' : 'Try changing check-in/check-out dates or selecting another destination.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hotelTabResults.map((hotel) => (
                          <div
                            key={hotel.id}
                            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col sm:flex-row gap-4 p-4 items-center"
                          >
                            <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                              <img
                                src={hotel.img}
                                alt={hotel.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-bold text-[#005ab4] shadow-xs">
                                ★ {hotel.rating}
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-between space-y-3 w-full">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-[#006578] font-bold">{hotel.city} • {hotel.neighborhood}</span>
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{hotel.stars}</span>
                                </div>
                                <h3 className="font-bold text-base text-[#151c27]">{hotel.name}</h3>
                                <p className="text-xs text-slate-600">غرفة مزدوجة فاخرة • إفطار مجاني مشمول • إلغاء مجاني</p>
                                <div className="text-[10px] text-[#005ab4] bg-[#f0f3ff] px-2 py-1 rounded-lg flex items-center justify-between mt-1">
                                  <span>📞 خدمة عملاء وحجز الشريك ({hotel.provider}): support@partner-booking.com</span>
                                  <span className="font-bold">هاتف: +966 11 200 5000</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                  <div className="flex items-baseline gap-1" dir="ltr">
                                    <span className="text-base font-bold text-[#005ab4]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                      {Math.round(hotel.price * currentCurrency.rateToSar)}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{currentCurrency.code} / ليلة (شامل الضرائب)</span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 block">عبر {hotel.provider} • ضمان أفضل سعر</span>
                                </div>

                                <a
                                  href={hotel.partnerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2.5 rounded-xl bg-[#005ab4] text-white text-xs font-bold hover:bg-[#00458d] transition-all shadow-xs text-center"
                                >
                                  شاهد العرض
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Wego-style Results Section using Precise CSS Grid Layout */}
                {flightSearchPerformed && (
                  <div className="w-full bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-6 mt-4 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#151c27]">نتائج البحث عن رحلات الطيران ({currentCurrency.code})</h2>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const title = `رحلة متعددة الوجهات`;
                              const query = `multi-city`;
                              subscribePriceAlert('flight', title, query, flightsList[0]?.price || 750);
                            }}
                            className="px-3 py-1 bg-[#f0f3ff] text-[#005ab4] text-xs font-bold rounded-full hover:bg-[#e2e8f8] transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">notifications</span>
                            <span>تفعيل تنبيه السعر</span>
                          </button>
                          <span className="px-3 py-1 bg-[#f0f3ff] text-[#005ab4] text-xs font-bold rounded-full">
                            {flightsList.length} عروض متاحة
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[#414753]">
                        {tripType === 'multi-city'
                          ? `بحث متعدد الوجهات (${multiCitySegments.map((s) => `${s.origin.code} ➔ ${s.destination.code}`).join(' | ')})`
                          : `من ${originAirport.cityAr} (${originAirport.code}) إلى ${destinationAirport.cityAr} (${destinationAirport.code})`}
                      </p>
                      <div className="px-4 py-2 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200/60 font-medium">
                        ℹ️ الأسعار محولة بناءً على العملة المختارة ({currentCurrency.nameAr}) وقابلة للتغيير وتُحدَّث لدى موقع الحجز.
                      </div>
                    </div>

                    {searchingFlights ? (
                      <div className="py-16 text-center space-y-3">
                        <div className="w-10 h-10 border-4 border-[#005ab4] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm text-[#414753]">جاري جلب الأسعار والتحويل للعملة ({currentCurrency.code})...</p>
                      </div>
                    ) : flightError ? (
                      <div className="py-12 text-center bg-slate-50 rounded-2xl p-6 space-y-4 border border-red-100">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                          <span className="material-symbols-outlined text-[24px]">error</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-base text-red-700">تعذر جلب الرحلات</h4>
                          <p className="text-xs text-slate-600 max-w-md mx-auto">{flightError}</p>
                        </div>
                        {configErrorDetails && (
                          <div className="p-4 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200 text-right space-y-2 max-w-lg mx-auto">
                            <div className="font-bold">⚠️ إعدادات مطلوبة على الخادم:</div>
                            <div>متغير البيئة المفقود: <code className="font-mono bg-amber-100 px-1 rounded">{configErrorDetails.tokenVariable}</code></div>
                            <div>{configErrorDetails.message}</div>
                            <div className="text-slate-600 pt-1">الرجاء إضافة المفتاح إلى خسك أو متغيرات البيئة لإتمام الاتصال بـ Travelpayouts Data API.</div>
                          </div>
                        )}
                        <button
                          onClick={() => handlePerformFlightSearch('price')}
                          className="px-6 py-2.5 bg-[#005ab4] text-white text-xs font-bold rounded-xl"
                        >
                          إعادة المحاولة
                        </button>
                      </div>
                    ) : flightsList.length === 0 ? (
                      <div className="py-16 text-center space-y-6 bg-slate-50 rounded-2xl p-6">
                        <span className="material-symbols-outlined text-slate-300 text-[40px]">flight_takeoff</span>
                        <div className="space-y-2">
                          <h4 className="font-bold text-base text-slate-700">لا توجد رحلات مطابقة لهذا المسار حالياً</h4>
                          <p className="text-xs text-slate-500">جرب البحث بوجهة أو تواريخ أخرى، أو استكشف خيارات الشركاء المعتمدين أدناه:</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                          <a
                            href="https://kiwi.tpx.lu/66qLX2jh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-[#006578] text-white text-xs font-bold rounded-xl hover:bg-[#004e5d] transition-colors"
                          >
                            البحث لدى Kiwi.com
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {flightsList.map((flight) => (
                          <div
                            key={flight.id}
                            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-slate-200/80 grid grid-cols-1 md:grid-cols-[220px_130px_180px_130px_160px_150px] items-center gap-4"
                          >
                            {/* 1. Airline Column */}
                            <div className="flex items-center gap-3">
                              {flight.airlineLogo ? (
                                <img
                                  src={flight.airlineLogo}
                                  alt={flight.airline}
                                  className="w-12 h-12 rounded-xl object-contain bg-[#f0f3ff] p-1 shadow-xs"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-[#f0f3ff] flex items-center justify-center font-bold text-[#005ab4] font-mono text-base shadow-xs">
                                  {flight.code}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h3 className="font-bold text-sm text-[#151c27] truncate">{flight.airline}</h3>
                                {flight.flightNo ? (
                                  <span className="text-xs text-slate-500 block truncate" dir="ltr">{flight.flightNo}</span>
                                ) : (
                                  <span className="text-xs text-slate-400 block">رحلة مجدولة</span>
                                )}
                              </div>
                            </div>

                            {/* 2. Departure Column (Right of route in RTL) */}
                            <div className="flex flex-col items-center justify-center text-center">
                              <span className="text-[10px] text-slate-400 font-semibold mb-0.5">المغادرة</span>
                              <span className="text-base font-bold text-[#151c27] tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }} dir="ltr">
                                {flight.depTime}
                              </span>
                              <span className="text-xs text-slate-500 font-medium" dir="ltr">{flight.depCode}</span>
                            </div>

                            {/* 3. Flight Route & Stops Column (Fixed width 180px) */}
                            <div className="flex flex-col items-center justify-center text-center px-2">
                              <span className="text-xs text-[#006578] font-medium">{flight.duration}</span>
                              <div className="w-full relative flex items-center my-1.5">
                                <div className="w-full h-0.5 bg-[#dce2f3]"></div>
                                <span className="material-symbols-outlined text-[#005ab4] text-[18px] absolute inset-x-0 mx-auto -top-2 bg-white px-1">flight</span>
                              </div>
                              <span className="text-[10px] text-slate-400">مباشر / عبر الترانزيت</span>
                            </div>

                            {/* 4. Arrival Column (Left of route in RTL, equal width 130px) */}
                            <div className="flex flex-col items-center justify-center text-center">
                              <span className="text-[10px] text-slate-400 font-semibold mb-0.5">الوصول</span>
                              <span className="text-base font-bold text-[#151c27] tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }} dir="ltr">
                                {flight.arrTime}
                              </span>
                              <span className="text-xs text-slate-500 font-medium" dir="ltr">{flight.arrCode}</span>
                            </div>

                            {/* 5. Price Column */}
                            <div className="text-right flex flex-col items-end">
                              <div className="flex items-baseline gap-1 justify-end" dir="ltr">
                                <span className="text-xl font-bold text-[#005ab4]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {Math.round(flight.price * currentCurrency.rateToSar)}
                                </span>
                                <span className="text-xs text-slate-600">{currentCurrency.code}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 block">عبر {flight.bookingProvider}</span>
                              <span className="text-[10px] text-slate-400 block">{flight.priceType}</span>
                            </div>

                            {/* 6. Action Button Column: «عرض الرحلات لدى الشريك» */}
                            <div className="flex justify-end md:justify-center">
                              <a
                                href={flight.partnerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#005ab4] text-white text-xs font-bold hover:bg-[#00458d] transition-all shadow-sm text-center"
                              >
                                عرض الرحلات لدى الشريك
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Section: Secondary Travel Services Grid including Kiwitaxi, Localrent & Airalo */}
            <section className="w-full max-w-7xl mx-auto px-5 py-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#151c27]">خدمات السفر المتكاملة</h2>
                  <p className="text-sm text-[#414753]">كل ما يلزم رحلتك من حجز المقعد وحتى انتقالات المطار وتأجير السيارات وشرائح الاتصال</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#005ab4]/10 via-white to-[#006578]/10 border border-[#afecff] shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#d6e3ff] text-[#005ab4] flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[26px]">airport_shuttle</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#151c27]">انتقالات المطار (Kiwitaxi)</h3>
                      <span className="text-xs text-[#005ab4] font-semibold">خدمات نقل موثوقة ومريحة</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#414753]">استكشف خدمات النقل من وإلى المطار</p>
                  <a
                    href="https://kiwitaxi.tpx.lu/phKkWBAl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 rounded-xl bg-[#005ab4] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#00458d] transition-all text-center shadow-sm"
                  >
                    <span>عرض خيارات النقل لدى Kiwitaxi</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#afecff] text-[#001f27] flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[26px]">directions_car</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#151c27]">تأجير السيارات (Localrent)</h3>
                      <span className="text-xs text-[#006578] font-semibold">أفضل أسعار استئجار السيارات عالمياً</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#414753]">احجز سيارتك المفضلة بكل سهولة وأمان عبر شريكنا المعتمد.</p>
                  <a
                    href="https://localrent.tpx.lu/QRRUwLpL"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 rounded-xl bg-[#006578] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#004e5d] transition-all text-center shadow-sm"
                  >
                    <span>استكشف السيارات لدى Localrent</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#dae2ff] text-[#365aaf] flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[26px]">sim_card</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#151c27]">شرائح الإنترنت eSIM (Airalo)</h3>
                      <span className="text-xs text-[#365aaf] font-semibold">تفعيل فوري في أكثر من 200 دولة</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#414753]">استكشف باقات الإنترنت لرحلتك</p>
                  <a
                    href="https://airalo.tpx.lu/rbWr2oqy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 rounded-xl bg-[#365aaf] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#174296] transition-all text-center shadow-sm"
                  >
                    <span>عرض باقات Airalo</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </section>

            {/* Section: «اكتشف إقامتك القادمة» */}
            <section className="w-full max-w-7xl mx-auto px-5 py-12 space-y-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl md:text-3xl font-bold text-[#151c27]">اكتشف إقامتك القادمة</h2>
                <p className="text-sm text-[#414753]">استكشف أفضل الفنادق وأماكن الإقامة الفاخرة مع أسعار محدثة وتتبع فندقي موثوق.</p>
              </div>

              {/* Destination Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {hotelDestinationTabs.map((tab) => {
                  const isActive = homepageHotelDest === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setHomepageHotelDest(tab.key);
                        setHomepageHotelsLimit(12);
                      }}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#005ab4] text-white shadow-sm'
                          : 'bg-white text-[#414753] hover:bg-slate-100 border border-slate-200/80'
                      }`}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Loading / Error / Empty States */}
              {homepageHotelsLoading ? (
                <div className="py-16 text-center space-y-3 bg-white rounded-2xl shadow-sm">
                  <div className="w-10 h-10 border-4 border-[#005ab4] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-[#414753]">جاري تحميل الفنادق...</p>
                </div>
              ) : homepageHotelsError ? (
                <div className="py-12 text-center bg-white rounded-2xl shadow-sm p-6 space-y-3 border border-red-100">
                  <p className="text-sm text-red-600 font-bold">{homepageHotelsError}</p>
                  <button
                    onClick={() => fetchHomepageHotels(homepageHotelDest)}
                    className="px-4 py-2 bg-[#005ab4] text-white text-xs font-bold rounded-xl"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : homepageHotelsList.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl shadow-sm p-6 space-y-2">
                  <span className="material-symbols-outlined text-slate-300 text-[40px]">hotel</span>
                  <p className="text-sm text-slate-600">لا توجد فنادق متاحة لهذه الوجهة حالياً.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Grid: Desktop 4 cards per row, Tablet 2-3, Mobile 1-2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {homepageHotelsList.slice(0, homepageHotelsLimit).map((hotel) => (
                      <div
                        key={hotel.id}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between group"
                      >
                        <div className="relative h-48 overflow-hidden bg-slate-100">
                          <img
                            src={hotel.img}
                            alt={hotel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-[#005ab4] shadow-xs flex items-center gap-1">
                            <span>★ {hotel.rating}</span>
                          </div>
                          <div className="absolute top-3 left-3 bg-[#151c27]/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white">
                            {hotel.stars}
                          </div>
                        </div>

                        <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#006578] font-bold uppercase tracking-wider block">{hotel.city} • {hotel.neighborhood}</span>
                            <h3 className="font-bold text-sm text-[#151c27] line-clamp-1 group-hover:text-[#005ab4] transition-colors">{hotel.name}</h3>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div>
                              <div className="flex items-baseline gap-1" dir="ltr">
                                <span className="text-base font-bold text-[#005ab4]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {Math.round(hotel.price * currentCurrency.rateToSar)}
                                </span>
                                <span className="text-[10px] text-slate-500">{currentCurrency.code} / ليلة</span>
                              </div>
                              <span className="text-[9px] text-slate-400 block">عبر {hotel.provider}</span>
                            </div>

                            <a
                              href={hotel.partnerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-[#005ab4] text-white text-xs font-bold hover:bg-[#00458d] transition-all shadow-xs text-center"
                            >
                              عرض الفندق
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination: «عرض المزيد» */}
                  {homepageHotelsList.length > homepageHotelsLimit && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setHomepageHotelsLimit((prev) => prev + 4)}
                        className="px-8 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#005ab4] text-sm font-bold border border-[#005ab4]/20 shadow-sm transition-all"
                        type="button"
                      >
                        عرض المزيد ({homepageHotelsList.length - homepageHotelsLimit} متبقي)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab: Dedicated Hotels View */}
        {activeTab === 'hotels' && (
          <div className="max-w-7xl mx-auto px-5 py-8 space-y-8 animate-in fade-in duration-200">
            {/* Header & Description */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#005ab4]">
                <span className="material-symbols-outlined text-[24px]">hotel</span>
                <h1 className="text-2xl md:text-3xl font-bold text-[#151c27]">حجز الفنادق وأماكن الإقامة</h1>
              </div>
              <p className="text-sm text-[#414753]">ابحث في آلاف الفنادق الموثوقة مع أفضل الأسعار وتأكيد الحجز الفوري عبر شركائنا المعتمدين.</p>
            </div>

            {/* Dedicated Hotel Search Form */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200/80 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* 1. Destination Input */}
                <div
                  onClick={() => setHotelDestPickerOpen(true)}
                  className="flex flex-col justify-center px-4 py-3 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer"
                >
                  <span className="text-xs text-[#414753]">المدينة أو الوجهة</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-base font-bold text-[#151c27]">
                    <span className="material-symbols-outlined text-[#005ab4] text-[18px]">location_on</span>
                    <span className="truncate">{hotelTabDest}</span>
                  </div>
                  <span className="text-[11px] text-[#006578]">اختر وجهتك المفضلة</span>
                </div>

                {/* 2. Check-in & Check-out Dates */}
                <div
                  onClick={openCalendarModal}
                  className="flex flex-col justify-center px-4 py-3 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer"
                >
                  <span className="text-xs text-[#414753]">تاريخ الوصول - المغادرة</span>
                  <div className="flex items-center gap-1 mt-0.5 text-sm font-semibold text-[#151c27]">
                    <span className="material-symbols-outlined text-[#005ab4] text-[18px]">calendar_today</span>
                    <span className="truncate">
                      {hotelTabCheckIn.getDate()} {arabicMonths[hotelTabCheckIn.getMonth()]} – {hotelTabCheckOut.getDate()} {arabicMonths[hotelTabCheckOut.getMonth()]}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#006578]">انقر لتعديل التواريخ</span>
                </div>

                {/* 3. Rooms & Guests */}
                <div
                  onClick={() => setHotelGuestsModalOpen(true)}
                  className="flex flex-col justify-center px-4 py-3 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eefe] transition-colors cursor-pointer"
                >
                  <span className="text-xs text-[#414753]">الغرف والضيوف</span>
                  <div className="flex items-center gap-1 mt-0.5 text-sm font-semibold text-[#151c27]">
                    <span className="material-symbols-outlined text-[#005ab4] text-[18px]">group</span>
                    <span className="truncate">{hotelTabRooms} غرفة، {hotelTabAdults + hotelTabChildren} ضيوف</span>
                  </div>
                  <span className="text-[11px] text-[#414753]">تعديل الغرف والنزلاء</span>
                </div>

                {/* 4. Search Button */}
                <div className="flex items-end">
                  <button
                    onClick={handlePerformHotelSearch}
                    disabled={hotelTabSearching}
                    onKeyDown={(e) => e.key === 'Enter' && handlePerformHotelSearch()}
                    className="w-full h-[54px] rounded-xl bg-[#005ab4] text-white text-base font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#00458d] transition-all active:scale-[0.99] disabled:opacity-60"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">search</span>
                    <span>{hotelTabSearching ? 'جاري البحث...' : 'ابحث عن فنادق'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hotel Search Results */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h2 className="text-xl font-bold text-[#151c27]">
                  نتائج البحث في {hotelTabDest} ({currentCurrency.code})
                </h2>
                <span className="px-3 py-1 bg-[#f0f3ff] text-[#005ab4] text-xs font-bold rounded-full">
                  {hotelTabResults.length} فنادق متاحة
                </span>
              </div>

              {hotelTabSearching ? (
                <div className="py-20 text-center space-y-3 bg-white rounded-2xl shadow-sm">
                  <div className="w-10 h-10 border-4 border-[#005ab4] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-[#414753]">جاري البحث عن أفضل الفنادق المتاحة في {hotelTabDest}...</p>
                </div>
              ) : hotelTabError ? (
                <div className="py-16 text-center bg-white rounded-2xl shadow-sm p-6 space-y-3 border border-red-100">
                  <p className="text-sm text-red-600 font-bold">{hotelTabError}</p>
                  <button
                    onClick={handlePerformHotelSearch}
                    className="px-6 py-2.5 bg-[#005ab4] text-white text-xs font-bold rounded-xl"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : hotelTabResults.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl shadow-sm p-6 space-y-3">
                  <span className="material-symbols-outlined text-slate-300 text-[48px]">hotel</span>
                  <h3 className="text-base font-bold text-slate-700">لا توجد فنادق متاحة لهذه الوجهة في التواريخ المحددة</h3>
                  <p className="text-xs text-slate-500">جرب تغيير تواريخ الوصول والمغادرة أو اختيار وجهة أخرى.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {hotelTabResults.map((hotel) => (
                    <div
                      key={hotel.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200/80 flex flex-col md:flex-row gap-4 p-4 items-center"
                    >
                      <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                        <img
                          src={hotel.img}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-bold text-[#005ab4] shadow-xs">
                          ★ {hotel.rating}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-3 w-full">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#006578] font-bold">{hotel.city} • {hotel.neighborhood}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{hotel.stars}</span>
                          </div>
                          <h3 className="font-bold text-base text-[#151c27]">{hotel.name}</h3>
                          <p className="text-xs text-slate-600">غرفة مزدوجة فاخرة • إفطار مجاني مشمول • إلغاء مجاني</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1" dir="ltr">
                              <span className="text-xl font-bold text-[#005ab4]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {Math.round(hotel.price * currentCurrency.rateToSar)}
                              </span>
                              <span className="text-xs text-slate-600">{currentCurrency.code} / لكل ليلة</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{hotel.pricingBasis} (عبر {hotel.provider})</span>
                          </div>

                          <a
                            href={hotel.partnerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-[#005ab4] text-white text-xs font-bold hover:bg-[#00458d] transition-all shadow-sm text-center"
                          >
                            شاهد العرض
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Price Alerts Manager View & User Account Section */}
        {activeTab === 'price-alerts' && (
          <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#f0f3ff] text-[#005ab4] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[26px]">notifications_active</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#151c27]">حساب المستخدم - تنبيهات الأسعار والإشعارات</h1>
                    <p className="text-sm text-[#414753]">إدارة ومراجعة كل التنبيهات المحفوظة وتغيرات الأسعار في حسابك.</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#f0f3ff] text-[#005ab4] text-xs font-bold rounded-full">
                  {priceAlerts.length} تنبيه نشط
                </span>
              </div>

              {priceAlerts.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl">
                  <span className="material-symbols-outlined text-slate-300 text-[40px]">notifications_off</span>
                  <h4 className="font-bold text-base text-slate-700">لا توجد تنبيهات أسعار مفعلة حالياً</h4>
                  <p className="text-xs text-slate-500">قم بتفعيل تنبيهات الأسعار من نتائج بحث الرحلات أو صفحة الفنادق.</p>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="px-6 py-2.5 bg-[#005ab4] text-white text-xs font-bold rounded-xl"
                  >
                    البحث عن رحلات وفنادق
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {priceAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#f0f3ff] text-[#005ab4] flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[22px]">
                            {alert.type === 'flight' ? 'flight' : 'hotel'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-[#151c27]">{alert.title}</h3>
                            <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">نشط</span>
                          </div>
                          <p className="text-xs text-[#006578] font-semibold">{alert.statusText}</p>
                          <span className="text-[10px] text-slate-400">تاريخ الإنشاء: {alert.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full md:w-auto gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-left">
                          <span className="text-xs text-slate-400 block">السعر الحالي المتابَع</span>
                          <span className="text-lg font-bold text-[#005ab4]" dir="ltr" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {Math.round(alert.currentPrice * (currentCurrency.rateToSar))} {currentCurrency.code}
                          </span>
                        </div>
                        <button
                          onClick={() => removePriceAlert(alert.id)}
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                          title="حذف التنبيه"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: AI Assistant View */}
        {activeTab === 'ai-assistant' && (
          <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#005ab4] to-[#006578] text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[26px]">smart_toy</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#151c27]">مساعد الذكاء الاصطناعي وشركاء السفر</h1>
                  <p className="text-sm text-[#414753]">استشر المساعد لاستعراض روابط Kiwitaxi، Localrent، Airalo، Aviasales و Kiwi.com.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col h-[500px]">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#005ab4] text-white rounded-br-sm'
                          : 'bg-[#f0f3ff] text-[#151c27] rounded-bl-sm border border-[#e7eefe]'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      {msg.tips && msg.tips.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-slate-200/60">
                          {msg.tips.map((tip, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendChatMessage(tip)}
                              className="px-2.5 py-1 bg-white text-[#00458d] text-xs rounded-lg font-semibold hover:bg-slate-50 shadow-xs"
                            >
                              💡 {tip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="اكتب سؤالك لمساعد AraboAir الذكي..."
                  className="flex-1 h-12 px-4 rounded-xl border border-[#c1c6d6] text-sm outline-none focus:border-[#005ab4]"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  className="h-12 px-6 bg-[#005ab4] text-white rounded-xl text-xs font-bold hover:bg-[#00458d]"
                >
                  إرسال
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Currency Selector Modal */}
      {currencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#151c27]">اختر العملة المفضلة</h3>
              <button onClick={() => setCurrencyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
              {CURRENCIES_DATA.map((c) => {
                const isSelected = currentCurrency.code === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrentCurrency(c);
                      setCurrencyModalOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#005ab4] text-white border-[#005ab4] shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-[#151c27]'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-sm">{c.code}</span>
                      <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{c.nameAr}</span>
                    </div>
                    <span className={`font-mono text-sm font-bold px-2 py-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {c.symbol}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Search Summary / Confirmation Modal */}
      {aiSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#151c27]">ملخص رحلتك المحللة بالذكاء الاصطناعي</h3>
              <button onClick={() => setAiSummaryModal(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 bg-[#f0f3ff] rounded-xl text-sm text-[#151c27] space-y-2">
              <div className="font-bold text-[#005ab4]">تأكيد تفاصيل البحث:</div>
              <div>{aiSummaryModal.summaryText}</div>
              {aiSummaryModal.clarificationNeeded && (
                <div className="p-3 bg-amber-50 text-amber-900 rounded-lg text-xs border border-amber-200 mt-2">
                  <strong>تنبيه توضيحي:</strong> {aiSummaryModal.clarificationNeeded}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setAiSummaryModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                تعديل الطلب
              </button>
              <button
                onClick={confirmAiSearch}
                className="px-6 py-2.5 rounded-xl bg-[#005ab4] text-white text-xs font-bold hover:bg-[#00458d] transition-colors shadow-sm"
              >
                تأكيد وبدء البحث الفوري
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Travelers & Cabin Modal */}
      {travelersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#151c27]">المسافرون ودرجة السفر</h3>
              <button onClick={() => setTravelersModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5">
              {/* Adults Counter */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#151c27]">البالغون</h4>
                  <span className="text-xs text-slate-500">12 سنة فأكثر</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTempAdults(Math.max(1, tempAdults - 1))}
                    disabled={tempAdults <= 1}
                    className="w-9 h-9 rounded-xl bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center hover:bg-[#e2e8f8] disabled:opacity-40 disabled:cursor-not-allowed"
                    type="button"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-base" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {tempAdults}
                  </span>
                  <button
                    onClick={() => setTempAdults(tempAdults + 1)}
                    className="w-9 h-9 rounded-xl bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center hover:bg-[#e2e8f8]"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children Counter */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#151c27]">الأطفال</h4>
                  <span className="text-xs text-slate-500">من 2 إلى 11 سنة</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTempChildren(Math.max(0, tempChildren - 1))}
                    disabled={tempChildren <= 0}
                    className="w-9 h-9 rounded-xl bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center hover:bg-[#e2e8f8] disabled:opacity-40 disabled:cursor-not-allowed"
                    type="button"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-base" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {tempChildren}
                  </span>
                  <button
                    onClick={() => setTempChildren(tempChildren + 1)}
                    className="w-9 h-9 rounded-xl bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center hover:bg-[#e2e8f8]"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Infants Counter */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#151c27]">الرضع</h4>
                  <span className="text-xs text-slate-500">أقل من سنتين</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTempInfants(Math.max(0, tempInfants - 1))}
                    disabled={tempInfants <= 0}
                    className="w-9 h-9 rounded-xl bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center hover:bg-[#e2e8f8] disabled:opacity-40 disabled:cursor-not-allowed"
                    type="button"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-base" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {tempInfants}
                  </span>
                  <button
                    onClick={() => {
                      if (tempInfants >= tempAdults) {
                        alert('لا يمكن أن يتجاوز عدد الرضع عدد البالغين.');
                        return;
                      }
                      setTempInfants(tempInfants + 1);
                    }}
                    className="w-9 h-9 rounded-xl bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center hover:bg-[#e2e8f8]"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="font-bold text-sm text-[#151c27]">درجة السفر</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'economy', label: 'الدرجة الاقتصادية' },
                  { id: 'premium_economy', label: 'الاقتصادية المميزة' },
                  { id: 'business', label: 'درجة رجال الأعمال' },
                  { id: 'first', label: 'الدرجة الأولى' },
                ].map((cabin) => {
                  const isSelected = tempCabinClass === cabin.id;
                  return (
                    <button
                      key={cabin.id}
                      onClick={() => setTempCabinClass(cabin.id as any)}
                      className={`p-3 rounded-xl border text-right text-xs font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#005ab4] text-white border-[#005ab4] shadow-xs'
                          : 'bg-[#f9f9ff] text-[#151c27] border-slate-200 hover:bg-slate-100'
                      }`}
                      type="button"
                    >
                      <span>{cabin.label}</span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-slate-300'}`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#005ab4]"></span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setTravelersModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                type="button"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setAdults(tempAdults);
                  setChildrenCount(tempChildren);
                  setInfants(tempInfants);
                  setCabinClass(tempCabinClass);
                  setTravelersModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#005ab4] text-white text-xs font-bold hover:bg-[#00458d] transition-colors shadow-sm"
                type="button"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrated Searchable Airport Picker Modal */}
      {airportPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#151c27]">
                {activeMultiCityIndex !== null
                  ? `اختر مطار المحطة ${activeMultiCityIndex.index + 1} (${activeMultiCityIndex.field === 'origin' ? 'المغادرة' : 'الوصول'})`
                  : airportPickerType === 'origin'
                  ? 'اختر مطار المغادرة (من أين؟)'
                  : 'اختر مطار الوصول (إلى أين؟)'}
              </h3>
              <button
                onClick={() => setAirportPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 text-[20px]">search</span>
              <input
                ref={searchInputRef}
                type="text"
                value={airportSearchQuery}
                onChange={(e) => setAirportSearchQuery(e.target.value)}
                placeholder="ابحث بالمدينة، اسم المطار، أو رمز IATA..."
                className="w-full h-12 pr-10 pl-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#005ab4] bg-slate-50/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
              {airportLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-3 border-[#005ab4] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-500">جارِ البحث...</p>
                </div>
              ) : filteredAirports.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <span className="material-symbols-outlined text-slate-300 text-[36px]">search_off</span>
                  <p className="text-sm text-slate-500">لا توجد مطارات مطابقة لبحثك</p>
                </div>
              ) : (
                filteredAirports.map((airport) => (
                  <div
                    key={airport.code}
                    onClick={() => selectAirport(airport)}
                    className="p-3.5 rounded-xl flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-100 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#f0f3ff] text-[#005ab4] flex items-center justify-center font-bold text-sm">
                        <span dir="ltr">{airport.code}</span>
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#151c27]">
                          {airport.cityAr} — {airport.nameAr} — <span dir="ltr" className="text-[#005ab4] font-mono">{airport.code}</span> — {airport.countryAr}
                        </div>
                        <div className="text-xs text-slate-500" dir="ltr">
                          {airport.cityEn}, {airport.countryEn}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700" dir="ltr">
                      {airport.code}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Date-Range Picker Modal */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#151c27]">اختر تواريخ الرحلة</h3>
              <button onClick={() => setCalendarModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-[#f0f3ff] rounded-xl text-xs">
              <div>
                <span className="text-[#414753] block font-medium">المغادرة</span>
                <strong className="text-[#005ab4] text-sm">{formatDateDisplay(tempDeparture) || 'اختر تاريخ'}</strong>
              </div>
              {tripType === 'round' && (
                <div>
                  <span className="text-[#414753] block font-medium">العودة</span>
                  <strong className="text-[#005ab4] text-sm">{formatDateDisplay(tempReturn) || 'اختر تاريخ'}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-2 py-1">
              <button
                onClick={prevMonth}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#151c27] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
              <h4 className="text-base font-bold text-[#151c27]">
                {arabicMonths[viewMonth]} {viewYear}
              </h4>
              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#151c27] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-bold text-[#414753] py-1 border-b border-slate-100">
              {arabicWeekdays.map((wd, i) => (
                <div key={i}>{wd}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm py-2">
              {getDaysInMonth(viewYear, viewMonth).map((d, index) => {
                if (!d) return <div key={`empty-${index}`} />;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = d < today;

                const isDep = tempDeparture && d.toDateString() === tempDeparture.toDateString();
                const isRet = tempReturn && d.toDateString() === tempReturn.toDateString();
                const isInBetween =
                  tempDeparture &&
                  tempReturn &&
                  d > tempDeparture &&
                  d < tempReturn;

                let btnClass = 'w-10 h-10 mx-auto rounded-full flex items-center justify-center text-xs font-semibold transition-all ';
                if (isPast) {
                  btnClass += 'text-slate-300 cursor-not-allowed';
                } else if (isDep || isRet) {
                  btnClass += 'bg-[#005ab4] text-white shadow-md scale-105';
                } else if (isInBetween) {
                  btnClass += 'bg-[#f0f3ff] text-[#00458d] rounded-none';
                } else {
                  btnClass += 'text-[#151c27] hover:bg-slate-100';
                }

                return (
                  <button
                    key={d.toISOString()}
                    disabled={isPast}
                    onClick={() => handleDateClick(d)}
                    className={btnClass}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setCalendarModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                disabled={!tempDeparture || (tripType === 'round' && !tempReturn)}
                onClick={() => {
                  setDepartureDate(tempDeparture);
                  setReturnDate(tempReturn);
                  setCalendarModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#005ab4] text-white text-xs font-bold hover:bg-[#00458d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Destination Picker Modal */}
      {hotelDestPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#151c27]">اختر وجهة الفندق</h3>
              <button onClick={() => setHotelDestPickerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {[
                { key: 'makkah', nameAr: 'مكة المكرمة' },
                { key: 'madinah', nameAr: 'المدينة المنورة' },
                { key: 'jeddah', nameAr: 'جدة' },
                { key: 'riyadh', nameAr: 'الرياض' },
                { key: 'dubai', nameAr: 'دبي' },
                { key: 'istanbul', nameAr: 'إسطنبول' },
                { key: 'marrakesh', nameAr: 'مراكش' },
              ].map((city) => (
                <div
                  key={city.key}
                  onClick={() => {
                    setHotelTabDest(city.nameAr);
                    setHotelTabDestKey(city.key);
                    setHotelDestPickerOpen(false);
                  }}
                  className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 cursor-pointer flex items-center justify-between font-bold text-sm text-[#151c27]"
                >
                  <span>{city.nameAr}</span>
                  <span className="material-symbols-outlined text-[#005ab4] text-[18px]">chevron_left</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hotel Guests Modal */}
      {hotelGuestsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#151c27]">الغرف والضيوف</h3>
              <button onClick={() => setHotelGuestsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#151c27]">الغرف</h4>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setHotelTabRooms(Math.max(1, hotelTabRooms - 1))} disabled={hotelTabRooms <= 1} className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center">-</button>
                  <span className="font-bold text-base">{hotelTabRooms}</span>
                  <button onClick={() => setHotelTabRooms(hotelTabRooms + 1)} className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#151c27]">البالغون</h4>
                  <span className="text-xs text-slate-500">12 سنة فأكثر</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setHotelTabAdults(Math.max(1, hotelTabAdults - 1))} disabled={hotelTabAdults <= 1} className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center">-</button>
                  <span className="font-bold text-base">{hotelTabAdults}</span>
                  <button onClick={() => setHotelTabAdults(hotelTabAdults + 1)} className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#151c27]">الأطفال</h4>
                  <span className="text-xs text-slate-500">من 2 إلى 11 سنة</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setHotelTabChildren(Math.max(0, hotelTabChildren - 1))} disabled={hotelTabChildren <= 0} className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center">-</button>
                  <span className="font-bold text-base">{hotelTabChildren}</span>
                  <button onClick={() => setHotelTabChildren(hotelTabChildren + 1)} className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#005ab4] font-bold flex items-center justify-center">+</button>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHotelGuestsModalOpen(false)}
                className="px-6 py-2.5 bg-[#005ab4] text-white rounded-xl text-xs font-bold hover:bg-[#00458d]"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-[#f0f3ff] shadow-[0_-1px_8px_rgba(0,0,0,0.02)] mt-auto">
        <div className="w-full px-5 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <img
                  alt="AraboAir Logo"
                  className="h-7 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3YMZGayw-PfsiOkZy_yLC1ESM9StBNSIkJqYN7XI8F_Wa3GxFgP1NQl424dnOfKHphFVRVsBpNUlp5n6rMjojrtByP4YQfOXm_3cEP4XYat_KUP4eoKsxhqR1WfnxrVT5462-RVdPn4nVy-1El23GfrhIMULAVney7eaChwsNrfVEsCEIzZx__SXAx_wtVIqEx54jbzJJ9pZGKoSRKMD3LGSlmEiuof1KdKGoC1ep0Eo5Lz9Nnj2d"
                />
                <span className="font-bold text-lg text-[#005ab4]">AraboAir & Partners</span>
              </div>
              <p className="text-sm text-[#414753] max-w-md">
                منصة ذكاء السفر الفاخر لمنطقة الخليج العربي بالتعاون مع شركائنا المعتمدين (Aviasales و Kiwi.com).
              </p>
            </div>
          </div>
          <div className="pt-6 border-t border-[#e2e8f8] flex flex-col md:flex-row items-center justify-between gap-4 text-[#414753] text-xs">
            <p>© 2025 AraboAir Travel Intelligence. نظام بحث Wego الفوري.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
