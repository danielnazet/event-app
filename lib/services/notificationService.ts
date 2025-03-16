import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../supabase';
import { Notification, Birthday, Event } from '../types';
import { addDays, format, parseISO, subDays, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';

// Konfiguracja powiadomień
export const configureNotifications = async () => {
  // Prośba o uprawnienia
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }

  // Konfiguracja powiadomień
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
};

// Pobierz powiadomienia użytkownika
export const getNotifications = async (userId: string): Promise<{ data: Notification[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
};

// Oznacz powiadomienie jako przeczytane
export const markNotificationAsRead = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  return { error };
};

// Anuluj powiadomienia dla urodzin
export async function cancelBirthdayNotifications(birthdayId: string) {
    try {
        // Pobierz wszystkie zaplanowane powiadomienia
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        
        // Filtruj powiadomienia związane z tymi urodzinami
        const birthdayNotifications = scheduledNotifications.filter(
            notification => notification.content.data?.birthdayId === birthdayId
        );
        
        // Anuluj każde powiadomienie
        for (const notification of birthdayNotifications) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Błąd podczas anulowania powiadomień o urodzinach:', error);
        return { success: false, error };
    }
}

// Anuluj powiadomienia dla wydarzenia
export async function cancelEventNotifications(eventId: string) {
    try {
        // Pobierz wszystkie zaplanowane powiadomienia
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        
        // Filtruj powiadomienia związane z tym wydarzeniem
        const eventNotifications = scheduledNotifications.filter(
            notification => notification.content.data?.eventId === eventId
        );
        
        // Anuluj każde powiadomienie
        for (const notification of eventNotifications) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Błąd podczas anulowania powiadomień o wydarzeniu:', error);
        return { success: false, error };
    }
}

// Zaplanuj powiadomienia dla urodzin
export async function scheduleBirthdayNotifications(birthday: Birthday) {
    try {
        // Anuluj istniejące powiadomienia dla tych urodzin
        await cancelBirthdayNotifications(birthday.id);

        // Pobierz datę urodzin
        const birthdayDate = parseISO(birthday.date);
        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Ustaw datę na bieżący rok
        const thisYearBirthday = new Date(currentYear, birthdayDate.getMonth(), birthdayDate.getDate());
        
        // Ustaw datę na przyszły rok
        const nextYearBirthday = new Date(currentYear + 1, birthdayDate.getMonth(), birthdayDate.getDate());
        
        // Wybierz odpowiednią datę (bieżący rok lub przyszły rok, jeśli data już minęła)
        const targetDate = thisYearBirthday < today ? nextYearBirthday : thisYearBirthday;
        
        // Ustaw datę powiadomienia na tydzień przed
        const weekBeforeDate = subDays(targetDate, 7);
        
        console.log(`Planowanie powiadomień dla urodzin ${birthday.person_name}:`);
        console.log(`- Data urodzin w tym/przyszłym roku: ${format(targetDate, 'yyyy-MM-dd')}`);
        console.log(`- Powiadomienie tydzień wcześniej: ${format(weekBeforeDate, 'yyyy-MM-dd')}`);

        // Powiadomienie w dniu urodzin
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `Dziś urodziny: ${birthday.person_name}!`,
                body: `Nie zapomnij złożyć życzeń!`,
                data: { type: 'birthday', birthdayId: birthday.id },
            },
            trigger: {
                date: targetDate,
                type: Notifications.SchedulableTriggerInputTypes.DATE
            },
        });

        // Powiadomienie na tydzień przed
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `Za tydzień urodziny: ${birthday.person_name}`,
                body: `Przygotuj się na urodziny ${birthday.person_name} za tydzień!`,
                data: { type: 'birthday', birthdayId: birthday.id },
            },
            trigger: {
                date: weekBeforeDate,
                type: Notifications.SchedulableTriggerInputTypes.DATE
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Błąd podczas planowania powiadomień o urodzinach:', error);
        return { success: false, error };
    }
}

// Zaplanuj powiadomienia dla wydarzenia
export async function scheduleEventNotifications(event: Event) {
    try {
        console.log('Próba zaplanowania powiadomień dla wydarzenia:', event);
        
        if (!event || !event.id) {
            console.error('Brak prawidłowego wydarzenia do zaplanowania powiadomień');
            return { success: false, error: 'Brak prawidłowego wydarzenia' };
        }
        
        // Anuluj istniejące powiadomienia dla tego wydarzenia
        try {
            await cancelEventNotifications(event.id);
        } catch (cancelError) {
            console.error('Błąd podczas anulowania istniejących powiadomień:', cancelError);
            // Kontynuuj mimo błędu
        }

        // Pobierz datę wydarzenia
        const eventDate = parseISO(event.date);
        
        // Ustaw datę powiadomienia na dzień przed
        const dayBeforeDate = subDays(eventDate, 1);
        
        console.log(`Planowanie powiadomień dla wydarzenia ${event.title}:`);
        console.log(`- Data wydarzenia: ${format(eventDate, 'yyyy-MM-dd')}`);
        console.log(`- Powiadomienie dzień wcześniej: ${format(dayBeforeDate, 'yyyy-MM-dd')}`);

        // Powiadomienie w dniu wydarzenia
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Dziś wydarzenie: ${event.title}!`,
                    body: event.description || `Nie zapomnij o dzisiejszym wydarzeniu!`,
                    data: { type: 'event', eventId: event.id },
                },
                trigger: {
                    date: eventDate,
                    type: Notifications.SchedulableTriggerInputTypes.DATE
                },
            });
            console.log('Zaplanowano powiadomienie w dniu wydarzenia');
        } catch (notificationError) {
            console.error('Błąd podczas planowania powiadomienia w dniu wydarzenia:', notificationError);
            // Kontynuuj mimo błędu
        }

        // Powiadomienie na dzień przed
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Jutro wydarzenie: ${event.title}`,
                    body: `Przygotuj się na jutrzejsze wydarzenie!`,
                    data: { type: 'event', eventId: event.id },
                },
                trigger: {
                    date: dayBeforeDate,
                    type: Notifications.SchedulableTriggerInputTypes.DATE
                },
            });
            console.log('Zaplanowano powiadomienie na dzień przed wydarzeniem');
        } catch (notificationError) {
            console.error('Błąd podczas planowania powiadomienia na dzień przed wydarzeniem:', notificationError);
            // Kontynuuj mimo błędu
        }

        return { success: true };
    } catch (error) {
        console.error('Błąd podczas planowania powiadomień o wydarzeniu:', error);
        return { success: false, error };
    }
}

// Zapisz powiadomienie w bazie danych
export const saveNotification = async (
  notification: Omit<Notification, 'id' | 'created_at'>
): Promise<{ data: Notification | null; error: any }> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        ...notification,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  return { data, error };
};

// Formatuj datę urodzin
export const formatBirthdayDate = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, 'd MMMM', { locale: pl });
};

// Sprawdź nadchodzące urodziny i wydarzenia
export async function checkUpcomingEvents() {
    try {
        // Pobierz urodziny i wydarzenia użytkownika
        const { data: birthdays, error: birthdaysError } = await supabase
            .from('birthdays')
            .select('*');

        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*');

        if (birthdaysError) {
            console.error('Błąd podczas pobierania urodzin:', birthdaysError);
        }

        if (eventsError) {
            console.error('Błąd podczas pobierania wydarzeń:', eventsError);
        }

        // Sprawdź nadchodzące urodziny
        const today = new Date();
        const upcomingBirthdays = (birthdays || []).filter((birthday: Birthday) => {
            const birthdayDate = parseISO(birthday.date);
            const currentYear = today.getFullYear();
            
            // Ustaw datę na bieżący rok
            const thisYearBirthday = new Date(currentYear, birthdayDate.getMonth(), birthdayDate.getDate());
            
            // Jeśli data już minęła, sprawdź na przyszły rok
            const targetDate = thisYearBirthday < today 
                ? new Date(currentYear + 1, birthdayDate.getMonth(), birthdayDate.getDate())
                : thisYearBirthday;
            
            // Sprawdź, czy urodziny są w ciągu najbliższych 7 dni
            const daysUntilBirthday = differenceInDays(targetDate, today);
            return daysUntilBirthday >= 0 && daysUntilBirthday <= 7;
        });

        // Sprawdź nadchodzące wydarzenia
        const upcomingEvents = (events || []).filter((event: Event) => {
            const eventDate = parseISO(event.date);
            const daysUntilEvent = differenceInDays(eventDate, today);
            return daysUntilEvent >= 0 && daysUntilEvent <= 7;
        });

        return {
            birthdays: upcomingBirthdays,
            events: upcomingEvents
        };
    } catch (error) {
        console.error('Błąd podczas sprawdzania nadchodzących wydarzeń:', error);
        return { birthdays: [], events: [] };
    }
} 