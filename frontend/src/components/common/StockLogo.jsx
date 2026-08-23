import React, { useState } from 'react';

const DOMAIN_MAP = {
    // Top Indian Stocks (NIFTY 100 & Major Movers)
    'RELIANCE.NS': 'ril.com',
    'TCS.NS': 'tcs.com',
    'HDFCBANK.NS': 'hdfcbank.com',
    'ICICIBANK.NS': 'icicibank.com',
    'BHARTIARTL.NS': 'airtel.in',
    'SBIN.NS': 'sbi.co.in',
    'INFY.NS': 'infosys.com',
    'LICI.NS': 'licindia.in',
    'ITC.NS': 'itcportal.com',
    'HINDUNILVR.NS': 'hul.co.in',
    'LT.NS': 'larsentoubro.com',
    'BAJFINANCE.NS': 'bajajfinserv.in',
    'HCLTECH.NS': 'hcltech.com',
    'MARUTI.NS': 'marutisuzuki.com',
    'SUNPHARMA.NS': 'sunpharma.com',
    'ADANIENT.NS': 'adanienterprises.com',
    'KOTAKBANK.NS': 'kotak.com',
    'TITAN.NS': 'titancompany.in',
    'ONGC.NS': 'ongcindia.com',
    'TATAMOTORS.NS': 'tatamotors.com',
    'NTPC.NS': 'ntpc.co.in',
    'AXISBANK.NS': 'axisbank.com',
    'DMART.NS': 'dmartindia.com',
    'ADANIGREEN.NS': 'adanigreenenergy.com',
    'ADANIPORTS.NS': 'adaniports.com',
    'ASIANPAINT.NS': 'asianpaints.com',
    'BAJAJFINSV.NS': 'bajajfinserv.in',
    'WIPRO.NS': 'wipro.com',
    'ULTRACEMCO.NS': 'ultratechcement.com',
    'POWERGRID.NS': 'powergrid.in',
    'M&M.NS': 'mahindra.com',
    'TATASTEEL.NS': 'tatasteel.com',
    'COALINDIA.NS': 'coalindia.in',
    'IOC.NS': 'iocl.com',
    'BAJAJ-AUTO.NS': 'bajajauto.com',
    'PIDILITIND.NS': 'pidilite.com',
    'GRASIM.NS': 'grasim.com',
    'TECHM.NS': 'techmahindra.com',
    'INDUSINDBK.NS': 'indusind.com',
    'CIPLA.NS': 'cipla.com',
    'HINDALCO.NS': 'hindalco.com',
    'EICHERMOT.NS': 'eichermotors.com',
    'DRREDDY.NS': 'drreddys.com',
    'BRITANNIA.NS': 'britannia.co.in',
    'APOLLOHOSP.NS': 'apollohospitals.com',
    'TATACONSUM.NS': 'tataconsumer.com',
    'DIVISLAB.NS': 'divislabs.com',
    'SHREECEM.NS': 'shreecement.com',
    'HEROMOTOCO.NS': 'heromotocorp.com',
    'BPCL.NS': 'bharatpetroleum.in',
    'JSWSTEEL.NS': 'jsw.in',
    'SBILIFE.NS': 'sbilife.co.in',
    'HDFCLIFE.NS': 'hdfclife.com',
    'ZOMATO.NS': 'zomato.com',
    'TRENT.NS': 'trentlimited.com',
    'HAL.NS': 'hal-india.co.in',
    'BEL.NS': 'bel-india.in',
    'INDIGO.NS': 'goindigo.in',
    'CHOLAFIN.NS': 'cholamandalam.com',
    'TVSMOTOR.NS': 'tvsmotor.com',
    'SIEMENS.NS': 'siemens.com',
    'DLF.NS': 'dlf.in',
    'VBL.NS': 'varunbeverages.com',
    'LTIM.NS': 'ltimindtree.com',
    'BANKBARODA.NS': 'bankofbaroda.in',
    'PNB.NS': 'pnbindia.in',
    'HAVELLS.NS': 'havells.com',
    'JINDALSTEL.NS': 'jindalsteelpower.com',
    'SHRIRAMFIN.NS': 'shriramfinance.in',
    'ICICIGI.NS': 'icicilombard.com',
    'GAIL.NS': 'gailonline.com',
    'SRF.NS': 'srf.com',
    'BOSCHLTD.NS': 'bosch.in',
    'CUMMINSIND.NS': 'cummins.com',
    'AMBUJACEM.NS': 'ambujacement.com',
    'TORNTPHARM.NS': 'torrentpharma.com',
    'MUTHOOTFIN.NS': 'muthootfinance.com',
    'PIIND.NS': 'piindustries.com',
    'COLPAL.NS': 'colgatepalmolive.co.in',
    'MAXHEALTH.NS': 'maxhealthcare.in',
    'AUBANK.NS': 'aubank.in',
    'IDFCFIRSTB.NS': 'idfcfirstbank.com',
    'YESBANK.NS': 'yesbank.in',
    'LUPIN.NS': 'lupin.com',
    'IDEA.NS': 'myvi.in',
    'NAUKRI.NS': 'infoedge.in',
    'MOTHERSON.NS': 'motherson.com',
    'ZYDUSLIFE.NS': 'zyduslife.com',
    'TIINDIA.NS': 'tiindia.com',
    'PERSISTENT.NS': 'persistent.com',
    'NYKAA.NS': 'nykaa.com',
    'OBEROIRLTY.NS': 'oberoirealty.com',
    'HINDZINC.NS': 'hzlindia.com',
    'UPL.NS': 'upl-ltd.com',
    'PAGEIND.NS': 'jockeyindia.com',
    'BANDHANBNK.NS': 'bandhanbank.com',
    'CONCOR.NS': 'concorindia.com',
    'POLYCAB.NS': 'polycab.com',
    'ASHOKLEY.NS': 'ashokleyland.com',
    'MARICO.NS': 'marico.com',
    'RECLTD.NS': 'recindia.nic.in',
    'PFC.NS': 'pfcindia.com',
    'IRCTC.NS': 'irctc.co.in',
    'IRFC.NS': 'irfc.co.in',
    'M&MFIN.NS': 'mahindrafinance.com',
    
    // Top US Stocks
    'AAPL': 'apple.com',
    'MSFT': 'microsoft.com',
    'GOOGL': 'google.com',
    'GOOG': 'google.com',
    'AMZN': 'amazon.com',
    'META': 'meta.com',
    'TSLA': 'tesla.com',
    'NVDA': 'nvidia.com',
    'NFLX': 'netflix.com',
    'JPM': 'jpmorganchase.com',
    'V': 'visa.com',
    'JNJ': 'jnj.com',
    'WMT': 'walmart.com',
    'PG': 'pg.com',
    'MA': 'mastercard.com',
    'UNH': 'uhc.com',
    'DIS': 'thewaltdisneycompany.com',
    'HD': 'homedepot.com',
    'BAC': 'bankofamerica.com',
    'INTC': 'intel.com',
    'AMD': 'amd.com',
    'CRM': 'salesforce.com',
    'KO': 'coca-colacompany.com',
    'NKE': 'nike.com',
    'MCD': 'mcdonalds.com',
    'CSCO': 'cisco.com',
    'PFE': 'pfizer.com',
    'BA': 'boeing.com',
};

const COLORS = [
    'from-emerald-400 to-emerald-600',
    'from-blue-400 to-blue-600',
    'from-indigo-400 to-indigo-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-rose-400 to-rose-600',
    'from-orange-400 to-orange-600',
    'from-amber-400 to-amber-600',
];

const guessDomain = (name) => {
    if (!name) return null;
    let cleanName = name.toLowerCase()
        .replace(/inc\.?|corp\.?|corporation|ltd\.?|plc|company|holdings|group/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    if (cleanName.length > 0) {
        return `${cleanName}.com`;
    }
    return null;
};

const StockLogo = ({ ticker, name, size = 32, className = '' }) => {
    const [hasError, setHasError] = useState(false);
    
    // Normalize ticker
    const normalizedTicker = ticker?.toUpperCase()?.trim() || '';
    
    // Try exact match, then try appending .NS (if missing), then try stripping suffixes, then guess domain
    const baseTicker = normalizedTicker.replace(/\.(NS|BO)$/, '');
    const domain = DOMAIN_MAP[normalizedTicker] 
                || DOMAIN_MAP[`${normalizedTicker}.NS`] 
                || DOMAIN_MAP[baseTicker]
                || guessDomain(name);

    // Generate fallback style
    const getFallbackColors = () => {
        let hash = 0;
        for (let i = 0; i < normalizedTicker.length; i++) {
            hash = normalizedTicker.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % COLORS.length;
        return COLORS[index];
    };

    const initial = name ? name.charAt(0).toUpperCase() : normalizedTicker.charAt(0).toUpperCase();

    // We use Google Favicon service as a reliable fallback, or clearbit logo
    if (!domain || hasError) {
        return (
            <div 
                className={`flex items-center justify-center rounded-full bg-gradient-to-br shadow-sm text-white font-bold shrink-0 ${getFallbackColors()} ${className}`}
                style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
            >
                {initial}
            </div>
        );
    }

    return (
        <div 
            className={`rounded-full overflow-hidden bg-white border border-gray-100 flex items-center justify-center shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            <img 
                src={`https://icon.horse/icon/${domain}`}
                alt={`${ticker} logo`}
                className="w-[75%] h-[75%] object-contain"
                onError={() => {
                    if (domain !== 'google.com') { // Prevent infinite loops if fallback fails
                        setHasError(true);
                    }
                }}
            />
        </div>
    );
};

export default StockLogo;
