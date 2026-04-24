/**
 * Email template engine — generates localized HTML email templates for all platform notifications.
 *
 * Uses Terra design system colors: sage-700 header, linen body, terracotta accents.
 * Templates are localized using the user's `preferredLang`.
 */

// ─── NOTIFICATION EVENT TYPES ──────────────────

export type NotificationEvent =
  | "WELCOME"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "BID_PLACED"
  | "OUTBID"
  | "AUCTION_WON"
  | "AUCTION_ENDED_NO_BIDS"
  | "AUCTION_ENDED_BELOW_RESERVE"
  | "AUCTION_SOLD"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "RFQ_CREATED"
  | "RFQ_RESPONSE_RECEIVED"
  | "RFQ_COUNTER_OFFER"
  | "RFQ_ACCEPTED"
  | "RFQ_REJECTED"
  | "RFQ_EXPIRED"
  | "TOKEN_MINTED"
  | "TOKEN_TRANSFERRED"
  | "TOKEN_RECEIVED"
  | "TOKEN_REDEEMED"
  | "TOKEN_EXPIRING_SOON"
  | "TOKEN_EXPIRED"
  | "MATERIAL_READY"
  | "LOT_STATUS_CHANGE"
  | "NEW_SUBMISSION_ADMIN";

// ─── TEMPLATE OUTPUT ───────────────────────────

interface EmailTemplate {
  subject: string;
  html: string;
}

// ─── LOCALIZED STRINGS ─────────────────────────

type LocaleStrings = Record<
  NotificationEvent,
  { subject: string; heading: string; body: string; cta?: string }
>;

const LOCALE_STRINGS: Record<string, LocaleStrings> = {
  en: {
    WELCOME: {
      subject: "Welcome to Krishibridge!",
      heading: "Email Verified Successfully!",
      body: "Hi {userName}, your email has been verified and your account is now active. Complete your profile setup and KYC verification to start trading.",
      cta: "Complete Profile Setup",
    },
    KYC_APPROVED: {
      subject: "KYC Approved — You're ready to trade!",
      heading: "KYC Verified ✓",
      body: "Congratulations {userName}! Your identity has been verified. You can now buy, sell, and trade on the platform.",
      cta: "Go to Dashboard",
    },
    KYC_REJECTED: {
      subject: "KYC Verification Update",
      heading: "KYC Review Required",
      body: "Hi {userName}, we couldn't verify your documents. Reason: {reason}. Please re-submit with correct documents.",
      cta: "Re-submit KYC",
    },
    BID_PLACED: {
      subject: "New bid on your lot — {lotNumber}",
      heading: "New Bid Received!",
      body: "A buyer placed a bid of {formattedAmount} on lot {lotNumber}. Current highest: {formattedHighestBid}.",
      cta: "View Lot",
    },
    OUTBID: {
      subject: "You've been outbid on {lotNumber}",
      heading: "You've been outbid",
      body: "Someone placed a higher bid on lot {lotNumber}. The current highest bid is {formattedHighestBid}. Place a new bid to stay in the auction!",
      cta: "Place New Bid",
    },
    AUCTION_WON: {
      subject: "Congratulations! You won lot {lotNumber}!",
      heading: "Auction Won! 🎉",
      body: "Congratulations {userName}! You won lot {lotNumber} with a bid of {formattedAmount}.<br/><br/><strong>Payment Instructions:</strong><br/>Transfer {formattedAmount} to the platform account. Your unique payment code is <strong>{buyerPaymentCode}</strong>. Please write this code in the payment remarks/description so we can identify your payment.<br/><br/>Once payment is confirmed by our team, a commodity ownership token will be issued to you.",
      cta: "Make Payment",
    },
    AUCTION_ENDED_NO_BIDS: {
      subject: "Auction ended — no bids on {lotNumber}",
      heading: "Auction Ended",
      body: "Your auction for lot {lotNumber} ended without any bids. The lot has been returned to Listed status.",
      cta: "View Lot",
    },
    AUCTION_ENDED_BELOW_RESERVE: {
      subject: "Auction ended — reserve not met on {lotNumber}",
      heading: "Reserve Not Met",
      body: "The highest bid of {formattedHighestBid} on lot {lotNumber} did not meet your reserve price of {formattedReservePrice}. The lot has been returned to Listed status.",
      cta: "View Lot",
    },
    AUCTION_SOLD: {
      subject: "Your lot {lotNumber} has been sold!",
      heading: "Lot Sold! 💰",
      body: "Lot {lotNumber} was sold for {formattedAmount}. The buyer will proceed with payment.",
      cta: "View Dashboard",
    },
    PAYMENT_CONFIRMED: {
      subject: "Payment confirmed — {lotNumber}",
      heading: "Payment Confirmed ✓",
      body: "Payment for lot {lotNumber} has been confirmed. A commodity token has been issued.",
      cta: "View Token",
    },
    PAYMENT_FAILED: {
      subject: "Payment failed — {lotNumber}",
      heading: "Payment Failed",
      body: "Your payment for lot {lotNumber} could not be processed. Please try again or use a different payment method.",
      cta: "Retry Payment",
    },
    RFQ_CREATED: {
      subject: "New RFQ posted — {commodityType}",
      heading: "New RFQ Available",
      body: "A buyer is looking for {commodityType} ({quantity} kg) delivered to {deliveryCity}. Target price: {formattedTargetPrice}.",
      cta: "View & Respond",
    },
    RFQ_RESPONSE_RECEIVED: {
      subject: "New response to your RFQ",
      heading: "New Offer Received",
      body: "A seller offered {formattedOfferedPrice} for your {commodityType} request. Review and compare all offers.",
      cta: "Review Responses",
    },
    RFQ_COUNTER_OFFER: {
      subject: "Counter-offer on your RFQ negotiation",
      heading: "New Counter-Offer",
      body: "A new price of {formattedProposedPrice} has been proposed in your {commodityType} negotiation.",
      cta: "View Negotiation",
    },
    RFQ_ACCEPTED: {
      subject: "Your RFQ offer was accepted!",
      heading: "Offer Accepted! 🤝",
      body: "The buyer accepted your offer for {commodityType}. Proceed to arrange delivery.",
      cta: "View Details",
    },
    RFQ_REJECTED: {
      subject: "RFQ response update",
      heading: "Offer Not Selected",
      body: "The buyer selected a different offer for their {commodityType} request. You can browse other open RFQs.",
      cta: "Browse RFQs",
    },
    RFQ_EXPIRED: {
      subject: "Your RFQ has expired",
      heading: "RFQ Expired",
      body: "Your request for {commodityType} has expired without being fulfilled. You can create a new RFQ.",
      cta: "Create New RFQ",
    },
    TOKEN_MINTED: {
      subject: "Commodity token issued — {lotNumber}",
      heading: "Token Issued! 🪙",
      body: "A digital commodity token for lot {lotNumber} ({commodityType}) has been issued to your account. Use it to claim your goods at the warehouse.",
      cta: "View Token",
    },
    TOKEN_TRANSFERRED: {
      subject: "Token transferred — {lotNumber}",
      heading: "Token Transferred",
      body: "Your token for lot {lotNumber} has been transferred to {recipientName}. {priceNote}",
      cta: "View Transfer History",
    },
    TOKEN_RECEIVED: {
      subject: "You received a commodity token!",
      heading: "Token Received! 🪙",
      body: "A commodity token for lot {lotNumber} ({commodityType}) has been transferred to you by {senderName}.",
      cta: "View Token",
    },
    TOKEN_REDEEMED: {
      subject: "Token redeemed — {lotNumber}",
      heading: "Token Redeemed ✓",
      body: "Your token for lot {lotNumber} has been successfully redeemed at the warehouse. The goods are ready for collection.",
      cta: "View Details",
    },
    TOKEN_EXPIRING_SOON: {
      subject: "Token expiring soon — {lotNumber}",
      heading: "Token Expiring Soon ⚠",
      body: "Your token for lot {lotNumber} will expire on {expiryDate}. Redeem it at the warehouse or transfer it before it expires.",
      cta: "View Token",
    },
    TOKEN_EXPIRED: {
      subject: "Token expired — {lotNumber}",
      heading: "Token Expired",
      body: "Your token for lot {lotNumber} has expired. Please contact support if you need assistance.",
    },
    MATERIAL_READY: {
      subject: "Material ready for pickup — {lotNumber}",
      heading: "Material Ready! 📦",
      body: "The goods for lot {lotNumber} ({commodityType}) at {warehouseName} are ready for pickup. Present your token QR code at the warehouse.",
      cta: "View QR Code",
    },
    LOT_STATUS_CHANGE: {
      subject: "Lot Update — {lotNumber}",
      heading: "{title}",
      body: "{body}",
    },
    NEW_SUBMISSION_ADMIN: {
      subject: "New Commodity Submission — {commodityLabel} ({quantityKg}kg)",
      heading: "New Commodity Submission for Review",
      body: "A farmer ({farmerName}) has submitted a new commodity for your review.<br/><br/><strong>Commodity:</strong> {commodityLabel}<br/><strong>Quantity:</strong> {quantityKg} kg<br/><strong>Grade:</strong> {grade}<br/><strong>Origin:</strong> {originLocation}<br/><br/>Please review and approve or reject this submission from the admin console.",
      cta: "Review Submission",
    },
  },
  hi: {
    WELCOME: {
      subject: "Krishibridge में आपका स्वागत है!",
      heading: "स्वागत है!",
      body: "नमस्ते {userName}, आपका खाता सफलतापूर्वक बनाया गया है। ट्रेडिंग शुरू करने के लिए अपना KYC सत्यापन पूरा करें।",
      cta: "KYC पूरा करें",
    },
    KYC_APPROVED: {
      subject: "KYC स्वीकृत — आप ट्रेड कर सकते हैं!",
      heading: "KYC सत्यापित ✓",
      body: "बधाई हो {userName}! आपकी पहचान सत्यापित हो गई है। अब आप प्लेटफॉर्म पर खरीद, बिक्री और ट्रेड कर सकते हैं।",
      cta: "डैशबोर्ड पर जाएं",
    },
    KYC_REJECTED: {
      subject: "KYC सत्यापन अपडेट",
      heading: "KYC समीक्षा आवश्यक",
      body: "नमस्ते {userName}, हम आपके दस्तावेज़ सत्यापित नहीं कर सके। कारण: {reason}। कृपया सही दस्तावेज़ पुनः जमा करें।",
      cta: "KYC पुनः जमा करें",
    },
    BID_PLACED: {
      subject: "आपके लॉट पर नई बोली — {lotNumber}",
      heading: "नई बोली प्राप्त!",
      body: "एक खरीदार ने लॉट {lotNumber} पर {formattedAmount} की बोली लगाई। वर्तमान उच्चतम: {formattedHighestBid}।",
      cta: "लॉट देखें",
    },
    OUTBID: {
      subject: "{lotNumber} पर आपकी बोली से अधिक बोली लगी",
      heading: "आपकी बोली से अधिक बोली लगी",
      body: "किसी ने लॉट {lotNumber} पर अधिक बोली लगाई है। वर्तमान उच्चतम बोली {formattedHighestBid} है। नीलामी में बने रहने के लिए नई बोली लगाएं!",
      cta: "नई बोली लगाएं",
    },
    AUCTION_WON: {
      subject: "बधाई हो! आपने लॉट {lotNumber} जीता!",
      heading: "नीलामी जीती! 🎉",
      body: "आपने {formattedAmount} की बोली से लॉट {lotNumber} ({commodityType}) जीता। खरीद पूरी करने के लिए भुगतान करें।",
      cta: "भुगतान करें",
    },
    AUCTION_ENDED_NO_BIDS: {
      subject: "नीलामी समाप्त — {lotNumber} पर कोई बोली नहीं",
      heading: "नीलामी समाप्त",
      body: "लॉट {lotNumber} की नीलामी बिना किसी बोली के समाप्त हो गई। लॉट सूचीबद्ध स्थिति में वापस आ गया है।",
      cta: "लॉट देखें",
    },
    AUCTION_ENDED_BELOW_RESERVE: {
      subject: "नीलामी समाप्त — {lotNumber} पर आरक्षित मूल्य पूरा नहीं हुआ",
      heading: "आरक्षित मूल्य पूरा नहीं हुआ",
      body: "लॉट {lotNumber} पर उच्चतम बोली {formattedHighestBid} आपके आरक्षित मूल्य {formattedReservePrice} तक नहीं पहुंची।",
      cta: "लॉट देखें",
    },
    AUCTION_SOLD: {
      subject: "आपका लॉट {lotNumber} बिक गया!",
      heading: "लॉट बिका! 💰",
      body: "लॉट {lotNumber} {formattedAmount} में बिक गया। खरीदार भुगतान के साथ आगे बढ़ेगा।",
      cta: "डैशबोर्ड देखें",
    },
    PAYMENT_CONFIRMED: {
      subject: "भुगतान पुष्टि — {lotNumber}",
      heading: "भुगतान पुष्टि ✓",
      body: "लॉट {lotNumber} के लिए भुगतान पुष्टि हो गया है। एक कमोडिटी टोकन जारी किया गया है।",
      cta: "टोकन देखें",
    },
    PAYMENT_FAILED: {
      subject: "भुगतान विफल — {lotNumber}",
      heading: "भुगतान विफल",
      body: "लॉट {lotNumber} के लिए आपका भुगतान संसाधित नहीं हो सका। कृपया पुनः प्रयास करें।",
      cta: "पुनः भुगतान करें",
    },
    RFQ_CREATED: {
      subject: "नया RFQ पोस्ट — {commodityType}",
      heading: "नया RFQ उपलब्ध",
      body: "एक खरीदार {deliveryCity} में {commodityType} ({quantity} किग्रा) की तलाश कर रहा है। लक्ष्य मूल्य: {formattedTargetPrice}।",
      cta: "देखें और जवाब दें",
    },
    RFQ_RESPONSE_RECEIVED: {
      subject: "आपके RFQ पर नया जवाब",
      heading: "नया प्रस्ताव प्राप्त",
      body: "एक विक्रेता ने आपके {commodityType} अनुरोध के लिए {formattedOfferedPrice} का प्रस्ताव दिया। सभी प्रस्तावों की समीक्षा करें।",
      cta: "जवाब समीक्षा करें",
    },
    RFQ_COUNTER_OFFER: {
      subject: "आपकी RFQ बातचीत पर काउंटर-ऑफर",
      heading: "नया काउंटर-ऑफर",
      body: "आपकी {commodityType} बातचीत में {formattedProposedPrice} का नया मूल्य प्रस्तावित किया गया है।",
      cta: "बातचीत देखें",
    },
    RFQ_ACCEPTED: {
      subject: "आपका RFQ प्रस्ताव स्वीकृत!",
      heading: "प्रस्ताव स्वीकृत! 🤝",
      body: "खरीदार ने {commodityType} के लिए आपका प्रस्ताव स्वीकार किया है। डिलीवरी की व्यवस्था करें।",
      cta: "विवरण देखें",
    },
    RFQ_REJECTED: {
      subject: "RFQ जवाब अपडेट",
      heading: "प्रस्ताव चयनित नहीं",
      body: "खरीदार ने {commodityType} अनुरोध के लिए एक अलग प्रस्ताव चुना। आप अन्य खुले RFQ ब्राउज़ कर सकते हैं।",
      cta: "RFQ ब्राउज़ करें",
    },
    RFQ_EXPIRED: {
      subject: "आपका RFQ समाप्त हो गया",
      heading: "RFQ समाप्त",
      body: "{commodityType} के लिए आपका अनुरोध समाप्त हो गया है। आप एक नया RFQ बना सकते हैं।",
      cta: "नया RFQ बनाएं",
    },
    TOKEN_MINTED: {
      subject: "कमोडिटी टोकन जारी — {lotNumber}",
      heading: "टोकन जारी! 🪙",
      body: "लॉट {lotNumber} ({commodityType}) के लिए एक डिजिटल कमोडिटी टोकन आपके खाते में जारी किया गया है।",
      cta: "टोकन देखें",
    },
    TOKEN_TRANSFERRED: {
      subject: "टोकन स्थानांतरित — {lotNumber}",
      heading: "टोकन स्थानांतरित",
      body: "लॉट {lotNumber} के लिए आपका टोकन {recipientName} को स्थानांतरित किया गया है। {priceNote}",
      cta: "स्थानांतरण इतिहास देखें",
    },
    TOKEN_RECEIVED: {
      subject: "आपको एक कमोडिटी टोकन मिला!",
      heading: "टोकन प्राप्त! 🪙",
      body: "लॉट {lotNumber} ({commodityType}) के लिए एक कमोडिटी टोकन {senderName} द्वारा आपको स्थानांतरित किया गया है।",
      cta: "टोकन देखें",
    },
    TOKEN_REDEEMED: {
      subject: "टोकन रिडीम — {lotNumber}",
      heading: "टोकन रिडीम ✓",
      body: "लॉट {lotNumber} के लिए आपका टोकन वेयरहाउस में सफलतापूर्वक रिडीम किया गया है। सामान संग्रह के लिए तैयार है।",
      cta: "विवरण देखें",
    },
    TOKEN_EXPIRING_SOON: {
      subject: "टोकन जल्द समाप्त — {lotNumber}",
      heading: "टोकन जल्द समाप्त ⚠",
      body: "लॉट {lotNumber} के लिए आपका टोकन {expiryDate} को समाप्त हो जाएगा। समय से पहले रिडीम या स्थानांतरित करें।",
      cta: "टोकन देखें",
    },
    TOKEN_EXPIRED: {
      subject: "टोकन समाप्त — {lotNumber}",
      heading: "टोकन समाप्त",
      body: "लॉट {lotNumber} के लिए आपका टोकन समाप्त हो गया है। सहायता के लिए संपर्क करें।",
    },
    MATERIAL_READY: {
      subject: "सामग्री पिकअप के लिए तैयार — {lotNumber}",
      heading: "सामग्री तैयार! 📦",
      body: "लॉट {lotNumber} ({commodityType}) का सामान {warehouseName} में पिकअप के लिए तैयार है। कृपया वेयरहाउस में अपना टोकन QR कोड दिखाएं।",
      cta: "QR कोड देखें",
    },
    LOT_STATUS_CHANGE: {
      subject: "लॉट अपडेट — {lotNumber}",
      heading: "{title}",
      body: "{body}",
    },
    NEW_SUBMISSION_ADMIN: {
      subject: "नया कमोडिटी सबमिशन — {commodityLabel} ({quantityKg}किग्रा)",
      heading: "समीक्षा हेतु नया कमोडिटी सबमिशन",
      body: "एक किसान ({farmerName}) ने आपकी समीक्षा हेतु एक नई कमोडिटी सबमिट की है।<br/><br/><strong>कमोडिटी:</strong> {commodityLabel}<br/><strong>मात्रा:</strong> {quantityKg} किग्रा<br/><strong>ग्रेड:</strong> {grade}<br/><strong>मूल:</strong> {originLocation}<br/><br/>कृपया एडमिन कंसोल से इस सबमिशन की समीक्षा करें।",
      cta: "सबमिशन समीक्षाएँ",
    },
  },
  ne: {
    WELCOME: {
      subject: "Krishibridge मा स्वागत छ!",
      heading: "स्वागत छ!",
      body: "नमस्ते {userName}, तपाईंको खाता सफलतापूर्वक बनाइयो। ट्रेडिङ सुरु गर्न KYC प्रमाणीकरण पूरा गर्नुहोस्।",
      cta: "KYC पूरा गर्नुहोस्",
    },
    KYC_APPROVED: {
      subject: "KYC स्वीकृत — तपाईं ट्रेड गर्न तयार!",
      heading: "KYC प्रमाणित ✓",
      body: "बधाई छ {userName}! तपाईंको पहिचान प्रमाणित भयो। अब तपाईं प्लेटफर्ममा किनबेच गर्न सक्नुहुन्छ।",
      cta: "ड्यासबोर्डमा जानुहोस्",
    },
    KYC_REJECTED: {
      subject: "KYC प्रमाणीकरण अद्यावधिक",
      heading: "KYC समीक्षा आवश्यक",
      body: "नमस्ते {userName}, हामी तपाईंका कागजातहरू प्रमाणित गर्न सकेनौं। कारण: {reason}। कृपया सही कागजातहरू पुनः पेश गर्नुहोस्।",
      cta: "KYC पुनः पेश गर्नुहोस्",
    },
    BID_PLACED: {
      subject: "तपाईंको लटमा नयाँ बोलपत्र — {lotNumber}",
      heading: "नयाँ बोलपत्र प्राप्त!",
      body: "एक क्रेताले लट {lotNumber} मा {formattedAmount} को बोलपत्र राख्यो। हालको उच्चतम: {formattedHighestBid}।",
      cta: "लट हेर्नुहोस्",
    },
    OUTBID: {
      subject: "{lotNumber} मा तपाईंको बोलपत्र भन्दा बढी बोलपत्र",
      heading: "तपाईंको भन्दा बढी बोलपत्र",
      body: "कसैले लट {lotNumber} मा बढी बोलपत्र राख्यो। हालको उच्चतम बोलपत्र {formattedHighestBid} छ।",
      cta: "नयाँ बोलपत्र राख्नुहोस्",
    },
    AUCTION_WON: {
      subject: "बधाई छ! तपाईंले लट {lotNumber} जित्नुभयो!",
      heading: "नीलामी जित्नुभयो! 🎉",
      body: "तपाईंले {formattedAmount} को बोलपत्रले लट {lotNumber} ({commodityType}) जित्नुभयो। भुक्तानी गर्नुहोस्।",
      cta: "भुक्तानी गर्नुहोस्",
    },
    AUCTION_ENDED_NO_BIDS: {
      subject: "नीलामी समाप्त — {lotNumber} मा कुनै बोलपत्र छैन",
      heading: "नीलामी समाप्त",
      body: "लट {lotNumber} को नीलामी कुनै बोलपत्र बिना समाप्त भयो।",
      cta: "लट हेर्नुहोस्",
    },
    AUCTION_ENDED_BELOW_RESERVE: {
      subject: "नीलामी समाप्त — {lotNumber} मा आरक्षित मूल्य पुगेन",
      heading: "आरक्षित मूल्य पुगेन",
      body: "लट {lotNumber} मा उच्चतम बोलपत्र {formattedHighestBid} तपाईंको आरक्षित मूल्य {formattedReservePrice} पुगेन।",
      cta: "लट हेर्नुहोस्",
    },
    AUCTION_SOLD: {
      subject: "तपाईंको लट {lotNumber} बिक्यो!",
      heading: "लट बिक्यो! 💰",
      body: "लट {lotNumber} {formattedAmount} मा बिक्यो। क्रेताले भुक्तानीमा अगाडि बढ्नेछ।",
      cta: "ड्यासबोर्ड हेर्नुहोस्",
    },
    PAYMENT_CONFIRMED: {
      subject: "भुक्तानी पुष्टि — {lotNumber}",
      heading: "भुक्तानी पुष्टि ✓",
      body: "लट {lotNumber} का लागि भुक्तानी पुष्टि भयो। कमोडिटी टोकन जारी भयो।",
      cta: "टोकन हेर्नुहोस्",
    },
    PAYMENT_FAILED: {
      subject: "भुक्तानी असफल — {lotNumber}",
      heading: "भुक्तानी असफल",
      body: "लट {lotNumber} का लागि तपाईंको भुक्तानी प्रशोधन हुन सकेन। कृपया पुन: प्रयास गर्नुहोस्।",
      cta: "पुन: भुक्तानी गर्नुहोस्",
    },
    RFQ_CREATED: {
      subject: "नयाँ RFQ पोस्ट — {commodityType}",
      heading: "नयाँ RFQ उपलब्ध",
      body: "एक क्रेता {deliveryCity} मा {commodityType} ({quantity} kg) खोज्दैछ। लक्ष्य मूल्य: {formattedTargetPrice}।",
      cta: "हेर्नुहोस् र जवाफ दिनुहोस्",
    },
    RFQ_RESPONSE_RECEIVED: {
      subject: "तपाईंको RFQ मा नयाँ जवाफ",
      heading: "नयाँ प्रस्ताव प्राप्त",
      body: "एक विक्रेताले तपाईंको {commodityType} अनुरोधमा {formattedOfferedPrice} को प्रस्ताव दियो।",
      cta: "जवाफहरू समीक्षा गर्नुहोस्",
    },
    RFQ_COUNTER_OFFER: {
      subject: "तपाईंको RFQ वार्तामा काउन्टर-अफर",
      heading: "नयाँ काउन्टर-अफर",
      body: "तपाईंको {commodityType} वार्तामा {formattedProposedPrice} को नयाँ मूल्य प्रस्ताव गरियो।",
      cta: "वार्ता हेर्नुहोस्",
    },
    RFQ_ACCEPTED: {
      subject: "तपाईंको RFQ प्रस्ताव स्वीकृत!",
      heading: "प्रस्ताव स्वीकृत! 🤝",
      body: "क्रेताले {commodityType} का लागि तपाईंको प्रस्ताव स्वीकार गर्यो। डेलिभरी व्यवस्था गर्नुहोस्।",
      cta: "विवरण हेर्नुहोस्",
    },
    RFQ_REJECTED: {
      subject: "RFQ जवाफ अद्यावधिक",
      heading: "प्रस्ताव चयन भएन",
      body: "क्रेताले {commodityType} अनुरोधमा अर्को प्रस्ताव छान्यो। तपाईं अन्य खुला RFQ हेर्न सक्नुहुन्छ।",
      cta: "RFQ हेर्नुहोस्",
    },
    RFQ_EXPIRED: {
      subject: "तपाईंको RFQ समाप्त भयो",
      heading: "RFQ समाप्त",
      body: "{commodityType} का लागि तपाईंको अनुरोध समाप्त भयो। तपाईं नयाँ RFQ बनाउन सक्नुहुन्छ।",
      cta: "नयाँ RFQ बनाउनुहोस्",
    },
    TOKEN_MINTED: {
      subject: "कमोडिटी टोकन जारी — {lotNumber}",
      heading: "टोकन जारी! 🪙",
      body: "लट {lotNumber} ({commodityType}) का लागि डिजिटल कमोडिटी टोकन तपाईंको खातामा जारी भयो।",
      cta: "टोकन हेर्नुहोस्",
    },
    TOKEN_TRANSFERRED: {
      subject: "टोकन स्थानान्तरण — {lotNumber}",
      heading: "टोकन स्थानान्तरण",
      body: "लट {lotNumber} का लागि तपाईंको टोकन {recipientName} लाई स्थानान्तरण भयो। {priceNote}",
      cta: "स्थानान्तरण इतिहास हेर्नुहोस्",
    },
    TOKEN_RECEIVED: {
      subject: "तपाईंले कमोडिटी टोकन प्राप्त गर्नुभयो!",
      heading: "टोकन प्राप्त! 🪙",
      body: "लट {lotNumber} ({commodityType}) का लागि कमोडिटी टोकन {senderName} बाट तपाईंलाई स्थानान्तरण भयो।",
      cta: "टोकन हेर्नुहोस्",
    },
    TOKEN_REDEEMED: {
      subject: "टोकन रिडिम — {lotNumber}",
      heading: "टोकन रिडिम ✓",
      body: "लट {lotNumber} का लागि तपाईंको टोकन वेयरहाउसमा सफलतापूर्वक रिडिम भयो।",
      cta: "विवरण हेर्नुहोस्",
    },
    TOKEN_EXPIRING_SOON: {
      subject: "टोकन चाँडै समाप्त — {lotNumber}",
      heading: "टोकन चाँडै समाप्त ⚠",
      body: "लट {lotNumber} का लागि तपाईंको टोकन {expiryDate} मा समाप्त हुनेछ। समयमै रिडिम वा स्थानान्तरण गर्नुहोस्।",
      cta: "टोकन हेर्नुहोस्",
    },
    TOKEN_EXPIRED: {
      subject: "टोकन समाप्त — {lotNumber}",
      heading: "टोकन समाप्त",
      body: "लट {lotNumber} का लागि तपाईंको टोकन समाप्त भयो। सहायताको लागि सम्पर्क गर्नुहोस्।",
    },
    MATERIAL_READY: {
      subject: "सामग्री पिकअपको लागि तयार — {lotNumber}",
      heading: "सामग्री तयार! 📦",
      body: "लट {lotNumber} ({commodityType}) को सामान {warehouseName} मा पिकअपको लागि तयार छ। वेयरहाउसमा तपाईंको टोकन QR कोड देखाउनुहोस्।",
      cta: "QR कोड हेर्नुहोस्",
    },
    LOT_STATUS_CHANGE: {
      subject: "लट अपडेट — {lotNumber}",
      heading: "{title}",
      body: "{body}",
    },
    NEW_SUBMISSION_ADMIN: {
      subject: "नयाँ वस्तु पेशकारी — {commodityLabel} ({quantityKg}कि.ग्रा.)",
      heading: "समीक्षाको लागि नयाँ वस्तु पेशकारी",
      body: "एक किसान ({farmerName}) ले तपाईँको समीक्षाको लागि नयाँ वस्तु पेश गरेको छ।<br/><br/><strong>वस्तु:</strong> {commodityLabel}<br/><strong>परिमाण:</strong> {quantityKg} कि.ग्रा.<br/><strong>ग्रेड:</strong> {grade}<br/><strong>उत्पत्ति:</strong> {originLocation}<br/><br/>कृपया एडमिन कन्सोलबाट यो पेशकारी समीक्षा गर्नुहोस्।",
      cta: "पेशकारी समीक्षा गर्नुहोस्",
    },
  },
  // Dzongkha and Arabic fall back to English templates via getEmailTemplate()
};

// ─── TEMPLATE INTERPOLATION ────────────────────

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = data[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

// ─── HTML WRAPPER (TERRA THEMED) ───────────────

function wrapInHtmlLayout(heading: string, bodyHtml: string, ctaText?: string, ctaUrl?: string): string {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resolvedCtaUrl = ctaUrl || APP_URL;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf7f2;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#faf7f2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#2d5a3d;border-radius:16px 16px 0 0;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.2px;">
                Krishibridge
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-left:1px solid #e8e0d4;border-right:1px solid #e8e0d4;">
              <h2 style="margin:0 0 16px;color:#1a3a2a;font-size:22px;font-weight:700;">
                ${heading}
              </h2>
              <p style="margin:0 0 24px;color:#4a6a5a;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </p>
              ${ctaText ? `
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:50px;background-color:#2d5a3d;">
                    <a href="${resolvedCtaUrl}" target="_blank" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:50px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0e8;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;border:1px solid #e8e0d4;border-top:none;">
              <p style="margin:0;color:#8a9a8e;font-size:12px;line-height:1.5;">
                Krishibridge — Cross-border agri-commodity exchange<br />
                You're receiving this because you have an account on Krishibridge.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── PUBLIC API ─────────────────────────────────

/**
 * Generate a localized HTML email template for a notification event.
 *
 * @param event — The notification event type
 * @param lang — The user's preferred language code (en, hi, ne, dz, ar)
 * @param data — Template variable values (userName, amount, lotNumber, etc.)
 * @returns { subject, html } — Ready to send via the email service
 */
export function getEmailTemplate(
  event: NotificationEvent,
  lang: string,
  data: Record<string, unknown> = {}
): EmailTemplate {
  // Fall back to English for unsupported locales
  const strings = LOCALE_STRINGS[lang]?.[event] || LOCALE_STRINGS.en[event];

  if (!strings) {
    // Defensive — should never happen if all events are mapped
    return {
      subject: "Krishibridge Notification",
      html: wrapInHtmlLayout("Notification", "You have a new notification on Krishibridge."),
    };
  }

  const subject = interpolate(strings.subject, data);
  const heading = interpolate(strings.heading, data);
  const body = interpolate(strings.body, data);
  const ctaUrl = data.ctaUrl ? String(data.ctaUrl) : undefined;
  const html = wrapInHtmlLayout(heading, body, strings.cta, ctaUrl);

  return { subject, html };
}

