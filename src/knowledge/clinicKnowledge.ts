// ── Clinic knowledge base — sourced from site.ts content ─────────────────────

export const CLINIC = {
  name: "Krushna Diagnostic Center",
  doctor: {
    name: "Dr. Shrikrushna Sonawane",
    title: "DMRE Radiology",
  },
  phone: "+91-9405347738",
  address: "Mahavir Heights, Gala No.1 & 2, Ground Floor, Old Pune-Solapur Highway Road, Near HDFC Bank, Indapur, Pune – 413106",
  hours: {
    weekdays: "Sunday to Friday: 9:00 AM to 10:00 PM",
    saturday: "Saturday: 9:00 AM to 2:00 PM",
  },
  services: [
    {
      name: "Digital X-Ray",
      keywords: ["x-ray", "xray", "x ray", "एक्स रे", "क्ष-किरण"],
      desc: "High-resolution digital radiography with instant results. No special preparation needed.",
      fastingRequired: false,
      reportTime: "1–2 hours",
    },
    {
      name: "Sonography 3D/4D",
      keywords: ["sonography", "ultrasound", "usg", "सोनोग्राफी", "अल्ट्रासाउंड", "3d", "4d"],
      desc: "Abdomen, pelvis, obstetric and small-parts ultrasound including 3D/4D.",
      fastingRequired: true,
      fastingNote: "Fasting of 6–8 hours required for abdominal sonography.",
      reportTime: "Same day",
    },
    {
      name: "Color Doppler",
      keywords: ["doppler", "color doppler", "डॉपलर", "colour doppler"],
      desc: "Vascular and colour Doppler for blood-flow assessment.",
      fastingRequired: false,
      reportTime: "Same day",
    },
  ],
  faqs: [
    {
      q: "How long does it take to get reports?",
      a: "X-Ray reports are ready in 1–2 hours. Sonography and Doppler reports are ready the same day.",
    },
    {
      q: "Do I need an appointment?",
      a: "Walk-ins are welcome, but booking in advance ensures minimal waiting time.",
    },
    {
      q: "Is fasting required?",
      a: "Fasting of 6–8 hours is required for abdominal sonography. X-Ray and Doppler do not require fasting.",
    },
    {
      q: "What should I bring?",
      a: "Please bring a valid photo ID, your doctor's prescription or referral, and any previous reports or films.",
    },
    {
      q: "Do you accept insurance?",
      a: "Yes, we accept most major health insurance and TPA cards. Please call ahead to confirm your specific insurer.",
    },
    {
      q: "Are reports available digitally?",
      a: "Yes, reports and images are shared via WhatsApp or email so your doctor can access them instantly.",
    },
  ],
} as const;

// Greeting messages per language
export const GREETINGS: Record<string, string> = {
  en: `Namaskar! Thank you for calling ${CLINIC.name}. I am your AI receptionist. How can I help you today? You can book an appointment, ask about our services, or get directions.`,
  hi: `नमस्कार! ${CLINIC.name} में आपका स्वागत है। मैं आपका AI रिसेप्शनिस्ट हूँ। मैं आपकी कैसे मदद कर सकता हूँ? आप अपॉइंटमेंट बुक कर सकते हैं, हमारी सेवाओं के बारे में पूछ सकते हैं।`,
  mr: `नमस्कार! ${CLINIC.name} मध्ये आपले स्वागत आहे. मी तुमचा AI रिसेप्शनिस्ट आहे. मी तुम्हाला कशी मदत करू शकतो? तुम्ही अपॉइंटमेंट बुक करू शकता किंवा आमच्या सेवांबद्दल विचारू शकता.`,
};

export const TRANSFER_MESSAGE: Record<string, string> = {
  en: "Please hold, I am transferring your call to our staff right away.",
  hi: "कृपया रुकें, मैं आपकी कॉल अभी हमारे स्टाफ को ट्रांसफर कर रहा हूँ।",
  mr: "कृपया थांबा, मी तुमची कॉल आत्ता आमच्या स्टाफकडे ट्रान्सफर करत आहे.",
};

export const EMERGENCY_MESSAGE: Record<string, string> = {
  en: "This sounds like a medical emergency. Please call 108 immediately for ambulance services. I am transferring you to our staff now.",
  hi: "यह एक मेडिकल इमरजेंसी लगती है। कृपया तुरंत 108 पर कॉल करें। मैं आपको अभी हमारे स्टाफ से जोड़ रहा हूँ।",
  mr: "हे वैद्यकीय आणीबाणीसारखे वाटते. कृपया ताबडतोब 108 वर कॉल करा. मी तुम्हाला आत्ता आमच्या स्टाफशी जोडत आहे.",
};
