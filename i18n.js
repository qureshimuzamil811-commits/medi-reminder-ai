/* ==========================================================================
   Medi Reminder AI - centralized translation system (English / Urdu)
   Usage: I18N.t('key'), I18N.set('ur'), I18N.apply() re-renders [data-i18n].
   Medicine names and confirmed prescription instructions are NEVER translated.
   ========================================================================== */
'use strict';

const I18N = (function () {
  const translations = {
    en: {
      tagline: 'Your Personal Voice Medicine Assistant',
      nav_home: 'Home', nav_medicines: 'Medicines', nav_history: 'History',
      nav_family: 'Family', nav_settings: 'Settings', nav_emergency: 'Emergency',
      go_home: 'Go to home screen',

      greet_morning: 'Good Morning', greet_afternoon: 'Good Afternoon',
      greet_evening: 'Good Evening', greet_wave: '👋',
      medi_intro: "Hello! I'm Medi. I'll help you remember your scheduled medicines.",
      assistant_title: 'Medi Assistant',
      assistant_hint: 'Tap the microphone and ask, for example: “What is my next medicine?”',
      mic_btn: 'Talk to Medi',
      listening: 'Listening…', thinking: 'Processing…', speaking: 'Speaking…', ready: 'Ready',
      asr_unsupported: 'Voice recognition is not supported in this browser. Please use the large buttons instead.',
      asr_denied: 'Microphone permission was denied. Please use the large buttons instead.',
      asr_nothing: "I couldn't hear you clearly. Please tap the microphone and try again.",
      asr_audio: 'No microphone was found. Please connect a microphone, or use the large buttons.',
      asr_network: 'Voice recognition needs an internet connection. Please check your connection, or use the large buttons.',
      asr_fallback: 'I can help with your medicine schedule, reminders, history, caregivers, and emergency options.',
      q_next: 'What is my next medicine?', q_today: 'What medicines do I have today?',
      q_morning: 'Did I take my morning medicine?', q_history: 'Show my medicine history.',

      next_medicine: 'NEXT MEDICINE', no_next: 'No upcoming medicine right now.',
      none_yet: 'No medicines yet. Add one or start the demo below.',
      scheduled_at: 'Scheduled time', remaining: '{t} remaining', due_now: 'Due now',
      dur_hm: '{h}h {m}m', dur_m: '{m}m',
      listen: 'Listen',

      progress_title: "TODAY'S MEDICINE PROGRESS",
      doses_of: '{done} of {total} doses confirmed',
      st_confirmed: 'Confirmed', st_upcoming: 'Upcoming', st_snoozed: 'Snoozed', st_not_confirmed: 'Not Confirmed',

      today_title: 'TODAY', listen_summary: 'Listen to Summary', no_doses_today: 'No doses scheduled today.',
      summary_spoken: 'Today you have {total} scheduled reminders. {done} confirmed, {up} upcoming, {miss} not confirmed.',

      quick_title: 'Quick Actions',
      qa_medicines: 'My Medicines', qa_scan: 'Scan Prescription', qa_test: 'Test Reminder',
      qa_family: 'Family', qa_history: 'History', qa_emergency: 'Emergency',
      start_demo: 'Start Demo', demo_banner: 'DEMO DATA — NOT MEDICAL ADVICE',
      demo_loaded: 'Demo data loaded. DEMO DATA — NOT MEDICAL ADVICE.',

      disclaimer: 'Medi Reminder AI is a medicine reminder and support tool. It does not diagnose conditions, prescribe medicines, or replace a doctor, pharmacist, caregiver, or emergency medical service.',

      medicines_title: 'My Medicines', add_medicine: 'Add Medicine',
      card_dose: 'Dose', card_time: 'Time', card_freq: 'Frequency', card_next: 'Next reminder',
      card_today: "Today's status", btn_edit: 'Edit', btn_history: 'History', btn_more: 'More',
      btn_delete: 'Delete', btn_about: 'About this medicine', btn_save: 'Save Medicine', btn_cancel: 'Cancel',
      delete_confirm: 'Delete this medicine?',
      med_saved: 'Medicine saved.', med_updated: 'Medicine updated.', med_deleted: 'Medicine deleted.',
      med_duplicate: 'A medicine with this name already exists.',
      no_medicines: 'No medicines added yet.',
      confirmed_today: '{done} of {total} doses confirmed today',

      about_title: 'ABOUT THIS MEDICINE', about_name: 'Medicine name',
      about_instructions: 'Confirmed instructions', about_side: 'Common possible side effects',
      about_warn: 'Important warnings', about_contact: 'When to contact a healthcare professional',
      about_demo_note: 'Demo Medicine Information — Not Medical Advice',
      about_no_info: 'No verified medicine information is stored for this medicine. For side effects and warnings, ask your doctor or pharmacist.',

      setup_title: 'Set Up My Medicines',
      scan_title: 'Scan / Upload Prescription',
      scan_upload: 'Upload Prescription', scan_camera: 'Use Camera', scan_sample: 'Use Sample Prescription',
      scan_hint: 'Take a clear photo in good light. OCR reads printed text best.',
      ocr_loading: 'Reading the prescription… please wait.',
      ocr_fail: 'We could not clearly read this prescription. Please check it manually or ask a caregiver or healthcare professional for help.',
      ocr_done: 'We found the following information. Please check it carefully before saving.',
      camera_title: 'Camera', camera_capture: 'Capture', camera_denied: 'Camera permission was denied or unavailable. You can still upload a photo.',
      review_title: 'PRESCRIPTION REVIEW',
      review_name: 'Medicine name', review_dose: 'Dose / instruction', review_times: 'Times (comma separated)',
      btn_confirm: 'Confirm', btn_remove: 'Remove', btn_add_med: 'Add Medicine',
      review_saved: 'Medicines confirmed and saved.',
      ocr_never_auto: 'OCR results are never saved automatically. You must confirm them.',

      f_name: 'Medicine Name', f_dose: 'Prescribed Dose / Instruction', f_times: 'Reminder times',
      f_add_time: '+ Add time', f_freq: 'Frequency', f_note: 'Custom note (optional)', f_image: 'Medicine image (optional)',
      freq_1: 'Once Daily', freq_2: 'Twice Daily', freq_3: 'Three Times Daily',
      freq_x: 'Every X Hours', freq_days: 'Specific Days', freq_custom: 'Custom',
      f_hours: 'Every how many hours?', f_days: 'Which days?',
      day_0: 'Sun', day_1: 'Mon', day_2: 'Tue', day_3: 'Wed', day_4: 'Thu', day_5: 'Fri', day_6: 'Sat',
      err_name: 'Please enter a medicine name.', err_time: 'Please add at least one time.',

      rem_title: 'TIME FOR YOUR MEDICINE', rem_ask: 'Did you take your medicine?',
      rem_took: 'I TOOK IT', rem_later: 'REMIND ME LATER', rem_listen: 'LISTEN AGAIN', rem_voice: 'VOICE RESPONSE',
      rem_close: 'Close without confirming',
      rem_speech: 'It is time for your scheduled medicine. Please check your confirmed medicine instructions.',
      voice_heard: 'I heard: “{x}”', voice_yes: 'Thank you. Your medicine has been marked as taken.',
      voice_not_understood: 'I did not understand. You can press the big green button.',
      voice_no_snooze: 'Okay. Choose when I should remind you again.',

      snooze_title: 'Remind me later', sn_5: '5 Minutes', sn_10: '10 Minutes', sn_15: '15 Minutes', sn_30: '30 Minutes',
      snoozed_for: 'Reminder snoozed for {m} minutes.',

      taken_title: 'MEDICINE TAKEN', taken_text: 'Your medicine has been marked as confirmed.',
      taken_note: 'Medi records your confirmation. It does not claim to physically verify that the medicine was swallowed.',

      checkin_title: 'HOW ARE YOU FEELING?', checkin_hint: 'This is only symptom logging. Medi does not diagnose.',
      feel_ok: 'No Problem', feel_nausea: 'Nausea / Feeling Sick', feel_vomit: 'Vomiting',
      feel_dizzy: 'Dizziness', feel_sleepy: 'Unusual Sleepiness', feel_urine: 'Changes in Urination',
      feel_other: 'Something Else',
      sev_label: 'Severity', sev_mild: 'Mild', sev_moderate: 'Moderate', sev_severe: 'Severe',
      note_label: 'Optional note', btn_save_symptom: 'Save Symptom', btn_skip: 'Skip', btn_done: 'Done',
      symptom_saved: 'Symptom saved to your log.',
      safety_1: 'You reported this symptom after taking your medicine. Some medicines can be associated with certain side effects, but Medi Reminder AI cannot determine whether your medicine caused this symptom.',
      safety_listed: 'This symptom is listed as a possible side effect in the available medicine information.',
      safety_2: 'If the symptom is severe, persistent, worsening, or concerning, contact a healthcare professional.',
      safety_severe: 'If you feel severely unwell right now, please use Emergency Help or contact a caregiver immediately.',

      symptom_log: 'SYMPTOM LOG', no_symptoms: 'No symptoms reported.',
      sym_med: 'Medicine', sym_sev: 'Severity',

      history_title: 'Medicine History', fl_today: 'Today', fl_week: 'This Week', fl_all: 'All',
      filter_med: 'Showing: {x}', clear_filter: 'Clear filter', no_history: 'No history yet.',
      h_scheduled: 'Scheduled', h_confirmed_at: 'Confirmed', clear_history: 'Clear History',
      history_cleared: 'History cleared.',

      family_title: 'FAMILY / CAREGIVER',
      notify_label: 'Notify my caregiver if I miss my medicine',
      escalate_label: 'If I do not confirm, ask me again after',
      esc_1: '1 minute (for demo)', esc_15: '15 minutes', esc_30: '30 minutes', esc_60: '60 minutes',
      fam_status: "TODAY'S MEDICINE STATUS", fam_next: 'Next medicine', fam_last: 'Last confirmation',
      fam_miss: 'Not-confirmed reminders', fam_symptoms: 'User-reported symptoms', fam_none: 'None',
      period_morning: 'Morning', period_afternoon: 'Afternoon', period_evening: 'Evening', period_night: 'Night',
      cg_title: 'Add a Caregiver', cg_name: 'Name', cg_rel: 'Relationship', cg_phone: 'Phone Number (with country code)',
      cg_wa: 'WhatsApp Number (optional)', cg_email: 'Email (optional)', btn_add_cg: 'Add Caregiver',
      cg_saved: 'Caregiver saved.', cg_deleted: 'Caregiver deleted.', cg_invalid: 'Please enter a name and phone number.',
      no_cg: 'No caregivers added yet.', call: 'Call', whatsapp: 'WhatsApp',
      cg_note: 'Caregiver details are stored only on this device. Calling and WhatsApp open your phone’s own apps — no message is ever sent automatically.',

      esc_title: 'Medicine not confirmed',
      esc_text: 'This medicine has not been confirmed.',
      esc_call: 'Call Caregiver', esc_wa: 'WhatsApp Caregiver', esc_continue: 'Continue Reminder', esc_dismiss: 'Dismiss',
      esc_wa_msg: 'Medicine reminder alert: The scheduled medicine has not yet been confirmed as taken. Please check on the patient.',

      em_title: 'EMERGENCY HELP', em_sub: 'If this is an emergency, call now.',
      em_call_now: 'CALL NOW', em_call_cg: 'Call Caregiver', em_location: 'Share Location', em_medical: 'Get Medical Help',
      em_contact_title: 'Emergency Contact', ec_name: 'Contact name', ec_rel: 'Relationship', ec_phone: 'Phone',
      btn_save_contact: 'Save Contact', contact_saved: 'Emergency contact saved.',
      no_contact: 'No emergency contact saved yet.',
      loc_btn_hint: 'Your location is only shared if you press the button. Never automatically.',
      loc_ok: 'Location ready. You can share it with your caregiver.', loc_fail: 'Location is unavailable or permission was denied.',
      open_maps: 'Open in Maps',
      em_symptoms: 'These symptoms may need urgent medical attention',
      em_chest: 'Chest Pain / Pressure', em_stroke: 'Possible Stroke Signs', em_breath: 'Severe Trouble Breathing',
      em_faint: 'Fainting / Unable to Stay Awake', em_allergy: 'Severe Allergic Reaction Signs',
      em_vomit: 'Severe / Persistent Vomiting', em_other: 'Something Else',
      em_urgent: 'THIS MAY REQUIRE URGENT MEDICAL ATTENTION',
      em_call_help: 'Call Emergency Help',
      g_stroke: 'Watch for SUDDEN: one-sided face, arm or leg weakness or numbness; difficulty speaking or understanding; major sudden balance or coordination problems; major sudden vision problems.',
      g_chest: 'Chest pain or severe breathing difficulty can require urgent medical attention.',
      g_breath: 'Severe trouble breathing can require urgent medical attention.',
      g_faint: 'Fainting or being unable to stay awake can require urgent medical attention.',
      g_allergy: 'Swelling of the face, lips or throat, or trouble breathing, can be a severe allergic reaction requiring urgent help.',
      g_vomit: 'Severe or persistent vomiting can require medical attention, especially with weakness or confusion.',
      g_other: 'If a symptom is severe, rapidly worsening, or worrying, seek urgent medical help. Do not wait.',
      g_severe: 'Prioritize emergency help and contact a caregiver or emergency service now. This app cannot manage serious symptoms.',
      em_no_diagnose: 'Medi Reminder AI cannot diagnose. When in doubt, contact emergency services or a healthcare professional.',
      em_number_label: 'My local emergency number',

      set_title: 'Settings',
      set_lang: 'Language', lang_en: 'English', lang_ur: 'اردو',
      set_theme: 'Theme', theme_light: '☀️ Light Mode', theme_dark: '🌙 Dark Mode',
      set_large: 'Large Text Mode', set_contrast: 'High Contrast Mode', set_voice: 'Voice Guidance',
      set_notif: 'Browser notifications', set_about: 'About & Disclaimer',
      clear_all: 'Clear All App Data', clear_all_confirm: 'Delete ALL app data on this device?',
      all_cleared: 'All app data cleared.',
      set_note: 'All data is stored only in this browser (localStorage). No cloud, no account needed.',
      future_note: 'Backend-ready: a future version can connect a server, cloud database, push notifications, SMS/WhatsApp APIs and a verified medication database at the marked integration points in the code.',

      notif_on: 'Notifications enabled.', notif_denied: 'Notification permission was denied. The in-app reminder will still appear.',
      tts_unavailable: 'Voice output is not available in this browser.',
      back_home: 'Back to Home',
      large_on: 'Large Text: ON', large_off: 'Large Text: OFF',
      theme_btn_light: 'Light', theme_btn_dark: 'Dark'
    },

    ur: {
      tagline: 'آپ کا ذاتی وائس میڈیسن اسسٹنٹ',
      nav_home: 'ہوم', nav_medicines: 'دوائیں', nav_history: 'ہسٹری',
      nav_family: 'اہلِ خانہ', nav_settings: 'ترتیبات', nav_emergency: 'ہنگامی',
      go_home: 'ہوم سکرین پر جائیں',

      greet_morning: 'صبح بخیر', greet_afternoon: 'دوپہر بخیر',
      greet_evening: 'شام بخیر', greet_wave: '👋',
      medi_intro: 'السلام علیکم! میں میڈی ہوں۔ میں آپ کو آپ کی دواؤں کا وقت یاد رکھنے میں مدد کروں گا۔',
      assistant_title: 'میڈی اسسٹنٹ',
      assistant_hint: 'مائیک بٹن دبائیں اور پوچھیں، مثلاً: “میری اگلی دوا کب ہے؟”',
      mic_btn: 'میڈی سے بات کریں',
      listening: 'سن رہا ہوں…', thinking: 'سوچ رہا ہوں…', speaking: 'بول رہا ہوں…', ready: 'تیار',
      asr_unsupported: 'اس براؤزر میں وائس پہچان دستیاب نہیں۔ براہ کرم بڑے بٹن استعمال کریں۔',
      asr_denied: 'مائیکروفون کی اجازت نہیں ملی۔ براہ کرم بڑے بٹن استعمال کریں۔',
      asr_nothing: 'میں آپ کی آواز واضح طور پر نہیں سن سکا۔ مائیکروفون دبائیں اور دوبارہ کوشش کریں۔',
      asr_audio: 'کوئی مائیکروفون نہیں ملا۔ براہ کرم مائیکروفون لگائیں یا بڑے بٹن استعمال کریں۔',
      asr_network: 'وائس پہچان کے لیے انٹرنیٹ درکار ہے۔ براہ کرم کنکشن چیک کریں یا بڑے بٹن استعمال کریں۔',
      asr_fallback: 'میں آپ کی دوا کے شیڈول، یاد دہانیوں، ہسٹری، نگہداشت کرنے والوں اور ہنگامی اختیارات میں مدد کر سکتا ہوں۔',
      q_next: 'میری اگلی دوا کب ہے؟', q_today: 'آج میری کتنی دوائیں ہیں؟',
      q_morning: 'کیا میں نے صبح والی دوا لے لی ہے؟', q_history: 'میری دواؤں کی ہسٹری دکھائیں۔',

      next_medicine: 'اگلی دوا', no_next: 'اس وقت کوئی اگلی دوا نہیں۔',
      none_yet: 'ابھی کوئی دوا نہیں۔ دوا شامل کریں یا نیچے ڈیمو شروع کریں۔',
      scheduled_at: 'مقررہ وقت', remaining: '{t} باقی', due_now: 'ابھی وقت ہو گیا',
      dur_hm: '{h} گھنٹے {m} منٹ', dur_m: '{m} منٹ',
      listen: 'سنیں',

      progress_title: 'آج کی دوا کی پیش رفت',
      doses_of: '{total} میں سے {done} دوائیں تصدیق شدہ',
      st_confirmed: 'تصدیق شدہ', st_upcoming: 'آنے والی', st_snoozed: 'بعد میں', st_not_confirmed: 'غیر تصدیق شدہ',

      today_title: 'آج', listen_summary: 'خلاصہ سنیں', no_doses_today: 'آج کوئی خوراک مقرر نہیں۔',
      summary_spoken: 'آج آپ کی {total} یاد دہانیاں ہیں۔ {done} تصدیق شدہ، {up} آنے والی، {miss} غیر تصدیق شدہ۔',

      quick_title: 'فوری اقدامات',
      qa_medicines: 'میری دوائیں', qa_scan: 'پرچہ اسکین کریں', qa_test: 'ٹیسٹ یاد دہانی',
      qa_family: 'اہلِ خانہ', qa_history: 'ہسٹری', qa_emergency: 'ہنگامی مدد',
      start_demo: 'ڈیمو شروع کریں', demo_banner: 'ڈیمو ڈیٹا — طبی مشورہ نہیں',
      demo_loaded: 'ڈیمو ڈیٹا لوڈ ہو گیا۔ ڈیمو ڈیٹا — طبی مشورہ نہیں۔',

      disclaimer: 'میڈی ریمائنڈر اے آئی ایک دوا یاد دہانی اور معاونت کا آلہ ہے۔ یہ بیماری کی تشخیص نہیں کرتا، دوا تجویز نہیں کرتا، اور ڈاکٹر، فارماسسٹ، نگہداشت کرنے والے یا ہنگامی طبی خدمت کا متبادل نہیں۔',

      medicines_title: 'میری دوائیں', add_medicine: 'دوا شامل کریں',
      card_dose: 'خوراک', card_time: 'وقت', card_freq: 'تعدد', card_next: 'اگلی یاد دہانی',
      card_today: 'آج کی صورتحال', btn_edit: 'ترمیم', btn_history: 'ہسٹری', btn_more: 'مزید',
      btn_delete: 'حذف کریں', btn_about: 'اس دوا کے بارے میں', btn_save: 'دوا محفوظ کریں', btn_cancel: 'منسوخ',
      delete_confirm: 'کیا یہ دوا حذف کرنی ہے؟',
      med_saved: 'دوا محفوظ ہو گئی۔', med_updated: 'دوا اپ ڈیٹ ہو گئی۔', med_deleted: 'دوا حذف ہو گئی۔',
      med_duplicate: 'اس نام کی دوا پہلے سے موجود ہے۔',
      no_medicines: 'ابھی کوئی دوا شامل نہیں کی گئی۔',
      confirmed_today: 'آج {total} میں سے {done} خوراکیں تصدیق شدہ',

      about_title: 'اس دوا کے بارے میں', about_name: 'دوا کا نام',
      about_instructions: 'تصدیق شدہ ہدایات', about_side: 'عام ممکنہ ضمنی اثرات',
      about_warn: 'اہم انتباہات', about_contact: 'ڈاکٹر سے کب رابطہ کریں',
      about_demo_note: 'ڈیمو دوا کی معلومات — طبی مشورہ نہیں',
      about_no_info: 'اس دوا کی کوئی تصدیق شدہ معلومات محفوظ نہیں۔ ضمنی اثرات اور انتباہات کے لیے اپنے ڈاکٹر یا فارماسسٹ سے پوچھیں۔',

      setup_title: 'میری دوائیں ترتیب دیں',
      scan_title: 'پرچہ اسکین / اپ لوڈ کریں',
      scan_upload: 'پرچہ اپ لوڈ کریں', scan_camera: 'کیمرہ استعمال کریں', scan_sample: 'نمونہ پرچہ استعمال کریں',
      scan_hint: 'اچھی روشنی میں صاف تصویر لیں۔ OCR چھپا ہوا متن بہتر پڑھتا ہے۔',
      ocr_loading: 'پرچہ پڑھا جا رہا ہے… براہ کرم انتظار کریں۔',
      ocr_fail: 'ہم اس پرچے کو واضح نہیں پڑھ سکے۔ براہ کرم دستی طور پر چیک کریں یا کسی نگہداشت کرنے والے یا طبی ماہر سے مدد لیں۔',
      ocr_done: 'ہمیں درج ذیل معلومات ملی ہیں۔ محفوظ کرنے سے پہلے غور سے چیک کریں۔',
      camera_title: 'کیمرہ', camera_capture: 'تصویر لیں', camera_denied: 'کیمرے کی اجازت نہیں ملی یا دستیاب نہیں۔ آپ تصویر اپ لوڈ کر سکتے ہیں۔',
      review_title: 'پرچے کا جائزہ',
      review_name: 'دوا کا نام', review_dose: 'خوراک / ہدایت', review_times: 'اوقات (کوما سے الگ کریں)',
      btn_confirm: 'تصدیق کریں', btn_remove: 'ہٹائیں', btn_add_med: 'دوا شامل کریں',
      review_saved: 'دوائیں تصدیق اور محفوظ ہو گئیں۔',
      ocr_never_auto: 'OCR کے نتائج کبھی خودکار محفوظ نہیں ہوتے۔ تصدیق آپ کو کرنی ہے۔',

      f_name: 'دوا کا نام', f_dose: 'تجویز کردہ خوراک / ہدایت', f_times: 'یاد دہانی کے اوقات',
      f_add_time: '+ وقت شامل کریں', f_freq: 'تعدد', f_note: 'اپنی یادداشت (اختیاری)', f_image: 'دوا کی تصویر (اختیاری)',
      freq_1: 'دن میں ایک بار', freq_2: 'دن میں دو بار', freq_3: 'دن میں تین بار',
      freq_x: 'ہر X گھنٹے بعد', freq_days: 'خاص دن', freq_custom: 'اپنی مرضی',
      f_hours: 'کتنے گھنٹے بعد؟', f_days: 'کن دنوں؟',
      day_0: 'اتوار', day_1: 'پیر', day_2: 'منگل', day_3: 'بدھ', day_4: 'جمعرات', day_5: 'جمعہ', day_6: 'ہفتہ',
      err_name: 'براہ کرم دوا کا نام لکھیں۔', err_time: 'براہ کرم کم از کم ایک وقت شامل کریں۔',

      rem_title: 'دوا لینے کا وقت ہو گیا', rem_ask: 'کیا آپ نے اپنی دوا لے لی ہے؟',
      rem_took: 'میں نے دوا لے لی', rem_later: 'بعد میں یاد دلائیں', rem_listen: 'دوبارہ سنیں', rem_voice: 'وائس جواب',
      rem_close: 'بغیر تصدیق بند کریں',
      rem_speech: 'آپ کی دوا لینے کا وقت ہو گیا ہے۔ براہ کرم اپنی تصدیق شدہ دوا کی ہدایات دیکھیں۔',
      voice_heard: 'میں نے سنا: “{x}”', voice_yes: 'شکریہ۔ آپ کی دوا لی ہوئی نشان زد ہو گئی ہے۔',
      voice_not_understood: 'مجھے سمجھ نہیں آیا۔ آپ بڑا سبز بٹن دبا سکتے ہیں۔',
      voice_no_snooze: 'ٹھیک ہے۔ منتخب کریں کہ میں دوبارہ کب یاد دلاؤں۔',

      snooze_title: 'بعد میں یاد دلائیں', sn_5: '5 منٹ', sn_10: '10 منٹ', sn_15: '15 منٹ', sn_30: '30 منٹ',
      snoozed_for: 'یاد دہانی {m} منٹ کے لیے مؤخر ہو گئی۔',

      taken_title: 'دوا لے لی گئی', taken_text: 'آپ کی دوا تصدیق شدہ نشان زد ہو گئی۔',
      taken_note: 'میڈی آپ کی تصدیق ریکارڈ کرتا ہے۔ یہ دعویٰ نہیں کرتا کہ دوا نگلی گئی یہ اس نے خود دیکھا۔',

      checkin_title: 'آپ کیسا محسوس کر رہے ہیں؟', checkin_hint: 'یہ صرف علامت کا ریکارڈ ہے۔ میڈی تشخیص نہیں کرتا۔',
      feel_ok: 'کوئی مسئلہ نہیں', feel_nausea: 'متلی / طبیعت خراب', feel_vomit: 'قے',
      feel_dizzy: 'چکر', feel_sleepy: 'غیر معمولی نیند', feel_urine: 'پیشاب میں تبدیلی',
      feel_other: 'کچھ اور',
      sev_label: 'شدت', sev_mild: 'ہلکی', sev_moderate: 'درمیانہ', sev_severe: 'شدید',
      note_label: 'اختیاری نوٹ', btn_save_symptom: 'علامت محفوظ کریں', btn_skip: 'چھوڑیں', btn_done: 'مکمل',
      symptom_saved: 'علامت آپ کی لاگ میں محفوظ ہو گئی۔',
      safety_1: 'آپ نے دوا لینے کے بعد یہ علامت بتائی۔ کچھ دواؤں کے کچھ ضمنی اثرات ہو سکتے ہیں، لیکن میڈی ریمائنڈر اے آئی یہ تعین نہیں کر سکتا کہ آپ کی دوا نے یہ علامت کی ہے۔',
      safety_listed: 'دستیاب دوا کی معلومات میں یہ علامت ایک ممکنہ ضمنی اثر کے طور پر درج ہے۔',
      safety_2: 'اگر علامت شدید، مسلسل، بڑھتی ہوئی یا تشویش ناک ہو تو کسی طبی ماہر سے رابطہ کریں۔',
      safety_severe: 'اگر آپ کو ابھی شدید تکلیف ہے تو ہنگامی مدد استعمال کریں یا فوراً نگہداشت کرنے والے سے رابطہ کریں۔',

      symptom_log: 'علامتوں کی لاگ', no_symptoms: 'کوئی علامت رپورٹ نہیں ہوئی۔',
      sym_med: 'دوا', sym_sev: 'شدت',

      history_title: 'دواؤں کی ہسٹری', fl_today: 'آج', fl_week: 'اس ہفتے', fl_all: 'تمام',
      filter_med: 'دکھائی جا رہی: {x}', clear_filter: 'فلٹر صاف کریں', no_history: 'ابھی کوئی ہسٹری نہیں۔',
      h_scheduled: 'مقررہ', h_confirmed_at: 'تصدیق', clear_history: 'ہسٹری صاف کریں',
      history_cleared: 'ہسٹری صاف ہو گئی۔',

      family_title: 'اہلِ خانہ / نگہداشت کرنے والا',
      notify_label: 'اگر میں دوا بھول جاؤں تو میرے نگہداشت کرنے والے کو اطلاع دیں',
      escalate_label: 'اگر میں تصدیق نہ کروں تو کتنی دیر بعد پوچھیں',
      esc_1: '1 منٹ (ڈیمو کے لیے)', esc_15: '15 منٹ', esc_30: '30 منٹ', esc_60: '60 منٹ',
      fam_status: 'آج کی دوا کی صورتحال', fam_next: 'اگلی دوا', fam_last: 'آخری تصدیق',
      fam_miss: 'غیر تصدیق شدہ یاد دہانیاں', fam_symptoms: 'رپورٹ کی گئی علامات', fam_none: 'کوئی نہیں',
      period_morning: 'صبح', period_afternoon: 'دوپہر', period_evening: 'شام', period_night: 'رات',
      cg_title: 'نگہداشت کرنے والا شامل کریں', cg_name: 'نام', cg_rel: 'رشتہ', cg_phone: 'فون نمبر (ملکی کوڈ کے ساتھ)',
      cg_wa: 'واٹس ایپ نمبر (اختیاری)', cg_email: 'ای میل (اختیاری)', btn_add_cg: 'شامل کریں',
      cg_saved: 'نگہداشت کرنے والا محفوظ ہو گیا۔', cg_deleted: 'نگہداشت کرنے والا حذف ہو گیا۔', cg_invalid: 'براہ کرم نام اور فون نمبر درج کریں۔',
      no_cg: 'ابھی کوئی نگہداشت کرنے والا شامل نہیں۔', call: 'کال', whatsapp: 'واٹس ایپ',
      cg_note: 'نگہداشت کرنے والے کی معلومات صرف اسی ڈیوائس پر محفوظ ہیں۔ کال اور واٹس ایپ آپ کے فون کی اپنی ایپس کھولتے ہیں — کوئی پیغام خودکار نہیں بھیجا جاتا۔',

      esc_title: 'دوا تصدیق نہیں ہوئی',
      esc_text: 'یہ دوا ابھی تصدیق نہیں ہوئی۔',
      esc_call: 'نگہداشت کرنے والے کو کال کریں', esc_wa: 'نگہداشت کرنے والے کو واٹس ایپ', esc_continue: 'یاد دہانی جاری رکھیں', esc_dismiss: 'بند کریں',
      esc_wa_msg: 'دوا کی یاد دہانی الرٹ: مقررہ دوا ابھی تک لی ہوئی تصدیق نہیں ہوئی۔ براہ کرم مریض کی خیریت معلوم کریں۔',

      em_title: 'ہنگامی مدد', em_sub: 'اگر یہ ہنگامی صورتحال ہے تو ابھی کال کریں۔',
      em_call_now: 'ابھی کال کریں', em_call_cg: 'نگہداشت کرنے والے کو کال کریں', em_location: 'مقام شیئر کریں', em_medical: 'طبی مدد لیں',
      em_contact_title: 'ہنگامی رابطہ', ec_name: 'رابطے کا نام', ec_rel: 'رشتہ', ec_phone: 'فون',
      btn_save_contact: 'رابطہ محفوظ کریں', contact_saved: 'ہنگامی رابطہ محفوظ ہو گیا۔',
      no_contact: 'ابھی کوئی ہنگامی رابطہ محفوظ نہیں۔',
      loc_btn_hint: 'آپ کا مقام صرف اس وقت شیئر ہوتا ہے جب آپ بٹن دبائیں۔ کبھی خودکار نہیں۔',
      loc_ok: 'مقام تیار ہے۔ آپ اسے اپنے نگہداشت کرنے والے کو دکھا سکتے ہیں۔', loc_fail: 'مقام دستیاب نہیں یا اجازت نہیں ملی۔',
      open_maps: 'نقشے میں کھولیں',
      em_symptoms: 'ان علامات کو فوری طبی توجہ کی ضرورت ہو سکتی ہے',
      em_chest: 'سینے میں درد / دباؤ', em_stroke: 'فالج کی ممکنہ علامات', em_breath: 'سانس کی شدید تکلیف',
      em_faint: 'بے ہوشی / جاگ نہ پانا', em_allergy: 'شدید الرجی کی علامات',
      em_vomit: 'شدید / مسلسل قے', em_other: 'کچھ اور',
      em_urgent: 'اسے فوری طبی توجہ کی ضرورت ہو سکتی ہے',
      em_call_help: 'ہنگامی مدد کو کال کریں',
      g_stroke: 'اچانک دیکھیں: ایک طرف کے چہرے، بازو یا ٹانگ میں کمزوری یا سن ہو جانا؛ بولنے یا سمجھنے میں دشواری؛ اچانک شدید توازن یا بینائی کے مسائل۔',
      g_chest: 'سینے کا درد یا سانس کی شدید تکلیف کو فوری طبی توجہ کی ضرورت ہو سکتی ہے۔',
      g_breath: 'سانس کی شدید تکلیف کو فوری طبی توجہ کی ضرورت ہو سکتی ہے۔',
      g_faint: 'بے ہوشی یا جاگ نہ پانا فوری طبی توجہ کا تقاضا کر سکتا ہے۔',
      g_allergy: 'چہرے، ہونٹوں یا حلق کی سوجن یا سانس کی تکلیف شدید الرجی ہو سکتی ہے جسے فوری مدد چاہیے۔',
      g_vomit: 'شدید یا مسلسل قے کو طبی توجہ کی ضرورت ہو سکتی ہے، خاص کر کمزوری یا الجھن کے ساتھ۔',
      g_other: 'اگر کوئی علامت شدید، تیزی سے بڑھتی یا تشویش ناک ہو تو فوری طبی مدد لیں۔ انتظار نہ کریں۔',
      g_severe: 'پہلے ہنگامی مدد لیں اور ابھی نگہداشت کرنے والے یا ہنگامی خدمت سے رابطہ کریں۔ یہ ایپ شدید علامات کا انتظام نہیں کر سکتی۔',
      em_no_diagnose: 'میڈی ریمائنڈر اے آئی تشخیص نہیں کر سکتا۔ شک کی صورت میں ہنگامی خدمات یا طبی ماہر سے رابطہ کریں۔',
      em_number_label: 'میرا مقامی ہنگامی نمبر',

      set_title: 'ترتیبات',
      set_lang: 'زبان', lang_en: 'English', lang_ur: 'اردو',
      set_theme: 'تھیم', theme_light: '☀️ لائٹ موڈ', theme_dark: '🌙 ڈارک موڈ',
      set_large: 'بڑے حروف', set_contrast: 'ہائی کنٹراسٹ', set_voice: 'وائس رہنمائی',
      set_notif: 'براؤزر اطلاعات', set_about: 'تعارف اور دستبرداری',
      clear_all: 'تمام ایپ ڈیٹا صاف کریں', clear_all_confirm: 'کیا اس ڈیوائس کا تمام ایپ ڈیٹا حذف کریں؟',
      all_cleared: 'تمام ایپ ڈیٹا صاف ہو گیا۔',
      set_note: 'تمام ڈیٹا صرف اسی براؤزر میں محفوظ ہے (localStorage)۔ کوئی کلاؤڈ یا اکاؤنٹ درکار نہیں۔',
      future_note: 'بیک اینڈ کے لیے تیار: مستقبل میں سرور، کلاؤڈ ڈیٹا بیس، پش اطلاعات، SMS/واٹس ایپ API اور تصدیق شدہ دوا ڈیٹا بیس کوڈ میں نشان زد مقامات پر جوڑے جا سکتے ہیں۔',

      notif_on: 'اطلاعَات فعال ہو گئیں۔', notif_denied: 'اطلاع کی اجازت نہیں ملی۔ ایپ کے اندر یاد دہانی پھر بھی دکھے گی۔',
      tts_unavailable: 'اس براؤزر میں وائس آؤٹ پٹ دستیاب نہیں۔',
      back_home: 'ہوم پر واپس',
      large_on: 'بڑے حروف: آن', large_off: 'بڑے حروف: آف',
      theme_btn_light: 'لائٹ', theme_btn_dark: 'ڈارک'
    }
  };

  let lang = 'en';

  function t(key, vars) {
    let s = (translations[lang] && translations[lang][key]);
    if (s == null) s = translations.en[key];
    if (s == null) s = key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  function set(l) {
    lang = (l === 'ur') ? 'ur' : 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ur') ? 'rtl' : 'ltr';
    apply();
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const s = t(el.getAttribute('data-i18n'));
      if (s != null) el.textContent = s;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
  }

  return { translations, t, set, apply, get lang() { return lang; } };
})();
