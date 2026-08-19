// utils/timezone.utils.ts
export const APP_TIMEZONE = 'Africa/Porto-Novo';

export const formatDateTime = (
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: APP_TIMEZONE,
    ...options,
  }).format(new Date(date));
};

export const formatDate = (date: string | Date): string => {
  return formatDateTime(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatTime = (date: string | Date): string => {
  return formatDateTime(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTimeFull = (date: string | Date): string => {
  return formatDateTime(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Retourne la date actuelle dans le fuseau horaire cible
export const nowInTimezone = (): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const values: Record<string, string> = {};
  parts.forEach(part => {
    values[part.type] = part.value;
  });
  
  return new Date(
    parseInt(values.year),
    parseInt(values.month) - 1,
    parseInt(values.day),
    parseInt(values.hour),
    parseInt(values.minute),
    parseInt(values.second)
  );
};

// Pour les formulaires datetime-local
export const toLocalDateTimeInput = (date: string | Date): string => {
  const d = new Date(date);
  // Ajuster pour le fuseau horaire
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

// Convertit une valeur de input datetime-local en UTC pour l'API
export const fromLocalDateTimeInput = (localDateTime: string): string => {
  if (!localDateTime) return '';
  // Créer une date en interprétant la chaîne comme étant dans le fuseau Africa/Porto-Novo
  const date = new Date(localDateTime);
  // Ajuster pour UTC en soustrayant le décalage
  const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return utcDate.toISOString();
};

// Pour les inputs date seulement
export const toLocalDateInput = (date: string | Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse une date UTC en objet Date local
export const parseUTCToLocal = (utcDate: string | Date): Date => {
  const date = new Date(utcDate);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000);
};

// Convertit une date locale en UTC pour l'API
export const fromLocalToUTC = (localDate: Date | string): string => {
  const date = new Date(localDate);
  return date.toISOString();
};

// Obtient la date actuelle au format YYYY-MM-DD pour les inputs date
export const getCurrentDateInput = (): string => {
  const now = nowInTimezone();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Obtient l'heure actuelle au format HH:MM
export const getCurrentTime = (): string => {
  const now = nowInTimezone();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};