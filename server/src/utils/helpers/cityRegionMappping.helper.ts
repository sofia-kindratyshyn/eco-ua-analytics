export function getCityRegionId(cityName: string): number {
    const city = cityName.toLowerCase().trim();
  
    // CORRECT mapping based on actual database:
    const cityToRegion: { [key: string]: number } = {
      // Region 1 - Kyiv (Київ) - CITY
      'kyiv': 1,
      'kiev': 1,
      
      // Region 3 - Lviv Oblast (Львівська область)
      'lviv': 3,
      'lvov': 3,
      
      // Region 6 - Odesa Oblast (Одеська область)
      'odesa': 6,
      'odessa': 6,
      
      // Region 4 - Dnipropetrovsk Oblast (Дніпропетровська область) 
      'dnipro': 4,
      'dnipropetrovsk': 4,
      'dnieper': 4,
      'kryvyi rih': 4,
      'kryvyi-rih': 4,
      'krivoy rog': 4,
      
      // Region 8 - Zaporizhzhia Oblast (Запорізька область)
      'zaporizhzhia': 8,
      'zaporizhzhya': 8,
      'zaporozhye': 8,
      
      // Region 5 - Kharkiv Oblast (Харківська область)
      'kharkiv': 5,
      'kharkov': 5,
      
      // Region 7 - Donetsk Oblast (Донецька область)
      'donetsk': 7,
      
      // Region 9 - Poltava Oblast (Полтавська область)
      'poltava': 9,
      
      // Region 10 - Cherkasy Oblast (Черкаська область)
      'cherkasy': 10,
      'cherkassy': 10,
      
      // Region 11 - Chernihiv Oblast (Чернігівська область)
      'chernihiv': 11,
      'chernigov': 11,
      
      // Region 12 - Sumy Oblast (Сумська область)
      'sumy': 12,
      
      // Region 13 - Zhytomyr Oblast (Житомирська область)
      'zhytomyr': 13,
      'zhitomir': 13,
      
      // Region 14 - Vinnytsia Oblast (Вінницька область)
      'vinnytsia': 14,
      'vinnitsa': 14,
      
      // Region 15 - Rivne Oblast (Рівненська область)
      'rivne': 15,
      'rovno': 15,
      
      // Region 16 - Khmelnytskyi Oblast (Хмельницька область)
      'khmelnytskyi': 16,
      'khmelnitsky': 16,
      
      // Region 17 - Chernivtsi Oblast (Чернівецька область)
      'chernivtsi': 17,
      'chernivci': 17,
      'chernovtsy': 17,
      
      // Region 18 - Ternopil Oblast (Тернопільська область)
      'ternopil': 18,
      'ternopol': 18,
      
      // Region 19 - Ivano-Frankivsk Oblast (Івано-Франківська область)
      'ivano-frankivsk': 19,
      'ivano frankivsk': 19,
      
      // Region 20 - Volyn Oblast (Волинська область)
      'lutsk': 20,
      'luck': 20,
      
      // Region 21 - Zakarpattia Oblast (Закарпатська область)
      'uzhhorod': 21,
      'uzhgorod': 21,
      
      // Region 22 - Mykolaiv Oblast (Миколаївська область)
      'mykolaiv': 22,
      'nikolaev': 22,
      
      // Region 23 - Kherson Oblast (Херсонська область)
      'kherson': 23,
      
      // Region 25 - Luhansk Oblast (Луганська область)
      'luhansk': 25,
      'lugansk': 25,
    };
    
    // Try exact match first
    if (cityToRegion[city]) {
      return cityToRegion[city];
    }
    
    // Try partial match
    for (const [cityKey, regionId] of Object.entries(cityToRegion)) {
      if (city.includes(cityKey) || cityKey.includes(city)) {
        return regionId;
      }
    }
    
    // Default to Kyiv Oblast if no match
    console.warn(`No region mapping found for city: ${cityName}, defaulting to Kyiv Oblast`);
    return 2; // Kyiv Oblast (not city Kyiv)
  }
  
  /**
   * Extract city name from station name by searching for known cities
   */
  export function extractCityName(input: string): string {
    const text = input.toLowerCase();
    
    // List of Ukrainian cities to search for (in priority order)
    const cities = [
      'zaporizhzhya', 'zaporizhzhia', 'ivano-frankivsk', 'kryvyi rih',
      'chernivtsi', 'chernivci', 'khmelnytskyi', 'dnipro', 'kharkiv',
      'kyiv', 'lviv', 'odesa', 'odessa', 'ternopil', 'rivne', 'cherkasy',
      'chernihiv', 'sumy', 'zhytomyr', 'vinnytsia', 'poltava', 'lutsk',
      'uzhhorod', 'mykolaiv', 'donetsk', 'luhansk', 'kherson'
    ];
    
    // Find first city that appears in the text
    for (const city of cities) {
      if (text.includes(city)) {
        return city;
      }
    }
    
    // Fallback: extract from comma-separated format
    // "Street Name, City, Ukraine" -> take second part
    const cleaned = text
      .replace(/\([^)]*\)/g, '') // Remove parentheses
      .replace(/, ukraine.*$/i, '') // Remove ", ukraine"
      .trim();
    
    const parts = cleaned.split(',').map(p => p.trim());
    
    // Return second part if exists (usually the city)
    if (parts.length >= 2) {
      return parts[1];
    }
    
    return parts[0] || text;
  }