import dayjs from 'dayjs';

const isInscriptionActive = (inscriptionExpiryDate: string | Date): boolean => {
    const expiryDate = dayjs(inscriptionExpiryDate);
    const today = dayjs();

    const daysLeft = expiryDate.diff(today, 'day');
    return daysLeft > 0;
};

export default isInscriptionActive;
