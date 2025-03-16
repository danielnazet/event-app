import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export const formatBirthdayDate = (date: string) => {
  const birthdayDate = new Date(date);
  return format(birthdayDate, 'd MMMM', { locale: pl });
};

export const formatEventDate = (date: string) => {
  const eventDate = new Date(date);
  return format(eventDate, 'd MMMM yyyy', { locale: pl });
}; 