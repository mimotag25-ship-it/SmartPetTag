import { useState, createContext, useContext } from 'react';

export const translations = {
  en: {
    // Navigation
    feed: 'Feed',
    profile: 'Profile',
    map: 'Map',
    messages: 'Messages',

    // Profile
    dogIsLost: 'is Lost',
    tapToAlert: 'Tap to instantly alert the community',
    editFullProfile: '✏️ Edit full profile',
    activity: 'Activity',
    alertsTriggered: 'Alerts triggered',
    dogsFound: 'Dogs found',
    sightingsReported: 'Sightings reported',
    postsMade: 'Posts made',
    owner: 'Owner',
    phone: 'Phone',
    personality: 'Personality',
    area: 'Area',
    vaccinated: '✓ Vaccinated',
    privacyPolicy: 'Privacy Policy',
    chatMessages: 'Messages',
    chatWithOwners: 'Chat with nearby dog owners',

    // Feed
    newPostAs: 'New post as',
    checkin: 'Check-in',
    lost: 'Lost',
    spotted: 'Spotted',
    event: 'Event',
    warning: 'Warning',
    nearMe: '🗺️ Near me',
    activeAlertsNearYou: 'ACTIVE ALERTS NEAR YOU',
    emergencyLostDog: '🚨 EMERGENCY — LOST DOG',
    iFoundThisDog: '🙋 I Found This Dog',
    share: '↗ Share',
    commentAs: 'Comment as',
    paws: 'paws',
    viewAll: 'View all',
    comments: 'comments',
    whatsAthenaUpTo: "What's your dog up to?",

    // Emergency
    emergencyAlert: '⚠️ EMERGENCY ALERT',
    reportAsLost: 'Report as lost?',
    lastSeenLocation: 'Last seen location',
    descriptionForFinders: 'Description for finders',
    whatHappensInstantly: 'What happens instantly:',
    isLost: 'IS LOST',
    tapToAlertCommunity: 'Tap to alert the community',
    alertActive: 'ALERT ACTIVE',
    usersNotifiedNearby: 'users notified nearby',
    spreadTheWord: 'SPREAD THE WORD BEYOND THE APP',
    shareToWhatsApp: 'Share to WhatsApp groups',
    whatsappSub: 'Pre-written message + sighting link. No app needed for finders.',
    printPoster: 'Print emergency poster',
    posterSub: 'Auto-generated with sighting link. Print and post around the neighbourhood.',
    dogHasBeenFound: 'has been found!',
    backToApp: 'Back to SmartPet Tag',
    liveUpdates: 'LIVE UPDATES',

    // Guest
    safetyNetwork: 'The safety network for dogs in CDMX',
    dogsProtectedNearby: 'Dogs protected nearby',
    activeAlerts: 'Active alerts',
    activeAlertsNearYouGuest: 'Active alerts near you',
    signUpToHelp: 'Sign up to help find these dogs',
    whyDogOwners: 'Why dog owners in CDMX use SmartPet Tag',
    protectFree: 'Protect your dog for free',
    createAccount: 'Create free account 🐾',
    alreadyHaveAccount: 'Already have an account? Sign in',

    // Map
    visible: 'Visible',
    community: 'Community',
    hidden: 'Hidden',
    invite: '👥 Invite',
    movingNow: 'moving now',
    visibilitySettings: '📍 Visibility settings',
    controlVisibility: "Control who can see your dog on the live map",

    // Found flow
    foundDogReport: '🐕 FOUND DOG REPORT',
    iFound: 'I found',
    yourName: '👤 Your name',
    soOwnerKnows: 'So the owner knows who found their dog',
    provideVerification: 'Provide at least one verification',
    photoOfDogSafe: '📷 Photo of dog safe',
    bestVerification: 'Best verification',
    contactOwner: '📞 Contact the owner',
    locationMessage: '📍 Location + message',
    submitReport: 'Submit report → notify owner',
    waitingOwner: 'Waiting for owner confirmation',
    badgePending: 'Badge pending: Lost Dog Hero',
    backToFeed: 'Back to feed',
  },

  es: {
    // Navigation
    feed: 'Feed',
    profile: 'Perfil',
    map: 'Mapa',
    messages: 'Mensajes',

    // Profile
    dogIsLost: 'se perdió',
    tapToAlert: 'Toca para alertar a la comunidad al instante',
    editFullProfile: '✏️ Editar perfil completo',
    activity: 'Actividad',
    alertsTriggered: 'Alertas enviadas',
    dogsFound: 'Perros encontrados',
    sightingsReported: 'Avistamientos reportados',
    postsMade: 'Publicaciones',
    owner: 'Dueño',
    phone: 'Teléfono',
    personality: 'Personalidad',
    area: 'Área',
    vaccinated: '✓ Vacunado',
    privacyPolicy: 'Política de Privacidad',
    chatMessages: 'Mensajes',
    chatWithOwners: 'Chatea con dueños de perros cercanos',

    // Feed
    newPostAs: 'Nueva publicación como',
    checkin: 'Check-in',
    lost: 'Perdido',
    spotted: 'Visto',
    event: 'Evento',
    warning: 'Aviso',
    nearMe: '🗺️ Cerca de mí',
    activeAlertsNearYou: 'ALERTAS ACTIVAS CERCA DE TI',
    emergencyLostDog: '🚨 EMERGENCIA — PERRO PERDIDO',
    iFoundThisDog: '🙋 Encontré a este perro',
    share: '↗ Compartir',
    commentAs: 'Comentar como',
    paws: 'patitas',
    viewAll: 'Ver todos',
    comments: 'comentarios',
    whatsAthenaUpTo: '¿Qué está haciendo tu perro?',

    // Emergency
    emergencyAlert: '⚠️ ALERTA DE EMERGENCIA',
    reportAsLost: '¿Reportar como perdido?',
    lastSeenLocation: 'Última ubicación conocida',
    descriptionForFinders: 'Descripción para quienes lo encuentren',
    whatHappensInstantly: 'Qué pasa al instante:',
    isLost: 'SE PERDIÓ',
    tapToAlertCommunity: 'Toca para alertar a la comunidad',
    alertActive: 'ALERTA ACTIVA',
    usersNotifiedNearby: 'usuarios notificados cerca',
    spreadTheWord: 'DIFUNDE MÁS ALLÁ DE LA APP',
    shareToWhatsApp: 'Compartir en grupos de WhatsApp',
    whatsappSub: 'Mensaje listo con link de avistamiento. Sin necesidad de la app.',
    printPoster: 'Imprimir cartel de emergencia',
    posterSub: 'Generado automáticamente con código QR. Imprime y pega en el vecindario.',
    dogHasBeenFound: 'fue encontrado/a!',
    backToApp: 'Volver a SmartPet Tag',
    liveUpdates: 'ACTUALIZACIONES EN VIVO',

    // Guest
    safetyNetwork: 'La red de seguridad para perros en CDMX',
    dogsProtectedNearby: 'Perros protegidos cerca',
    activeAlerts: 'Alertas activas',
    activeAlertsNearYouGuest: 'Alertas activas cerca de ti',
    signUpToHelp: 'Regístrate para ayudar a encontrar estos perros',
    whyDogOwners: 'Por qué los dueños de perros en CDMX usan SmartPet Tag',
    protectFree: 'Protege a tu perro gratis',
    createAccount: 'Crear cuenta gratis 🐾',
    alreadyHaveAccount: '¿Ya tienes cuenta? Inicia sesión',

    // Map
    visible: 'Visible',
    community: 'Comunidad',
    hidden: 'Oculto',
    invite: '👥 Invitar',
    movingNow: 'en movimiento',
    visibilitySettings: '📍 Configuración de visibilidad',
    controlVisibility: 'Controla quién puede ver a tu perro en el mapa',

    // Found flow
    foundDogReport: '🐕 REPORTE DE PERRO ENCONTRADO',
    iFound: 'Encontré a',
    yourName: '👤 Tu nombre',
    soOwnerKnows: 'Para que el dueño sepa quién encontró a su perro',
    provideVerification: 'Proporciona al menos una verificación',
    photoOfDogSafe: '📷 Foto del perro en lugar seguro',
    bestVerification: 'Mejor verificación',
    contactOwner: '📞 Contactar al dueño',
    locationMessage: '📍 Ubicación + mensaje',
    submitReport: 'Enviar reporte → notificar al dueño',
    waitingOwner: 'Esperando confirmación del dueño',
    badgePending: 'Insignia pendiente: Héroe de Perros Perdidos',
    backToFeed: 'Volver al feed',
  }
};

export const LanguageContext = createContext({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}
