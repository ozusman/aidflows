import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Language = 'he' | 'en';

type TranslationKey = keyof typeof translations.he;

const translations = {
  he: {
    // App
    appName: 'AidFlow',
    
    // Navigation
    navShifts: 'משמרות',
    navDailyCoverage: 'כיסוי יומי',
    navWeeklySummary: 'סיכום שבועי',
    navNewShift: 'משמרת חדשה',
    
    // Shift Entry
    shiftEntry: 'רישום משמרת',
    shiftDate: 'תאריך',
    startTime: 'שעת התחלה',
    endTime: 'שעת סיום',
    totalHours: 'סה"כ שעות',
    caregiverName: 'שם המטפל',
    caregiverType: 'סוג מטפל',
    typePrivatePaid: 'מטפל פרטי בתשלום',
    typeFamilyMember: 'בן משפחה',
    typeForeignCaregiver: 'השגחה בתשלום',
    typeOther: 'אחר',
    
    // Location
    location: 'מיקום',
    locationType: 'סוג מיקום',
    locationName: 'שם המקום',
    locationHospital: 'בית חולים',
    locationHome: 'בית',
    locationInstitution: 'מוסד',
    
    // Payment
    payment: 'תשלום',
    paymentAmount: 'סכום',
    paymentMethod: 'אמצעי תשלום',
    paymentDate: 'תאריך תשלום',
    paymentStatus: 'סטטוס',
    statusPaid: 'שולם',
    statusUnpaid: 'לא שולם',
    methodBankTransfer: 'העברה בנקאית',
    methodPayBox: 'PayBox',
    methodBit: 'ביט',
    methodCash: 'מזומן',
    travelCost: 'עלות נסיעות',
    parkingCost: 'עלות חניה',
    
    // Purpose
    shiftPurpose: 'מטרת המשמרת',
    purposeGuarding: 'שמירה',
    purposeSupervision: 'השגחה',
    
    // Medical Event
    medicalEvent: 'אירוע רפואי',
    eventHospitalization: 'אשפוז',
    eventDeterioration: 'הידרדרות',
    eventRehabilitation: 'שיקום',
    
    // Data Entry
    dataEnteredBy: 'נרשם ע"י',
    shiftPerformed: 'המשמרת בוצעה בפועל',
    notes: 'הערות',
    
    // Actions
    save: 'שמירה',
    cancel: 'ביטול',
    edit: 'עריכה',
    delete: 'מחיקה',
    export: 'ייצוא',
    
    // Daily Coverage
    dailyCoverage: 'כיסוי יומי',
    selectDate: 'בחירת תאריך',
    covered: 'מכוסה',
    uncovered: 'לא מכוסה',
    paidCaregiver: 'מטפל בתשלום',
    familyCaregiver: 'בן משפחה',
    
    // Weekly Summary
    weeklySummary: 'סיכום שבועי',
    selectWeek: 'בחירת שבוע',
    selectCaregiver: 'בחירת מטפל',
    allCaregivers: 'כל המטפלים',
    totalExpenses: 'סה"כ הוצאות',
    totalPayment: 'סה"כ תשלום',
    
    // Table Headers
    date: 'תאריך',
    time: 'שעה',
    caregiver: 'מטפל',
    hours: 'שעות',
    expenses: 'הוצאות',
    
    // Status
    noShifts: 'אין משמרות',
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
    shiftSaved: 'המשמרת נשמרה בהצלחה',
    
    // Receipts
    uploadReceipts: 'העלאת קבלות',
    dragFilesHere: 'גרור קבצים לכאן או לחץ להעלאה',
    noReceiptsUploaded: 'לא הועלו קבלות',
    uploading: 'מעלה...',
    download: 'הורדה',
    receiptsCount: 'קבלות',
    
    // Auth
    signIn: 'התחברות',
    signUp: 'הרשמה',
    signOut: 'יציאה',
    email: 'דוא"ל',
    password: 'סיסמה',
    welcomeMessage: 'ברוכים הבאים, אנא התחברו להמשיך',
    invalidCredentials: 'פרטי התחברות שגויים',
    emailAlreadyRegistered: 'כתובת הדוא"ל כבר רשומה',
    accountCreated: 'החשבון נוצר בהצלחה! תוכלו להתחבר כעת',
    forgotPassword: 'שכחת סיסמה?',
    resetPassword: 'איפוס סיסמה',
    resetPasswordInstructions: 'הזינו את כתובת הדוא"ל שלכם ונשלח לכם קישור לאיפוס הסיסמה',
    resetEmailSent: 'נשלח אליכם מייל עם קישור לאיפוס הסיסמה',
    backToSignIn: 'חזרה להתחברות',
    
    // Language
    language: 'שפה',
    hebrew: 'עברית',
    english: 'English',
  },
  en: {
    // App
    appName: 'AidFlow',
    
    // Navigation
    navShifts: 'Shifts',
    navDailyCoverage: 'Daily Coverage',
    navWeeklySummary: 'Weekly Summary',
    navNewShift: 'New Shift',
    
    // Shift Entry
    shiftEntry: 'Shift Entry',
    shiftDate: 'Date',
    startTime: 'Start Time',
    endTime: 'End Time',
    totalHours: 'Total Hours',
    caregiverName: 'Caregiver Name',
    caregiverType: 'Caregiver Type',
    typePrivatePaid: 'Paid Private Caregiver',
    typeFamilyMember: 'Family Member',
    typeForeignCaregiver: 'Paid Supervision',
    typeOther: 'Other',
    
    // Location
    location: 'Location',
    locationType: 'Location Type',
    locationName: 'Location Name',
    locationHospital: 'Hospital',
    locationHome: 'Home',
    locationInstitution: 'Institution',
    
    // Payment
    payment: 'Payment',
    paymentAmount: 'Amount',
    paymentMethod: 'Payment Method',
    paymentDate: 'Payment Date',
    paymentStatus: 'Status',
    statusPaid: 'Paid',
    statusUnpaid: 'Unpaid',
    methodBankTransfer: 'Bank Transfer',
    methodPayBox: 'PayBox',
    methodBit: 'Bit',
    methodCash: 'Cash',
    travelCost: 'Travel Cost',
    parkingCost: 'Parking Cost',
    
    // Purpose
    shiftPurpose: 'Shift Purpose',
    purposeGuarding: 'Guarding',
    purposeSupervision: 'Supervision',
    
    // Medical Event
    medicalEvent: 'Medical Event',
    eventHospitalization: 'Hospitalization',
    eventDeterioration: 'Deterioration',
    eventRehabilitation: 'Rehabilitation',
    
    // Data Entry
    dataEnteredBy: 'Entered By',
    shiftPerformed: 'Shift performed in practice',
    notes: 'Notes',
    
    // Actions
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
    
    // Daily Coverage
    dailyCoverage: 'Daily Coverage',
    selectDate: 'Select Date',
    covered: 'Covered',
    uncovered: 'Uncovered',
    paidCaregiver: 'Paid Caregiver',
    familyCaregiver: 'Family Member',
    
    // Weekly Summary
    weeklySummary: 'Weekly Summary',
    selectWeek: 'Select Week',
    selectCaregiver: 'Select Caregiver',
    allCaregivers: 'All Caregivers',
    totalExpenses: 'Total Expenses',
    totalPayment: 'Total Payment',
    
    // Table Headers
    date: 'Date',
    time: 'Time',
    caregiver: 'Caregiver',
    hours: 'Hours',
    expenses: 'Expenses',
    
    // Status
    noShifts: 'No shifts',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    shiftSaved: 'Shift saved successfully',
    
    // Receipts
    uploadReceipts: 'Upload Receipts',
    dragFilesHere: 'Drag files here or click to upload',
    noReceiptsUploaded: 'No receipts uploaded',
    uploading: 'Uploading...',
    download: 'Download',
    receiptsCount: 'receipts',
    
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    welcomeMessage: 'Welcome, please sign in to continue',
    invalidCredentials: 'Invalid credentials',
    emailAlreadyRegistered: 'Email is already registered',
    accountCreated: 'Account created successfully! You can now sign in',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset Password',
    resetPasswordInstructions: 'Enter your email address and we will send you a link to reset your password',
    resetEmailSent: 'We have sent you an email with a link to reset your password',
    backToSignIn: 'Back to sign in',
    
    // Language
    language: 'Language',
    hebrew: 'עברית',
    english: 'English',
  },
} as const;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('he');

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  const isRTL = language === 'he';
  const dir = isRTL ? 'rtl' : 'ltr';

  // Set initial document attributes
  React.useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.body.className = isRTL ? 'font-hebrew' : 'font-sans';
  }, [language, dir, isRTL]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
